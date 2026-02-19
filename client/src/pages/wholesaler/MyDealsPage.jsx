import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

// ─── Helpers ──────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending_review', label: 'Pending Review' },
  { key: 'under_contract', label: 'Under Contract' },
  { key: 'sold', label: 'Sold' },
  { key: 'draft', label: 'Drafts' },
  { key: 'delisted', label: 'Delisted' },
];

const STATUS_COLORS = {
  active: { bg: 'rgba(0,214,143,0.12)', text: 'var(--accent-success)' },
  pending_review: { bg: 'rgba(255,170,0,0.12)', text: 'var(--accent-warning)' },
  under_contract: { bg: 'rgba(108,92,231,0.12)', text: 'var(--accent-primary)' },
  sold: { bg: 'rgba(52,152,219,0.12)', text: 'var(--accent-info)' },
  draft: { bg: 'rgba(95,99,104,0.15)', text: 'var(--text-secondary)' },
  delisted: { bg: 'rgba(255,71,87,0.12)', text: 'var(--accent-danger)' },
};

const PROPERTY_GRADIENTS = {
  SFH: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
  'Multi-Family': 'linear-gradient(135deg, #00d68f 0%, #00b894 100%)',
  Commercial: 'linear-gradient(135deg, #3498db 0%, #74b9ff 100%)',
  Land: 'linear-gradient(135deg, #ffaa00 0%, #fdcb6e 100%)',
  default: 'linear-gradient(135deg, #636e72 0%, #b2bec3 100%)',
};

// ─── Inline Styles ────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1280, margin: '0 auto' },
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' },
  newBtn: {
    background: 'var(--accent-primary)', color: '#fff', border: 'none',
    borderRadius: 'var(--border-radius)', padding: '0.6rem 1.25rem',
    fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'var(--transition)',
  },

  /* Tabs */
  tabBar: {
    display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', overflowX: 'auto',
    borderBottom: '1px solid var(--border-color)', paddingBottom: 0,
  },
  tab: {
    padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
    color: 'var(--text-secondary)', background: 'none', border: 'none',
    borderBottom: '2px solid transparent', transition: 'var(--transition)', whiteSpace: 'nowrap',
  },
  tabActive: {
    color: 'var(--accent-primary)', borderBottomColor: 'var(--accent-primary)',
  },

  /* Deal grid */
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem',
  },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', cursor: 'pointer',
    transition: 'var(--transition)',
  },
  cardPhoto: {
    height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: 1,
  },
  cardBody: { padding: '1rem 1.25rem' },
  cardAddress: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 },
  cardLocation: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' },
  cardPriceRow: { display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.75rem' },
  cardPrice: { fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-success)' },
  cardArv: { fontSize: '0.8rem', color: 'var(--text-secondary)' },
  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: 12,
    fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize',
  },
  countBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: '0.75rem', color: 'var(--text-secondary)',
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
    border: '1px solid var(--border-color)', maxWidth: 780, width: '100%',
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
    cursor: 'pointer', fontSize: '1.1rem', transition: 'var(--transition)',
  },
  modalBody: { padding: '1.5rem' },

  /* Modal sections */
  detailGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 1.5rem', marginBottom: '1.5rem',
  },
  detailLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  detailValue: { fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 },
  photoPlaceholder: {
    background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)',
    height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem',
  },
  financialRow: {
    display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0',
    borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem',
  },
  btnRow: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  actionBtn: {
    padding: '0.55rem 1.1rem', borderRadius: 'var(--border-radius)',
    fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer',
    transition: 'var(--transition)',
  },

  /* ── Offer panel ── */
  offerCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem', marginBottom: '0.75rem',
  },
  offerTop: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' },
  offerAvatar: {
    width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
  },
  offerName: { fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' },
  offerCompany: { fontSize: '0.78rem', color: 'var(--text-secondary)' },
  offerAmount: { fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-success)', marginBottom: '0.35rem' },
  offerMessage: { fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontStyle: 'italic' },
  offerBtns: { display: 'flex', gap: '0.5rem' },
  stars: { color: 'var(--accent-warning)', fontSize: '0.8rem' },

  /* Confirm dialog */
  confirmOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
  },
  confirmBox: {
    background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-lg)',
    border: '1px solid var(--border-color)', padding: '1.75rem', maxWidth: 420,
    width: '100%', textAlign: 'center',
  },
  confirmTitle: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' },
  confirmText: { fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' },
  confirmBtns: { display: 'flex', justifyContent: 'center', gap: '0.75rem' },
};

// ─── Sub-components ───────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span style={{ ...s.badge, background: cfg.bg, color: cfg.text }}>
      {(status || '').replace(/_/g, ' ')}
    </span>
  );
}

