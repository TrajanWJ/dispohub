import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/client';
import { Button, Badge, LoadingSpinner, EmptyState } from '../../components/common/index.jsx';

// ─── Helpers ──────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtCompact(n) {
  if (n == null) return '$0';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtNumber(n) {
  if (n == null) return '0';
  return Number(n).toLocaleString('en-US');
}

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1280, margin: '0 auto' },
  header: { marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '0.9rem' },

  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem', marginBottom: '2rem',
  },
  statCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.25rem 1.5rem',
    transition: 'var(--transition)',
  },
  statLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '0.5rem' },
  statValue: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 },
  statChange: { fontSize: '0.75rem', fontWeight: 600, marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' },

  periodSelector: {
    display: 'flex', gap: '0.5rem', marginBottom: '1.75rem',
  },
  periodBtn: {
    padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 500,
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    cursor: 'pointer', transition: 'var(--transition)', background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
  },
  periodBtnActive: {
    background: 'var(--accent-primary)', color: '#fff',
    borderColor: 'var(--accent-primary)',
  },

  chartSection: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.5rem',
    marginBottom: '2rem',
  },
  chartHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  chartTitle: { fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)' },
  chartLegend: { display: 'flex', gap: '1.25rem' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' },
  legendDot: { width: 10, height: 10, borderRadius: 2 },

  chartContainer: {
    position: 'relative', width: '100%', height: 320,
    display: 'flex', alignItems: 'flex-end', gap: 0,
    paddingBottom: '2rem',
  },
  barGroup: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    position: 'relative', height: '100%', justifyContent: 'flex-end',
  },
  barWrapper: {
    display: 'flex', alignItems: 'flex-end', gap: 3, width: '100%',
    justifyContent: 'center', flex: 1,
  },
  bar: {
    borderRadius: '4px 4px 0 0', minWidth: 16, maxWidth: 40,
    transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
    cursor: 'pointer', position: 'relative', width: '35%',
  },
  barLabel: {
    fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center',
    marginTop: '0.5rem', whiteSpace: 'nowrap', position: 'absolute',
    bottom: '-1.75rem', left: '50%', transform: 'translateX(-50%)',
  },
  barTooltip: {
    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)', padding: '0.375rem 0.625rem',
    fontSize: '0.7rem', color: 'var(--text-primary)', whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', marginBottom: 6, zIndex: 10,
    pointerEvents: 'none',
  },

  gridLines: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: '2rem',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  gridLine: {
    borderBottom: '1px dashed var(--border-color)', position: 'relative',
  },
  gridLabel: {
    position: 'absolute', left: -4, top: -8, fontSize: '0.625rem',
    color: 'var(--text-muted)', transform: 'translateX(-100%)', paddingRight: '0.5rem',
  },

  tableSection: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', overflow: 'hidden',
  },
  tableHeader: {
    padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)',
    fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)',
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

  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1.25rem',
  },
};

const PERIODS = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
];

