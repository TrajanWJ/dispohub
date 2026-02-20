import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import {
  Button, Modal, ConfirmDialog, Badge, StatusBadge,
  LoadingSpinner, EmptyState, useToast,
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

function daysSince(d) {
  if (!d) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24)));
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
    display: 'flex', alignItems: 'center', gap: '1rem', transition: 'var(--transition)',
  },
  statIcon: {
    width: 48, height: 48, borderRadius: 12, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0,
  },
  statValue: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 },
  statLabel: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 },

  disputeList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  disputeCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.25rem', cursor: 'pointer',
    transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: '1.25rem',
  },
  disputeIcon: {
    width: 48, height: 48, borderRadius: 12, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0,
    background: 'rgba(255,71,87,0.12)',
  },
  disputeInfo: { flex: 1, minWidth: 0 },
  disputeProperty: { fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  disputeParties: { fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' },
  disputeMeta: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  disputeAmount: { fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent-success)', textAlign: 'right', minWidth: 100 },
  disputeDays: {
    fontSize: '0.75rem', color: 'var(--accent-danger)', fontWeight: 600,
    background: 'rgba(255,71,87,0.1)', borderRadius: 'var(--border-radius)',
    padding: '0.25rem 0.5rem', whiteSpace: 'nowrap',
  },

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

  partyCard: {
    background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)',
    padding: '0.875rem', border: '1px solid var(--border-color)',
  },
  partyRole: {
    fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: '0.375rem',
  },
  partyName: { fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.125rem' },
  partyEmail: { fontSize: '0.8rem', color: 'var(--text-secondary)' },
  partyReputation: { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' },

  resolutionGroup: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.25rem', marginTop: '1.25rem',
  },
  resolutionOption: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem',
    border: '2px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    cursor: 'pointer', transition: 'var(--transition)', marginBottom: '0.5rem',
    background: 'var(--bg-card)',
  },
  resolutionRadio: {
    width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--border-color)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    transition: 'var(--transition)',
  },
  resolutionLabel: { fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' },
  resolutionDesc: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 },

  textarea: {
    width: '100%', minHeight: 80, background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    padding: '0.625rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-primary)',
    resize: 'vertical', marginTop: '0.75rem',
  },
  actionsRow: { display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' },

  timeline: { position: 'relative', paddingLeft: '1.5rem', marginBottom: '0.5rem' },
  timelineItem: {
    position: 'relative', paddingBottom: '0.875rem', paddingLeft: '0.75rem',
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

const RESOLUTION_OPTIONS = [
  {
    value: 'continue',
    label: 'Continue Transaction',
    description: 'Resolve dispute and advance the transaction to closing. Both parties will be notified.',
    color: 'var(--accent-success)',
  },
  {
    value: 'cancel',
    label: 'Cancel Transaction',
    description: 'Cancel the transaction and initiate escrow refund to the investor. Both parties will be notified.',
    color: 'var(--accent-danger)',
  },
];

// ─── Component ────────────────────────────────────────────────────
export default function DisputeResolutionPage() {
  const toast = useToast();

  const [disputes, setDisputes] = useState([]);
  const [totalDisputes, setTotalDisputes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats
  const [resolvedThisMonth, setResolvedThisMonth] = useState(0);
  const [avgResolutionDays, setAvgResolutionDays] = useState(0);

  // Modal
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolution, setResolution] = useState('');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/disputes');
      const data = res.data;
      const items = data.disputes || [];
      setDisputes(items);
      setTotalDisputes(data.total || items.length);
      setResolvedThisMonth(data.resolvedThisMonth || 0);
      setAvgResolutionDays(data.avgResolutionTime || data.avgResolutionDays || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load disputes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const openDispute = (dispute) => {
    setSelectedDispute(dispute);
    setResolution('');
    setNotes('');
  };

  const closeModal = () => {
    setSelectedDispute(null);
    setResolution('');
    setNotes('');
    setShowConfirm(false);
  };

  const handleResolve = async () => {
    if (!selectedDispute || !resolution) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/disputes/${selectedDispute._id || selectedDispute.id}/resolve`, {
        resolution,
        notes,
      });
      const label = resolution === 'continue' ? 'continued' : 'cancelled and refund initiated';
      toast.success(`Dispute resolved. Transaction has been ${label}.`);
      closeModal();
      fetchDisputes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve dispute.');
    } finally {
      setActionLoading(false);
      setShowConfirm(false);
    }
  };

  const statCards = [
    {
      label: 'Open Disputes', value: String(totalDisputes),
      icon: '\u26A0\uFE0F', bg: 'rgba(255,71,87,0.15)', color: 'var(--accent-danger)',
    },
    {
      label: 'Resolved This Month', value: String(resolvedThisMonth),
      icon: '\u2705', bg: 'rgba(0,214,143,0.15)', color: 'var(--accent-success)',
    },
    {
      label: 'Avg. Resolution Time', value: avgResolutionDays ? `${Number(avgResolutionDays).toFixed(1)}d` : '-',
      icon: '\u{1F552}', bg: 'rgba(52,152,219,0.15)', color: 'var(--accent-info)',
    },
  ];

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>Dispute Resolution</h1>
        <p style={s.subtitle}>Review and resolve disputed transactions between wholesalers and investors.</p>
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

      {/* Dispute List */}
      {loading ? (
        <div style={s.center}><LoadingSpinner size={40} /></div>
      ) : disputes.length === 0 ? (
        <EmptyState
          title="No open disputes"
          message="All disputes have been resolved. The platform is operating smoothly."
          icon={'\u2696\uFE0F'}
        />
      ) : (
        <div style={s.disputeList}>
          {disputes.map((dispute) => {
            const tx = dispute.transaction || dispute;
            const property = tx.deal || tx.property || {};
            const address = property.address || tx.propertyAddress || tx.address || 'Unknown Property';
            const wholesaler = tx.wholesaler || tx.seller || dispute.wholesaler || {};
            const investor = tx.buyer || tx.investor || dispute.investor || {};
            const wsName = wholesaler.name || `${wholesaler.firstName || ''} ${wholesaler.lastName || ''}`.trim() || 'Unknown';
            const invName = investor.name || `${investor.firstName || ''} ${investor.lastName || ''}`.trim() || 'Unknown';
            const disputeDate = dispute.disputeDate || dispute.createdAt || tx.updatedAt;
            const amount = tx.amount || tx.totalAmount || dispute.amount || 0;
            const days = daysSince(disputeDate);

            return (
              <div
                key={dispute._id || dispute.id}
                style={s.disputeCard}
                onClick={() => openDispute(dispute)}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-danger)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={s.disputeIcon}>
                  <span style={{ color: 'var(--accent-danger)' }}>{'\u26A0\uFE0F'}</span>
                </div>
                <div style={s.disputeInfo}>
                  <div style={s.disputeProperty}>{address}</div>
                  <div style={s.disputeParties}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{wsName}</span>
                    <span style={{ margin: '0 0.375rem', color: 'var(--text-muted)' }}>vs</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{invName}</span>
                  </div>
                  <div style={s.disputeMeta}>
                    <Badge variant="danger">Disputed</Badge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Filed {fmtDate(disputeDate)}
                    </span>
                    {days > 0 && (
                      <span style={s.disputeDays}>{days} day{days !== 1 ? 's' : ''} open</span>
                    )}
                  </div>
                </div>
                <div style={s.disputeAmount}>{fmt(amount)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Dispute Resolution Modal ═══ */}
      <Modal
        isOpen={!!selectedDispute}
        onClose={closeModal}
        title="Resolve Dispute"
        size="lg"
      >
        {selectedDispute && (
          <DisputeResolveContent
            dispute={selectedDispute}
            resolution={resolution}
            setResolution={setResolution}
            notes={notes}
            setNotes={setNotes}
            actionLoading={actionLoading}
            onResolve={() => setShowConfirm(true)}
          />
        )}
      </Modal>

      {/* Confirm Resolution */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleResolve}
        title="Confirm Resolution"
        message={
          resolution === 'continue'
            ? 'This will resolve the dispute and advance the transaction to closing. Both parties will be notified. Proceed?'
            : 'This will cancel the transaction and initiate an escrow refund to the investor. This action cannot be undone. Proceed?'
        }
        confirmText={resolution === 'continue' ? 'Continue Transaction' : 'Cancel & Refund'}
        confirmVariant={resolution === 'continue' ? 'primary' : 'danger'}
      />
    </div>
  );
}

// ─── Dispute Resolve Content ──────────────────────────────────────
function DisputeResolveContent({ dispute, resolution, setResolution, notes, setNotes, actionLoading, onResolve }) {
  const tx = dispute.transaction || dispute;
  const property = tx.deal || tx.property || {};
  const address = property.address || tx.propertyAddress || tx.address || '-';
  const wholesaler = tx.wholesaler || tx.seller || dispute.wholesaler || {};
  const investor = tx.buyer || tx.investor || dispute.investor || {};
  const wsName = wholesaler.name || `${wholesaler.firstName || ''} ${wholesaler.lastName || ''}`.trim() || '-';
  const invName = investor.name || `${investor.firstName || ''} ${investor.lastName || ''}`.trim() || '-';
  const disputeDate = dispute.disputeDate || dispute.createdAt || tx.updatedAt;
  const reason = dispute.reason || dispute.disputeReason || tx.disputeReason || '';
  const timeline = tx.timeline || tx.history || dispute.timeline || [];

  return (
    <>
      {/* Transaction Info */}
      <div style={s.sectionTitle}>Transaction Details</div>
      <div style={s.infoGrid}>
        <div>
          <div style={s.infoLabel}>Property</div>
          <div style={s.infoValue}>{address}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Transaction Amount</div>
          <div style={{ ...s.infoValue, color: 'var(--accent-success)', fontWeight: 700, fontSize: '1.125rem' }}>
            {fmt(tx.amount || tx.totalAmount || dispute.amount)}
          </div>
        </div>
        <div>
          <div style={s.infoLabel}>Platform Fee</div>
          <div style={s.infoValue}>{fmt(tx.platformFee || tx.fee)}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Dispute Filed</div>
          <div style={s.infoValue}>{fmtDateTime(disputeDate)}</div>
        </div>
      </div>

      {/* Dispute Reason */}
      {reason && (
        <>
          <div style={s.sectionTitle}>Dispute Reason</div>
          <div style={{
            background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)',
            borderRadius: 'var(--border-radius)', padding: '0.75rem 1rem',
            fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6,
            marginBottom: '0.5rem',
          }}>
            {reason}
          </div>
        </>
      )}

      {/* Parties */}
      <div style={s.sectionTitle}>Involved Parties</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.5rem' }}>
        <div style={s.partyCard}>
          <div style={s.partyRole}>Wholesaler (Seller)</div>
          <div style={s.partyName}>{wsName}</div>
          <div style={s.partyEmail}>{wholesaler.email || '-'}</div>
          <div style={s.partyReputation}>
            Reputation: {wholesaler.reputationScore != null ? Number(wholesaler.reputationScore).toFixed(1) : '-'} / 5.0
          </div>
        </div>
        <div style={s.partyCard}>
          <div style={s.partyRole}>Investor (Buyer)</div>
          <div style={s.partyName}>{invName}</div>
          <div style={s.partyEmail}>{investor.email || '-'}</div>
          <div style={s.partyReputation}>
            Reputation: {investor.reputationScore != null ? Number(investor.reputationScore).toFixed(1) : '-'} / 5.0
          </div>
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
                  background: i === 0 ? 'var(--accent-danger)' : 'var(--border-color)',
                }} />
                <div style={s.timelineDate}>{fmtDateTime(entry.date || entry.timestamp || entry.createdAt)}</div>
                <div style={s.timelineEvent}>{entry.event || entry.action || entry.description || entry.status || '-'}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Resolution Options */}
      <div style={s.resolutionGroup}>
        <div style={{ ...s.sectionTitle, marginTop: 0 }}>Resolution Decision</div>
        {RESOLUTION_OPTIONS.map((opt) => {
          const isSelected = resolution === opt.value;
          return (
            <div
              key={opt.value}
              style={{
                ...s.resolutionOption,
                borderColor: isSelected ? opt.color : 'var(--border-color)',
                background: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-card)',
              }}
              onClick={() => setResolution(opt.value)}
            >
              <div style={{
                ...s.resolutionRadio,
                borderColor: isSelected ? opt.color : 'var(--border-color)',
              }}>
                {isSelected && (
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', background: opt.color,
                  }} />
                )}
              </div>
              <div>
                <div style={s.resolutionLabel}>{opt.label}</div>
                <div style={s.resolutionDesc}>{opt.description}</div>
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: '0.75rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
            Admin Notes (required)
          </label>
          <textarea
            style={s.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Provide reasoning for your resolution decision. This will be recorded in the transaction log..."
          />
        </div>

        <div style={s.actionsRow}>
          <Button
            variant={resolution === 'continue' ? 'primary' : resolution === 'cancel' ? 'danger' : 'secondary'}
            loading={actionLoading}
            disabled={!resolution || !notes.trim()}
            onClick={onResolve}
          >
            {resolution === 'continue' ? 'Continue Transaction' : resolution === 'cancel' ? 'Cancel & Refund' : 'Select Resolution'}
          </Button>
        </div>
      </div>
    </>
  );
}
