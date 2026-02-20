import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import {
  Button, Badge, Modal, LoadingSpinner, ConfirmDialog,
} from '../../components/common';
import { useToast } from '../../components/common/index.jsx';

// ─── Constants ────────────────────────────────────────────────────
const TIER_ORDER = ['free', 'pro', 'premium'];

const DEFAULT_TIERS = [
  {
    name: 'free',
    price: 0,
    label: 'Free',
    description: 'Get started with basic deal browsing and limited matches.',
    features: [
      'Browse up to 10 deals per day',
      'Basic deal matching',
      'Save up to 5 deals',
      'Email support',
    ],
  },
  {
    name: 'pro',
    price: 29,
    label: 'Pro',
    description: 'Unlock more deals, advanced matching, and priority support.',
    features: [
      'Unlimited deal browsing',
      'Advanced AI matching algorithm',
      'Save up to 50 deals',
      'Real-time deal alerts',
      'Offer analytics',
      'Priority email support',
    ],
  },
  {
    name: 'premium',
    price: 99,
    label: 'Premium',
    description: 'Full access with exclusive deals, market insights, and dedicated support.',
    features: [
      'Everything in Pro',
      'Exclusive off-market deals',
      'Market trend analytics',
      'Unlimited saved deals',
      'Wholesaler reputation insights',
      'ROI calculator tools',
      'Dedicated account manager',
      'Phone and live chat support',
    ],
  },
];

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1100, margin: '0 auto' },
  pageHeader: { marginBottom: '1.75rem', textAlign: 'center' },
  title: { fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  subtitle: { fontSize: '0.9rem', color: 'var(--text-secondary)' },

  // Current plan card
  currentPlan: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.5rem 2rem',
    marginBottom: '2rem', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
  },
  currentPlanLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  currentPlanIcon: {
    width: 52, height: 52, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.5rem', flexShrink: 0,
  },
  currentPlanName: { fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' },
  currentPlanPrice: { fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 2 },
  currentPlanRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  renewalInfo: {
    fontSize: '0.8rem', color: 'var(--text-muted)',
    background: 'var(--bg-tertiary)', padding: '0.4rem 0.85rem',
    borderRadius: 'var(--border-radius)',
  },

  // Pricing grid
  pricingGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.25rem', marginBottom: '2rem',
  },
  pricingCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.75rem 1.5rem',
    display: 'flex', flexDirection: 'column', position: 'relative',
    transition: 'var(--transition)',
  },
  pricingCardFeatured: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.75rem 1.5rem',
    display: 'flex', flexDirection: 'column', position: 'relative',
    transition: 'var(--transition)',
    border: '2px solid var(--accent-primary)',
    boxShadow: '0 0 20px rgba(108, 92, 231, 0.15)',
  },
  featuredTag: {
    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--accent-primary)', color: '#fff',
    padding: '0.2rem 1rem', borderRadius: 20, fontSize: '0.72rem',
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
    whiteSpace: 'nowrap',
  },
  currentTag: {
    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--accent-success)', color: '#fff',
    padding: '0.2rem 1rem', borderRadius: 20, fontSize: '0.72rem',
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
    whiteSpace: 'nowrap',
  },
  tierName: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  tierDescription: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.5rem' },
  priceLarge: { fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 },
  pricePeriod: { fontSize: '0.85rem', color: 'var(--text-muted)' },
  featureList: {
    listStyle: 'none', padding: 0, margin: 0,
    display: 'flex', flexDirection: 'column', gap: '0.6rem',
    flex: 1, marginBottom: '1.5rem',
  },
  featureItem: {
    display: 'flex', alignItems: 'flex-start', gap: '0.55rem',
    fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4,
  },
  featureCheck: {
    color: 'var(--accent-success)', flexShrink: 0, fontSize: '0.9rem',
    marginTop: 1,
  },

  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1.25rem',
  },
};