// ─── Component ────────────────────────────────────────────────────
export default function RevenueReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('monthly');

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [breakdown, setBreakdown] = useState([]);
  const [animated, setAnimated] = useState(false);

  // Tooltip hover
  const [hoveredBar, setHoveredBar] = useState(null);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnimated(false);
    try {
      const res = await api.get('/admin/revenue', { params: { period } });
      const data = res.data;
      setTotalRevenue(data.totalRevenue || 0);
      setTotalVolume(data.totalVolume || 0);
      setTotalTransactions(data.totalTransactions || 0);
      setBreakdown(data.breakdown || []);

      // Trigger animation after data is loaded
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimated(true));
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load revenue data.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  // Compute stats
  const avgFee = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Find max values for chart scaling
  const maxRevenue = Math.max(1, ...breakdown.map((b) => b.revenue || 0));
  const maxVolume = Math.max(1, ...breakdown.map((b) => b.totalVolume || b.volume || 0));

  // Compute trend (compare last two periods)
  const revenueTrend = (() => {
    if (breakdown.length < 2) return null;
    const current = breakdown[breakdown.length - 1]?.revenue || 0;
    const previous = breakdown[breakdown.length - 2]?.revenue || 0;
    if (previous === 0) return null;
    const pct = ((current - previous) / previous) * 100;
    return { pct, up: pct >= 0 };
  })();

  // Find top performing period
  const topPeriodIdx = breakdown.reduce((best, item, i) => {
    return (item.revenue || 0) > (breakdown[best]?.revenue || 0) ? i : best;
  }, 0);

  // Grid line values
  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((pct) => Math.round(maxRevenue * pct));

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>Revenue Reports</h1>
        <p style={s.subtitle}>Comprehensive financial analytics and platform revenue performance.</p>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {/* Stat Cards */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Total Revenue</div>
          <div style={{ ...s.statValue, color: 'var(--accent-success)' }}>{fmtCompact(totalRevenue)}</div>
          {revenueTrend && (
            <div style={{
              ...s.statChange,
              color: revenueTrend.up ? 'var(--accent-success)' : 'var(--accent-danger)',
            }}>
              <span>{revenueTrend.up ? '\u25B2' : '\u25BC'}</span>
              <span>{Math.abs(revenueTrend.pct).toFixed(1)}% vs previous period</span>
            </div>
          )}
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Total Volume</div>
          <div style={s.statValue}>{fmtCompact(totalVolume)}</div>
          <div style={{ ...s.statChange, color: 'var(--text-muted)' }}>
            Gross transaction volume
          </div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Total Transactions</div>
          <div style={s.statValue}>{fmtNumber(totalTransactions)}</div>
          <div style={{ ...s.statChange, color: 'var(--text-muted)' }}>
            Completed deals
          </div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Avg. Fee per Transaction</div>
          <div style={{ ...s.statValue, color: 'var(--accent-primary)' }}>{fmt(avgFee)}</div>
          <div style={{ ...s.statChange, color: 'var(--text-muted)' }}>
            Platform commission
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div style={s.periodSelector}>
        {PERIODS.map((p) => (
          <button
            key={p.value}
            style={{
              ...s.periodBtn,
              ...(period === p.value ? s.periodBtnActive : {}),
            }}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div style={s.center}><LoadingSpinner size={40} /></div>
      ) : breakdown.length === 0 ? (
        <EmptyState
          title="No revenue data"
          message="Revenue data will appear here once transactions are processed on the platform."
          icon={'\u{1F4CA}'}
        />
      ) : (
        <>
          <div style={s.chartSection}>
            <div style={s.chartHeader}>
              <div style={s.chartTitle}>Revenue vs Transaction Volume</div>
              <div style={s.chartLegend}>
                <div style={s.legendItem}>
                  <div style={{ ...s.legendDot, background: 'var(--accent-primary)' }} />
                  Revenue
                </div>
                <div style={s.legendItem}>
                  <div style={{ ...s.legendDot, background: 'var(--accent-success)' }} />
                  Volume
                </div>
              </div>
            </div>

            <div style={{ position: 'relative', paddingLeft: 50 }}>
              {/* Grid Lines */}
              <div style={s.gridLines}>
                {gridValues.reverse().map((val, i) => (
                  <div key={i} style={s.gridLine}>
                    <span style={s.gridLabel}>{fmtCompact(val)}</span>
                  </div>
                ))}
              </div>

              {/* Bars */}
              <div style={s.chartContainer}>
                {breakdown.map((item, i) => {
                  const revHeight = animated ? Math.max(2, ((item.revenue || 0) / maxRevenue) * 100) : 2;
                  const volHeight = animated ? Math.max(2, ((item.totalVolume || item.volume || 0) / maxVolume) * 100) : 2;
                  const label = item.period || item.month || item.label || `Period ${i + 1}`;
                  const isTop = i === topPeriodIdx;
                  const isHovered = hoveredBar === i;

                  return (
                    <div
                      key={i}
                      style={s.barGroup}
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div style={s.barWrapper}>
                        {/* Revenue bar */}
                        <div style={{
                          ...s.bar,
                          height: `${revHeight}%`,
                          background: isTop
                            ? 'linear-gradient(180deg, #a78bfa 0%, #6c5ce7 100%)'
                            : 'linear-gradient(180deg, #8b7bd4 0%, #6c5ce7 100%)',
                          opacity: isHovered ? 1 : 0.85,
                          boxShadow: isHovered ? '0 0 12px rgba(108,92,231,0.4)' : 'none',
                        }} />

                        {/* Volume bar */}
                        <div style={{
                          ...s.bar,
                          height: `${volHeight}%`,
                          background: isTop
                            ? 'linear-gradient(180deg, #34d399 0%, #00d68f 100%)'
                            : 'linear-gradient(180deg, #2bc4a0 0%, #00d68f 100%)',
                          opacity: isHovered ? 1 : 0.85,
                          boxShadow: isHovered ? '0 0 12px rgba(0,214,143,0.4)' : 'none',
                        }} />
                      </div>

                      {/* Label */}
                      <div style={s.barLabel}>
                        {label}
                        {isTop && <span style={{ color: 'var(--accent-warning)', marginLeft: 3 }}>{'\u2605'}</span>}
                      </div>

                      {/* Tooltip */}
                      {isHovered && (
                        <div style={s.barTooltip}>
                          <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
                          <div>Revenue: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{fmt(item.revenue || 0)}</span></div>
                          <div>Volume: <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{fmt(item.totalVolume || item.volume || 0)}</span></div>
                          <div>Transactions: <span style={{ fontWeight: 600 }}>{item.transactionCount || item.transactions || 0}</span></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div style={s.tableSection}>
            <div style={s.tableHeader}>Period Breakdown</div>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Period</th>
                  <th style={s.th}>Revenue</th>
                  <th style={s.th}>Volume</th>
                  <th style={s.th}>Transactions</th>
                  <th style={s.th}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item, i) => {
                  const prev = i > 0 ? breakdown[i - 1] : null;
                  const prevRev = prev?.revenue || 0;
                  const currRev = item.revenue || 0;
                  const trendPct = prevRev > 0 ? ((currRev - prevRev) / prevRev) * 100 : null;
                  const isTop = i === topPeriodIdx;

                  return (
                    <tr
                      key={i}
                      style={{ background: isTop ? 'rgba(108,92,231,0.04)' : 'transparent' }}
                    >
                      <td style={s.td}>
                        <span style={{ fontWeight: 500 }}>{item.period || item.month || item.label || '-'}</span>
                        {isTop && (
                          <Badge variant="warning" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                            Top Period
                          </Badge>
                        )}
                      </td>
                      <td style={{ ...s.td, fontWeight: 600, color: 'var(--accent-success)' }}>
                        {fmt(item.revenue || 0)}
                      </td>
                      <td style={{ ...s.td, color: 'var(--text-secondary)' }}>
                        {fmt(item.totalVolume || item.volume || 0)}
                      </td>
                      <td style={{ ...s.td, color: 'var(--text-secondary)' }}>
                        {fmtNumber(item.transactionCount || item.transactions || 0)}
                      </td>
                      <td style={s.td}>
                        {trendPct != null ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            fontSize: '0.8rem', fontWeight: 600,
                            color: trendPct >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
                          }}>
                            <span>{trendPct >= 0 ? '\u25B2' : '\u25BC'}</span>
                            {Math.abs(trendPct).toFixed(1)}%
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style>{`
        @keyframes barGrow {
          from { height: 2%; }
        }
      `}</style>
    </div>
  );
}
