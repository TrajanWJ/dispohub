import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Badge, LoadingSpinner } from '../../components/common';

// ─── Helpers ──────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ACTIVITY_ICONS = {
  match: { symbol: '\u{1F3AF}', bg: 'rgba(108,92,231,0.15)', color: 'var(--accent-primary)' },
  offer: { symbol: '\u{1F4E9}', bg: 'rgba(255,170,0,0.15)', color: 'var(--accent-warning)' },
  accepted: { symbol: '\u2713', bg: 'rgba(0,214,143,0.15)', color: 'var(--accent-success)' },
  saved: { symbol: '\u{1F516}', bg: 'rgba(52,152,219,0.15)', color: 'var(--accent-info)' },
  transaction: { symbol: '\u{1F4B0}', bg: 'rgba(0,214,143,0.15)', color: 'var(--accent-success)' },
  default: { symbol: '\u25CF', bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
};

const PROPERTY_GRADIENTS = {
  SFH: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
  'Multi-Family': 'linear-gradient(135deg, #00d68f 0%, #00b894 100%)',
  Commercial: 'linear-gradient(135deg, #3498db 0%, #74b9ff 100%)',
  Land: 'linear-gradient(135deg, #ffaa00 0%, #fdcb6e 100%)',
  default: 'linear-gradient(135deg, #636e72 0%, #b2bec3 100%)',
};

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1280, margin: '0 auto' },
  header: { marginBottom: '1.75rem' },
  greeting: { fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '0.9rem' },

  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem', marginBottom: '2rem',
  },
  statCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.25rem 1.5rem',
    display: 'flex', alignItems: 'center', gap: '1rem', transition: 'var(--transition)',
  },
  statIcon: {
    width: 48, height: 48, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.25rem', flexShrink: 0,
  },
  statValue: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 },
  statLabel: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 },

  quickActions: { display: 'flex', gap: '0.75rem', marginBottom: '2rem' },
  primaryBtn: {
    background: 'var(--accent-primary)', color: '#fff', border: 'none',
    borderRadius: 'var(--border-radius)', padding: '0.6rem 1.25rem',
    fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'var(--transition)',
  },
  secondaryBtn: {
    background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    padding: '0.6rem 1.25rem', fontWeight: 500, fontSize: '0.875rem',
    cursor: 'pointer', transition: 'var(--transition)',
  },

  section: { marginBottom: '2rem' },
  sectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem',
  },
  sectionTitle: { fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' },
  viewAll: {
    fontSize: '0.85rem', color: 'var(--accent-primary)', cursor: 'pointer',
    background: 'none', border: 'none', fontWeight: 500,
  },

  // Match carousel
  carousel: {
    display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem',
    scrollSnapType: 'x mandatory', scrollBehavior: 'smooth',
  },
  matchCard: {
    flex: '0 0 280px', scrollSnapAlign: 'start',
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', overflow: 'hidden',
    cursor: 'pointer', transition: 'var(--transition)', position: 'relative',
  },
  matchPhoto: {
    height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600,
  },
  matchBody: { padding: '0.85rem 1rem' },
  matchAddress: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 },
  matchLocation: { fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' },
  matchPrice: { fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-success)' },
  matchBadge: {
    position: 'absolute', top: 8, right: 8,
    background: 'var(--accent-primary)', color: '#fff', borderRadius: 20,
    padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: 700,
  },
  matchReasons: { display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.4rem' },
  reasonTag: {
    background: 'rgba(108,92,231,0.12)', color: 'var(--accent-primary)',
    padding: '0.1rem 0.4rem', borderRadius: 8, fontSize: '0.65rem', fontWeight: 500,
  },

  // Activity feed
  activityList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  activityItem: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)', padding: '0.85rem 1.1rem',
    display: 'flex', alignItems: 'center', gap: '0.85rem',
  },
  activityIcon: {
    width: 36, height: 36, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.9rem', flexShrink: 0,
  },
  activityText: { flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)' },
  activityTime: { fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 },

  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },

  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 },
  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1.5rem',
  },
  empty: { textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' },

  carouselArrow: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 32, height: 32, borderRadius: '50%',
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '1rem', zIndex: 2, boxShadow: 'var(--shadow-md)',
    transition: 'var(--transition)',
  },
};

