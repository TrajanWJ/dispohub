import { Router } from 'express';
import {
  createTransaction,
  findTransactionById,
  findTransactionsByUser,
  updateTransaction,
} from '../models/Transaction.js';
import { findOfferById } from '../models/Offer.js';
import { findDealById } from '../models/Deal.js';
import { findUserById } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { canTransition, getAvailableTransitions } from '../services/escrowService.js';
import { calculatePlatformFee } from '../services/feeCalculator.js';
import { notifyTransactionUpdate } from '../services/notificationService.js';
import { PLATFORM_FEE_PERCENT } from '../config/constants.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ---------------------------------------------------------------------------
// GET /api/transactions — List user's transactions
// Wholesaler sees their sales, investor sees their purchases
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const transactions = await findTransactionsByUser(req.user.id);

    // Sort newest first
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Enrich with deal info
    const enriched = await Promise.all(
      transactions.map(async (txn) => {
        const deal = await findDealById(txn.dealId);
        return {
          ...txn,
          deal: deal
            ? {
                id: deal.id,
                address: deal.address,
                city: deal.city,
                state: deal.state,
                propertyType: deal.propertyType,
                askingPrice: deal.askingPrice,
              }
            : null,
        };
      })
    );

    res.json({ transactions: enriched, total: enriched.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/transactions/:id — Single transaction detail
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const txn = await findTransactionById(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    // Only parties to the transaction or admins can view
    const isParty = txn.wholesalerId === req.user.id || txn.investorId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isParty && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Enrich with deal, wholesaler, and investor info
    const deal = await findDealById(txn.dealId);
    const wholesaler = await findUserById(txn.wholesalerId);
    const investor = await findUserById(txn.investorId);

    const enriched = {
      ...txn,
      deal: deal
        ? {
            id: deal.id,
            address: deal.address,
            city: deal.city,
            state: deal.state,
            zip: deal.zip,
            propertyType: deal.propertyType,
            askingPrice: deal.askingPrice,
            arvEstimate: deal.arvEstimate,
          }
        : null,
      wholesaler: wholesaler
        ? {
            id: wholesaler.id,
            name: wholesaler.name,
            company: wholesaler.company,
            email: wholesaler.email,
            reputationScore: wholesaler.reputationScore,
          }
        : null,
      investor: investor
        ? {
            id: investor.id,
            name: investor.name,
            company: investor.company,
            email: investor.email,
            reputationScore: investor.reputationScore,
          }
        : null,
      availableTransitions: getAvailableTransitions(txn.status),
    };

    res.json({ transaction: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transaction: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/transactions — Create transaction from accepted offer
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { offerId, dealId } = req.body;

    if (!offerId) return res.status(400).json({ error: '"offerId" is required' });
    if (!dealId) return res.status(400).json({ error: '"dealId" is required' });

    const offer = await findOfferById(offerId);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    if (offer.status !== 'accepted') {
      return res.status(400).json({ error: 'Only accepted offers can become transactions' });
    }

    const deal = await findDealById(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (offer.dealId !== deal.id) {
      return res.status(400).json({ error: 'Offer does not belong to this deal' });
    }

    // Only the wholesaler (deal owner) or admin can create the transaction
    const isOwner = deal.wholesalerId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only the deal owner or admin can create a transaction' });
    }

    // Calculate platform fee based on wholesaler's subscription tier
    const wholesaler = await findUserById(deal.wholesalerId);
    const tier = wholesaler?.subscriptionTier || 'free';
    const { fee: platformFee, feePercent } = calculatePlatformFee(offer.amount, tier);

    const transaction = await createTransaction({
      dealId: deal.id,
      offerId: offer.id,
      wholesalerId: deal.wholesalerId,
      investorId: offer.investorId,
      status: 'escrow_funded',
      salePrice: offer.amount,
      platformFee,
      platformFeePercent: feePercent,
      escrowAmount: Math.round(offer.amount * 0.01),
    });

    // Notify both parties
    await notifyTransactionUpdate(deal.wholesalerId, transaction.id, 'escrow_funded');
    await notifyTransactionUpdate(offer.investorId, transaction.id, 'escrow_funded');

    res.status(201).json({ transaction });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create transaction: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/transactions/:id/status — Advance transaction status
// ---------------------------------------------------------------------------
router.put('/:id/status', async (req, res) => {
  try {
    const txn = await findTransactionById(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    // Only parties or admins can advance status
    const isParty = txn.wholesalerId === req.user.id || txn.investorId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isParty && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status } = req.body;
    if (!status) return res.status(400).json({ error: '"status" is required' });

    if (!canTransition(txn.status, status)) {
      const available = getAvailableTransitions(txn.status);
      return res.status(400).json({
        error: `Invalid status transition from "${txn.status}" to "${status}"`,
        availableTransitions: available,
      });
    }

    const updates = { status };
    if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
    }

    const updated = await updateTransaction(txn.id, updates);

    // Notify both parties
    await notifyTransactionUpdate(txn.wholesalerId, txn.id, status);
    await notifyTransactionUpdate(txn.investorId, txn.id, status);

    res.json({ transaction: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update transaction status: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/transactions/:id/timeline — Get statusHistory array
// ---------------------------------------------------------------------------
router.get('/:id/timeline', async (req, res) => {
  try {
    const txn = await findTransactionById(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    // Only parties or admins can view timeline
    const isParty = txn.wholesalerId === req.user.id || txn.investorId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isParty && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      transactionId: txn.id,
      currentStatus: txn.status,
      timeline: txn.statusHistory || [],
      availableTransitions: getAvailableTransitions(txn.status),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timeline: ' + err.message });
  }
});

export default router;
