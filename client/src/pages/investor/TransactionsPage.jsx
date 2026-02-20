import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import {
  Button, Modal, Badge, StatusBadge, Tabs,
  LoadingSpinner, EmptyState, ConfirmDialog,
} from '../../components/common';
import { useToast } from '../../components/common/index.jsx';

// ─── Constants ────────────────────────────────────────────────────
const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Escrow Funded', value: 'escrow_funded' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Closing', value: 'closing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Disputed', value: 'disputed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const PIPELINE_STEPS = ['escrow_funded', 'under_review', 'closing', 'completed'];

const STATUS_COLORS = {
  escrow_funded: { bg: 'rgba(52,152,219,0.15)', color: 'var(--accent-info)', label: 'Escrow Funded' },
  under_review: { bg: 'rgba(255,170,0,0.15)', color: 'var(--accent-warning)', label: 'Under Review' },
  closing: { bg: 'rgba(108,92,231,0.15)', color: 'var(--accent-primary)', label: 'Closing' },
  completed: { bg: 'rgba(0,214,143,0.15)', color: 'var(--accent-success)', label: 'Completed' },
  disputed: { bg: 'rgba(255,71,87,0.15)', color: 'var(--accent-danger)', label: 'Disputed' },
  cancelled: { bg: 'var(--bg-tertiary)', color: 'var(--text-muted)', label: 'Cancelled' },
};

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatDateTime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function statusBadgeVariant(status) {
  const map = {
    escrow_funded: 'info',
    under_review: 'warning',
    closing: 'info',
    completed: 'success',
    disputed: 'danger',
    cancelled: 'neutral',
    in_progress: 'info',
  };
  return map[status] || 'neutral';
}

function statusLabel(status) {
  const info = STATUS_COLORS[status];
  if (info) return info.label;
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1280, margin: '0 auto' },
  pageHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem',
  },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' },
  subtitle: { fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' },

  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem', marginBottom: '1.5rem',
  },
  statCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.1rem 1.25rem',
    display: 'flex', alignItems: 'center', gap: '0.85rem',
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.15rem', flexShrink: 0,
  },
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 },
  statLabel: { fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 },

  table: {
    width: '100%', borderCollapse: 'separate', borderSpacing: 0,
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', overflow: 'hidden',
  },
  th: {
    padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5,
    textAlign: 'left', background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
  },
  td: {
    padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle',
  },
  row: { cursor: 'pointer', transition: 'var(--transition)' },
  propertyCell: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  propertyIcon: {
    width: 40, height: 40, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '0.9rem', flexShrink: 0, background: 'var(--accent-primary)',
  },
  propertyAddress: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' },
  propertyLocation: { fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 1 },

  // Pipeline
  pipeline: { display: 'flex', alignItems: 'center', gap: 0, marginBottom: '1.5rem' },
  pipelineStep: {
    flex: 1, textAlign: 'center', padding: '0.6rem 0.25rem', fontSize: '0.72rem',
    fontWeight: 600, position: 'relative', transition: 'var(--transition)',
  },
  pipelineConnector: {
    width: 24, height: 2, flexShrink: 0,
  },

  // Detail modal
  detailSection: { marginBottom: '1.25rem' },
  detailSectionTitle: {
    fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)',
    marginBottom: '0.75rem', paddingBottom: '0.4rem',
    borderBottom: '1px solid var(--border-color)',
  },
  detailGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 1.5rem', marginBottom: '1.25rem',
  },
  detailLabel: {
    fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 2,
  },
  detailValue: { fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 },
  financialRow: {
    display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0',
    borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem',
  },

  // Timeline
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  timelineItem: { display: 'flex', gap: '0.85rem', position: 'relative', paddingBottom: '1.25rem' },
  timelineDot: {
    width: 12, height: 12, borderRadius: '50%', flexShrink: 0, marginTop: 4, zIndex: 1,
  },
  timelineLine: {
    position: 'absolute', left: 5, top: 16, bottom: 0, width: 2,
    background: 'var(--border-color)',
  },
  timelineContent: { flex: 1 },
  timelineTitle: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' },
  timelineDate: { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 },

  // Counterparty
  counterparty: {
    display: 'flex', alignItems: 'center', gap: '0.85rem',
    background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)',
    padding: '0.85rem 1rem',
  },
  counterpartyAvatar: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'var(--accent-primary)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
  },

  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1.25rem',
  },
};