// ─── Component ────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const carouselRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ matchedToday: 0, activeOffers: 0, dealsPurchased: 0, tier: 'free' });
  const [matches, setMatches] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [matchRes, txnRes, savedRes, subRes] = await Promise.all([
        api.get('/matching/deals').catch(() => ({ data: { matches: [] } })),
        api.get('/transactions').catch(() => ({ data: { transactions: [] } })),
        api.get('/deals/saved').catch(() => ({ data: { deals: [] } })),
        api.get('/subscriptions/mine').catch(() => ({ data: { subscription: { tier: 'free' } } })),
      ]);

      const matchList = matchRes.data.matches || [];
      const transactions = txnRes.data.transactions || [];
      const savedDeals = savedRes.data.deals || [];
      const subscription = subRes.data.subscription || subRes.data || {};

      // Count today's matches
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const matchedToday = matchList.filter((m) => {
        const d = m.deal?.createdAt || m.createdAt;
        return d && new Date(d) >= todayStart;
      }).length || matchList.length;

      // Count active offers (collect from deals)
      let activeOffers = 0;
      try {
        const dealsRes = await api.get('/deals', { params: { limit: 50 } });
        const deals = dealsRes.data.deals || [];
        const offerResults = await Promise.all(
          deals.slice(0, 20).map((d) =>
            api.get(`/deals/${d._id || d.id}/offers`).then((r) => r.data.offers || []).catch(() => [])
          )
        );
        activeOffers = offerResults.reduce(
          (sum, offers) => sum + offers.filter((o) => o.status === 'pending').length, 0
        );
      } catch { /* ignore */ }

      const dealsPurchased = transactions.filter((t) => t.status === 'completed').length;
      const tier = subscription.tier || subscription.plan || 'free';

      setStats({ matchedToday, activeOffers, dealsPurchased, tier });
      setMatches(matchList.slice(0, 10));

      // Build activity feed
      const activities = [];
      matchList.slice(0, 3).forEach((m) => {
        activities.push({
          id: `match-${m.deal?._id || m.deal?.id || Math.random()}`,
          type: 'match',
          text: `New match: ${m.deal?.address || 'a deal'} (${m.match?.percentage || 0}% match)`,
          date: m.deal?.createdAt,
        });
      });
      savedDeals.slice(0, 2).forEach((d) => {
        activities.push({
          id: `saved-${d._id || d.id || Math.random()}`,
          type: 'saved',
          text: `Saved deal: ${d.address || 'a deal'} at ${fmt(d.askingPrice)}`,
          date: d.savedAt || d.createdAt,
        });
      });
      transactions.slice(0, 3).forEach((t) => {
        activities.push({
          id: `txn-${t._id || t.id || Math.random()}`,
          type: 'transaction',
          text: `Transaction ${t.status}: ${t.dealAddress || t.address || 'a deal'} - ${fmt(t.salePrice)}`,
          date: t.updatedAt || t.createdAt,
        });
      });
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivity(activities.slice(0, 6));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    const scrollAmt = 296;
    carouselRef.current.scrollBy({ left: direction * scrollAmt, behavior: 'smooth' });
  };

  const tierLabel = (tier) => {
    const map = { free: 'Free', pro: 'Pro', premium: 'Premium' };
    return map[tier] || tier;
  };
  const tierVariant = (tier) => {
    const map = { free: 'neutral', pro: 'info', premium: 'success' };
    return map[tier] || 'neutral';
  };

  const statCards = [
    { label: 'Matched Deals Today', value: stats.matchedToday, icon: '\u{1F3AF}', bg: 'rgba(108,92,231,0.15)', color: 'var(--accent-primary)' },
    { label: 'Active Offers', value: stats.activeOffers, icon: '\u{1F4E9}', bg: 'rgba(255,170,0,0.15)', color: 'var(--accent-warning)' },
    { label: 'Deals Purchased', value: stats.dealsPurchased, icon: '\u{1F3E0}', bg: 'rgba(0,214,143,0.15)', color: 'var(--accent-success)' },
    {
      label: 'Subscription Tier',
      value: <Badge variant={tierVariant(stats.tier)}>{tierLabel(stats.tier)}</Badge>,
      icon: '\u2B50',
      bg: 'rgba(255,170,0,0.15)',
      color: 'var(--accent-warning)',
    },
  ];

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.center}>
          <LoadingSpinner size={40} />
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.greeting}>
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p style={s.subtitle}>Your investment activity at a glance.</p>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {/* Quick actions */}
      <div style={s.quickActions}>
        <button
          style={s.primaryBtn}
          onClick={() => navigate('/investor/browse')}
          onMouseOver={(e) => (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
        >
          Browse Deals
        </button>
        <button
          style={s.secondaryBtn}
          onClick={() => navigate('/investor/matches')}
          onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
        >
          View Matches
        </button>
        <button
          style={s.secondaryBtn}
          onClick={() => navigate('/investor/preferences')}
          onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
        >
          Set Preferences
        </button>
      </div>

      {/* Stats Row */}
      <div style={s.statsRow}>
        {statCards.map((card) => (
          <div key={card.label} style={s.statCard}>
            <div style={{ ...s.statIcon, background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div>
              <div style={s.statValue}>{card.value}</div>
              <div style={s.statLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Matches Carousel */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Top Matches</h2>
          {matches.length > 0 && (
            <button style={s.viewAll} onClick={() => navigate('/investor/matches')}>
              View all
            </button>
          )}
        </div>

        {matches.length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              No matches yet
            </p>
            <p>Set your preferences to get matched with relevant deals.</p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              style={{ ...s.carouselArrow, left: -12 }}
              onClick={() => scrollCarousel(-1)}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              &#8592;
            </button>
            <div ref={carouselRef} style={s.carousel}>
              {matches.map((item) => {
                const deal = item.deal || {};
                const match = item.match || {};
                const id = deal._id || deal.id;
                const gradient = PROPERTY_GRADIENTS[deal.propertyType] || PROPERTY_GRADIENTS.default;

                return (
                  <div
                    key={id}
                    style={s.matchCard}
                    onClick={() => navigate('/investor/matches')}
                    onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                    onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                  >
                    <div style={s.matchBadge}>{match.percentage || 0}%</div>
                    <div style={{ ...s.matchPhoto, background: gradient }}>
                      {deal.propertyType || 'PROPERTY'}
                    </div>
                    <div style={s.matchBody}>
                      <div style={s.matchAddress}>{deal.address || 'No address'}</div>
                      <div style={s.matchLocation}>
                        {deal.city || ''}{deal.state ? `, ${deal.state}` : ''}
                      </div>
                      <div style={s.matchPrice}>{fmt(deal.askingPrice)}</div>
                      {match.reasons && match.reasons.length > 0 && (
                        <div style={s.matchReasons}>
                          {match.reasons.slice(0, 3).map((r, i) => (
                            <span key={i} style={s.reasonTag}>{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              style={{ ...s.carouselArrow, right: -12 }}
              onClick={() => scrollCarousel(1)}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              &#8594;
            </button>
          </div>
        )}
      </div>

      {/* Two-column: Recent Activity + Quick Stats */}
      <div style={s.twoCol}>
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Recent Activity</h2>
          </div>
          {recentActivity.length === 0 ? (
            <div style={s.empty}>No recent activity.</div>
          ) : (
            <div style={s.activityList}>
              {recentActivity.map((item) => {
                const iconCfg = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.default;
                return (
                  <div key={item.id} style={s.activityItem}>
                    <div style={{ ...s.activityIcon, background: iconCfg.bg, color: iconCfg.color }}>
                      {iconCfg.symbol}
                    </div>
                    <span style={s.activityText}>{item.text}</span>
                    <span style={s.activityTime}>{timeAgo(item.date)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Quick Actions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Browse New Deals', icon: '\u{1F50D}', path: '/investor/browse' },
              { label: 'View Saved Deals', icon: '\u{1F516}', path: '/investor/saved' },
              { label: 'Check My Offers', icon: '\u{1F4E9}', path: '/investor/offers' },
              { label: 'Update Preferences', icon: '\u2699\uFE0F', path: '/investor/preferences' },
              { label: 'Manage Subscription', icon: '\u2B50', path: '/investor/subscription' },
            ].map((action) => (
              <div
                key={action.path}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)', padding: '0.75rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  cursor: 'pointer', transition: 'var(--transition)',
                }}
                onClick={() => navigate(action.path)}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <span style={{ fontSize: '1.1rem' }}>{action.icon}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {action.label}
                </span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.9rem' }}>&#8250;</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carousel custom scrollbar styles */}
      <style>{`
        div::-webkit-scrollbar { height: 4px; }
        div::-webkit-scrollbar-track { background: var(--bg-tertiary); border-radius: 4px; }
        div::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
        div::-webkit-scrollbar-thumb:hover { background: var(--accent-primary); }
      `}</style>
    </div>
  );
}
