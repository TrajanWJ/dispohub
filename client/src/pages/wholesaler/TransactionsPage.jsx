import { useState, useEffect, useCallback } from 'react';
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

const STATUS_MAP = {
  escrow_funded: { label: 'Escrow Funded', bg: 'rgba(52,152,219,0.12)', color: 'var(--accent-info)' },
  under_review: { label: 'Under Review', bg: 'rgba(255,170,0,0.12)', color: 'var(--accent-warning)' },
  closing: { label: 'Closing', bg: 'rgba(108,92,231,0.12)', color: 'var(--accent-primary)' },
  completed: { label: 'Completed', bg: 'rgba(0,214,143,0.12)', color: 'var(--accent-success)' },
  cancelled: { label: 'Cancelled', bg: 'rgba(255,71,87,0.12)', color: 'var(--accent-danger)' },
  pending: { label: 'Pending', bg: 'rgba(95,99,104,0.15)', color: 'var(--text-secondary)' },
};

const PIPELINE_STAGES = ['escrow_funded', 'under_review', 'closing', 'completed'];

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1280, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' },

  /* Table */
  tableWrap: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5,
    borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
  },
  td: {
    padding: '0.85rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
  },
  row: { cursor: 'pointer', transition: 'var(--transition)' },
  badge: {
    display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: 12,
    fontSize: '0.72rem', fontWeight: 600,
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

  /* ── Modal overlay ── */
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  },
  modal: {
    background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-xl)',
    border: '1px solid var(--border-color)', maxWidth: 680, width: '100%',
    maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)',
  },
  modalTitle: { fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' },
  closeBtn: {
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)', color: 'var(--text-secondary)',
    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '1.1rem',
  },
  modalBody: { padding: '1.5rem' },

  /* Timeline */
  timeline: { display: 'flex', flexDirection: 'column', gap: 0, margin: '1.5rem 0' },
  timelineItem: { display: 'flex', alignItems: 'flex-start', gap: '0.85rem', position: 'relative' },
  timelineDotCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 },
  timelineDot: {
    width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, flexShrink: 0, zIndex: 1,
  },
  timelineLine: { width: 2, flex: 1, minHeight: 32 },
  timelineContent: { paddingBottom: '1.25rem' },
  timelineLabel: { fontSize: '0.9rem', fontWeight: 600, marginBottom: 2 },
  timelineDesc: { fontSize: '0.78rem', color: 'var(--text-muted)' },

  /* Fee breakdown */
  feeTable: { width: '100%', borderCollapse: 'collapse', marginTop: '1.25rem' },
  feeRow: { borderBottom: '1px solid var(--border-color)' },
  feeTh: {
    padding: '0.6rem 0', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  feeTd: { padding: '0.6rem 0', textAlign: 'right', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' },
  feeTotal: { color: 'var(--accent-success)', fontSize: '1.05rem', fontWeight: 700 },

  /* Info grid */
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', marginBottom: '1.25rem' },
  infoLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '0.6rem' },

  /* Advance button */
  advanceBtn: {
    background: 'var(--accent-primary)', color: '#fff', border: 'none',
    borderRadius: 'var(--border-radius)', padding: '0.6rem 1.25rem',
    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', marginTop: '1rem',
    transition: 'var(--transition)',
  },
};

