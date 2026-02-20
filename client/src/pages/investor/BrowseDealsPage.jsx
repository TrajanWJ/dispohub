import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Button, Card, Modal, Badge, StarRating, SearchBar,
  LoadingSpinner, EmptyState, Pagination, ConfirmDialog,
} from '../../components/common';
import { useToast } from '../../components/common/index.jsx';

// ─── Constants ────────────────────────────────────────────────────
const PROPERTY_TYPES = ['SFH', 'Multi-Family', 'Commercial', 'Land', 'Condo', 'Townhouse'];
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

const PROPERTY_GRADIENTS = {
  SFH: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
  'Multi-Family': 'linear-gradient(135deg, #00d68f 0%, #00b894 100%)',
  Commercial: 'linear-gradient(135deg, #3498db 0%, #74b9ff 100%)',
  Land: 'linear-gradient(135deg, #ffaa00 0%, #fdcb6e 100%)',
  Condo: 'linear-gradient(135deg, #e84393 0%, #fd79a8 100%)',
  Townhouse: 'linear-gradient(135deg, #00cec9 0%, #81ecec 100%)',
  default: 'linear-gradient(135deg, #636e72 0%, #b2bec3 100%)',
};

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1440, margin: '0 auto' },
  pageHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem',
  },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  layout: { display: 'flex', gap: '1.5rem' },

  // Sidebar
  sidebar: {
    width: 280, flexShrink: 0, background: 'var(--bg-card)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)',
    padding: '1.25rem', alignSelf: 'flex-start', position: 'sticky', top: 80,
  },
  sidebarTitle: {
    fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)',
    marginBottom: '1rem', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterGroup: { marginBottom: '1.25rem' },
  filterLabel: {
    fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)',
    marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  select: {
    width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)', fontSize: '0.85rem',
  },
  input: {
    width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)', fontSize: '0.85rem', boxSizing: 'border-box',
  },
  checkboxList: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  checkboxItem: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer',
  },
  priceRow: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  reputationRow: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
  },
  slider: {
    width: '100%', accentColor: 'var(--accent-primary)',
  },

  // Content area
  content: { flex: 1, minWidth: 0 },
  viewToggle: {
    display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)',
    overflow: 'hidden', border: '1px solid var(--border-color)',
  },
  viewBtn: {
    padding: '0.4rem 0.75rem', fontSize: '0.8rem', border: 'none',
    cursor: 'pointer', transition: 'var(--transition)', fontWeight: 500,
  },

  // Grid
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem',
  },
  // List
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  listCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', overflow: 'hidden',
    display: 'flex', cursor: 'pointer', transition: 'var(--transition)',
  },
  listPhoto: {
    width: 200, flexShrink: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: 'rgba(255,255,255,0.7)',
    fontSize: '0.8rem', fontWeight: 600,
  },
  listBody: { flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' },

  // Card
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', overflow: 'hidden',
    cursor: 'pointer', transition: 'var(--transition)', position: 'relative',
  },
  cardPhoto: {
    height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600,
    position: 'relative',
  },
  cardBody: { padding: '1rem 1.25rem' },
  cardAddress: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 },
  cardLocation: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' },
  cardPriceRow: { display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' },
  cardPrice: { fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-success)' },
  cardArv: { fontSize: '0.8rem', color: 'var(--text-secondary)' },
  cardFooter: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)',
  },
  cardFee: { fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 500 },
  stars: { color: 'var(--accent-warning)', fontSize: '0.75rem' },

  // Hover overlay
  hoverOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(15, 17, 23, 0.92)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '0.75rem', padding: '1rem',
    opacity: 0, transition: 'opacity 0.2s ease', pointerEvents: 'none',
  },
  hoverStat: {
    display: 'flex', justifyContent: 'space-between', width: '100%',
    fontSize: '0.85rem', color: 'var(--text-primary)',
  },
  hoverBtns: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem' },

  // Modal detail
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
  textarea: {
    width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical',
    minHeight: 80, fontFamily: 'inherit', boxSizing: 'border-box',
  },

  // Collapse toggle
  collapseBtn: {
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)', padding: '0.4rem 0.75rem',
    fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer',
    display: 'none',
  },

  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1.25rem',
  },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
};

