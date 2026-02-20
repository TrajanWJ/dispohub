import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import {
  Button, Modal, Badge, StatusBadge, Tabs,
  LoadingSpinner, EmptyState, ConfirmDialog,
} from '../../components/common';
import { useToast } from '../../components/common/index.jsx';

// ─── Constants ────────────────────────────────────────────────────
const PROPERTY_GRADIENTS = {
  SFH: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
  'Multi-Family': 'linear-gradient(135deg, #00d68f 0%, #00b894 100%)',
  Commercial: 'linear-gradient(135deg, #3498db 0%, #74b9ff 100%)',
  Land: 'linear-gradient(135deg, #ffaa00 0%, #fdcb6e 100%)',
  default: 'linear-gradient(135deg, #636e72 0%, #b2bec3 100%)',
};

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Withdrawn', value: 'withdrawn' },
];

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

function statusVariant(status) {
  const map = {
    pending: 'warning',
    accepted: 'success',
    rejected: 'danger',
    withdrawn: 'neutral',
    countered: 'info',
  };
  return map[status] || 'neutral';
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
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem', marginBottom: '1.5rem',
  },
  statCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1rem 1.25rem',
    display: 'flex', alignItems: 'center', gap: '0.85rem',
  },
  statIcon: {
    width: 42, height: 42, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.1rem', flexShrink: 0,
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
  row: {
    cursor: 'pointer', transition: 'var(--transition)',
  },
  propertyCell: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  propertyIcon: {
    width: 40, height: 40, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', fontWeight: 600, flexShrink: 0,
  },
  propertyAddress: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' },
  propertyLocation: { fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 1 },
  amountCell: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-success)' },

  actionBtn: {
    padding: '0.3rem 0.65rem', fontSize: '0.78rem', fontWeight: 500,
    background: 'transparent', border: '1px solid var(--accent-danger)',
    color: 'var(--accent-danger)', borderRadius: 'var(--border-radius)',
    cursor: 'pointer', transition: 'var(--transition)',
  },
  viewBtn: {
    padding: '0.3rem 0.65rem', fontSize: '0.78rem', fontWeight: 500,
    background: 'transparent', border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)', borderRadius: 'var(--border-radius)',
    cursor: 'pointer', transition: 'var(--transition)', marginRight: '0.4rem',
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
  photoPlaceholder: {
    borderRadius: 'var(--border-radius)', height: 160,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600,
    marginBottom: '1.25rem',
  },
  offerHighlight: {
    background: 'rgba(108,92,231,0.08)', border: '1px solid var(--accent-primary)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },

  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1.25rem',
  },
};

