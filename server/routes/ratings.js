import { Router } from 'express';
import {
  createRating,
  findRatingsByUser,
  findRatingByTransaction,
} from '../models/Rating.js';
import { findTransactionById } from '../models/Transaction.js';
import { findUserById, updateUser } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateReputation } from '../services/reputationEngine.js';
import { notifyReviewReceived } from '../services/notificationService.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ---------------------------------------------------------------------------
// POST /api/ratings — Create a rating for a completed transaction
// Body: {transactionId, score, comment, categories: {communication, dealQuality, professionalism, timeliness}}
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { transactionId, score, comment, categories } = req.body;

    // Validate required fields
    if (!transactionId) return res.status(400).json({ error: '"transactionId" is required' });
    if (score == null || score < 1 || score > 5) {
      return res.status(400).json({ error: '"score" must be between 1 and 5' });
    }

    // Validate categories if provided
    if (categories) {
      const validCategories = ['communication', 'dealQuality', 'professionalism', 'timeliness'];
      for (const cat of validCategories) {
        if (categories[cat] != null && (categories[cat] < 1 || categories[cat] > 5)) {
          return res.status(400).json({ error: `Category "${cat}" must be between 1 and 5` });
        }
      }
    }

    // Validate transaction exists and is completed
    const txn = await findTransactionById(transactionId);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    if (txn.status !== 'completed') {
      return res.status(400).json({ error: 'Ratings can only be submitted for completed transactions' });
    }

    // Verify the reviewer is a party to the transaction
    const isWholesaler = txn.wholesalerId === req.user.id;
    const isInvestor = txn.investorId === req.user.id;
    if (!isWholesaler && !isInvestor) {
      return res.status(403).json({ error: 'You are not a party to this transaction' });
    }

    // Check if the user has already rated this transaction
    const existingRating = await findRatingByTransaction(transactionId, req.user.id);
    if (existingRating) {
      return res.status(409).json({ error: 'You have already rated this transaction' });
    }

    // Determine the reviewee (the other party)
    const revieweeId = isWholesaler ? txn.investorId : txn.wholesalerId;

    const rating = await createRating({
      transactionId,
      reviewerId: req.user.id,
      revieweeId,
      score: Number(score),
      comment: comment || '',
      categories: categories || {},
    });

    // Update the reviewee's reputation score
    const allRatings = await findRatingsByUser(revieweeId);
    const newReputation = calculateReputation(allRatings);
    await updateUser(revieweeId, { reputationScore: newReputation });

    // Notify the reviewee
    await notifyReviewReceived(revieweeId, req.user.name, Number(score));

    res.status(201).json({ rating });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create rating: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/ratings/user/:userId — Get all ratings for a user
// ---------------------------------------------------------------------------
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await findUserById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ratings = await findRatingsByUser(req.params.userId);

    // Enrich with reviewer info
    const enriched = await Promise.all(
      ratings.map(async (rating) => {
        const reviewer = await findUserById(rating.reviewerId);
        return {
          ...rating,
          reviewer: reviewer
            ? {
                id: reviewer.id,
                name: reviewer.name,
                company: reviewer.company,
                role: reviewer.role,
              }
            : null,
        };
      })
    );

    // Compute summary
    const total = enriched.length;
    const averageScore = total > 0
      ? Math.round((enriched.reduce((sum, r) => sum + r.score, 0) / total) * 10) / 10
      : 0;

    res.json({
      ratings: enriched,
      summary: { total, averageScore, reputationScore: user.reputationScore },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ratings: ' + err.message });
  }
});

export default router;
