import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import {
  Button, Card, Modal, Badge, StatusBadge, Avatar,
  LoadingSpinner, EmptyState, Tabs,
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

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1280, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' },

  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1rem', marginBottom: '1.5rem',
  },
  dealCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.25rem', cursor: 'pointer',
    transition: 'var(--transition)',
  },
  dealAddress: { fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  dealMeta: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' },
  dealPrice: { fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-success)', marginBottom: '0.5rem' },
  dealFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' },
  dealWholesaler: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' },

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
  actionsRow: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem', alignItems: 'flex-start' },

  textarea: {
    width: '100%', minHeight: 80, background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    padding: '0.625rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-primary)',
    resize: 'vertical',
  },

  flaggedPlaceholder: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '4rem 1rem', textAlign: 'center',
  },
};

const PROPERTY_TYPE_LABELS = {
  single_family: 'Single Family',
  multi_family: 'Multi-Family',
  condo: 'Condo',
  townhouse: 'Townhouse',
  land: 'Vacant Land',
  commercial: 'Commercial',
};

// ─── Component ────────────────────────────────────────────────────
export default function DealModerationPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const fetchPendingDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/deals/pending');
      setDeals(res.data.deals || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending deals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingDeals();
    }
  }, [activeTab, fetchPendingDeals]);

  const openDealReview = (deal) => {
    setSelectedDeal(deal);
    setRejectReason('');
    setShowRejectForm(false);
  };

  const closeModal = () => {
    setSelectedDeal(null);
    setShowRejectForm(false);
  };

  const handleApprove = async () => {
    if (!selectedDeal) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/deals/${selectedDeal._id || selectedDeal.id}/approve`);
      setDeals((prev) => prev.filter((d) => (d._id || d.id) !== (selectedDeal._id || selectedDeal.id)));
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve deal.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDeal || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/deals/${selectedDeal._id || selectedDeal.id}/reject`, {
        reason: rejectReason,
      });
      setDeals((prev) => prev.filter((d) => (d._id || d.id) !== (selectedDeal._id || selectedDeal.id)));
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject deal.');
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { label: `Pending (${deals.length})`, value: 'pending' },
    { label: 'Flagged', value: 'flagged' },
  ];

  return (
    <div style={s.page}>
      <h1 style={s.title}>Deal Moderation</h1>

      {error && <div style={s.errorBox}>{error}</div>}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <>
          {loading ? (
            <div style={s.center}>
              <LoadingSpinner size={40} />
            </div>
          ) : deals.length === 0 ? (
            <EmptyState
              title="No pending deals"
              message="All deals have been reviewed. Check back later."
              icon={'\u2705'}
            />
          ) : (
            <div style={s.grid}>
              {deals.map((deal) => {
                const wholesaler = deal.wholesaler || deal.seller || {};
                const wsName = wholesaler.name ||
                  `${wholesaler.firstName || ''} ${wholesaler.lastName || ''}`.trim() || 'Unknown';

                return (
                  <div
                    key={deal._id || deal.id}
                    style={s.dealCard}
                    onClick={() => openDealReview(deal)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={s.dealAddress}>{deal.address || 'No address'}</div>
                    <div style={s.dealMeta}>
                      {deal.city}{deal.state ? `, ${deal.state}` : ''}
                      {deal.propertyType ? ` \u00B7 ${PROPERTY_TYPE_LABELS[deal.propertyType] || deal.propertyType}` : ''}
                    </div>
                    <div style={s.dealPrice}>{fmt(deal.askingPrice || deal.price)}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <StatusBadge status={deal.status || 'pending_review'} />
                      {deal.propertyType && (
                        <Badge variant="neutral">
                          {PROPERTY_TYPE_LABELS[deal.propertyType] || deal.propertyType}
                        </Badge>
                      )}
                    </div>
                    <div style={s.dealFooter}>
                      <div style={s.dealWholesaler}>
                        <Avatar src={wholesaler.avatar} name={wsName} size={24} />
                        <span>{wsName}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {fmtDate(deal.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Flagged Tab Placeholder */}
      {activeTab === 'flagged' && (
        <div style={s.flaggedPlaceholder}>
          <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }}>{'\uD83D\uDEA9'}</div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
            Flagged Deals
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 360 }}>
            Flagged deal review system is coming soon. Deals flagged by users or automated checks will appear here.
          </p>
        </div>
      )}

      {/* ═══ Deal Review Modal ═══ */}
      <Modal
        isOpen={!!selectedDeal}
        onClose={closeModal}
        title="Deal Review"
        size="lg"
        footer={
          <>
            {!showRejectForm ? (
              <>
                <Button variant="ghost" onClick={closeModal}>Close</Button>
                <Button
                  variant="danger"
                  onClick={() => setShowRejectForm(true)}
                  loading={actionLoading}
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  onClick={handleApprove}
                  loading={actionLoading}
                  style={{ background: 'var(--accent-success)' }}
                >
                  Approve
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setShowRejectForm(false)}>Back</Button>
                <Button
                  variant="danger"
                  onClick={handleReject}
                  loading={actionLoading}
                  disabled={!rejectReason.trim()}
                >
                  Confirm Rejection
                </Button>
              </>
            )}
          </>
        }
      >
        {selectedDeal && (
          <DealReviewContent
            deal={selectedDeal}
            showRejectForm={showRejectForm}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
          />
        )}
      </Modal>
    </div>
  );
}

// ─── Deal Review Content ──────────────────────────────────────────
function DealReviewContent({ deal, showRejectForm, rejectReason, setRejectReason }) {
  const wholesaler = deal.wholesaler || deal.seller || {};
  const wsName = wholesaler.name ||
    `${wholesaler.firstName || ''} ${wholesaler.lastName || ''}`.trim() || 'Unknown';

  if (showRejectForm) {
    return (
      <div>
        <div style={s.sectionTitle}>Rejection Reason</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Please provide a reason for rejecting this deal. The wholesaler will be notified.
        </p>
        <textarea
          style={s.textarea}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Enter reason for rejection..."
          autoFocus
        />
      </div>
    );
  }

  return (
    <>
      {/* Property Info */}
      <div style={s.sectionTitle}>Property Information</div>
      <div style={s.infoGrid}>
        <div>
          <div style={s.infoLabel}>Address</div>
          <div style={s.infoValue}>{deal.address || '-'}</div>
        </div>
        <div>
          <div style={s.infoLabel}>City / State</div>
          <div style={s.infoValue}>{deal.city || '-'}{deal.state ? `, ${deal.state}` : ''} {deal.zipCode || ''}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Property Type</div>
          <div style={s.infoValue}>{PROPERTY_TYPE_LABELS[deal.propertyType] || deal.propertyType || '-'}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Bedrooms / Bathrooms</div>
          <div style={s.infoValue}>{deal.bedrooms || '-'} bd / {deal.bathrooms || '-'} ba</div>
        </div>
        <div>
          <div style={s.infoLabel}>Sq. Ft.</div>
          <div style={s.infoValue}>{deal.sqft ? Number(deal.sqft).toLocaleString() : '-'}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Year Built</div>
          <div style={s.infoValue}>{deal.yearBuilt || '-'}</div>
        </div>
      </div>

      {/* Financials */}
      <div style={s.sectionTitle}>Financials</div>
      <div style={s.infoGrid}>
        <div>
          <div style={s.infoLabel}>Asking Price</div>
          <div style={{ ...s.infoValue, color: 'var(--accent-success)', fontWeight: 700, fontSize: '1.125rem' }}>
            {fmt(deal.askingPrice || deal.price)}
          </div>
        </div>
        <div>
          <div style={s.infoLabel}>ARV (After Repair Value)</div>
          <div style={s.infoValue}>{fmt(deal.arv)}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Repair Estimate</div>
          <div style={s.infoValue}>{fmt(deal.repairCost || deal.estimatedRepairs)}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Assignment Fee</div>
          <div style={s.infoValue}>{fmt(deal.assignmentFee)}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Contract Price</div>
          <div style={s.infoValue}>{fmt(deal.contractPrice)}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Equity Spread</div>
          <div style={s.infoValue}>
            {deal.arv && deal.askingPrice
              ? fmt(deal.arv - (deal.askingPrice || deal.price) - (deal.repairCost || deal.estimatedRepairs || 0))
              : '-'
            }
          </div>
        </div>
      </div>

      {/* Description */}
      {deal.description && (
        <>
          <div style={s.sectionTitle}>Description</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
            {deal.description}
          </p>
        </>
      )}

      {/* Wholesaler Profile */}
      <div style={s.sectionTitle}>Wholesaler</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
        background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)', marginBottom: '0.5rem',
      }}>
        <Avatar src={wholesaler.avatar} name={wsName} size="md" />
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{wsName}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {wholesaler.email || '-'}
          </div>
          <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem' }}>
            <StatusBadge status={wholesaler.verificationStatus || 'unverified'} />
            {wholesaler.reputationScore && (
              <Badge variant="neutral">
                Rating: {Number(wholesaler.reputationScore).toFixed(1)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Submission Info */}
      <div style={s.sectionTitle}>Submission Details</div>
      <div style={s.infoGrid}>
        <div>
          <div style={s.infoLabel}>Submitted</div>
          <div style={s.infoValue}>{fmtDate(deal.createdAt)}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Status</div>
          <div style={s.infoValue}><StatusBadge status={deal.status || 'pending_review'} /></div>
        </div>
      </div>
    </>
  );
}
