import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Button, Modal, Badge, StarRating,
  LoadingSpinner, EmptyState,
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

function matchColor(pct) {
  if (pct >= 80) return 'var(--accent-success)';
  if (pct >= 60) return 'var(--accent-primary)';
  if (pct >= 40) return 'var(--accent-warning)';
  return 'var(--text-secondary)';
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
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem',
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
  matchBadge: {
    position: 'absolute', top: 10, right: 10,
    borderRadius: 20, padding: '0.25rem 0.7rem', fontSize: '0.8rem', fontWeight: 700,
    color: '#fff', display: 'flex', alignItems: 'center', gap: '0.25rem',
  },
  cardBody: { padding: '1rem 1.25rem' },
  cardAddress: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 },
  cardLocation: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' },
  cardPriceRow: { display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' },
  cardPrice: { fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-success)' },
  cardArv: { fontSize: '0.8rem', color: 'var(--text-secondary)' },
  reasonTags: { display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' },
  reasonTag: {
    background: 'rgba(108,92,231,0.12)', color: 'var(--accent-primary)',
    padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.72rem', fontWeight: 500,
  },
  cardFooter: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem',
  },
  cardFee: { fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 500 },

  // Detail modal
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

  // Offer modal
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
export default function MatchedDealsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [offerModal, setOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/matching/deals');
      const list = res.data.matches || [];
      // Sort by match percentage desc
      list.sort((a, b) => (b.match?.percentage || 0) - (a.match?.percentage || 0));
      setMatches(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load matched deals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const openDetail = async (item) => {
    const deal = item.deal || {};
    setSelectedDeal(deal);
    setSelectedMatch(item.match || {});
    setDetailLoading(true);
    try {
      const res = await api.get(`/deals/${deal._id || deal.id}`);
      setSelectedDeal(res.data.deal || res.data);
    } catch { /* keep list data */ }
    finally { setDetailLoading(false); }
  };

  const closeDetail = () => {
    setSelectedDeal(null);
    setSelectedMatch(null);
  };

  const toggleSave = async (e, deal) => {
    if (e) e.stopPropagation();
    const id = deal._id || deal.id;
    setSavingId(id);
    try {
      if (deal.isSaved) {
        await api.delete(`/deals/${id}/save`);
        toast.success('Deal removed from saved.');
      } else {
        await api.post(`/deals/${id}/save`);
        toast.success('Deal saved!');
      }
      // Update in matches
      setMatches((prev) => prev.map((m) => {
        const did = m.deal?._id || m.deal?.id;
        if (did === id) return { ...m, deal: { ...m.deal, isSaved: !m.deal.isSaved } };
        return m;
      }));
      if (selectedDeal && (selectedDeal._id || selectedDeal.id) === id) {
        setSelectedDeal((prev) => ({ ...prev, isSaved: !prev.isSaved }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save deal.');
    } finally {
      setSavingId(null);
    }
  };

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

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.title}>Matched Deals</h1>
          <p style={s.subtitle}>
            Deals that match your investment preferences, ranked by relevance.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/investor/preferences'}>
          Update Preferences
        </Button>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {loading && (
        <div style={s.center}>
          <LoadingSpinner size={40} />
        </div>
      )}

      {!loading && matches.length === 0 && (
        <EmptyState
          icon={'\u{1F3AF}'}
          title="No matches yet"
          message="Set your investment preferences to get personalized deal matches."
          action={
            <Button onClick={() => window.location.href = '/investor/preferences'}>
              Set Preferences
            </Button>
          }
        />
      )}

      {!loading && matches.length > 0 && (
        <>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            {matches.length} match{matches.length !== 1 ? 'es' : ''} found
          </div>
          <div style={s.grid}>
            {matches.map((item) => {
              const deal = item.deal || {};
              const match = item.match || {};
              const id = deal._id || deal.id;
              const gradient = PROPERTY_GRADIENTS[deal.propertyType] || PROPERTY_GRADIENTS.default;
              const pct = match.percentage || 0;

              return (
                <div
                  key={id}
                  style={s.card}
                  onClick={() => openDetail(item)}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <div style={{ ...s.cardPhoto, background: gradient }}>
                    {deal.propertyType || 'PROPERTY'}
                    <div style={{ ...s.matchBadge, background: matchColor(pct) }}>
                      {pct}% Match
                    </div>
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
                    {match.reasons && match.reasons.length > 0 && (
                      <div style={s.reasonTags}>
                        {match.reasons.map((r, i) => (
                          <span key={i} style={s.reasonTag}>{r}</span>
                        ))}
                      </div>
                    )}
                    <div style={s.cardFooter}>
                      {deal.assignmentFee ? (
                        <span style={s.cardFee}>Fee: {fmt(deal.assignmentFee)}</span>
                      ) : <span />}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={savingId === id}
                          onClick={(e) => { e.stopPropagation(); toggleSave(e, deal); }}
                        >
                          {deal.isSaved ? '\u{1F516}' : '\u{1F517}'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ Deal Detail Modal ═══ */}
      <Modal
        isOpen={!!selectedDeal && !offerModal}
        onClose={closeDetail}
        title={selectedDeal?.address || 'Deal Details'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeDetail}>Close</Button>
            <Button
              variant="secondary"
              loading={savingId === (selectedDeal?._id || selectedDeal?.id)}
              onClick={(e) => toggleSave(e, selectedDeal)}
            >
              {selectedDeal?.isSaved ? 'Unsave' : 'Save'}
            </Button>
            <Button onClick={openOfferModal}>Make Offer</Button>
          </>
        }
      >
        {detailLoading ? (
          <div style={s.center}><LoadingSpinner size={32} /></div>
        ) : selectedDeal ? (
          <>
            {/* Match info banner */}
            {selectedMatch && (
              <div style={{
                background: `rgba(108,92,231,0.1)`, border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--border-radius)', padding: '0.85rem 1rem', marginBottom: '1.25rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: matchColor(selectedMatch.percentage || 0),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                }}>
                  {selectedMatch.percentage || 0}%
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Match Score
                  </div>
                  {selectedMatch.reasons && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                      {selectedMatch.reasons.map((r, i) => (
                        <span key={i} style={s.reasonTag}>{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

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
