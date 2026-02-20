import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import {
  Button, Badge, Modal, LoadingSpinner, EmptyState, ConfirmDialog,
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

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1280, margin: '0 auto' },
  pageHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' },
  subtitle: { fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' },

  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem',
  },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', overflow: 'hidden',
    cursor: 'pointer', transition: 'var(--transition)', position: 'relative',
  },
  cardPhoto: {
    height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, position: 'relative',
  },
  updateBadge: {
    position: 'absolute', top: 8, left: 8,
    borderRadius: 12, padding: '0.15rem 0.55rem', fontSize: '0.7rem', fontWeight: 600,
  },
  removeBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: '50%',
    background: 'rgba(0,0,0,0.6)', border: 'none',
    color: '#fff', fontSize: '0.85rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'var(--transition)', lineHeight: 1,
  },
  cardBody: { padding: '1rem 1.25rem' },
  cardAddress: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 },
  cardLocation: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' },
  cardPriceRow: { display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' },
  cardPrice: { fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-success)' },
  cardArv: { fontSize: '0.8rem', color: 'var(--text-secondary)' },
  cardFooter: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)',
  },
  cardTime: { fontSize: '0.75rem', color: 'var(--text-muted)' },

  // Detail modal reuse
  detailGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 1.5rem', marginBottom: '1.5rem',
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
    background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)',
    height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem',
  },
  offerForm: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formLabel: { fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  input: {
    width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)', fontSize: '0.85rem', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical',
    minHeight: 80, fontFamily: 'inherit', boxSizing: 'border-box',
  },

  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1.25rem',
  },
};

