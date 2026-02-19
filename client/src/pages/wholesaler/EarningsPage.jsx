import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/client';

// ─── Helpers ──────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getMonthLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1280, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' },

  /* Stats */
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem', marginBottom: '2rem',
  },
  statCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.25rem 1.5rem',
    display: 'flex', alignItems: 'center', gap: '1rem',
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.15rem', flexShrink: 0,
  },
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 },
  statLabel: { fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 },

  /* Chart */
  chartWrap: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.5rem', marginBottom: '2rem',
  },
  chartTitle: { fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' },

  /* Table */
  tableWrap: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', overflow: 'hidden',
  },
  tableHeader: {
    padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)',
    fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5,
    borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
  },
  td: {
    padding: '0.75rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
  },

  /* Loading / Error / Empty */
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  spinner: {
    width: 36, height: 36, border: '3px solid var(--border-color)',
    borderTopColor: 'var(--accent-primary)', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1.25rem',
  },
  empty: { textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' },
};

// Custom tooltip for chart
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius)', padding: '0.6rem 0.85rem',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-success)' }}>
        {fmt(payload[0].value)}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────
export default function EarningsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/transactions');
      const list = (res.data.transactions || [])
        .filter((t) => t.status === 'completed')
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      setTransactions(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load earnings data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Compute stats ──
  const totalEarned = transactions.reduce(
    (sum, t) => sum + (t.netToWholesaler || (t.salePrice || 0) - (t.platformFee || 0)),
    0
  );
  const now = new Date();
  const thisMonthEarned = transactions
    .filter((t) => {
      const d = new Date(t.createdAt || t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce(
      (sum, t) => sum + (t.netToWholesaler || (t.salePrice || 0) - (t.platformFee || 0)),
      0
    );
  const avgPerDeal = transactions.length > 0 ? totalEarned / transactions.length : 0;
  const totalClosed = transactions.length;

  // ── Monthly chart data ──
  const monthlyMap = {};
  transactions.forEach((t) => {
    const key = getMonthLabel(t.createdAt || t.date);
    const net = t.netToWholesaler || (t.salePrice || 0) - (t.platformFee || 0);
    monthlyMap[key] = (monthlyMap[key] || 0) + net;
  });
  // Sort chronologically
  const monthlyData = Object.entries(monthlyMap)
    .map(([month, earnings]) => ({ month, earnings }))
    .reverse();

  const statCards = [
    { label: 'Total Earned', value: fmt(totalEarned), icon: '\u{1F4B0}', bg: 'rgba(0,214,143,0.15)', color: 'var(--accent-success)' },
    { label: 'This Month', value: fmt(thisMonthEarned), icon: '\u{1F4C5}', bg: 'rgba(108,92,231,0.15)', color: 'var(--accent-primary)' },
    { label: 'Average Per Deal', value: fmt(avgPerDeal), icon: '\u{1F4CA}', bg: 'rgba(52,152,219,0.15)', color: 'var(--accent-info)' },
    { label: 'Total Deals Closed', value: totalClosed, icon: '\u{1F3E0}', bg: 'rgba(255,170,0,0.15)', color: 'var(--accent-warning)' },
  ];

  if (loading) {
    return (
      <div style={s.page}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={s.center}>
          <div style={s.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <h1 style={s.title}>Earnings</h1>

      {error && <div style={s.errorBox}>{error}</div>}

      {/* Stats Row */}
      <div style={s.statsRow}>
        {statCards.map((card) => (
          <div key={card.label} style={s.statCard}>
            <div style={{ ...s.statIcon, background: card.bg, color: card.color }}>{card.icon}</div>
            <div>
              <div style={s.statValue}>{card.value}</div>
              <div style={s.statLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {monthlyData.length > 0 && (
        <div style={s.chartWrap}>
          <h2 style={s.chartTitle}>Monthly Earnings</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey="month"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border-color)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border-color)' }}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(108,92,231,0.08)' }} />
              <Bar dataKey="earnings" fill="var(--accent-success)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Earnings Table */}
      {transactions.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            No earnings yet
          </p>
          <p>Your earnings will appear here once deals are completed.</p>
        </div>
      ) : (
        <div style={s.tableWrap}>
          <div style={s.tableHeader}>Transaction Earnings</div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Date</th>
                <th style={s.th}>Deal Address</th>
                <th style={s.th}>Sale Price</th>
                <th style={s.th}>Platform Fee</th>
                <th style={s.th}>Net Earned</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const net = t.netToWholesaler || (t.salePrice || 0) - (t.platformFee || 0);
                return (
                  <tr key={t._id || t.id}>
                    <td style={{ ...s.td, color: 'var(--text-secondary)' }}>{fmtDate(t.createdAt || t.date)}</td>
                    <td style={s.td}>{t.dealAddress || t.address || '-'}</td>
                    <td style={s.td}>{fmt(t.salePrice)}</td>
                    <td style={{ ...s.td, color: 'var(--accent-danger)' }}>-{fmt(t.platformFee)}</td>
                    <td style={{ ...s.td, fontWeight: 700, color: 'var(--accent-success)' }}>{fmt(net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
