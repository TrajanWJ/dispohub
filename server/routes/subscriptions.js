import { Router } from 'express';
import {
  createSubscription,
  findSubscriptionByUser,
  updateSubscription,
} from '../models/Subscription.js';
import { updateUser } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { SUBSCRIPTION_TIERS } from '../config/constants.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ---------------------------------------------------------------------------
// GET /api/subscriptions/tiers — List available tiers with features
// ---------------------------------------------------------------------------
router.get('/tiers', (req, res) => {
  const tiers = Object.entries(SUBSCRIPTION_TIERS).map(([name, tier]) => {
    const features = [];

    // Build human-readable feature list
    if (tier.offersPerMonth === Infinity) {
      features.push('Unlimited offers per month');
    } else {
      features.push(`${tier.offersPerMonth} offers per month`);
    }

    features.push(`${tier.matchingLevel.charAt(0).toUpperCase() + tier.matchingLevel.slice(1)} matching`);

    if (tier.calculators === 8) {
      features.push('All 8 calculators');
    } else {
      features.push(`${tier.calculators} calculators`);
    }

    if (tier.analytics === 'full') {
      features.push('Full analytics dashboard');
    } else if (tier.analytics === 'basic') {
      features.push('Basic analytics');
    } else {
      features.push('No analytics');
    }

    if (name === 'premium') {
      features.push('Priority support');
      features.push('Featured listings');
    }

    return {
      name,
      price: tier.price,
      ...tier,
      features,
    };
  });

  res.json({ tiers });
});

// ---------------------------------------------------------------------------
// GET /api/subscriptions/mine — Current user's subscription
// ---------------------------------------------------------------------------
router.get('/mine', async (req, res) => {
  try {
    let subscription = await findSubscriptionByUser(req.user.id);

    // If no subscription record exists, create a free one
    if (!subscription) {
      subscription = await createSubscription({
        userId: req.user.id,
        tier: 'free',
        price: 0,
        features: ['3 offers per month', 'Basic matching', '3 calculators'],
        status: 'active',
      });
    }

    res.json({ subscription });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscription: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/subscriptions/upgrade — Upgrade to a new tier
// ---------------------------------------------------------------------------
router.post('/upgrade', async (req, res) => {
  try {
    const { tier } = req.body;

    if (!tier) return res.status(400).json({ error: '"tier" is required' });
    if (!SUBSCRIPTION_TIERS[tier]) {
      return res.status(400).json({ error: `Invalid tier. Available tiers: ${Object.keys(SUBSCRIPTION_TIERS).join(', ')}` });
    }

    const tierInfo = SUBSCRIPTION_TIERS[tier];

    // Check if user is already on this tier
    if (req.user.subscriptionTier === tier) {
      return res.status(400).json({ error: `You are already on the ${tier} tier` });
    }

    // Find or create the subscription record
    let subscription = await findSubscriptionByUser(req.user.id);

    const features = [];
    if (tierInfo.offersPerMonth === Infinity) {
      features.push('Unlimited offers per month');
    } else {
      features.push(`${tierInfo.offersPerMonth} offers per month`);
    }
    features.push(`${tierInfo.matchingLevel.charAt(0).toUpperCase() + tierInfo.matchingLevel.slice(1)} matching`);
    features.push(tierInfo.calculators === 8 ? 'All 8 calculators' : `${tierInfo.calculators} calculators`);
    if (tierInfo.analytics === 'full') features.push('Full analytics dashboard');
    else if (tierInfo.analytics === 'basic') features.push('Basic analytics');
    if (tier === 'premium') {
      features.push('Priority support');
      features.push('Featured listings');
    }

    const now = new Date();
    const renewalDate = new Date(now);
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    if (subscription) {
      subscription = await updateSubscription(subscription.id, {
        tier,
        price: tierInfo.price,
        features,
        startDate: now.toISOString(),
        renewalDate: tier !== 'free' ? renewalDate.toISOString() : null,
        status: 'active',
      });
    } else {
      subscription = await createSubscription({
        userId: req.user.id,
        tier,
        price: tierInfo.price,
        features,
        startDate: now.toISOString(),
        renewalDate: tier !== 'free' ? renewalDate.toISOString() : null,
        status: 'active',
      });
    }

    // Update the user's subscriptionTier field
    await updateUser(req.user.id, { subscriptionTier: tier });

    res.json({ subscription, message: `Successfully upgraded to ${tier} tier` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upgrade subscription: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/subscriptions/cancel — Cancel subscription (reverts to free)
// ---------------------------------------------------------------------------
router.post('/cancel', async (req, res) => {
  try {
    if (req.user.subscriptionTier === 'free') {
      return res.status(400).json({ error: 'You are already on the free tier' });
    }

    let subscription = await findSubscriptionByUser(req.user.id);

    const freeFeatures = ['3 offers per month', 'Basic matching', '3 calculators'];

    if (subscription) {
      subscription = await updateSubscription(subscription.id, {
        tier: 'free',
        price: 0,
        features: freeFeatures,
        renewalDate: null,
        status: 'cancelled',
      });
    } else {
      subscription = await createSubscription({
        userId: req.user.id,
        tier: 'free',
        price: 0,
        features: freeFeatures,
        status: 'cancelled',
      });
    }

    // Update the user's subscriptionTier field
    await updateUser(req.user.id, { subscriptionTier: 'free' });

    res.json({ subscription, message: 'Subscription cancelled. Reverted to free tier.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel subscription: ' + err.message });
  }
});

export default router;