// ─── Component ────────────────────────────────────────────────────
export default function TransactionsPage() {
  const toast = useToast();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail modal
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status advance confirm
  const [advanceTarget, setAdvanceTarget] = useState(null);
  const [advanceStatus, setAdvanceStatus] = useState(null);
  const [advancing, setAdvancing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/transactions');
      const list = res.data.transactions || [];
      list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
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

  // ── Filter ──
  const filteredTxns = statusFilter === 'all'
    ? transactions
    : transactions.filter((t) => t.status === statusFilter);

  // ── Stats ──
  const totalInvested = transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + (Number(t.salePrice || t.amount) || 0), 0);
  const activeTxns = transactions.filter((t) =>
    ['escrow_funded', 'under_review', 'closing'].includes(t.status)
  ).length;
  const completedTxns = transactions.filter((t) => t.status === 'completed').length;
  const inProgressTxns = transactions.filter((t) =>
    ['escrow_funded', 'under_review', 'closing'].includes(t.status)
  ).length;

  // ── Open detail ──
  const openDetail = async (txn) => {
    setSelectedTxn(txn);
    setDetailLoading(true);
    try {
      const res = await api.get(`/transactions/${txn._id || txn.id}`);
      setSelectedTxn(res.data.transaction || res.data);
    } catch { /* keep list data */ }
    finally { setDetailLoading(false); }
  };

  const closeDetail = () => {
    setSelectedTxn(null);
  };

  // ── Advance status ──
  const confirmAdvance = (txn, newStatus) => {
    setAdvanceTarget(txn);
    setAdvanceStatus(newStatus);
  };

  const executeAdvance = async () => {
    if (!advanceTarget || !advanceStatus) return;
    setAdvancing(true);
    try {
      const id = advanceTarget._id || advanceTarget.id;
      await api.put(`/transactions/${id}/status`, { status: advanceStatus });
      toast.success(`Transaction status updated to "${statusLabel(advanceStatus)}".`);
      // Refresh detail
      try {
        const res = await api.get(`/transactions/${id}`);
        setSelectedTxn(res.data.transaction || res.data);
      } catch { /* ignore */ }
      // Refresh list
      setTransactions((prev) => prev.map((t) =>
        (t._id || t.id) === id ? { ...t, status: advanceStatus } : t
      ));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update transaction status.');
    } finally {
      setAdvancing(false);
      setAdvanceTarget(null);
      setAdvanceStatus(null);
    }
  };

  // ── Pipeline visualization ──
  const PipelineView = ({ status }) => {
    const currentIdx = PIPELINE_STEPS.indexOf(status);
    const isBranch = status === 'disputed' || status === 'cancelled';

    return (
      <div style={s.pipeline}>
        {PIPELINE_STEPS.map((step, idx) => {
          const isActive = !isBranch && idx <= currentIdx;
          const isCurrent = !isBranch && step === status;
          const info = STATUS_COLORS[step] || {};

          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div
                style={{
                  ...s.pipelineStep,
                  flex: 1,
                  background: isActive ? info.bg : 'var(--bg-tertiary)',
                  color: isActive ? info.color : 'var(--text-muted)',
                  borderRadius: idx === 0 ? '8px 0 0 8px' :
                    idx === PIPELINE_STEPS.length - 1 ? '0 8px 8px 0' : 0,
                  border: isCurrent ? `2px solid ${info.color}` : '2px solid transparent',
                }}
              >
                {info.label || step}
                {isCurrent && (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', background: info.color,
                    margin: '4px auto 0',
                  }} />
                )}
              </div>
            </div>
          );
        })}
        {isBranch && (
          <div style={{
            flex: '0 0 auto', padding: '0.5rem 0.75rem',
            background: STATUS_COLORS[status]?.bg || 'var(--bg-tertiary)',
            color: STATUS_COLORS[status]?.color || 'var(--text-muted)',
            borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, marginLeft: '0.5rem',
          }}>
            {statusLabel(status)}
          </div>
        )}
      </div>
    );
  };

  // ── Build timeline from transaction data ──
  const buildTimeline = (txn) => {
    const events = [];
    if (txn.createdAt) {
      events.push({ title: 'Transaction Created', date: txn.createdAt, color: 'var(--accent-info)' });
    }
    if (txn.statusHistory && Array.isArray(txn.statusHistory)) {
      txn.statusHistory.forEach((entry) => {
        events.push({
          title: `Status changed to ${statusLabel(entry.status)}`,
          date: entry.date || entry.changedAt,
          color: STATUS_COLORS[entry.status]?.color || 'var(--text-muted)',
        });
      });
    }
    if (txn.updatedAt && txn.updatedAt !== txn.createdAt) {
      events.push({ title: `Last updated (${statusLabel(txn.status)})`, date: txn.updatedAt, color: STATUS_COLORS[txn.status]?.color || 'var(--text-muted)' });
    }
    events.sort((a, b) => new Date(b.date) - new Date(a.date));
    return events.length > 0 ? events : [
      { title: `Current: ${statusLabel(txn.status)}`, date: txn.updatedAt || txn.createdAt, color: STATUS_COLORS[txn.status]?.color || 'var(--text-secondary)' },
    ];
  };

  const statCards = [
    { label: 'Total Invested', value: fmt(totalInvested), icon: '\u{1F4B0}', bg: 'rgba(0,214,143,0.15)', color: 'var(--accent-success)' },
    { label: 'Active Transactions', value: activeTxns, icon: '\u{1F504}', bg: 'rgba(52,152,219,0.15)', color: 'var(--accent-info)' },
    { label: 'Completed', value: completedTxns, icon: '\u2713', bg: 'rgba(0,214,143,0.15)', color: 'var(--accent-success)' },
    { label: 'In Progress', value: inProgressTxns, icon: '\u{23F3}', bg: 'rgba(255,170,0,0.15)', color: 'var(--accent-warning)' },
  ];

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
        <div>
          <h1 style={s.title}>Transactions</h1>
          <p style={s.subtitle}>
            Track the progress of your real estate transactions from escrow to close.
          </p>
        </div>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {/* Stats */}
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

      {/* Status Tabs */}
      <Tabs
        tabs={STATUS_TABS.map((t) => ({
          ...t,
          label: `${t.label}${t.value === 'all' ? ` (${transactions.length})` :
            ` (${transactions.filter((tx) => tx.status === t.value).length})`}`,
        }))}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      {/* Transactions Table */}
      {filteredTxns.length === 0 ? (
        <EmptyState
          icon={'\u{1F4CB}'}
          title={statusFilter === 'all' ? 'No transactions yet' : `No ${statusLabel(statusFilter).toLowerCase()} transactions`}
          message={
            statusFilter === 'all'
              ? 'When you close on deals, your transactions will appear here.'
              : `You don't have any transactions with "${statusLabel(statusFilter)}" status.`
          }
          action={
            statusFilter !== 'all' ? (
              <Button variant="outline" onClick={() => setStatusFilter('all')}>
                View All Transactions
              </Button>
            ) : (
              <Button onClick={() => window.location.href = '/investor/browse'}>
                Browse Deals
              </Button>
            )
          }
        />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Property</th>
                <th style={s.th}>Amount</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Date</th>
                <th style={s.th}>Counterparty</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxns.map((txn) => {
                const deal = txn.deal || {};
                const id = txn._id || txn.id;
                const wholesaler = txn.wholesaler || deal.wholesaler || {};
                const wholesalerName = wholesaler.firstName
                  ? `${wholesaler.firstName} ${wholesaler.lastName || ''}`.trim()
                  : wholesaler.companyName || wholesaler.company || 'Wholesaler';

                return (
                  <tr
                    key={id}
                    style={s.row}
                    onClick={() => openDetail(txn)}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={s.td}>
                      <div style={s.propertyCell}>
                        <div style={s.propertyIcon}>
                          {'\u{1F3E0}'}
                        </div>
                        <div>
                          <div style={s.propertyAddress}>
                            {deal.address || txn.dealAddress || txn.address || 'Unknown Property'}
                          </div>
                          <div style={s.propertyLocation}>
                            {deal.city || txn.city || ''}{(deal.state || txn.state) ? `, ${deal.state || txn.state}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...s.td, fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-success)' }}>
                      {fmt(txn.salePrice || txn.amount)}
                    </td>
                    <td style={s.td}>
                      <Badge variant={statusBadgeVariant(txn.status)}>
                        {statusLabel(txn.status)}
                      </Badge>
                    </td>
                    <td style={{ ...s.td, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {formatDate(txn.updatedAt || txn.createdAt)}
                    </td>
                    <td style={{ ...s.td, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {wholesalerName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ Advance Status Confirm ═══ */}
      <ConfirmDialog
        isOpen={!!advanceTarget && !!advanceStatus}
        onClose={() => { setAdvanceTarget(null); setAdvanceStatus(null); }}
        onConfirm={executeAdvance}
        title="Update Transaction Status"
        message={`Advance this transaction to "${statusLabel(advanceStatus)}"? This will notify all parties involved.`}
        confirmText={advancing ? 'Updating...' : 'Confirm'}
        confirmVariant="primary"
      />

      {/* ═══ Transaction Detail Modal ═══ */}
      <Modal
        isOpen={!!selectedTxn}
        onClose={closeDetail}
        title="Transaction Details"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeDetail}>Close</Button>
            {selectedTxn?.availableTransitions && selectedTxn.availableTransitions.length > 0 && (
              selectedTxn.availableTransitions.map((nextStatus) => (
                <Button
                  key={nextStatus}
                  variant="primary"
                  onClick={() => confirmAdvance(selectedTxn, nextStatus)}
                >
                  Advance to {statusLabel(nextStatus)}
                </Button>
              ))
            )}
          </>
        }
      >
        {detailLoading ? (
          <div style={s.center}><LoadingSpinner size={32} /></div>
        ) : selectedTxn ? (
          <>
            {/* Pipeline */}
            <div style={s.detailSection}>
              <div style={s.detailSectionTitle}>Transaction Pipeline</div>
              <PipelineView status={selectedTxn.status} />
            </div>

            {/* Transaction Info */}
            <div style={s.detailSection}>
              <div style={s.detailSectionTitle}>Transaction Summary</div>
              <div style={s.detailGrid}>
                <div>
                  <div style={s.detailLabel}>Transaction ID</div>
                  <div style={{ ...s.detailValue, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {(selectedTxn._id || selectedTxn.id || '-').toString().slice(-12).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div style={s.detailLabel}>Status</div>
                  <div style={s.detailValue}>
                    <Badge variant={statusBadgeVariant(selectedTxn.status)}>
                      {statusLabel(selectedTxn.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div style={s.detailLabel}>Sale Price</div>
                  <div style={{ ...s.detailValue, color: 'var(--accent-success)' }}>
                    {fmt(selectedTxn.salePrice || selectedTxn.amount)}
                  </div>
                </div>
                <div>
                  <div style={s.detailLabel}>Created</div>
                  <div style={s.detailValue}>{formatDateTime(selectedTxn.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Property Details */}
            {(selectedTxn.deal || selectedTxn.dealAddress) && (
              <div style={s.detailSection}>
                <div style={s.detailSectionTitle}>Property Details</div>
                <div style={s.detailGrid}>
                  <div>
                    <div style={s.detailLabel}>Address</div>
                    <div style={s.detailValue}>
                      {selectedTxn.deal?.address || selectedTxn.dealAddress || selectedTxn.address || '-'}
                    </div>
                  </div>
                  <div>
                    <div style={s.detailLabel}>City / State</div>
                    <div style={s.detailValue}>
                      {selectedTxn.deal?.city || selectedTxn.city || '-'}
                      {(selectedTxn.deal?.state || selectedTxn.state) ? `, ${selectedTxn.deal?.state || selectedTxn.state}` : ''}
                    </div>
                  </div>
                  <div>
                    <div style={s.detailLabel}>Property Type</div>
                    <div style={s.detailValue}>{selectedTxn.deal?.propertyType || '-'}</div>
                  </div>
                  <div>
                    <div style={s.detailLabel}>Bedrooms / Bathrooms</div>
                    <div style={s.detailValue}>
                      {selectedTxn.deal?.bedrooms ?? '-'} bd / {selectedTxn.deal?.bathrooms ?? '-'} ba
                    </div>
                  </div>
                </div>
                {selectedTxn.deal && (
                  <>
                    {[
                      ['Asking Price', fmt(selectedTxn.deal.askingPrice)],
                      ['Sale Price', fmt(selectedTxn.salePrice || selectedTxn.amount)],
                      ['ARV Estimate', fmt(selectedTxn.deal.arv)],
                      ['Assignment Fee', fmt(selectedTxn.deal.assignmentFee)],
                    ].map(([label, val]) => (
                      <div key={label} style={s.financialRow}>
                        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Counterparty */}
            <div style={s.detailSection}>
              <div style={s.detailSectionTitle}>Wholesaler</div>
              {(() => {
                const ws = selectedTxn.wholesaler || selectedTxn.deal?.wholesaler || {};
                const name = ws.firstName
                  ? `${ws.firstName} ${ws.lastName || ''}`.trim()
                  : ws.companyName || ws.company || 'Unknown Wholesaler';
                const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

                return (
                  <div style={s.counterparty}>
                    <div style={s.counterpartyAvatar}>{initials || '?'}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {name}
                      </div>
                      {(ws.companyName || ws.company) && ws.firstName && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {ws.companyName || ws.company}
                        </div>
                      )}
                      {(ws.reputationScore || ws.reputation) != null && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Reputation: {Number(ws.reputationScore || ws.reputation || 0).toFixed(1)} / 5.0
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Timeline */}
            <div style={s.detailSection}>
              <div style={s.detailSectionTitle}>Activity Timeline</div>
              <div style={s.timeline}>
                {buildTimeline(selectedTxn).map((event, idx, arr) => (
                  <div key={idx} style={s.timelineItem}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ ...s.timelineDot, background: event.color }} />
                      {idx < arr.length - 1 && <div style={s.timelineLine} />}
                    </div>
                    <div style={s.timelineContent}>
                      <div style={s.timelineTitle}>{event.title}</div>
                      <div style={s.timelineDate}>{formatDateTime(event.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
