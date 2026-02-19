import { Router } from 'express';
import { findAllUsers, findUserById, updateUser } from '../models/User.js';
import { findAllDeals, findDealById, updateDeal } from '../models/Deal.js';
import { findAllTransactions, updateTransaction } from '../models/Transaction.js';
import { createNotification } from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

// ---------------------------------------------------------------------------
// GET /api/admin/stats — Platform-wide statistics
// ---------------------------------------------------------------------------
router.get('/stats', async (req, res) => {
  try {
    const users = await findAllUsers();
    const deals = await findAllDeals();
    const transactions = await findAllTransactions();

    const totalUsers = users.length;
    const totalDeals = deals.length;
    const activeDeals = deals.filter(d => d.status === 'active').length;
    const totalTransactions = transactions.length;
    const completedTransactions = transactions.filter(t => t.status === 'completed').length;
    const totalRevenue = transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.platformFee || 0), 0);
    const pendingVerifications = users.filter(u => u.verificationStatus === 'pending').length;
    const pendingDeals = deals.filter(d => d.status === 'pending_review').length;
    const openDisputes = transactions.filter(t => t.status === 'disputed').length;

    res.json({
      totalUsers,
      totalDeals,
      activeDeals,
      totalTransactions,
      completedTransactions,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingVerifications,
      pendingDeals,
      openDisputes,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/users — All users with filters and pagination
// Query: ?role=investor&verificationStatus=pending&search=john&page=1&limit=20
// ---------------------------------------------------------------------------
router.get('/users', async (req, res) => {
  try {
    const { role, verificationStatus, search, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (role) filters.role = role;
    if (verificationStatus) filters.verificationStatus = verificationStatus;
    if (search) filters.search = search;

    let users = await findAllUsers(filters);

    // Strip password hashes
    users = users.map(({ passwordHash, ...u }) => u);

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const total = users.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (pageNum - 1) * pageSize;
    const paged = users.slice(start, start + pageSize);

    res.json({
      users: paged,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/admin/users/:id/verify — Approve or reject user verification
// Body: {status: 'verified'|'rejected', notes}
// ---------------------------------------------------------------------------
router.put('/users/:id/verify', async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '"status" must be "verified" or "rejected"' });
    }

    const user = await findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await updateUser(req.params.id, {
      verificationStatus: status,
    });

    // Notify the user about their verification status
    const title = status === 'verified' ? 'Account Verified' : 'Verification Rejected';
    const message = status === 'verified'
      ? 'Your account has been verified. You now have full access to the platform.'
      : `Your verification was rejected.${notes ? ' Reason: ' + notes : ''} Please update your documents and try again.`;

    await createNotification({
      userId: req.params.id,
      type: 'verification',
      title,
      message,
      relatedId: req.params.id,
      relatedType: 'user',
    });

    const { passwordHash, ...safeUser } = updated;
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update verification: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/admin/users/:id/ban — Ban a user
// ---------------------------------------------------------------------------
router.put('/users/:id/ban', async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot ban an admin user' });
    }

    const updated = await updateUser(req.params.id, {
      verificationStatus: 'rejected',
    });

    await createNotification({
      userId: req.params.id,
      type: 'system',
      title: 'Account Suspended',
      message: 'Your account has been suspended due to a policy violation. Contact support for more information.',
      relatedId: req.params.id,
      relatedType: 'user',
    });

    const { passwordHash, ...safeUser } = updated;
    res.json({ user: safeUser, message: 'User has been banned' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ban user: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/deals/pending — Deals awaiting approval
// ---------------------------------------------------------------------------
router.get('/deals/pending', async (req, res) => {
  try {
    const deals = await findAllDeals({ status: 'pending_review' });

    // Enrich with wholesaler info
    const enriched = await Promise.all(
      deals.map(async (deal) => {
        const wholesaler = await findUserById(deal.wholesalerId);
        return {
          ...deal,
          wholesaler: wholesaler
            ? {
                id: wholesaler.id,
                name: wholesaler.name,
                company: wholesaler.company,
                reputationScore: wholesaler.reputationScore,
                verificationStatus: wholesaler.verificationStatus,
              }
            : null,
        };
      })
    );

    res.json({ deals: enriched, total: enriched.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending deals: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/admin/deals/:id/approve — Approve a deal
// ---------------------------------------------------------------------------
router.put('/deals/:id/approve', async (req, res) => {
  try {
    const deal = await findDealById(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (deal.status !== 'pending_review') {
      return res.status(400).json({ error: 'Only pending_review deals can be approved' });
    }

    const updated = await updateDeal(req.params.id, {
      status: 'active',
      approvalStatus: 'approved',
      approvedBy: req.user.id,
      listedAt: new Date().toISOString(),
    });

    // Notify the wholesaler
    await createNotification({
      userId: deal.wholesalerId,
      type: 'deal_approved',
      title: 'Deal Approved',
      message: `Your listing at ${deal.address}, ${deal.city} is now live on the marketplace.`,
      relatedId: deal.id,
      relatedType: 'deal',
    });

    res.json({ deal: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve deal: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/admin/deals/:id/reject — Reject a deal
// Body: {reason}
// ---------------------------------------------------------------------------
router.put('/deals/:id/reject', async (req, res) => {
  try {
    const deal = await findDealById(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const { reason } = req.body;

    const updated = await updateDeal(req.params.id, {
      status: 'delisted',
      approvalStatus: 'rejected',
      delistedAt: new Date().toISOString(),
    });

    // Notify the wholesaler
    await createNotification({
      userId: deal.wholesalerId,
      type: 'deal_rejected',
      title: 'Deal Rejected',
      message: `Your listing at ${deal.address}, ${deal.city} was not approved.${reason ? ' Reason: ' + reason : ''}`,
      relatedId: deal.id,
      relatedType: 'deal',
    });

    res.json({ deal: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject deal: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/disputes — List disputed transactions
// ---------------------------------------------------------------------------
router.get('/disputes', async (req, res) => {
  try {
    const transactions = await findAllTransactions({ status: 'disputed' });

    // Enrich with deal and party info
    const enriched = await Promise.all(
      transactions.map(async (txn) => {
        const deal = await findDealById(txn.dealId);
        const wholesaler = await findUserById(txn.wholesalerId);
        const investor = await findUserById(txn.investorId);

        return {
          ...txn,
          deal: deal
            ? { id: deal.id, address: deal.address, city: deal.city, state: deal.state }
            : null,
          wholesaler: wholesaler
            ? { id: wholesaler.id, name: wholesaler.name, company: wholesaler.company }
            : null,
          investor: investor
            ? { id: investor.id, name: investor.name, company: investor.company }
            : null,
        };
      })
    );

    res.json({ disputes: enriched, total: enriched.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch disputes: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/admin/disputes/:id/resolve — Resolve a dispute
// Body: {resolution, notes}
// ---------------------------------------------------------------------------
router.put('/disputes/:id/resolve', async (req, res) => {
  try {
    const { resolution, notes } = req.body;

    if (!resolution) return res.status(400).json({ error: '"resolution" is required' });

    const txn = await findAllTransactions().then(all => all.find(t => t.id === req.params.id));
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    if (txn.status !== 'disputed') {
      return res.status(400).json({ error: 'Only disputed transactions can be resolved' });
    }

    // Determine the new status based on the resolution
    let newStatus;
    if (resolution === 'continue') {
      newStatus = 'closing';
    } else if (resolution === 'cancel') {
      newStatus = 'cancelled';
    } else {
      newStatus = 'cancelled'; // Default to cancelled for unknown resolutions
    }

    const updated = await updateTransaction(req.params.id, {
      status: newStatus,
    });

    // Notify both parties
    const notifMessage = `Your disputed transaction has been resolved. Resolution: ${resolution}.${notes ? ' Notes: ' + notes : ''}`;

    await createNotification({
      userId: txn.wholesalerId,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: notifMessage,
      relatedId: txn.id,
      relatedType: 'transaction',
    });

    await createNotification({
      userId: txn.investorId,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: notifMessage,
      relatedId: txn.id,
      relatedType: 'transaction',
    });

    res.json({ transaction: updated, resolution, notes: notes || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve dispute: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/revenue — Revenue breakdown
// Query: ?period=monthly|quarterly|yearly
// ---------------------------------------------------------------------------
router.get('/revenue', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const transactions = await findAllTransactions();
    const completed = transactions.filter(t => t.status === 'completed' && t.completedAt);

    // Group by period
    const groups = {};

    for (const txn of completed) {
      const date = new Date(txn.completedAt);
      let key;

      if (period === 'yearly') {
        key = `${date.getFullYear()}`;
      } else if (period === 'quarterly') {
        const quarter = Math.ceil((date.getMonth() + 1) / 3);
        key = `${date.getFullYear()}-Q${quarter}`;
      } else {
        // monthly
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groups[key]) {
        groups[key] = { period: key, revenue: 0, transactionCount: 0, totalVolume: 0 };
      }
      groups[key].revenue += txn.platformFee || 0;
      groups[key].transactionCount += 1;
      groups[key].totalVolume += txn.salePrice || 0;
    }

    // Round revenue values
    const breakdown = Object.values(groups)
      .map(g => ({
        ...g,
        revenue: Math.round(g.revenue * 100) / 100,
        totalVolume: Math.round(g.totalVolume * 100) / 100,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const totalRevenue = Math.round(
      completed.reduce((sum, t) => sum + (t.platformFee || 0), 0) * 100
    ) / 100;

    const totalVolume = Math.round(
      completed.reduce((sum, t) => sum + (t.salePrice || 0), 0) * 100
    ) / 100;

    res.json({
      period,
      totalRevenue,
      totalVolume,
      totalTransactions: completed.length,
      breakdown,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch revenue data: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/reseed — Re-run seed data (dev toolbar)
// ---------------------------------------------------------------------------
router.post('/reseed', async (req, res) => {
  try {
    // Dynamically import and run the seed script
    const seedModule = await import('../db/seed.js');
    res.json({ message: 'Database reseeded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reseed database: ' + err.message });
  }
});

export default router;
