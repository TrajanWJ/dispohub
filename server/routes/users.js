import { Router } from 'express';
import { findUserById, updateUser } from '../models/User.js';
import { findDealsByWholesaler } from '../models/Deal.js';
import { findRatingsByUser } from '../models/Rating.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/users/:id  --  Public profile
// Excludes passwordHash; includes dealCount and reputationScore.
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Strip sensitive fields
    const { passwordHash, ...profile } = user;

    res.json({ user: profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/users/:id  --  Update own profile
// Only the authenticated user can update their own profile.
// ---------------------------------------------------------------------------
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const allowedFields = [
      'name',
      'phone',
      'company',
      'bio',
      'location',
      'avatar',
      'preferences',
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const updated = await updateUser(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'User not found' });

    const { passwordHash, ...safeUser } = updated;
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/users/:id/deals  --  User's deals
// Own profile: all statuses.  Other users: only active deals.
// ---------------------------------------------------------------------------
router.get('/:id/deals', async (req, res) => {
  try {
    const targetUser = await findUserById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Determine if the requester is viewing their own profile.
    // authenticateToken is optional here -- we peek at the auth header manually
    // so unauthenticated visitors still get the public view.
    let isOwner = false;
    const authHeader = req.headers.authorization;
    const devUserId = req.headers['x-dev-user-id'];
    if (devUserId) {
      isOwner = devUserId === req.params.id;
    } else if (authHeader) {
      // Import dynamically would be heavy; instead rely on a lightweight check:
      // We attempt to use the same JWT verification used in authenticateToken.
      try {
        const jwt = await import('jsonwebtoken');
        const { JWT_SECRET } = await import('../middleware/auth.js');
        const token = authHeader.split(' ')[1];
        if (token) {
          const payload = jwt.default.verify(token, JWT_SECRET);
          isOwner = payload.userId === req.params.id;
        }
      } catch {
        // Token invalid or missing -- just treat as not-owner
      }
    }

    let deals;
    if (targetUser.role === 'wholesaler') {
      deals = await findDealsByWholesaler(req.params.id);
    } else {
      // Investors don't list deals, but future-proof: return deals they may own
      deals = await findDealsByWholesaler(req.params.id);
    }

    // Non-owners only see active deals
    if (!isOwner) {
      deals = deals.filter((d) => d.status === 'active');
    }

    res.json({ deals, total: deals.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user deals: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/users/:id/ratings  --  Received ratings for a user
// ---------------------------------------------------------------------------
router.get('/:id/ratings', async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ratings = await findRatingsByUser(req.params.id);

    // Compute summary statistics
    const total = ratings.length;
    const averageScore =
      total > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r.score, 0) / total) * 10) / 10
        : 0;

    res.json({ ratings, summary: { total, averageScore } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ratings: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/users/:id/preferences  --  Update matching preferences (investor)
// ---------------------------------------------------------------------------
router.put(
  '/:id/preferences',
  authenticateToken,
  requireRole('investor'),
  async (req, res) => {
    try {
      if (req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'You can only update your own preferences' });
      }

      const allowedFields = [
        'states',
        'cities',
        'propertyTypes',
        'minPrice',
        'maxPrice',
        'minReputation',
      ];
      const preferences = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          preferences[field] = req.body[field];
        }
      }

      if (Object.keys(preferences).length === 0) {
        return res.status(400).json({ error: 'No valid preference fields provided' });
      }

      // Validate array fields
      if (preferences.states && !Array.isArray(preferences.states)) {
        return res.status(400).json({ error: '"states" must be an array' });
      }
      if (preferences.cities && !Array.isArray(preferences.cities)) {
        return res.status(400).json({ error: '"cities" must be an array' });
      }
      if (preferences.propertyTypes && !Array.isArray(preferences.propertyTypes)) {
        return res.status(400).json({ error: '"propertyTypes" must be an array' });
      }
      if (preferences.minPrice != null && Number(preferences.minPrice) < 0) {
        return res.status(400).json({ error: '"minPrice" cannot be negative' });
      }
      if (preferences.maxPrice != null && Number(preferences.maxPrice) < 0) {
        return res.status(400).json({ error: '"maxPrice" cannot be negative' });
      }

      // Merge with existing preferences instead of replacing entirely
      const currentUser = await findUserById(req.params.id);
      const mergedPreferences = { ...(currentUser.preferences || {}), ...preferences };

      const updated = await updateUser(req.params.id, { preferences: mergedPreferences });
      if (!updated) return res.status(404).json({ error: 'User not found' });

      const { passwordHash, ...safeUser } = updated;
      res.json({ user: safeUser });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update preferences: ' + err.message });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/users/:id/verify  --  Submit verification documents
// ---------------------------------------------------------------------------
router.post('/:id/verify', authenticateToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'You can only submit verification for your own profile' });
    }

    const { documents } = req.body;
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: '"documents" must be a non-empty array' });
    }

    const currentUser = await findUserById(req.params.id);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    // Append new documents to any existing ones
    const existingDocs = Array.isArray(currentUser.verificationDocs)
      ? currentUser.verificationDocs
      : [];
    const allDocs = [...existingDocs, ...documents];

    const updated = await updateUser(req.params.id, {
      verificationDocs: allDocs,
      verificationStatus: 'pending',
    });

    const { passwordHash, ...safeUser } = updated;
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit verification: ' + err.message });
  }
});

export default router;
