import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import {
  Button, Modal, Badge, StatusBadge, LoadingSpinner, EmptyState, Tabs, useToast,
} from '../../components/common/index.jsx';

// ─── Helpers ──────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function fmtCompact(n) {
  if (n == null) return '0';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + String(n);
}

function truncateId(id) {
  if (!id) return '-';
  const s = String(id);
  return s.length > 8 ? s.slice(0, 8) + '...' : s;
}

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1280, margin: '0 auto' },
  header: { marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '0.9rem' },

  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem', marginBottom: '1.75rem',
  },
  statCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.125rem 1.25rem',
    display: 'flex', alignItems: 'center', gap: '0.875rem', transition: 'var(--transition)',
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 10, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0,
  },
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 },
  statLabel: { fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 },

  toolbar: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1, minWidth: 200, maxWidth: 360,
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)', padding: '0.5rem 0.75rem',
    fontSize: '0.875rem', color: 'var(--text-primary)',
  },
  select: {
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)', padding: '0.5rem 0.75rem', fontSize: '0.875rem',
    color: 'var(--text-primary)', minWidth: 140, cursor: 'pointer',
  },

  tableWrap: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5,
    borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
  },
  td: {
    padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap',
  },
  row: { cursor: 'pointer', transition: 'var(--transition)' },

  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1.25rem',
  },

  // Modal detail
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', marginBottom: '1.25rem' },
  infoLabel: {
    fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 2,
  },
  infoValue: { fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '0.6rem' },
  sectionTitle: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', marginTop: '1.25rem' },
  actionsRow: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' },

  timeline: {
    position: 'relative', paddingLeft: '1.5rem', marginBottom: '1rem',
  },
  timelineItem: {
    position: 'relative', paddingBottom: '1rem', paddingLeft: '0.75rem',
    borderLeft: '2px solid var(--border-color)',
  },
  timelineDot: {
    position: 'absolute', left: '-0.4375rem', top: '0.125rem',
    width: 12, height: 12, borderRadius: '50%',
    background: 'var(--accent-primary)', border: '2px solid var(--bg-card)',
  },
  timelineDate: { fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 },
  timelineEvent: { fontSize: '0.825rem', color: 'var(--text-primary)', fontWeight: 500 },
};

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Escrow Funded', value: 'escrow_funded' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Closing', value: 'closing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Disputed', value: 'disputed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_FLOW = {
  escrow_funded: { next: 'under_review', label: 'Move to Under Review' },
  under_review: { next: 'closing', label: 'Advance to Closing' },
  closing: { next: 'completed', label: 'Mark Completed' },
};