function StarRatingInline({ score = 0 }) {
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  let stars = '';
  for (let i = 0; i < full; i++) stars += '\u2605';
  if (half) stars += '\u00BD';
  return <span style={s.stars}>{stars || '-'} ({Number(score).toFixed(1)})</span>;
}

// ─── Main Component ───────────────────────────────────────────────
export default function MyDealsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [deals, setDeals] = useState([]);
  const [offerCounts, setOfferCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail modal
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [dealOffers, setDealOffers] = useState([]);
  const [showOffers, setShowOffers] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState(null); // { type, payload, message }
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch deals ──
  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 100 };
      if (activeTab !== 'all') params.status = activeTab;
      const res = await api.get('/deals', { params });
      const dealsList = res.data.deals || [];
      setDeals(dealsList);

      // fetch offer counts in background
      const counts = {};
      await Promise.all(
        dealsList.map(async (d) => {
          try {
            const r = await api.get(`/deals/${d._id || d.id}/offers`);
            counts[d._id || d.id] = (r.data.offers || []).length;
          } catch {
            counts[d._id || d.id] = 0;
          }
        })
      );
      setOfferCounts(counts);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load deals.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // ── Open deal detail ──
  const openDeal = (deal) => {
    setSelectedDeal(deal);
    setShowOffers(false);
    setDealOffers([]);
  };

  const closeDeal = () => {
    setSelectedDeal(null);
    setShowOffers(false);
    setDealOffers([]);
  };

  // ── Fetch offers for a deal ──
  const loadOffers = async (dealId) => {
    setOffersLoading(true);
    setShowOffers(true);
    try {
      const res = await api.get(`/deals/${dealId}/offers`);
      setDealOffers(res.data.offers || []);
    } catch {
      setDealOffers([]);
    } finally {
      setOffersLoading(false);
    }
  };

  // ── Accept / Reject offer ──
  const handleOfferAction = (offer, action) => {
    if (action === 'accepted') {
      setConfirmAction({
        type: 'accept_offer',
        payload: offer,
        message: `Accept this offer for ${fmt(offer.amount)}? This will notify the investor and start the transaction process.`,
      });
    } else {
      setConfirmAction({
        type: 'reject_offer',
        payload: offer,
        message: `Reject this offer for ${fmt(offer.amount)}? The investor will be notified.`,
      });
    }
  };

  const executeConfirm = async () => {
    if (!confirmAction || !selectedDeal) return;
    setActionLoading(true);
    const dealId = selectedDeal._id || selectedDeal.id;
    try {
      if (confirmAction.type === 'accept_offer' || confirmAction.type === 'reject_offer') {
        const offerId = confirmAction.payload._id || confirmAction.payload.id;
        const status = confirmAction.type === 'accept_offer' ? 'accepted' : 'rejected';
        await api.put(`/deals/${dealId}/offers/${offerId}`, { status });
        // refresh offers
        await loadOffers(dealId);
        // refresh deal (status might have changed)
        try {
          const r = await api.get(`/deals/${dealId}`);
          setSelectedDeal(r.data.deal || r.data);
        } catch { /* keep current */ }
      } else if (confirmAction.type === 'delist') {
        await api.delete(`/deals/${dealId}`);
        closeDeal();
        fetchDeals();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleDelist = () => {
    setConfirmAction({
      type: 'delist',
      payload: null,
      message: 'Delist this deal? It will no longer be visible to investors.',
    });
  };

  // ── Render ──
  return (
    <div style={s.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Page header */}
      <div style={s.pageHeader}>
        <h1 style={s.title}>My Deals</h1>
        <button
          style={s.newBtn}
          onClick={() => navigate('/wholesaler/deals/new')}
          onMouseOver={(e) => (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
        >
          + New Deal
        </button>
      </div>

      {/* Tab bar */}
      <div style={s.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            style={{ ...s.tab, ...(activeTab === tab.key ? s.tabActive : {}) }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {/* Loading */}
      {loading && (
        <div style={s.center}>
          <div style={s.spinner} />
        </div>
      )}

      {/* Empty */}
      {!loading && deals.length === 0 && (
        <div style={s.empty}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            No deals found
          </p>
          <p>
            {activeTab === 'all'
              ? 'Create your first deal to get started.'
              : `No ${activeTab.replace(/_/g, ' ')} deals.`}
          </p>
        </div>
      )}

      {/* Deal grid */}
      {!loading && deals.length > 0 && (
        <div style={s.grid}>
          {deals.map((deal) => {
            const id = deal._id || deal.id;
            const gradient = PROPERTY_GRADIENTS[deal.propertyType] || PROPERTY_GRADIENTS.default;
            return (
              <div
                key={id}
                style={s.card}
                onClick={() => openDeal(deal)}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <div style={{ ...s.cardPhoto, background: gradient }}>
                  {deal.propertyType || 'PROPERTY'}
                </div>
                <div style={s.cardBody}>
                  <div style={s.cardAddress}>{deal.address || 'No address'}</div>
                  <div style={s.cardLocation}>
                    {deal.city || ''}{deal.state ? `, ${deal.state}` : ''}{deal.zip ? ` ${deal.zip}` : ''}
                  </div>
                  <div style={s.cardPriceRow}>
                    <span style={s.cardPrice}>{fmt(deal.askingPrice)}</span>
                    {deal.arv && <span style={s.cardArv}>ARV {fmt(deal.arv)}</span>}
                  </div>
                  <div style={s.cardFooter}>
                    <StatusBadge status={deal.status} />
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <span style={s.countBadge}>
                        <span style={{ fontSize: '0.85rem' }}>{'\u{1F4E9}'}</span>
                        {offerCounts[id] ?? '-'}
                      </span>
                      <span style={s.countBadge}>
                        <span style={{ fontSize: '0.85rem' }}>{'\u{1F441}'}</span>
                        {deal.viewCount ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Deal Detail Modal ═══ */}
      {selectedDeal && (
        <div style={s.overlay} onClick={closeDeal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{selectedDeal.address || 'Deal Details'}</h2>
              <button style={s.closeBtn} onClick={closeDeal}>&times;</button>
            </div>

            <div style={s.modalBody}>
              {!showOffers ? (
                <DealDetailView
                  deal={selectedDeal}
                  onViewOffers={() => loadOffers(selectedDeal._id || selectedDeal.id)}
                  onEdit={() => navigate(`/wholesaler/deals/${selectedDeal._id || selectedDeal.id}/edit`)}
                  onDelist={handleDelist}
                />
              ) : (
                <OfferPanelView
                  offers={dealOffers}
                  loading={offersLoading}
                  onBack={() => setShowOffers(false)}
                  onAccept={(o) => handleOfferAction(o, 'accepted')}
                  onReject={(o) => handleOfferAction(o, 'rejected')}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Confirm Dialog ═══ */}
      {confirmAction && (
        <div style={s.confirmOverlay} onClick={() => !actionLoading && setConfirmAction(null)}>
          <div style={s.confirmBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.confirmTitle}>
              {confirmAction.type === 'accept_offer'
                ? 'Accept Offer'
                : confirmAction.type === 'reject_offer'
                ? 'Reject Offer'
                : 'Delist Deal'}
            </div>
            <div style={s.confirmText}>{confirmAction.message}</div>
            <div style={s.confirmBtns}>
              <button
                style={{
                  ...s.actionBtn,
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                style={{
                  ...s.actionBtn,
                  background:
                    confirmAction.type === 'accept_offer'
                      ? 'var(--accent-success)'
                      : 'var(--accent-danger)',
                  color: '#fff',
                }}
                onClick={executeConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Deal Detail Sub-view ─────────────────────────────────────────
function DealDetailView({ deal, onViewOffers, onEdit, onDelist }) {
  const gradient = PROPERTY_GRADIENTS[deal.propertyType] || PROPERTY_GRADIENTS.default;
  const canEdit = deal.status === 'draft' || deal.status === 'pending_review';
  const canDelist = deal.status === 'active';

  return (
    <>
      {/* Photo placeholder */}
      <div
        style={{
          ...s.photoPlaceholder,
          background: gradient,
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}
      >
        Photo Gallery Placeholder
      </div>

      {/* Status */}
      <div style={{ marginBottom: '1.25rem' }}>
        <StatusBadge status={deal.status} />
      </div>

      {/* Property details */}
      <div style={s.detailGrid}>
        <div>
          <div style={s.detailLabel}>Address</div>
          <div style={s.detailValue}>{deal.address || '-'}</div>
        </div>
        <div>
          <div style={s.detailLabel}>City / State</div>
          <div style={s.detailValue}>
            {deal.city || '-'}{deal.state ? `, ${deal.state}` : ''}{deal.zip ? ` ${deal.zip}` : ''}
          </div>
        </div>
        <div>
          <div style={s.detailLabel}>County</div>
          <div style={s.detailValue}>{deal.county || '-'}</div>
        </div>
        <div>
          <div style={s.detailLabel}>Property Type</div>
          <div style={s.detailValue}>{deal.propertyType || '-'}</div>
        </div>
        <div>
          <div style={s.detailLabel}>Bedrooms</div>
          <div style={s.detailValue}>{deal.bedrooms ?? '-'}</div>
        </div>
        <div>
          <div style={s.detailLabel}>Bathrooms</div>
          <div style={s.detailValue}>{deal.bathrooms ?? '-'}</div>
        </div>
        <div>
          <div style={s.detailLabel}>Sqft</div>
          <div style={s.detailValue}>{deal.sqft ? Number(deal.sqft).toLocaleString() : '-'}</div>
        </div>
        <div>
          <div style={s.detailLabel}>Year Built</div>
          <div style={s.detailValue}>{deal.yearBuilt || '-'}</div>
        </div>
      </div>

      {/* Financials */}
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
        Financials
      </h3>
      {[
        ['Asking Price', fmt(deal.askingPrice)],
        ['ARV Estimate', fmt(deal.arv)],
        ['Rehab Estimate', fmt(deal.rehabEstimate)],
        ['Assignment Fee', fmt(deal.assignmentFee)],
      ].map(([label, val]) => (
        <div key={label} style={s.financialRow}>
          <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
        </div>
      ))}

      {/* Description */}
      {deal.description && (
        <div style={{ marginTop: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Description
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {deal.description}
          </p>
        </div>
      )}

      {/* Highlights */}
      {deal.highlights && deal.highlights.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {deal.highlights.map((h, i) => (
            <span
              key={i}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                padding: '0.2rem 0.6rem',
                borderRadius: 12,
                fontSize: '0.75rem',
              }}
            >
              {h}
            </span>
          ))}
        </div>
      )}

      {/* Status timeline (simplified) */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          Timeline
        </h3>
        <StatusTimeline status={deal.status} createdAt={deal.createdAt} updatedAt={deal.updatedAt} />
      </div>

      {/* Action buttons */}
      <div style={s.btnRow}>
        <button
          style={{ ...s.actionBtn, background: 'var(--accent-primary)', color: '#fff' }}
          onClick={onViewOffers}
        >
          View Offers
        </button>
        {canEdit && (
          <button
            style={{ ...s.actionBtn, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            onClick={onEdit}
          >
            Edit
          </button>
        )}
        {canDelist && (
          <button
            style={{ ...s.actionBtn, background: 'rgba(255,71,87,0.12)', color: 'var(--accent-danger)' }}
            onClick={onDelist}
          >
            Delist
          </button>
        )}
      </div>
    </>
  );
}

// ─── Status Timeline ──────────────────────────────────────────────
function StatusTimeline({ status, createdAt, updatedAt }) {
  const stages = ['draft', 'pending_review', 'active', 'under_contract', 'sold'];
  const currentIdx = stages.indexOf(status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {stages.map((st, i) => {
        const isActive = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={st} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: isActive ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                border: isCurrent ? '2px solid var(--accent-primary-hover)' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive ? '#fff' : 'var(--text-muted)',
                fontSize: '0.65rem',
                fontWeight: 700,
              }}
            >
              {isActive ? '\u2713' : i + 1}
            </div>
            {i < stages.length - 1 && (
              <div
                style={{
                  width: 40,
                  height: 2,
                  background: i < currentIdx ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Offer Panel Sub-view ─────────────────────────────────────────
function OfferPanelView({ offers, loading: offersLoading, onBack, onAccept, onReject }) {
  if (offersLoading) {
    return (
      <div style={s.center}>
        <div style={s.spinner} />
      </div>
    );
  }

  return (
    <>
      <button
        style={{
          background: 'none', border: 'none', color: 'var(--accent-primary)',
          cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
        onClick={onBack}
      >
        &larr; Back to Deal
      </button>

      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
        Offers ({offers.length})
      </h3>

      {offers.length === 0 && (
        <div style={s.empty}>No offers yet for this deal.</div>
      )}

      {offers.map((offer) => {
        const investor = offer.investor || offer.investorInfo || {};
        const initials = ((investor.firstName || '?')[0] + (investor.lastName || '?')[0]).toUpperCase();
        const isPending = offer.status === 'pending';

        return (
          <div key={offer._id || offer.id} style={s.offerCard}>
            <div style={s.offerTop}>
              <div style={s.offerAvatar}>{initials}</div>
              <div style={{ flex: 1 }}>
                <div style={s.offerName}>
                  {investor.firstName || 'Unknown'} {investor.lastName || 'Investor'}
                </div>
                <div style={s.offerCompany}>
                  {investor.company || ''}{' '}
                  <StarRatingInline score={investor.reputationScore || investor.reputation || 0} />
                </div>
              </div>
              <StatusBadge status={offer.status} />
            </div>

            <div style={s.offerAmount}>{fmt(offer.amount)}</div>

            {offer.message && (
              <div style={s.offerMessage}>"{offer.message}"</div>
            )}

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {timeAgo(offer.createdAt)}
            </div>

            {isPending && (
              <div style={s.offerBtns}>
                <button
                  style={{ ...s.actionBtn, background: 'var(--accent-success)', color: '#fff', fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                  onClick={() => onAccept(offer)}
                >
                  Accept
                </button>
                <button
                  style={{ ...s.actionBtn, background: 'rgba(255,71,87,0.12)', color: 'var(--accent-danger)', fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                  onClick={() => onReject(offer)}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
