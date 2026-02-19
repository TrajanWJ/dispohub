import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';
import { findAllDeals, findDealById } from '../models/Deal.js';
import { findAllUsers, findUserById } from '../models/User.js';
import { findMatchesForInvestor, findMatchingInvestorsForDeal } from '../services/matchingEngine.js';

const router = Router();

// GET /api/matching/deals — get matched deals for current investor
router.get('/deals', authenticateToken, requireRole('investor'), async (req, res) => {
  try {
    const preferences = req.user.preferences || {};
    if (!Object.keys(preferences).length) {
      return res.json({ matches: [], message: 'Set your preferences to get matched deals' });
    }

    const deals = await findAllDeals({ status: 'active' });
    // Attach wholesaler reputation to each deal
    for (const deal of deals) {
      const wholesaler = await findUserById(deal.wholesalerId);
      deal.wholesalerReputation = wholesaler?.reputationScore || 0;
      deal.wholesalerName = wholesaler?.name || 'Unknown';
      deal.wholesalerCompany = wholesaler?.company || '';
    }

    const matches = findMatchesForInvestor(deals, preferences);
    res.json({ matches, total: matches.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to find matches: ' + err.message });
  }
});

// GET /api/matching/investors/:dealId — get matched investors for a deal (wholesaler)
router.get('/investors/:dealId', authenticateToken, requireRole('wholesaler'), async (req, res) => {
  try {
    const deal = await findDealById(req.params.dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    if (deal.wholesalerId !== req.user.id) return res.status(403).json({ error: 'Not your deal' });

    const investors = await findAllUsers({ role: 'investor' });
    const matches = findMatchingInvestorsForDeal(deal, investors);
    res.json({ matches, total: matches.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to find investors: ' + err.message });
  }
});

export default router;