// ─── Component ────────────────────────────────────────────────────
export default function MyOffersPage() {
  const toast = useToast();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail modal
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [detailDeal, setDetailDeal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Withdraw
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  // ── Fetch offers by iterating deals ──
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dealsRes = await api.get('/deals', { params: { limit: 100 } });
      const deals = dealsRes.data.deals || [];

      const offerPromises = deals.map((deal) =>
        api.get(`/deals/${deal._id || deal.id}/offers`)
          .then((res) => {
            const dealOffers = res.data.offers || [];
            return dealOffers.map((offer) => ({ ...offer, deal }));
          })
          .catch(() => [])
      );

      const results = await Promise.all(offerPromises);
      const allOffers = results.flat();

      // Sort by date descending
      allOffers.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setOffers(allOffers);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load offers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // ── Filter offers by status ──
  const filteredOffers = statusFilter === 'all'
    ? offers
    : offers.filter((o) => o.status === statusFilter);

  // ── Stats ──
  const pendingCount = offers.filter((o) => o.status === 'pending').length;
  const acceptedCount = offers.filter((o) => o.status === 'accepted').length;
  const rejectedCount = offers.filter((o) => o.status === 'rejected').length;
  const totalOffered = offers.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  // ── Open detail modal ──
  const openDetail = async (offer) => {
    setSelectedOffer(offer);
    setDetailDeal(offer.deal || null);
    if (offer.deal) {
      setDetailLoading(true);
      try {
        const res = await api.get(`/deals/${offer.deal._id || offer.deal.id}`);
        setDetailDeal(res.data.deal || res.data);
      } catch { /* keep list-level data */ }
      finally { setDetailLoading(false); }
    }
  };

  const closeDetail = () => {
    setSelectedOffer(null);
    setDetailDeal(null);
  };

  // ── Withdraw offer ──
  const confirmWithdraw = (e, offer) => {
    if (e) e.stopPropagation();
    setWithdrawTarget(offer);
  };

  const executeWithdraw = async () => {
    if (!withdrawTarget) return;
    setWithdrawing(true);
    try {
      const dealId = withdrawTarget.deal?._id || withdrawTarget.deal?.id || withdrawTarget.dealId;
      const offerId = withdrawTarget._id || withdrawTarget.id;
      await api.put(`/deals/${dealId}/offers/${offerId}`, { status: 'withdrawn' });
      setOffers((prev) => prev.map((o) =>
        (o._id || o.id) === offerId ? { ...o, status: 'withdrawn' } : o
      ));
      toast.success('Offer withdrawn successfully.');
      if (selectedOffer && (selectedOffer._id || selectedOffer.id) === offerId) {
        setSelectedOffer((prev) => ({ ...prev, status: 'withdrawn' }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw offer.');
    } finally {
      setWithdrawing(false);
      setWithdrawTarget(null);
    }
  };

  const statCards = [
    { label: 'Total Offered', value: fmt(totalOffered), icon: '\u{1F4B0}', bg: 'rgba(0,214,143,0.15)', color: 'var(--accent-success)' },
    { label: 'Pending', value: pendingCount, icon: '\u{23F3}', bg: 'rgba(255,170,0,0.15)', color: 'var(--accent-warning)' },
    { label: 'Accepted', value: acceptedCount, icon: '\u2713', bg: 'rgba(0,214,143,0.15)', color: 'var(--accent-success)' },
    { label: 'Rejected', value: rejectedCount, icon: '\u2717', bg: 'rgba(255,71,87,0.15)', color: 'var(--accent-danger)' },
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
          <h1 style={s.title}>My Offers</h1>
          <p style={s.subtitle}>
            Track and manage all offers you have submitted on deals.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/investor/browse'}>
          Browse Deals
        </Button>
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
          label: `${t.label}${t.value === 'all' ? ` (${offers.length})` :
            ` (${offers.filter((o) => o.status === t.value).length})`}`,
        }))}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      {/* Offers Table */}
      {filteredOffers.length === 0 ? (
        <EmptyState
          icon={'\u{1F4E9}'}
          title={statusFilter === 'all' ? 'No offers yet' : `No ${statusFilter} offers`}
          message={
            statusFilter === 'all'
              ? 'You have not submitted any offers yet. Browse deals to find your next investment.'
              : `You don't have any offers with "${statusFilter}" status.`
          }
          action={
            statusFilter !== 'all' ? (
              <Button variant="outline" onClick={() => setStatusFilter('all')}>
                View All Offers
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
                <th style={s.th}>Offer Amount</th>
                <th style={s.th}>Asking Price</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Submitted</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.map((offer) => {
                const deal = offer.deal || {};
                const id = offer._id || offer.id;
                const gradient = PROPERTY_GRADIENTS[deal.propertyType] || PROPERTY_GRADIENTS.default;

                return (
                  <tr
                    key={id}
                    style={s.row}
                    onClick={() => openDetail(offer)}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={s.td}>
                      <div style={s.propertyCell}>
                        <div style={{ ...s.propertyIcon, background: gradient }}>
                          {(deal.propertyType || 'N/A').substring(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <div style={s.propertyAddress}>{deal.address || 'Unknown Property'}</div>
                          <div style={s.propertyLocation}>
                            {deal.city || ''}{deal.state ? `, ${deal.state}` : ''}
                            {deal.propertyType ? ` \u00B7 ${deal.propertyType}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...s.td, ...s.amountCell }}>{fmt(offer.amount)}</td>
                    <td style={{ ...s.td, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {fmt(deal.askingPrice)}
                    </td>
                    <td style={s.td}>
                      <Badge variant={statusVariant(offer.status)}>
                        {(offer.status || 'unknown').charAt(0).toUpperCase() + (offer.status || 'unknown').slice(1)}
                      </Badge>
                    </td>
                    <td style={{ ...s.td, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {formatDate(offer.createdAt)}
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <button
                        style={s.viewBtn}
                        onClick={(e) => { e.stopPropagation(); openDetail(offer); }}
                        onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                        onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                      >
                        View
                      </button>
                      {offer.status === 'pending' && (
                        <button
                          style={s.actionBtn}
                          onClick={(e) => confirmWithdraw(e, offer)}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'var(--accent-danger)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--accent-danger)';
                          }}
                        >
                          Withdraw
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ Withdraw Confirm Dialog ═══ */}
      <ConfirmDialog
        isOpen={!!withdrawTarget}
        onClose={() => setWithdrawTarget(null)}
        onConfirm={executeWithdraw}
        title="Withdraw Offer"
        message={`Withdraw your ${fmt(withdrawTarget?.amount)} offer on "${withdrawTarget?.deal?.address || 'this property'}"? This action cannot be undone.`}
        confirmText={withdrawing ? 'Withdrawing...' : 'Withdraw Offer'}
        confirmVariant="danger"
      />

      {/* ═══ Offer Detail Modal ═══ */}
      <Modal
        isOpen={!!selectedOffer}
        onClose={closeDetail}
        title="Offer Details"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeDetail}>Close</Button>
            {selectedOffer?.status === 'pending' && (
              <Button
                variant="danger"
                onClick={(e) => {
                  closeDetail();
                  confirmWithdraw(e, selectedOffer);
                }}
              >
                Withdraw Offer
              </Button>
            )}
          </>
        }
      >
        {detailLoading ? (
          <div style={s.center}><LoadingSpinner size={32} /></div>
        ) : selectedOffer ? (
          <>
            {/* Offer summary banner */}
            <div style={s.offerHighlight}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Your Offer
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: 2 }}>
                  {fmt(selectedOffer.amount)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge variant={statusVariant(selectedOffer.status)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
                  {(selectedOffer.status || 'unknown').charAt(0).toUpperCase() + (selectedOffer.status || 'unknown').slice(1)}
                </Badge>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Submitted {formatDate(selectedOffer.createdAt)}
                </div>
              </div>
            </div>

            {selectedOffer.message && (
              <div style={{ ...s.detailSection }}>
                <div style={s.detailSectionTitle}>Your Message</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{selectedOffer.message}"
                </p>
              </div>
            )}

            {/* Property details */}
            {detailDeal && (
              <>
                <div style={s.detailSection}>
                  <div style={s.detailSectionTitle}>Property Details</div>
                  <div
                    style={{
                      ...s.photoPlaceholder,
                      background: PROPERTY_GRADIENTS[detailDeal.propertyType] || PROPERTY_GRADIENTS.default,
                    }}
                  >
                    {detailDeal.propertyType || 'PROPERTY'}
                  </div>

                  <div style={s.detailGrid}>
                    <div>
                      <div style={s.detailLabel}>Address</div>
                      <div style={s.detailValue}>{detailDeal.address || '-'}</div>
                    </div>
                    <div>
                      <div style={s.detailLabel}>City / State</div>
                      <div style={s.detailValue}>
                        {detailDeal.city || '-'}{detailDeal.state ? `, ${detailDeal.state}` : ''}
                      </div>
                    </div>
                    <div>
                      <div style={s.detailLabel}>Property Type</div>
                      <div style={s.detailValue}>{detailDeal.propertyType || '-'}</div>
                    </div>
                    <div>
                      <div style={s.detailLabel}>Bedrooms / Bathrooms</div>
                      <div style={s.detailValue}>{detailDeal.bedrooms ?? '-'} bd / {detailDeal.bathrooms ?? '-'} ba</div>
                    </div>
                    <div>
                      <div style={s.detailLabel}>Sqft</div>
                      <div style={s.detailValue}>{detailDeal.sqft ? Number(detailDeal.sqft).toLocaleString() : '-'}</div>
                    </div>
                    <div>
                      <div style={s.detailLabel}>Year Built</div>
                      <div style={s.detailValue}>{detailDeal.yearBuilt || '-'}</div>
                    </div>
                  </div>
                </div>

                <div style={s.detailSection}>
                  <div style={s.detailSectionTitle}>Financials</div>
                  {[
                    ['Asking Price', fmt(detailDeal.askingPrice)],
                    ['Your Offer', fmt(selectedOffer.amount)],
                    ['Difference', (() => {
                      const diff = (Number(selectedOffer.amount) || 0) - (Number(detailDeal.askingPrice) || 0);
                      const sign = diff >= 0 ? '+' : '';
                      return sign + fmt(Math.abs(diff));
                    })()],
                    ['ARV Estimate', fmt(detailDeal.arv)],
                    ['Rehab Estimate', fmt(detailDeal.rehabEstimate)],
                    ['Assignment Fee', fmt(detailDeal.assignmentFee)],
                  ].map(([label, val]) => (
                    <div key={label} style={s.financialRow}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{
                        fontWeight: 600,
                        color: label === 'Your Offer' ? 'var(--accent-primary)' : 'var(--text-primary)',
                      }}>{val}</span>
                    </div>
                  ))}
                </div>

                {detailDeal.description && (
                  <div style={s.detailSection}>
                    <div style={s.detailSectionTitle}>Description</div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {detailDeal.description}
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        ) : null}
      </Modal>
    </div>
  );
}
