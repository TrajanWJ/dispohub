import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

// ─── Inline styles ────────────────────────────────────────────────
const styles = {
  page: {
    padding: '1.5rem 2rem',
    maxWidth: 1280,
    margin: '0 auto',
  },
  header: {
    marginBottom: '1.75rem',
  },
  greeting: {
    fontSize: '1.625rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },

  /* ── Stat cards ── */
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'var(--transition)',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    flexShrink: 0,
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: 2,
  },

  /* ── Section ── */
  section: {
    marginBottom: '2rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  viewAll: {
    fontSize: '0.85rem',
    color: 'var(--accent-primary)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontWeight: 500,
  },

  /* ── Quick actions ── */
  quickActions: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '2rem',
  },
  primaryBtn: {
    background: 'var(--accent-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--border-radius)',
    padding: '0.6rem 1.25rem',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'var(--transition)',
  },
  secondaryBtn: {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    padding: '0.6rem 1.25rem',
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },

  /* ── Attention cards ── */
  attentionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
  attentionCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'var(--transition)',
    position: 'relative',
  },
  attentionAddress: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '0.35rem',
  },
  attentionMeta: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.75rem',
  },
  attentionPrice: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: 'var(--accent-success)',
  },
  offerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: 'var(--accent-primary)',
    color: '#fff',
    borderRadius: 20,
    padding: '0.2rem 0.65rem',
    fontSize: '0.75rem',
    fontWeight: 600,
  },

  /* ── Activity feed ── */
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  activityItem: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    padding: '0.85rem 1.1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    flexShrink: 0,
  },
  activityText: {
    flex: 1,
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
  },
  activityTime: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    flexShrink: 0,
  },

  /* ── Loading / Error ── */
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid var(--border-color)',
    borderTopColor: 'var(--accent-primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    background: 'rgba(255,71,87,0.08)',
    border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)',
    padding: '1rem 1.25rem',
    color: 'var(--accent-danger)',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '2.5rem 1rem',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },

  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────
