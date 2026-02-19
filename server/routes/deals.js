import { Router } from 'express';
import {
  createDeal,
  findDealById,
  findAllDeals,
  findDealsByWholesaler,
  updateDeal,
} from '../models/Deal.js';
import { findUserById } from '../models/User.js';
import {
  createOffer,
  findOfferById,
  findOffersByDeal,
  updateOffer,
} from '../models/Offer.js';
import { createNotification } from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';
import { validateDeal } from '../middleware/dealValidator.js';

const router = Router();

// ---------------------------------------------------------------------------
// Helper: attach wholesaler public info to a deal object
// ---------------------------------------------------------------------------
async function attachWholesalerInfo(deal) {
  const wholesaler = await findUserById(deal.wholesalerId);
  if (wholesaler) {
    deal.wholesaler = {
      id: wholesaler.id,
      name: wholesaler.name,
      company: wholesaler.company,
      reputationScore: wholesaler.reputationScore,
      verificationStatus: wholesaler.verificationStatus,
    };
  }
  return deal;
}

// ---------------------------------------------------------------------------
// GET /api/deals/saved  --  Investor's saved/bookmarked deals
// NOTE: This route MUST be defined before the /:id param routes so that
// "saved" is not captured as a deal id.
// ---------------------------------------------------------------------------
router.get('/saved', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all active deals, then filter to those the user has saved
    const allDeals = await findAllDeals({ status: 'active' });
    const saved = allDeals.filter(
      (d) => Array.isArray(d.savedBy) && d.savedBy.includes(userId)
    );

    // Attach wholesaler info to each deal
    const enriched = await Promise.all(saved.map(attachWholesalerInfo));

    res.json({ deals: enriched, total: enriched.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved deals: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/deals  --  List active deals with filtering, sorting & pagination
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const {
      state,
      city,
      propertyType,
      priceMin,
      priceMax,
      search,
      page = 1,
      limit = 20,
      sort,
    } = req.query;

    // Build the filter object consumed by the model layer
    const filters = { status: 'active' };
    if (state) filters.state = state;
    if (city) filters.city = city;
    if (propertyType) filters.propertyType = propertyType;
    if (priceMin != null) filters.priceMin = priceMin;
    if (priceMax != null) filters.priceMax = priceMax;
    if (search) filters.search = search;

    let deals = await findAllDeals(filters);

    // Sorting
    switch (sort) {
      case 'price_asc':
        deals.sort((a, b) => a.askingPrice - b.askingPrice);
        break;
      case 'price_desc':
        deals.sort((a, b) => b.askingPrice - a.askingPrice);
        break;
      case 'oldest':
        deals.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'newest':
      default:
        deals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const total = deals.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (pageNum - 1) * pageSize;
    const paged = deals.slice(start, start + pageSize);

    // Attach wholesaler info to each deal in parallel
    const enriched = await Promise.all(paged.map(attachWholesalerInfo));

    res.json({
      deals: enriched,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deals: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/deals/:id  --  Single deal detail (increments viewCount)
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const deal = await findDealById(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    // Increment view count
    await updateDeal(deal.id, { viewCount: (deal.viewCount ?? 0) + 1 });
    deal.viewCount = (deal.viewCount ?? 0) + 1;

    await attachWholesalerInfo(deal);
    res.json({ deal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deal: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/deals  --  Create a new deal (wholesaler only)
// ---------------------------------------------------------------------------
router.post(
  '/',
  authenticateToken,
  requireRole('wholesaler'),
  validateDeal,
  async (req, res) => {
    try {
      const {
        address,
        city,
        state,
        zip,
        county,
        propertyType,
        bedrooms,
        bathrooms,
        sqft,
        lotSize,
        yearBuilt,
        photos,
        askingPrice,
        arvEstimate,
        rehabEstimate,
        currentValue,
        assignmentFee,
        description,
        highlights,
      } = req.body;

      const deal = await createDeal({
        wholesalerId: req.user.id,
        status: 'pending_review',
        address,
        city,
        state,
        zip,
        county,
        propertyType,
        bedrooms,
        bathrooms,
        sqft,
        lotSize,
        yearBuilt,
        photos,
        askingPrice,
        arvEstimate,
        rehabEstimate,
        currentValue,
        assignmentFee,
        description,
        highlights,
        listedAt: new Date().toISOString(),
      });

      res.status(201).json({ deal });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create deal: ' + err.message });
    }
  }
);

// ---------------------------------------------------------------------------
// PUT /api/deals/:id  --  Update deal (owner wholesaler only)
// ---------------------------------------------------------------------------
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const deal = await findDealById(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (deal.wholesalerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the deal owner can update this deal' });
    }

    // Whitelist the fields that may be updated
    const allowedFields = [
      'address',
      'city',
      'state',
      'zip',
      'county',
      'propertyType',
      'bedrooms',
      'bathrooms',
      'sqft',
      'lotSize',
      'yearBuilt',
      'photos',
      'askingPrice',
      'arvEstimate',
      'rehabEstimate',
      'currentValue',
      'assignmentFee',
      'description',
      'highlights',
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updated = await updateDeal(deal.id, updates);
    res.json({ deal: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update deal: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/deals/:id  --  Delist deal (owner only, soft-delete)
// ---------------------------------------------------------------------------
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deal = await findDealById(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (deal.wholesalerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the deal owner can delist this deal' });
    }

    const updated = await updateDeal(deal.id, {
      status: 'delisted',
      delistedAt: new Date().toISOString(),
    });

    res.json({ deal: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delist deal: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/deals/:id/offers  --  Make an offer on a deal (investor only)
// ---------------------------------------------------------------------------
router.post(
  '/:id/offers',
  authenticateToken,
  requireRole('investor'),
  async (req, res) => {
    try {
      const deal = await findDealById(req.params.id);
      if (!deal) return res.status(404).json({ error: 'Deal not found' });

      if (deal.status !== 'active') {
        return res.status(400).json({ error: 'Offers can only be placed on active deals' });
      }

      const { amount, message } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Offer amount must be a positive number' });
      }

      const offer = await createOffer({
        dealId: deal.id,
        investorId: req.user.id,
        amount,
        message: message || '',
      });

      // Increment deal offer count
      await updateDeal(deal.id, { offerCount: (deal.offerCount ?? 0) + 1 });

      // Notify the wholesaler
      await createNotification({
        userId: deal.wholesalerId,
        type: 'new_offer',
        title: 'New offer received',
        message: `${req.user.name} offered $${Number(amount).toLocaleString()} on your deal at ${deal.address}`,
        relatedId: offer.id,
        relatedType: 'offer',
      });

      res.status(201).json({ offer });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create offer: ' + err.message });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/deals/:id/offers  --  List offers for a deal (owner or admin)
// ---------------------------------------------------------------------------
router.get('/:id/offers', authenticateToken, async (req, res) => {
  try {
    const deal = await findDealById(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const isOwner = deal.wholesalerId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only the deal owner or an admin can view offers' });
    }

    const offers = await findOffersByDeal(deal.id);

    // Attach investor info to each offer
    const enriched = await Promise.all(
      offers.map(async (offer) => {
        const investor = await findUserById(offer.investorId);
        return {
          ...offer,
          investor: investor
            ? {
                id: investor.id,
                name: investor.name,
                company: investor.company,
                reputationScore: investor.reputationScore,
                verificationStatus: investor.verificationStatus,
              }
            : null,
        };
      })
    );

    res.json({ offers: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch offers: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/deals/:id/offers/:offerId  --  Respond to offer (owner wholesaler)
// ---------------------------------------------------------------------------
router.put('/:id/offers/:offerId', authenticateToken, async (req, res) => {
  try {
    const deal = await findDealById(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (deal.wholesalerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the deal owner can respond to offers' });
    }

    const offer = await findOfferById(req.params.offerId);
    if (!offer || offer.dealId !== deal.id) {
      return res.status(404).json({ error: 'Offer not found for this deal' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({ error: 'This offer has already been responded to' });
    }

    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "accepted" or "rejected"' });
    }

    const updatedOffer = await updateOffer(offer.id, {
      status,
      respondedAt: new Date().toISOString(),
    });

    // If accepted, mark the deal as under_contract
    if (status === 'accepted') {
      await updateDeal(deal.id, { status: 'under_contract' });
    }

    // Notify the investor
    const notifTitle =
      status === 'accepted' ? 'Offer accepted!' : 'Offer declined';
    const notifMessage =
      status === 'accepted'
        ? `Your offer of $${Number(offer.amount).toLocaleString()} on ${deal.address} has been accepted`
        : `Your offer of $${Number(offer.amount).toLocaleString()} on ${deal.address} has been declined`;

    await createNotification({
      userId: offer.investorId,
      type: status === 'accepted' ? 'offer_accepted' : 'offer_rejected',
      title: notifTitle,
      message: notifMessage,
      relatedId: offer.id,
      relatedType: 'offer',
    });

    res.json({ offer: updatedOffer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to respond to offer: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/deals/:id/save  --  Bookmark a deal (investor only)
// ---------------------------------------------------------------------------
router.post(
  '/:id/save',
  authenticateToken,
  requireRole('investor'),
  async (req, res) => {
    try {
      const deal = await findDealById(req.params.id);
      if (!deal) return res.status(404).json({ error: 'Deal not found' });

      const savedBy = Array.isArray(deal.savedBy) ? deal.savedBy : [];

      if (savedBy.includes(req.user.id)) {
        return res.status(409).json({ error: 'Deal is already saved' });
      }

      savedBy.push(req.user.id);
      const updated = await updateDeal(deal.id, {
        savedBy,
        saveCount: (deal.saveCount ?? 0) + 1,
      });

      res.json({ saved: true, deal: updated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save deal: ' + err.message });
    }
  }
);

// ---------------------------------------------------------------------------
// DELETE /api/deals/:id/save  --  Remove bookmark (investor only)
// ---------------------------------------------------------------------------
router.delete(
  '/:id/save',
  authenticateToken,
  requireRole('investor'),
  async (req, res) => {
    try {
      const deal = await findDealById(req.params.id);
      if (!deal) return res.status(404).json({ error: 'Deal not found' });

      const savedBy = Array.isArray(deal.savedBy) ? deal.savedBy : [];
      const idx = savedBy.indexOf(req.user.id);

      if (idx === -1) {
        return res.status(404).json({ error: 'Deal is not in your saved list' });
      }

      savedBy.splice(idx, 1);
      const updated = await updateDeal(deal.id, {
        savedBy,
        saveCount: Math.max(0, (deal.saveCount ?? 1) - 1),
      });

      res.json({ saved: false, deal: updated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to unsave deal: ' + err.message });
    }
  }
);

export default router;
