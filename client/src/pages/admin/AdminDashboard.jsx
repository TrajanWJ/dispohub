import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Card, LoadingSpinner, Badge } from '../../components/common/index.jsx';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Helpers ──────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtCompact(n) {
  if (n == null) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

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
    width: 48, height: 48, borderRadius: 12, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0,
  },
  statValue: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 },
  statLabel: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 },

  chartsRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem',
  },
  chartCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.25rem',
  },
  chartTitle: {
    fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem',
  },

  alertsSection: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' },
  alertsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' },
  alertCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.25rem', cursor: 'pointer',
    transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: '1rem',
  },
  alertIcon: {
    width: 44, height: 44, borderRadius: 10, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0,
  },
  alertCount: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 },
  alertLabel: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 },

  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 },
  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1.25rem',
  },
};

const customTooltip = {
  contentStyle: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
    borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-primary)',
  },
  labelStyle: { color: 'var(--text-secondary)', marginBottom: 4 },
};

// ─── Component ────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [dealVolumeData, setDealVolumeData] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, revenueRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/revenue', { params: { period: 'monthly' } }),
      ]);

      setStats(statsRes.data);

      // Build chart data from revenue breakdown
      const breakdown = revenueRes.data.breakdown || [];
      const revChart = breakdown.map((item) => ({
        month: item.month || item.period || item.label || '',
        revenue: item.revenue || item.totalRevenue || 0,
        volume: item.volume || item.totalVolume || 0,
        transactions: item.transactions || item.totalTransactions || 0,
      }));
      setRevenueData(revChart);

      // Deal volume chart from same data
      setDealVolumeData(revChart.map((r) => ({
        month: r.month,
        deals: r.transactions,
      })));
    } catch (err) {
      console.error('Admin dashboard error:', err);
      setError(err.response?.data?.message || 'Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.center}>
          <LoadingSpinner size={48} />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Users', value: fmtCompact(stats?.totalUsers || 0),
      icon: '\uD83D\uDC65', bg: 'rgba(108,92,231,0.15)', color: 'var(--accent-primary)',
    },
    {
      label: 'Active Deals', value: fmtCompact(stats?.activeDeals || 0),
      icon: '\uD83C\uDFE0', bg: 'rgba(0,214,143,0.15)', color: 'var(--accent-success)',
    },
    {
      label: 'Transactions This Month', value: fmtCompact(stats?.completedTransactions || stats?.totalTransactions || 0),
      icon: '\uD83D\uDCB1', bg: 'rgba(52,152,219,0.15)', color: 'var(--accent-info)',
    },
    {
      label: 'Revenue This Month', value: fmt(stats?.totalRevenue || 0),
      icon: '\uD83D\uDCB0', bg: 'rgba(255,170,0,0.15)', color: 'var(--accent-warning)',
    },
  ];

  const alerts = [
    {
      label: 'Pending Verifications', count: stats?.pendingVerifications || 0,
      icon: '\uD83D\uDD0D', bg: 'rgba(255,170,0,0.15)', color: 'var(--accent-warning)',
      path: '/admin/users',
    },
    {
      label: 'Pending Deals', count: stats?.pendingDeals || 0,
      icon: '\uD83D\uDCCB', bg: 'rgba(108,92,231,0.15)', color: 'var(--accent-primary)',
      path: '/admin/deals',
    },
    {
      label: 'Open Disputes', count: stats?.openDisputes || 0,
      icon: '\u26A0\uFE0F', bg: 'rgba(255,71,87,0.15)', color: 'var(--accent-danger)',
      path: '/admin/disputes',
    },
  ];

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.greeting}>
          Admin Dashboard
        </h1>
        <p style={s.subtitle}>
          Platform overview and key metrics{user?.firstName ? ` — Welcome, ${user.firstName}` : ''}.
        </p>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

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

      {/* Charts Row */}
      <div style={s.chartsRow}>
        {/* Revenue Trend */}
        <div style={s.chartCard}>
          <div style={s.chartTitle}>Revenue Trend</div>
          {revenueData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              No revenue data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border-color)' }} tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border-color)' }} tickLine={false}
                  tickFormatter={(v) => '$' + fmtCompact(v)}
                />
                <Tooltip
                  contentStyle={customTooltip.contentStyle}
                  labelStyle={customTooltip.labelStyle}
                  formatter={(v) => [fmt(v), 'Revenue']}
                />
                <Area
                  type="monotone" dataKey="revenue" stroke="#6c5ce7" strokeWidth={2}
                  fill="url(#colorRevenue)" dot={false} activeDot={{ r: 5, fill: '#6c5ce7' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Deal Volume */}
        <div style={s.chartCard}>
          <div style={s.chartTitle}>Deal Volume</div>
          {dealVolumeData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              No deal volume data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dealVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border-color)' }} tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border-color)' }} tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={customTooltip.contentStyle}
                  labelStyle={customTooltip.labelStyle}
                  formatter={(v) => [v, 'Deals']}
                />
                <Bar dataKey="deals" fill="#00d68f" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Alerts Section */}
      <div style={s.alertsSection}>
        <h2 style={s.sectionTitle}>Items Requiring Attention</h2>
        <div style={s.alertsGrid}>
          {alerts.map((alert) => (
            <div
              key={alert.label}
              style={s.alertCard}
              onClick={() => navigate(alert.path)}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ ...s.alertIcon, background: alert.bg, color: alert.color }}>
                {alert.icon}
              </div>
              <div>
                <div style={s.alertCount}>
                  {alert.count}
                  {alert.count > 0 && (
                    <Badge
                      variant={alert.count > 5 ? 'danger' : 'warning'}
                      style={{ marginLeft: '0.5rem', fontSize: '0.65rem', verticalAlign: 'middle' }}
                    >
                      Action Needed
                    </Badge>
                  )}
                </div>
                <div style={s.alertLabel}>{alert.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