// ─── Component ────────────────────────────────────────────────────
export default function BrowseDealsPage() {
  const { user } = useAuth();
  const toast = useToast();

  // Filters
  const [filters, setFilters] = useState({
    state: '', city: '', propertyTypes: [], priceMin: '', priceMax: '',
    search: '', minReputation: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  // Data
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [offerModal, setOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  // ── Fetch deals ──
  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (filters.state) params.state = filters.state;
      if (filters.city) params.city = filters.city;
      if (filters.propertyTypes.length === 1) params.propertyType = filters.propertyTypes[0];
      if (filters.priceMin) params.priceMin = filters.priceMin;
      if (filters.priceMax) params.priceMax = filters.priceMax;
      if (filters.search) params.search = filters.search;

      const res = await api.get('/deals', { params });
      let dealsList = res.data.deals || [];

      // Client-side filter for multi property type and reputation
      if (filters.propertyTypes.length > 1) {
        dealsList = dealsList.filter((d) => filters.propertyTypes.includes(d.propertyType));
      }
      if (filters.minReputation > 0) {
        dealsList = dealsList.filter((d) => {
          const rep = d.wholesaler?.reputationScore || d.wholesaler?.reputation || d.wholesalerReputation || 0;
          return rep >= filters.minReputation;
        });
      }

      setDeals(dealsList);
      const pagination = res.data.pagination || {};
      setTotalPages(pagination.totalPages || Math.ceil((pagination.total || dealsList.length) / 20) || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load deals.');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Reset page when filters change
  const updateFilter = (key, val) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const togglePropertyType = (type) => {
    setPage(1);
    setFilters((prev) => {
      const types = prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter((t) => t !== type)
        : [...prev.propertyTypes, type];
      return { ...prev, propertyTypes: types };
    });
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ state: '', city: '', propertyTypes: [], priceMin: '', priceMax: '', search: '', minReputation: 0 });
  };

  // ── Open deal detail ──
  const openDealDetail = async (deal) => {
    setSelectedDeal(deal);
    setDetailLoading(true);
    try {
      const res = await api.get(`/deals/${deal._id || deal.id}`);
      setSelectedDeal(res.data.deal || res.data);
    } catch {
      // keep list-level data
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Save / Unsave ──
  const toggleSave = async (e, deal) => {
    e.stopPropagation();
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
      setDeals((prev) => prev.map((d) =>
        (d._id || d.id) === id ? { ...d, isSaved: !d.isSaved } : d
      ));
      if (selectedDeal && (selectedDeal._id || selectedDeal.id) === id) {
        setSelectedDeal((prev) => ({ ...prev, isSaved: !prev.isSaved }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save deal.');
    } finally {
      setSavingId(null);
    }
  };

  // ── Make offer ──
  const openOfferModal = (e) => {
    if (e) e.stopPropagation();
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

  // ── Stars helper ──
  const starsInline = (score) => {
    const full = Math.floor(score || 0);
    let stars = '';
    for (let i = 0; i < full; i++) stars += '\u2605';
    return <span style={s.stars}>{stars || '-'} ({Number(score || 0).toFixed(1)})</span>;
  };

  // ── Deal Card ──
  const DealCard = ({ deal }) => {
    const id = deal._id || deal.id;
    const gradient = PROPERTY_GRADIENTS[deal.propertyType] || PROPERTY_GRADIENTS.default;
    const isHovered = hoveredCard === id;
    const rep = deal.wholesaler?.reputationScore || deal.wholesaler?.reputation || deal.wholesalerReputation || 0;

    return (
      <div
        style={s.card}
        onClick={() => openDealDetail(deal)}
        onMouseEnter={() => setHoveredCard(id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div style={{ ...s.cardPhoto, background: gradient }}>
          {deal.propertyType || 'PROPERTY'}
          {/* Hover overlay */}
          <div style={{ ...s.hoverOverlay, opacity: isHovered ? 1 : 0, pointerEvents: isHovered ? 'auto' : 'none' }}>
            <div style={{ width: '100%' }}>
              <div style={s.hoverStat}>
                <span style={{ color: 'var(--text-secondary)' }}>Price</span>
                <span style={{ fontWeight: 600 }}>{fmt(deal.askingPrice)}</span>
              </div>
              <div style={s.hoverStat}>
                <span style={{ color: 'var(--text-secondary)' }}>ARV</span>
                <span style={{ fontWeight: 600 }}>{fmt(deal.arv)}</span>
              </div>
              <div style={s.hoverStat}>
                <span style={{ color: 'var(--text-secondary)' }}>Fee</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{fmt(deal.assignmentFee)}</span>
              </div>
            </div>
            <div style={s.hoverBtns}>
              <Button size="sm" onClick={(e) => { e.stopPropagation(); openDealDetail(deal); setOfferModal(true); }}>
                Make Offer
              </Button>
              <Button size="sm" variant="secondary" loading={savingId === id} onClick={(e) => toggleSave(e, deal)}>
                {deal.isSaved ? 'Unsave' : 'Save'}
              </Button>
            </div>
          </div>
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
            {deal.assignmentFee ? (
              <span style={s.cardFee}>Fee: {fmt(deal.assignmentFee)}</span>
            ) : <span />}
            {starsInline(rep)}
          </div>
        </div>
      </div>
    );
  };

  // ── List Card ──
  const DealListCard = ({ deal }) => {
    const gradient = PROPERTY_GRADIENTS[deal.propertyType] || PROPERTY_GRADIENTS.default;
    const rep = deal.wholesaler?.reputationScore || deal.wholesaler?.reputation || deal.wholesalerReputation || 0;

    return (
      <div
        style={s.listCard}
        onClick={() => openDealDetail(deal)}
        onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
        onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
      >
        <div style={{ ...s.listPhoto, background: gradient }}>
          {deal.propertyType || 'PROPERTY'}
        </div>
        <div style={s.listBody}>
          <div style={s.cardAddress}>{deal.address || 'No address'}</div>
          <div style={s.cardLocation}>
            {deal.city || ''}{deal.state ? `, ${deal.state}` : ''}{deal.zip ? ` ${deal.zip}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginTop: '0.5rem' }}>
            <span style={s.cardPrice}>{fmt(deal.askingPrice)}</span>
            {deal.arv && <span style={s.cardArv}>ARV {fmt(deal.arv)}</span>}
            {deal.assignmentFee && <span style={s.cardFee}>Fee: {fmt(deal.assignmentFee)}</span>}
            <span style={{ marginLeft: 'auto' }}>{starsInline(rep)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={s.page}>
      {/* Page Header */}
      <div style={s.pageHeader}>
        <h1 style={s.title}>Browse Deals</h1>
        <div style={s.headerRight}>
          <SearchBar
            value={filters.search}
            onChange={(v) => updateFilter('search', v)}
            placeholder="Search deals..."
            style={{ width: 280 }}
          />
          <div style={s.viewToggle}>
            <button
              style={{
                ...s.viewBtn,
                background: viewMode === 'grid' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
              }}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              style={{
                ...s.viewBtn,
                background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
              }}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
          <button
            style={{
              ...s.collapseBtn,
              display: 'inline-flex',
            }}
            onClick={() => setSidebarOpen((p) => !p)}
          >
            {sidebarOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      <div style={s.layout}>
        {/* Filter Sidebar */}
        {sidebarOpen && (
          <div style={s.sidebar}>
            <div style={s.sidebarTitle}>
              <span>Filters</span>
              <button
                onClick={clearFilters}
                style={{
                  background: 'none', border: 'none', fontSize: '0.75rem',
                  color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 500,
                }}
              >
                Clear All
              </button>
            </div>

            {/* State */}
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>State</label>
              <select
                style={s.select}
                value={filters.state}
                onChange={(e) => updateFilter('state', e.target.value)}
              >
                <option value="">All States</option>
                {US_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>City</label>
              <input
                style={s.input}
                type="text"
                placeholder="Enter city..."
                value={filters.city}
                onChange={(e) => updateFilter('city', e.target.value)}
              />
            </div>

            {/* Property Type */}
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>Property Type</label>
              <div style={s.checkboxList}>
                {PROPERTY_TYPES.map((type) => (
                  <label key={type} style={s.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={filters.propertyTypes.includes(type)}
                      onChange={() => togglePropertyType(type)}
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>Price Range</label>
              <div style={s.priceRow}>
                <input
                  style={s.input}
                  type="number"
                  placeholder="Min"
                  value={filters.priceMin}
                  onChange={(e) => updateFilter('priceMin', e.target.value)}
                />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                <input
                  style={s.input}
                  type="number"
                  placeholder="Max"
                  value={filters.priceMax}
                  onChange={(e) => updateFilter('priceMax', e.target.value)}
                />
              </div>
            </div>

            {/* Wholesaler Reputation */}
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>Min Wholesaler Reputation</label>
              <div style={s.reputationRow}>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.minReputation}
                  onChange={(e) => updateFilter('minReputation', Number(e.target.value))}
                  style={s.slider}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, minWidth: 30 }}>
                  {filters.minReputation > 0 ? `${filters.minReputation}+` : 'Any'}
                </span>
              </div>
              <StarRating value={filters.minReputation} size={16} />
            </div>
          </div>
        )}

        {/* Deal Content */}
        <div style={s.content}>
          {loading && (
            <div style={s.center}>
              <LoadingSpinner size={40} />
            </div>
          )}

          {!loading && deals.length === 0 && (
            <EmptyState
              icon={'\u{1F50D}'}
              title="No deals found"
              message="Try adjusting your filters or search criteria."
              action={<Button variant="outline" onClick={clearFilters}>Clear Filters</Button>}
            />
          )}

          {!loading && deals.length > 0 && (
            <>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Showing {deals.length} deal{deals.length !== 1 ? 's' : ''}
              </div>

              {viewMode === 'grid' ? (
                <div style={s.grid}>
                  {deals.map((deal) => (
                    <DealCard key={deal._id || deal.id} deal={deal} />
                  ))}
                </div>
              ) : (
                <div style={s.list}>
                  {deals.map((deal) => (
                    <DealListCard key={deal._id || deal.id} deal={deal} />
                  ))}
                </div>
              )}

              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

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
              variant="secondary"
              loading={savingId === (selectedDeal?._id || selectedDeal?.id)}
              onClick={(e) => toggleSave(e, selectedDeal)}
            >
              {selectedDeal?.isSaved ? 'Unsave' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => toast.info('Calculator coming soon!')}>
              Run Numbers
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
                  {selectedDeal.city || '-'}{selectedDeal.state ? `, ${selectedDeal.state}` : ''}{selectedDeal.zip ? ` ${selectedDeal.zip}` : ''}
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
              <div>
                <div style={s.detailLabel}>Wholesaler Rating</div>
                <div style={s.detailValue}>
                  <StarRating value={selectedDeal.wholesaler?.reputationScore || selectedDeal.wholesaler?.reputation || 0} size={16} />
                </div>
              </div>
              <div>
                <div style={s.detailLabel}>Status</div>
                <div style={s.detailValue}>
                  <Badge variant={selectedDeal.status === 'active' ? 'success' : 'neutral'}>
                    {selectedDeal.status || 'unknown'}
                  </Badge>
                </div>
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

            {selectedDeal.highlights && selectedDeal.highlights.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {selectedDeal.highlights.map((h, i) => (
                  <Badge key={i} variant="neutral">{h}</Badge>
                ))}
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