function formatCurrency(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const ACTIVITY_ICONS = {
  offer: { symbol: '\u{1F4E9}', bg: 'rgba(108,92,231,0.15)', color: 'var(--accent-primary)' },
  accepted: { symbol: '\u2713', bg: 'rgba(0,214,143,0.15)', color: 'var(--accent-success)' },
  deal: { symbol: '\u{1F3E0}', bg: 'rgba(52,152,219,0.15)', color: 'var(--accent-info)' },
  transaction: { symbol: '\u{1F4B0}', bg: 'rgba(255,170,0,0.15)', color: 'var(--accent-warning)' },
  default: { symbol: '\u25CF', bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
};

// ─── Component ────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ activeListings: 0, pendingOffers: 0, totalEarned: 0, reputation: 0 });
  const [attentionDeals, setAttentionDeals] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dealsRes, transactionsRes] = await Promise.all([
        api.get('/deals', { params: { status: 'active', limit: 50 } }),
        api.get('/transactions'),
      ]);

      const deals = dealsRes.data.deals || [];
      const transactions = transactionsRes.data.transactions || [];

      // Gather offers for active deals
      const offersResults = await Promise.all(
        deals.slice(0, 20).map((d) =>
          api.get(`/deals/${d._id || d.id}/offers`).then((r) => ({
            deal: d,
            offers: r.data.offers || [],
          })).catch(() => ({ deal: d, offers: [] }))
        )
      );

      // Stats
      const activeListings = deals.length;
      const pendingOffers = offersResults.reduce(
        (sum, { offers }) => sum + offers.filter((o) => o.status === 'pending').length,
        0
      );
      const totalEarned = transactions
        .filter((t) => t.status === 'completed')
        .reduce((sum, t) => sum + (t.netToWholesaler || t.salePrice || 0), 0);
      const reputation = user?.reputationScore ?? user?.reputation ?? 4.5;

      setStats({ activeListings, pendingOffers, totalEarned, reputation });

      // Deals with pending offers
      const needsAttention = offersResults
        .filter(({ offers }) => offers.some((o) => o.status === 'pending'))
        .map(({ deal, offers }) => ({
          ...deal,
          pendingOfferCount: offers.filter((o) => o.status === 'pending').length,
        }))
        .slice(0, 6);
      setAttentionDeals(needsAttention);

      // Recent activity - synthesize from deals & transactions
      const activities = [];
      offersResults.forEach(({ deal, offers }) => {
        offers.slice(0, 3).forEach((o) => {
          activities.push({
            id: o._id || o.id || Math.random(),
            type: o.status === 'accepted' ? 'accepted' : o.status === 'pending' ? 'offer' : 'offer',
            text:
              o.status === 'accepted'
                ? `Offer of ${formatCurrency(o.amount)} accepted on ${deal.address || 'a deal'}`
                : `New offer of ${formatCurrency(o.amount)} on ${deal.address || 'a deal'}`,
            date: o.updatedAt || o.createdAt,
          });
        });
      });
      transactions.slice(0, 3).forEach((t) => {
        activities.push({
          id: t._id || t.id || Math.random(),
          type: 'transaction',
          text: `Transaction ${t.status} for ${t.dealAddress || t.address || 'a deal'} - ${formatCurrency(t.salePrice)}`,
          date: t.updatedAt || t.createdAt,
        });
      });
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivity(activities.slice(0, 5));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Stat card configs ──
  const statCards = [
    {
      label: 'Active Listings',
      value: stats.activeListings,
      icon: '\u{1F3E0}',
      bg: 'rgba(108,92,231,0.15)',
      color: 'var(--accent-primary)',
    },
    {
      label: 'Pending Offers',
      value: stats.pendingOffers,
      icon: '\u{1F4E9}',
      bg: 'rgba(255,170,0,0.15)',
      color: 'var(--accent-warning)',
    },
    {
      label: 'Total Earned',
      value: formatCurrency(stats.totalEarned),
      icon: '\u{1F4B0}',
      bg: 'rgba(0,214,143,0.15)',
      color: 'var(--accent-success)',
    },
    {
      label: 'Reputation Score',
      value: Number(stats.reputation).toFixed(1),
      icon: '\u2B50',
      bg: 'rgba(255,170,0,0.15)',
      color: 'var(--accent-warning)',
    },
  ];

  // ── Render ──
  if (loading) {
    return (
      <div style={styles.page}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.greeting}>
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p style={styles.subtitle}>Here is what is happening with your deals today.</p>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Quick actions */}
      <div style={styles.quickActions}>
        <button
          style={styles.primaryBtn}
          onClick={() => navigate('/wholesaler/deals/new')}
          onMouseOver={(e) => (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
        >
          + New Deal
        </button>
        <button
          style={styles.secondaryBtn}
          onClick={() => navigate('/wholesaler/deals')}
          onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
        >
          View All Deals
        </button>
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        {statCards.map((card) => (
          <div key={card.label} style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div>
              <div style={styles.statValue}>{card.value}</div>
              <div style={styles.statLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two‑column layout */}
      <div style={styles.twoCol}>
        {/* Deals Needing Attention */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Deals Needing Attention</h2>
            {attentionDeals.length > 0 && (
              <button style={styles.viewAll} onClick={() => navigate('/wholesaler/deals')}>
                View all
              </button>
            )}
          </div>

          {attentionDeals.length === 0 ? (
            <div style={styles.emptyState}>No deals need attention right now.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {attentionDeals.map((deal) => (
                <div
                  key={deal._id || deal.id}
                  style={styles.attentionCard}
                  onClick={() => navigate('/wholesaler/deals')}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <div style={styles.offerBadge}>
                    {deal.pendingOfferCount} offer{deal.pendingOfferCount !== 1 ? 's' : ''}
                  </div>
                  <div style={styles.attentionAddress}>{deal.address || 'No address'}</div>
                  <div style={styles.attentionMeta}>
                    {deal.city}{deal.state ? `, ${deal.state}` : ''}
                  </div>
                  <div style={styles.attentionPrice}>{formatCurrency(deal.askingPrice)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recent Activity</h2>
          </div>

          {recentActivity.length === 0 ? (
            <div style={styles.emptyState}>No recent activity.</div>
          ) : (
            <div style={styles.activityList}>
              {recentActivity.map((item) => {
                const iconCfg = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.default;
                return (
                  <div key={item.id} style={styles.activityItem}>
                    <div
                      style={{
                        ...styles.activityIcon,
                        background: iconCfg.bg,
                        color: iconCfg.color,
                      }}
                    >
                      {iconCfg.symbol}
                    </div>
                    <span style={styles.activityText}>{item.text}</span>
                    <span style={styles.activityTime}>{timeAgo(item.date)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