// ─── Component ────────────────────────────────────────────────────
export default function SavedDealsPage() {
  const toast = useToast();

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [offerModal, setOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);

  // Confirm remove
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/deals/saved');
      setDeals(res.data.deals || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load saved deals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  // ── Remove from saved ──
  const confirmRemove = (e, deal) => {
    e.stopPropagation();
    setRemoveTarget(deal);
  };

  const executeRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const id = removeTarget._id || removeTarget.id;
      await api.delete(`/deals/${id}/save`);
      setDeals((prev) => prev.filter((d) => (d._id || d.id) !== id));
      toast.success('Deal removed from saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove deal.');
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  };

  // ── Open detail ──
  const openDetail = async (deal) => {
    setSelectedDeal(deal);
    setDetailLoading(true);
    try {
      const res = await api.get(`/deals/${deal._id || deal.id}`);
      setSelectedDeal(res.data.deal || res.data);
    } catch { /* keep */ }
    finally { setDetailLoading(false); }
  };

  // ── Offer ──
  const openOfferModal = () => {
    setOfferModal(true);
    setOfferAmount('');
    setOfferMessage('');
  };

  const submitOffer = async () => {
    if (!offerAmount || Number(offerAmount) <= 0) {
      toast.warning('Please enter a valid offer amount.');
      return;
    }
    setOfferLoading(true);
    try {
      const id = selectedDeal._id || selectedDeal.id;
      await api.post(`/deals/${id}/offers`, {
        amount: Number(offerAmount),
        message: offerMessage,
      });
      toast.success('Offer submitted successfully!');
      setOfferModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit offer.');
    } finally {
      setOfferLoading(false);
    }
  };

  // Simulate update badges based on deal data
  const getUpdateBadge = (deal) => {
    if (deal.priceChanged || deal.priceUpdatedAt) {
      return { label: 'Price Changed', variant: 'warning' };
    }
    if (deal.newOffer || deal.hasNewOffer) {
      return { label: 'New Offer', variant: 'info' };
    }
    return null;
  };

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.title}>Saved Deals</h1>
          <p style={s.subtitle}>
            {deals.length} deal{deals.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/investor/browse'}>
          Browse More Deals
        </Button>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {loading && (
        <div style={s.center}>
          <LoadingSpinner size={40} />
        </div>
      )}

      {!loading && deals.length === 0 && (
        <EmptyState
          icon={'\u{1F516}'}
          title="No saved deals"
          message="Save deals while browsing to keep track of ones you're interested in."
          action={
            <Button onClick={() => window.location.href = '/investor/browse'}>
              Browse Deals
            </Button>
          }
        />
      )}

      {!loading && deals.length > 0 && (
        <div style={s.grid}>
          {deals.map((deal) => {
            const id = deal._id || deal.id;
            const gradient = PROPERTY_GRADIENTS[deal.propertyType] || PROPERTY_GRADIENTS.default;
            const updateBadge = getUpdateBadge(deal);

            return (
              <div
                key={id}
                style={s.card}
                onClick={() => openDetail(deal)}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <div style={{ ...s.cardPhoto, background: gradient }}>
                  {deal.propertyType || 'PROPERTY'}
                  {updateBadge && (
                    <div style={s.updateBadge}>
                      <Badge variant={updateBadge.variant}>{updateBadge.label}</Badge>
                    </div>
                  )}
                  <button
                    style={s.removeBtn}
                    onClick={(e) => confirmRemove(e, deal)}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--accent-danger)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
                    title="Remove from saved"
                  >
                    &#x2715;
                  </button>
                </div>
                <div style={s.cardBody}>
                  <div style={s.cardAddress}>{deal.address || 'No address'}</div>
                  <div style={s.cardLocation}>
                    {deal.city || ''}{deal.state ? `, ${deal.state}` : ''}
                  </div>
                  <div style={s.cardPriceRow}>
                    <span style={s.cardPrice}>{fmt(deal.askingPrice)}</span>
                    {deal.arv && <span style={s.cardArv}>ARV {fmt(deal.arv)}</span>}
                  </div>
                  <div style={s.cardFooter}>
                    {deal.assignmentFee ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                        Fee: {fmt(deal.assignmentFee)}
                      </span>
                    ) : <span />}
                    <span style={s.cardTime}>
                      Saved {timeAgo(deal.savedAt || deal.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Confirm Remove Dialog ═══ */}
      <ConfirmDialog
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={executeRemove}
        title="Remove Saved Deal"
        message={`Remove "${removeTarget?.address || 'this deal'}" from your saved deals?`}
        confirmText={removing ? 'Removing...' : 'Remove'}
        confirmVariant="danger"
      />

      {/* ═══ Deal Detail Modal ═══ */}
      <Modal
        isOpen={!!selectedDeal && !offerModal}
        onClose={() => setSelectedDeal(null)}
        title={selectedDeal?.address || 'Deal Details'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedDeal(null)}>Close</Button>
            <Button
              variant="danger"
              onClick={(e) => {
                setSelectedDeal(null);
                confirmRemove(e, selectedDeal);
              }}
            >
              Remove from Saved
            </Button>
            <Button onClick={openOfferModal}>Make Offer</Button>
          </>
        }
      >
        {detailLoading ? (
          <div style={s.center}><LoadingSpinner size={32} /></div>
        ) : selectedDeal ? (
          <>
            <div
              style={{
                ...s.photoPlaceholder,
                background: PROPERTY_GRADIENTS[selectedDeal.propertyType] || PROPERTY_GRADIENTS.default,
                color: 'rgba(255,255,255,0.7)', fontWeight: 600,
              }}
            >
              Photo Gallery Placeholder
            </div>

            <div style={s.detailGrid}>
              <div>
                <div style={s.detailLabel}>Address</div>
                <div style={s.detailValue}>{selectedDeal.address || '-'}</div>
              </div>
              <div>
                <div style={s.detailLabel}>City / State</div>
                <div style={s.detailValue}>
                  {selectedDeal.city || '-'}{selectedDeal.state ? `, ${selectedDeal.state}` : ''}
                </div>
              </div>
              <div>
                <div style={s.detailLabel}>Property Type</div>
                <div style={s.detailValue}>{selectedDeal.propertyType || '-'}</div>
              </div>
              <div>
                <div style={s.detailLabel}>Bedrooms / Bathrooms</div>
                <div style={s.detailValue}>{selectedDeal.bedrooms ?? '-'} bd / {selectedDeal.bathrooms ?? '-'} ba</div>
              </div>
              <div>
                <div style={s.detailLabel}>Sqft</div>
                <div style={s.detailValue}>{selectedDeal.sqft ? Number(selectedDeal.sqft).toLocaleString() : '-'}</div>
              </div>
              <div>
                <div style={s.detailLabel}>Year Built</div>
                <div style={s.detailValue}>{selectedDeal.yearBuilt || '-'}</div>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Financials
            </h3>
            {[
              ['Asking Price', fmt(selectedDeal.askingPrice)],
              ['ARV Estimate', fmt(selectedDeal.arv)],
              ['Rehab Estimate', fmt(selectedDeal.rehabEstimate)],
              ['Assignment Fee', fmt(selectedDeal.assignmentFee)],
            ].map(([label, val]) => (
              <div key={label} style={s.financialRow}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
              </div>
            ))}

            {selectedDeal.description && (
              <div style={{ marginTop: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Description
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {selectedDeal.description}
                </p>
              </div>
            )}
          </>
        ) : null}
      </Modal>

      {/* ═══ Offer Modal ═══ */}
      <Modal
        isOpen={offerModal}
        onClose={() => setOfferModal(false)}
        title={`Make Offer on ${selectedDeal?.address || 'Deal'}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOfferModal(false)}>Cancel</Button>
            <Button loading={offerLoading} onClick={submitOffer}>Submit Offer</Button>
          </>
        }
      >
        <div style={s.offerForm}>
          {selectedDeal && (
            <div style={{
              background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)',
              padding: '0.75rem 1rem', marginBottom: '0.5rem',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Asking Price</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                {fmt(selectedDeal.askingPrice)}
              </div>
            </div>
          )}
          <div>
            <div style={s.formLabel}>Your Offer Amount ($)</div>
            <input
              style={s.input}
              type="number"
              placeholder="Enter amount..."
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <div style={s.formLabel}>Message (optional)</div>
            <textarea
              style={s.textarea}
              placeholder="Add a message to the wholesaler..."
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