// ─── Component ────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/transactions');
      const list = res.data.transactions || [];
      list.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      setTransactions(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const openDetail = async (txn) => {
    setDetailLoading(true);
    setSelected(txn);
    try {
      const res = await api.get(`/transactions/${txn._id || txn.id}`);
      setSelected(res.data.transaction || res.data);
    } catch {
      // keep the list-level data
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => setSelected(null);

  const advanceStatus = async () => {
    if (!selected) return;
    const currentIdx = PIPELINE_STAGES.indexOf(selected.status);
    if (currentIdx < 0 || currentIdx >= PIPELINE_STAGES.length - 1) return;
    const nextStatus = PIPELINE_STAGES[currentIdx + 1];
    setAdvancing(true);
    try {
      const res = await api.put(`/transactions/${selected._id || selected.id}`, { status: nextStatus });
      setSelected(res.data.transaction || res.data);
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to advance status.');
    } finally {
      setAdvancing(false);
    }
  };

  const statusBadge = (status) => {
    const cfg = STATUS_MAP[status] || STATUS_MAP.pending;
    return <span style={{ ...s.badge, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>;
  };

  return (
    <div style={s.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <h1 style={s.title}>Transactions</h1>

      {error && <div style={s.errorBox}>{error}</div>}

      {loading && (
        <div style={s.center}>
          <div style={s.spinner} />
        </div>
      )}

      {!loading && transactions.length === 0 && (
        <div style={s.empty}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            No transactions yet
          </p>
          <p>Transactions will appear here once offers are accepted and deals move to closing.</p>
        </div>
      )}

      {!loading && transactions.length > 0 && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Deal</th>
                <th style={s.th}>Buyer</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Sale Price</th>
                <th style={s.th}>Platform Fee</th>
                <th style={s.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => {
                const buyer = txn.buyer || txn.buyerInfo || {};
                const buyerName = buyer.firstName
                  ? `${buyer.firstName} ${buyer.lastName || ''}`
                  : buyer.name || txn.buyerName || '-';
                return (
                  <tr
                    key={txn._id || txn.id}
                    style={s.row}
                    onClick={() => openDetail(txn)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={s.td}>{txn.dealAddress || txn.address || '-'}</td>
                    <td style={s.td}>{buyerName}</td>
                    <td style={s.td}>{statusBadge(txn.status)}</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>{fmt(txn.salePrice)}</td>
                    <td style={{ ...s.td, color: 'var(--accent-danger)' }}>{fmt(txn.platformFee)}</td>
                    <td style={{ ...s.td, color: 'var(--text-secondary)' }}>{fmtDate(txn.createdAt || txn.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ Transaction Detail Modal ═══ */}
      {selected && (
        <div style={s.overlay} onClick={closeDetail}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Transaction Details</h2>
              <button style={s.closeBtn} onClick={closeDetail}>&times;</button>
            </div>
            <div style={s.modalBody}>
              {detailLoading ? (
                <div style={s.center}>
                  <div style={s.spinner} />
                </div>
              ) : (
                <TransactionDetailContent
                  txn={selected}
                  onAdvance={advanceStatus}
                  advancing={advancing}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Transaction Detail Content ───────────────────────────────────
function TransactionDetailContent({ txn, onAdvance, advancing }) {
  const buyer = txn.buyer || txn.buyerInfo || {};
  const buyerName = buyer.firstName
    ? `${buyer.firstName} ${buyer.lastName || ''}`
    : buyer.name || txn.buyerName || '-';

  const currentStageIdx = PIPELINE_STAGES.indexOf(txn.status);
  const canAdvance = currentStageIdx >= 0 && currentStageIdx < PIPELINE_STAGES.length - 1;

  // Fee breakdown
  const salePrice = txn.salePrice || 0;
  const platformFeePercent = txn.platformFeePercent || txn.feePercent || 3;
  const platformFee = txn.platformFee || salePrice * (platformFeePercent / 100);
  const netToWholesaler = txn.netToWholesaler || salePrice - platformFee;

  return (
    <>
      {/* Pipeline Timeline */}
      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        Transaction Pipeline
      </h3>
      <div style={s.timeline}>
        {PIPELINE_STAGES.map((stage, i) => {
          const isActive = i <= currentStageIdx;
          const isCurrent = i === currentStageIdx;
          const isLast = i === PIPELINE_STAGES.length - 1;
          const cfg = STATUS_MAP[stage] || STATUS_MAP.pending;

          return (
            <div key={stage} style={s.timelineItem}>
              <div style={s.timelineDotCol}>
                <div
                  style={{
                    ...s.timelineDot,
                    background: isActive ? cfg.color : 'var(--bg-tertiary)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    border: isCurrent ? `2px solid ${cfg.color}` : '2px solid transparent',
                    boxShadow: isCurrent ? `0 0 0 4px ${cfg.bg}` : 'none',
                  }}
                >
                  {isActive ? '\u2713' : ''}
                </div>
                {!isLast && (
                  <div
                    style={{
                      ...s.timelineLine,
                      background: i < currentStageIdx ? cfg.color : 'var(--bg-tertiary)',
                    }}
                  />
                )}
              </div>
              <div style={s.timelineContent}>
                <div style={{ ...s.timelineLabel, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {cfg.label}
                </div>
                {isCurrent && (
                  <div style={s.timelineDesc}>Current stage</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deal & Buyer info */}
      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
        Details
      </h3>
      <div style={s.infoGrid}>
        <div>
          <div style={s.infoLabel}>Deal Address</div>
          <div style={s.infoValue}>{txn.dealAddress || txn.address || '-'}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Buyer</div>
          <div style={s.infoValue}>{buyerName}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Buyer Company</div>
          <div style={s.infoValue}>{buyer.company || '-'}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Date Created</div>
          <div style={s.infoValue}>{fmtDate(txn.createdAt || txn.date)}</div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        Fee Breakdown
      </h3>
      <table style={s.feeTable}>
        <tbody>
          <tr style={s.feeRow}>
            <td style={s.feeTh}>Sale Price</td>
            <td style={s.feeTd}>{fmt(salePrice)}</td>
          </tr>
          <tr style={s.feeRow}>
            <td style={s.feeTh}>Platform Fee ({platformFeePercent}%)</td>
            <td style={{ ...s.feeTd, color: 'var(--accent-danger)' }}>-{fmt(platformFee)}</td>
          </tr>
          <tr>
            <td style={s.feeTh}>Net to You</td>
            <td style={{ ...s.feeTd, ...s.feeTotal }}>{fmt(netToWholesaler)}</td>
          </tr>
        </tbody>
      </table>

      {/* Advance button */}
      {canAdvance && (
        <button
          style={s.advanceBtn}
          onClick={onAdvance}
          disabled={advancing}
          onMouseOver={(e) => !advancing && (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
        >
          {advancing
            ? 'Advancing...'
            : `Advance to ${(STATUS_MAP[PIPELINE_STAGES[currentStageIdx + 1]] || {}).label || 'Next'}`}
        </button>
      )}
    </>
  );
}