// ─── Component ────────────────────────────────────────────────────
export default function TransactionOverviewPage() {
  const toast = useToast();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Search, sort
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  // Modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalVolume: 0, platformRevenue: 0, active: 0, completed: 0, disputed: 0,
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (search) params.search = search;
      const res = await api.get('/transactions', { params });
      const txs = res.data.transactions || res.data || [];
      setTransactions(txs);

      // Compute summary stats from full list
      let volume = 0, revenue = 0, active = 0, completed = 0, disputed = 0;
      txs.forEach((tx) => {
        const amt = tx.amount || tx.totalAmount || 0;
        volume += amt;
        revenue += tx.platformFee || tx.fee || 0;
        const st = (tx.status || '').toLowerCase();
        if (['escrow_funded', 'under_review', 'closing'].includes(st)) active++;
        if (st === 'completed') completed++;
        if (st === 'disputed') disputed++;
      });
      setStats({ totalVolume: volume, platformRevenue: revenue, active, completed, disputed });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = [...transactions].sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'date') {
      aVal = new Date(a.createdAt || a.date || 0).getTime();
      bVal = new Date(b.createdAt || b.date || 0).getTime();
    } else if (sortField === 'amount') {
      aVal = a.amount || a.totalAmount || 0;
      bVal = b.amount || b.totalAmount || 0;
    } else if (sortField === 'status') {
      aVal = a.status || '';
      bVal = b.status || '';
    } else {
      aVal = 0; bVal = 0;
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const openDetail = (tx) => setSelectedTx(tx);
  const closeModal = () => setSelectedTx(null);

  const handleAdvanceStatus = async (tx) => {
    const flow = STATUS_FLOW[(tx.status || '').toLowerCase()];
    if (!flow) return;
    setActionLoading(true);
    try {
      await api.put(`/transactions/${tx._id || tx.id}/status`, { status: flow.next });
      toast.success(`Transaction advanced to ${flow.next.replace(/_/g, ' ')}.`);
      setSelectedTx((prev) => prev ? { ...prev, status: flow.next } : prev);
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to advance transaction status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlagDisputed = async (tx) => {
    setActionLoading(true);
    try {
      await api.put(`/transactions/${tx._id || tx.id}/status`, { status: 'disputed' });
      toast.warning('Transaction has been flagged as disputed.');
      setSelectedTx((prev) => prev ? { ...prev, status: 'disputed' } : prev);
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to flag transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  const sortIndicator = (field) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  const statCards = [
    {
      label: 'Total Volume', value: fmtCompact(stats.totalVolume),
      icon: '\u{1F4B5}', bg: 'rgba(0,214,143,0.15)', color: 'var(--accent-success)',
    },
    {
      label: 'Platform Revenue', value: fmtCompact(stats.platformRevenue),
      icon: '\u{1F4B0}', bg: 'rgba(108,92,231,0.15)', color: 'var(--accent-primary)',
    },
    {
      label: 'Active Transactions', value: String(stats.active),
      icon: '\u{1F504}', bg: 'rgba(52,152,219,0.15)', color: 'var(--accent-info)',
    },
    {
      label: 'Completed', value: String(stats.completed),
      icon: '\u2705', bg: 'rgba(0,214,143,0.15)', color: 'var(--accent-success)',
    },
    {
      label: 'Disputed', value: String(stats.disputed),
      icon: '\u26A0\uFE0F', bg: 'rgba(255,71,87,0.15)', color: 'var(--accent-danger)',
    },
  ];

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>Transaction Overview</h1>
        <p style={s.subtitle}>Monitor and manage all platform transactions across the deal pipeline.</p>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {/* Stats */}
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

      {/* Tabs */}
      <Tabs tabs={STATUS_TABS} active={activeTab} onChange={(v) => { setActiveTab(v); }} />

      {/* Toolbar */}
      <div style={s.toolbar}>
        <input
          type="text"
          style={s.searchInput}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by property address or party name..."
        />
        <select style={s.select} value={sortField} onChange={(e) => handleSort(e.target.value)}>
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={s.center}><LoadingSpinner size={40} /></div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No transactions found"
          message="No transactions match your current filters. Adjust your search or status filter."
          icon={'\u{1F4B1}'}
        />
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>ID</th>
                <th style={s.th}>Property</th>
                <th style={s.th}>Wholesaler</th>
                <th style={s.th}>Investor</th>
                <th style={s.th} onClick={() => handleSort('amount')}>Amount{sortIndicator('amount')}</th>
                <th style={s.th}>Platform Fee</th>
                <th style={s.th} onClick={() => handleSort('status')}>Status{sortIndicator('status')}</th>
                <th style={s.th} onClick={() => handleSort('date')}>Date{sortIndicator('date')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((tx) => {
                const wholesaler = tx.wholesaler || tx.seller || {};
                const investor = tx.buyer || tx.investor || {};
                const wsName = wholesaler.name || `${wholesaler.firstName || ''} ${wholesaler.lastName || ''}`.trim() || '-';
                const invName = investor.name || `${investor.firstName || ''} ${investor.lastName || ''}`.trim() || '-';
                const property = tx.deal || tx.property || {};
                const address = property.address || tx.propertyAddress || tx.address || '-';

                return (
                  <tr
                    key={tx._id || tx.id}
                    style={s.row}
                    onClick={() => openDetail(tx)}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {truncateId(tx._id || tx.id)}
                    </td>
                    <td style={{ ...s.td, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {address}
                    </td>
                    <td style={s.td}>{wsName}</td>
                    <td style={s.td}>{invName}</td>
                    <td style={{ ...s.td, fontWeight: 600, color: 'var(--accent-success)' }}>
                      {fmt(tx.amount || tx.totalAmount)}
                    </td>
                    <td style={{ ...s.td, color: 'var(--text-secondary)' }}>
                      {fmt(tx.platformFee || tx.fee)}
                    </td>
                    <td style={s.td}><StatusBadge status={tx.status} /></td>
                    <td style={{ ...s.td, color: 'var(--text-secondary)' }}>
                      {fmtDate(tx.createdAt || tx.date)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ Transaction Detail Modal ═══ */}
      <Modal
        isOpen={!!selectedTx}
        onClose={closeModal}
        title="Transaction Details"
        size="lg"
      >
        {selectedTx && (
          <TransactionDetailContent
            tx={selectedTx}
            actionLoading={actionLoading}
            onAdvance={handleAdvanceStatus}
            onFlagDisputed={handleFlagDisputed}
          />
        )}
      </Modal>
    </div>
  );
}

// ─── Transaction Detail Content ───────────────────────────────────
function TransactionDetailContent({ tx, actionLoading, onAdvance, onFlagDisputed }) {
  const property = tx.deal || tx.property || {};
  const address = property.address || tx.propertyAddress || tx.address || '-';
  const wholesaler = tx.wholesaler || tx.seller || {};
  const investor = tx.buyer || tx.investor || {};
  const wsName = wholesaler.name || `${wholesaler.firstName || ''} ${wholesaler.lastName || ''}`.trim() || '-';
  const invName = investor.name || `${investor.firstName || ''} ${investor.lastName || ''}`.trim() || '-';
  const flow = STATUS_FLOW[(tx.status || '').toLowerCase()];
  const isDisputed = (tx.status || '').toLowerCase() === 'disputed';
  const isCancelled = (tx.status || '').toLowerCase() === 'cancelled';
  const isCompleted = (tx.status || '').toLowerCase() === 'completed';
  const isTerminal = isDisputed || isCancelled || isCompleted;

  const timeline = tx.timeline || tx.history || [];

  return (
    <>
      {/* Transaction Info */}
      <div style={s.sectionTitle}>Transaction Information</div>
      <div style={s.infoGrid}>
        <div>
          <div style={s.infoLabel}>Transaction ID</div>
          <div style={{ ...s.infoValue, fontFamily: 'monospace', fontSize: '0.8rem' }}>{tx._id || tx.id}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Status</div>
          <div style={s.infoValue}><StatusBadge status={tx.status} /></div>
        </div>
        <div>
          <div style={s.infoLabel}>Property</div>
          <div style={s.infoValue}>{address}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Transaction Amount</div>
          <div style={{ ...s.infoValue, color: 'var(--accent-success)', fontWeight: 700, fontSize: '1.125rem' }}>
            {fmt(tx.amount || tx.totalAmount)}
          </div>
        </div>
        <div>
          <div style={s.infoLabel}>Platform Fee</div>
          <div style={s.infoValue}>{fmt(tx.platformFee || tx.fee)}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Net to Wholesaler</div>
          <div style={s.infoValue}>
            {fmt((tx.amount || tx.totalAmount || 0) - (tx.platformFee || tx.fee || 0))}
          </div>
        </div>
        <div>
          <div style={s.infoLabel}>Created</div>
          <div style={s.infoValue}>{fmtDateTime(tx.createdAt || tx.date)}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Last Updated</div>
          <div style={s.infoValue}>{fmtDateTime(tx.updatedAt || tx.lastUpdated)}</div>
        </div>
      </div>

      {/* Parties */}
      <div style={s.sectionTitle}>Transaction Parties</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{
          background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)',
          padding: '0.875rem', border: '1px solid var(--border-color)',
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '0.375rem' }}>
            Wholesaler (Seller)
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.125rem' }}>
            {wsName}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {wholesaler.email || '-'}
          </div>
          {wholesaler.reputationScore != null && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Reputation: {Number(wholesaler.reputationScore).toFixed(1)} / 5.0
            </div>
          )}
        </div>
        <div style={{
          background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)',
          padding: '0.875rem', border: '1px solid var(--border-color)',
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '0.375rem' }}>
            Investor (Buyer)
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.125rem' }}>
            {invName}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {investor.email || '-'}
          </div>
          {investor.reputationScore != null && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Reputation: {Number(investor.reputationScore).toFixed(1)} / 5.0
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <>
          <div style={s.sectionTitle}>Transaction Timeline</div>
          <div style={s.timeline}>
            {timeline.map((entry, i) => (
              <div key={i} style={{
                ...s.timelineItem,
                ...(i === timeline.length - 1 ? { borderLeft: '2px solid transparent', paddingBottom: 0 } : {}),
              }}>
                <div style={{
                  ...s.timelineDot,
                  background: i === 0 ? 'var(--accent-primary)' : 'var(--border-color)',
                }} />
                <div style={s.timelineDate}>{fmtDateTime(entry.date || entry.timestamp || entry.createdAt)}</div>
                <div style={s.timelineEvent}>{entry.event || entry.action || entry.description || entry.status || '-'}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Admin Actions */}
      <div style={s.sectionTitle}>Admin Actions</div>
      <div style={s.actionsRow}>
        {flow && !isTerminal && (
          <Button
            variant="primary"
            loading={actionLoading}
            onClick={() => onAdvance(tx)}
            style={{ background: 'var(--accent-success)' }}
          >
            {flow.label}
          </Button>
        )}
        {!isTerminal && (
          <Button
            variant="danger"
            loading={actionLoading}
            onClick={() => onFlagDisputed(tx)}
          >
            Flag as Disputed
          </Button>
        )}
        {isCompleted && (
          <Badge variant="success" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Transaction Completed
          </Badge>
        )}
        {isDisputed && (
          <Badge variant="danger" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Transaction Under Dispute
          </Badge>
        )}
        {isCancelled && (
          <Badge variant="neutral" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Transaction Cancelled
          </Badge>
        )}
      </div>
    </>
  );
}