// ─── Component ────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  const [subscription, setSubscription] = useState(null);

  // Modals
  const [upgradeTarget, setUpgradeTarget] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tiersRes, subRes] = await Promise.all([
        api.get('/subscriptions/tiers').catch(() => ({ data: { tiers: null } })),
        api.get('/subscriptions/mine').catch(() => ({ data: { subscription: null } })),
      ]);

      if (tiersRes.data.tiers && tiersRes.data.tiers.length > 0) {
        // Merge API tiers with defaults for descriptions and features fallback
        const apiTiers = tiersRes.data.tiers.map((t) => {
          const def = DEFAULT_TIERS.find((d) => d.name === t.name) || {};
          return {
            ...def,
            ...t,
            label: t.label || def.label || (t.name ? t.name.charAt(0).toUpperCase() + t.name.slice(1) : 'Plan'),
            features: (t.features && t.features.length > 0) ? t.features : def.features || [],
          };
        });
        setTiers(apiTiers);
      }

      const sub = subRes.data.subscription || subRes.data;
      if (sub && (sub.tier || sub.plan)) {
        setSubscription({
          tier: sub.tier || sub.plan || 'free',
          price: sub.price,
          status: sub.status || 'active',
          renewalDate: sub.renewalDate || sub.nextBillingDate,
          features: sub.features || [],
        });
      } else {
        setSubscription({ tier: 'free', price: 0, status: 'active', renewalDate: null, features: [] });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subscription data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentTier = subscription?.tier || 'free';
  const currentTierIdx = TIER_ORDER.indexOf(currentTier);

  // ── Upgrade ──
  const handleUpgrade = (tierName) => {
    setUpgradeTarget(tierName);
  };

  const executeUpgrade = async () => {
    if (!upgradeTarget) return;
    setUpgrading(true);
    try {
      const res = await api.post('/subscriptions/upgrade', { tier: upgradeTarget });
      const newSub = res.data.subscription || {};
      setSubscription({
        tier: newSub.tier || newSub.plan || upgradeTarget,
        price: newSub.price,
        status: newSub.status || 'active',
        renewalDate: newSub.renewalDate || newSub.nextBillingDate,
        features: newSub.features || [],
      });
      toast.success(res.data.message || `Successfully upgraded to ${upgradeTarget.charAt(0).toUpperCase() + upgradeTarget.slice(1)}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upgrade subscription.');
    } finally {
      setUpgrading(false);
      setUpgradeTarget(null);
    }
  };

  // ── Cancel ──
  const executeCancel = async () => {
    setCancelling(true);
    try {
      const res = await api.post('/subscriptions/cancel');
      const newSub = res.data.subscription || {};
      setSubscription({
        tier: newSub.tier || newSub.plan || 'free',
        price: newSub.price || 0,
        status: newSub.status || 'cancelled',
        renewalDate: null,
        features: newSub.features || [],
      });
      toast.success(res.data.message || 'Subscription cancelled. You have been moved to the Free plan.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel subscription.');
    } finally {
      setCancelling(false);
      setCancelConfirm(false);
    }
  };

  const tierIcon = (name) => {
    const map = { free: '\u{1F310}', pro: '\u{1F680}', premium: '\u{1F451}' };
    return map[name] || '\u2B50';
  };

  const tierBg = (name) => {
    const map = {
      free: { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
      pro: { bg: 'rgba(52,152,219,0.15)', color: 'var(--accent-info)' },
      premium: { bg: 'rgba(108,92,231,0.15)', color: 'var(--accent-primary)' },
    };
    return map[name] || map.free;
  };

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.center}><LoadingSpinner size={40} /></div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.pageHeader}>
        <h1 style={s.title}>Subscription</h1>
        <p style={s.subtitle}>
          Choose the plan that best fits your investment strategy.
        </p>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {/* Current Plan Card */}
      {subscription && (
        <div style={s.currentPlan}>
          <div style={s.currentPlanLeft}>
            <div style={{ ...s.currentPlanIcon, background: tierBg(currentTier).bg, color: tierBg(currentTier).color }}>
              {tierIcon(currentTier)}
            </div>
            <div>
              <div style={s.currentPlanName}>
                {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan
                <Badge
                  variant={currentTier === 'free' ? 'neutral' : currentTier === 'pro' ? 'info' : 'success'}
                  style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }}
                >
                  Current
                </Badge>
              </div>
              <div style={s.currentPlanPrice}>
                {subscription.price > 0
                  ? `$${subscription.price}/month`
                  : 'Free forever'}
                {subscription.renewalDate && (
                  <span> &middot; Renews {formatDate(subscription.renewalDate)}</span>
                )}
              </div>
            </div>
          </div>
          <div style={s.currentPlanRight}>
            {currentTier !== 'free' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancelConfirm(true)}
                style={{ color: 'var(--accent-danger)' }}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div style={s.pricingGrid}>
        {tiers.map((tier) => {
          const tierIdx = TIER_ORDER.indexOf(tier.name);
          const isCurrent = tier.name === currentTier;
          const isFeatured = tier.name === 'premium';
          const isUpgrade = tierIdx > currentTierIdx;
          const isDowngrade = tierIdx < currentTierIdx;
          const price = tier.price != null ? tier.price : 0;

          return (
            <div
              key={tier.name}
              style={isFeatured ? s.pricingCardFeatured : s.pricingCard}
              onMouseOver={(e) => {
                if (!isFeatured) e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseOut={(e) => {
                if (!isFeatured) e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              {isFeatured && !isCurrent && <div style={s.featuredTag}>Most Popular</div>}
              {isCurrent && <div style={s.currentTag}>Current Plan</div>}

              <div style={s.tierName}>{tier.label || tier.name}</div>
              <div style={s.tierDescription}>{tier.description || ''}</div>

              <div style={s.priceRow}>
                <span style={s.priceLarge}>${price}</span>
                <span style={s.pricePeriod}>{price > 0 ? '/mo' : ''}</span>
              </div>

              <ul style={s.featureList}>
                {(tier.features || []).map((feature, idx) => (
                  <li key={idx} style={s.featureItem}>
                    <span style={s.featureCheck}>{'\u2713'}</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="secondary" fullWidth disabled>
                  Current Plan
                </Button>
              ) : isUpgrade ? (
                <Button
                  variant={isFeatured ? 'primary' : 'outline'}
                  fullWidth
                  onClick={() => handleUpgrade(tier.name)}
                >
                  Upgrade to {tier.label || tier.name}
                </Button>
              ) : isDowngrade ? (
                <Button variant="ghost" fullWidth onClick={() => handleUpgrade(tier.name)}>
                  Downgrade
                </Button>
              ) : (
                <Button variant="outline" fullWidth onClick={() => handleUpgrade(tier.name)}>
                  Switch Plan
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ / Info */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-lg)', padding: '1.5rem 2rem',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Frequently Asked Questions
        </h3>
        {[
          {
            q: 'Can I switch plans at any time?',
            a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and are prorated.',
          },
          {
            q: 'What happens when I cancel?',
            a: 'When you cancel, you will be moved to the Free plan at the end of your current billing period. You will not lose any saved data.',
          },
          {
            q: 'Is there a contract or commitment?',
            a: 'No. All plans are month-to-month with no long-term commitment. Cancel anytime without penalty.',
          },
        ].map((item, idx) => (
          <div key={idx} style={{ marginBottom: idx < 2 ? '1rem' : 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {item.q}
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {item.a}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Upgrade Confirm Modal ═══ */}
      <Modal
        isOpen={!!upgradeTarget}
        onClose={() => setUpgradeTarget(null)}
        title="Confirm Plan Change"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUpgradeTarget(null)}>Cancel</Button>
            <Button loading={upgrading} onClick={executeUpgrade}>
              {TIER_ORDER.indexOf(upgradeTarget) > currentTierIdx ? 'Upgrade Now' : 'Switch Plan'}
            </Button>
          </>
        }
      >
        {(() => {
          const targetTier = tiers.find((t) => t.name === upgradeTarget);
          const isUpgrade = TIER_ORDER.indexOf(upgradeTarget) > currentTierIdx;
          return (
            <div>
              <div style={{
                background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)',
                padding: '1rem 1.25rem', marginBottom: '1rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  {isUpgrade ? 'Upgrading to' : 'Switching to'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {targetTier?.label || upgradeTarget}
                </div>
                <div style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                  ${targetTier?.price || 0}/month
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, textAlign: 'center' }}>
                {isUpgrade
                  ? 'Your new plan will be activated immediately. You will be charged the prorated difference for the remainder of your billing period.'
                  : 'Your plan will be changed immediately. Any unused balance from your current plan will be credited to your account.'}
              </p>
            </div>
          );
        })()}
      </Modal>

      {/* ═══ Cancel Confirm ═══ */}
      <ConfirmDialog
        isOpen={cancelConfirm}
        onClose={() => setCancelConfirm(false)}
        onConfirm={executeCancel}
        title="Cancel Subscription"
        message={`Are you sure you want to cancel your ${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} subscription? You will lose access to premium features at the end of your current billing period.`}
        confirmText={cancelling ? 'Cancelling...' : 'Cancel Subscription'}
        confirmVariant="danger"
      />
    </div>
  );
}
