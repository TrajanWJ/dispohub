import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { Button, Badge, LoadingSpinner } from '../../components/common';
import { useToast } from '../../components/common/index.jsx';

// ─── Constants ────────────────────────────────────────────────────
const PROPERTY_TYPES = [
  { value: 'SFH', label: 'Single Family Home' },
  { value: 'Multi-Family', label: 'Multi-Family' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Land', label: 'Land' },
  { value: 'Mixed-Use', label: 'Mixed-Use' },
];

const INVESTMENT_STRATEGIES = [
  { value: 'fix_and_flip', label: 'Fix & Flip' },
  { value: 'buy_and_hold', label: 'Buy & Hold' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'any', label: 'Any Strategy' },
];

const MUST_HAVES = [
  { value: 'garage', label: 'Garage' },
  { value: 'basement', label: 'Basement' },
  { value: 'pool', label: 'Pool' },
  { value: 'corner_lot', label: 'Corner Lot' },
  { value: 'fenced_yard', label: 'Fenced Yard' },
  { value: 'updated_kitchen', label: 'Updated Kitchen' },
  { value: 'central_ac', label: 'Central A/C' },
  { value: 'hardwood_floors', label: 'Hardwood Floors' },
];

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

function fmtDollar(val) {
  if (!val && val !== 0) return '';
  return Number(val).toLocaleString('en-US');
}

function parseDollar(str) {
  if (!str) return '';
  return str.replace(/[^0-9]/g, '');
}

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 960, margin: '0 auto' },
  pageHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem',
  },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' },
  subtitle: { fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' },

  form: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  section: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.5rem 1.75rem',
  },
  sectionTitle: {
    fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  sectionSubtitle: {
    fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem',
  },

  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 1.5rem' },
  fieldGroup: { marginBottom: '0.25rem' },
  label: {
    display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)',
    marginBottom: '0.4rem',
  },
  input: {
    width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)', fontSize: '0.85rem', boxSizing: 'border-box',
    transition: 'var(--transition)',
  },
  select: {
    width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)', fontSize: '0.85rem',
  },

  checkboxGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '0.5rem',
  },
  checkboxItem: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer',
    padding: '0.4rem 0.65rem', borderRadius: 'var(--border-radius)',
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    transition: 'var(--transition)',
  },
  checkboxItemActive: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '0.85rem', color: 'var(--accent-primary)', cursor: 'pointer',
    padding: '0.4rem 0.65rem', borderRadius: 'var(--border-radius)',
    background: 'rgba(108,92,231,0.1)', border: '1px solid var(--accent-primary)',
    transition: 'var(--transition)', fontWeight: 500,
  },

  radioGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  radioItem: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer',
    padding: '0.55rem 0.85rem', borderRadius: 'var(--border-radius)',
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    transition: 'var(--transition)',
  },
  radioItemActive: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    fontSize: '0.85rem', color: 'var(--accent-primary)', cursor: 'pointer',
    padding: '0.55rem 0.85rem', borderRadius: 'var(--border-radius)',
    background: 'rgba(108,92,231,0.1)', border: '1px solid var(--accent-primary)',
    transition: 'var(--transition)', fontWeight: 500,
  },

  // Target markets chips
  chipContainer: {
    display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem',
    minHeight: 32,
  },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    background: 'rgba(108,92,231,0.12)', color: 'var(--accent-primary)',
    padding: '0.2rem 0.6rem', borderRadius: 16, fontSize: '0.78rem', fontWeight: 500,
  },
  chipRemove: {
    background: 'none', border: 'none', color: 'var(--accent-primary)',
    cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1, padding: 0, marginLeft: 2,
    opacity: 0.7,
  },

  // Slider
  sliderRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  slider: { flex: 1, accentColor: 'var(--accent-primary)' },
  sliderValue: {
    fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)',
    minWidth: 48, textAlign: 'right',
  },

  // Toggle
  toggleRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.85rem 0',
  },
  toggleLabel: { fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 },
  toggleDescription: { fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 },
  toggle: {
    width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
    position: 'relative', transition: 'var(--transition)', flexShrink: 0,
  },
  toggleKnob: {
    width: 18, height: 18, borderRadius: '50%', background: '#fff',
    position: 'absolute', top: 3, transition: 'var(--transition)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },

  // Footer
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    gap: '0.75rem', paddingTop: '0.5rem',
  },

  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1.25rem',
  },
};

// ─── Component ────────────────────────────────────────────────────
export default function PreferencesPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [targetMarkets, setTargetMarkets] = useState([]);
  const [strategy, setStrategy] = useState('any');
  const [minimumRoi, setMinimumRoi] = useState(10);
  const [maxRehabBudget, setMaxRehabBudget] = useState('');
  const [mustHaves, setMustHaves] = useState([]);
  const [dealAlerts, setDealAlerts] = useState(true);

  // State selector
  const [stateSearch, setStateSearch] = useState('');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users/me/preferences');
      const prefs = res.data.preferences || res.data || {};

      if (prefs.propertyTypes) setPropertyTypes(prefs.propertyTypes);
      if (prefs.budgetMin != null) setBudgetMin(String(prefs.budgetMin));
      if (prefs.budgetMax != null) setBudgetMax(String(prefs.budgetMax));
      if (prefs.targetMarkets) setTargetMarkets(prefs.targetMarkets);
      if (prefs.strategy) setStrategy(prefs.strategy);
      if (prefs.minimumRoi != null) setMinimumRoi(Number(prefs.minimumRoi));
      if (prefs.maxRehabBudget != null) setMaxRehabBudget(String(prefs.maxRehabBudget));
      if (prefs.mustHaves) setMustHaves(prefs.mustHaves);
      if (prefs.dealAlerts != null) setDealAlerts(prefs.dealAlerts);
    } catch (err) {
      // Preferences may not exist yet, that's okay
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load preferences.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // ── Toggle helpers ──
  const togglePropertyType = (type) => {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleMustHave = (item) => {
    setMustHaves((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const addTargetMarket = (stateVal) => {
    if (!targetMarkets.includes(stateVal)) {
      setTargetMarkets((prev) => [...prev, stateVal]);
    }
    setStateSearch('');
    setStateDropdownOpen(false);
  };

  const removeTargetMarket = (stateVal) => {
    setTargetMarkets((prev) => prev.filter((s) => s !== stateVal));
  };

  const filteredStates = US_STATES.filter((st) =>
    !targetMarkets.includes(st.value) &&
    (st.label.toLowerCase().includes(stateSearch.toLowerCase()) ||
     st.value.toLowerCase().includes(stateSearch.toLowerCase()))
  );

  // ── Save ──
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/profile', {
        preferences: {
          propertyTypes,
          budgetMin: budgetMin ? Number(budgetMin) : null,
          budgetMax: budgetMax ? Number(budgetMax) : null,
          targetMarkets,
          strategy,
          minimumRoi,
          maxRehabBudget: maxRehabBudget ? Number(maxRehabBudget) : null,
          mustHaves,
          dealAlerts,
        },
      });
      toast.success('Investment preferences saved successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

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
          <h1 style={s.title}>Investment Preferences</h1>
          <p style={s.subtitle}>
            Configure your criteria to receive personalized deal matches and alerts.
          </p>
        </div>
        <Button loading={saving} onClick={handleSave}>
          Save Preferences
        </Button>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      <div style={s.form}>
        {/* ── Property Types ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Property Types</div>
          <div style={s.sectionSubtitle}>Select the types of properties you are interested in investing in.</div>
          <div style={s.checkboxGrid}>
            {PROPERTY_TYPES.map((type) => {
              const isActive = propertyTypes.includes(type.value);
              return (
                <label
                  key={type.value}
                  style={isActive ? s.checkboxItemActive : s.checkboxItem}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => togglePropertyType(type.value)}
                    style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                  {type.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* ── Budget & ROI ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Budget & Returns</div>
          <div style={s.sectionSubtitle}>Define your investment budget range and expected returns.</div>
          <div style={s.twoCol}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Minimum Budget</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none',
                }}>$</span>
                <input
                  style={{ ...s.input, paddingLeft: '1.5rem' }}
                  type="text"
                  placeholder="50,000"
                  value={fmtDollar(budgetMin)}
                  onChange={(e) => setBudgetMin(parseDollar(e.target.value))}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
                />
              </div>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Maximum Budget</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none',
                }}>$</span>
                <input
                  style={{ ...s.input, paddingLeft: '1.5rem' }}
                  type="text"
                  placeholder="500,000"
                  value={fmtDollar(budgetMax)}
                  onChange={(e) => setBudgetMax(parseDollar(e.target.value))}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
                />
              </div>
            </div>
          </div>

          <div style={{ ...s.twoCol, marginTop: '1rem' }}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Minimum ROI Target</label>
              <div style={s.sliderRow}>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={minimumRoi}
                  onChange={(e) => setMinimumRoi(Number(e.target.value))}
                  style={s.slider}
                />
                <span style={s.sliderValue}>{minimumRoi}%</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Only show deals with estimated ROI above this threshold.
              </div>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Maximum Rehab Budget</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none',
                }}>$</span>
                <input
                  style={{ ...s.input, paddingLeft: '1.5rem' }}
                  type="text"
                  placeholder="75,000"
                  value={fmtDollar(maxRehabBudget)}
                  onChange={(e) => setMaxRehabBudget(parseDollar(e.target.value))}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
                />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Maximum you are willing to spend on property rehabilitation.
              </div>
            </div>
          </div>
        </div>

        {/* ── Target Markets ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Target Markets</div>
          <div style={s.sectionSubtitle}>Select the states where you want to invest. You can add multiple markets.</div>

          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <input
              style={s.input}
              type="text"
              placeholder="Search states to add..."
              value={stateSearch}
              onChange={(e) => { setStateSearch(e.target.value); setStateDropdownOpen(true); }}
              onFocus={() => setStateDropdownOpen(true)}
              onBlur={() => setTimeout(() => setStateDropdownOpen(false), 200)}
            />
            {stateDropdownOpen && stateSearch && filteredStates.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)', maxHeight: 200, overflowY: 'auto',
                boxShadow: 'var(--shadow-md)',
              }}>
                {filteredStates.slice(0, 10).map((st) => (
                  <div
                    key={st.value}
                    style={{
                      padding: '0.5rem 0.75rem', fontSize: '0.85rem',
                      color: 'var(--text-primary)', cursor: 'pointer',
                      transition: 'var(--transition)',
                    }}
                    onMouseDown={() => addTargetMarket(st.value)}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {st.label} ({st.value})
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={s.chipContainer}>
            {targetMarkets.length === 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.2rem 0' }}>
                No markets selected. Search above to add target states.
              </span>
            )}
            {targetMarkets.map((st) => {
              const stateObj = US_STATES.find((s) => s.value === st);
              return (
                <span key={st} style={s.chip}>
                  {stateObj ? stateObj.label : st}
                  <button
                    style={s.chipRemove}
                    onClick={() => removeTargetMarket(st)}
                    title={`Remove ${st}`}
                  >
                    &#x2715;
                  </button>
                </span>
              );
            })}
          </div>
        </div>

        {/* ── Investment Strategy ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Investment Strategy</div>
          <div style={s.sectionSubtitle}>Choose your primary investment approach.</div>
          <div style={s.radioGroup}>
            {INVESTMENT_STRATEGIES.map((item) => {
              const isActive = strategy === item.value;
              return (
                <label
                  key={item.value}
                  style={isActive ? s.radioItemActive : s.radioItem}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <input
                    type="radio"
                    name="strategy"
                    checked={isActive}
                    onChange={() => setStrategy(item.value)}
                    style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                  {item.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* ── Must-Haves ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Must-Have Features</div>
          <div style={s.sectionSubtitle}>Select property features that are essential for your investments.</div>
          <div style={s.checkboxGrid}>
            {MUST_HAVES.map((item) => {
              const isActive = mustHaves.includes(item.value);
              return (
                <label
                  key={item.value}
                  style={isActive ? s.checkboxItemActive : s.checkboxItem}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleMustHave(item.value)}
                    style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                  {item.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* ── Notifications ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Notifications</div>
          <div style={s.sectionSubtitle}>Control how and when you receive deal alerts.</div>
          <div style={s.toggleRow}>
            <div>
              <div style={s.toggleLabel}>Deal Alert Emails</div>
              <div style={s.toggleDescription}>
                Receive email notifications when new deals match your investment preferences.
              </div>
            </div>
            <div
              style={{
                ...s.toggle,
                background: dealAlerts ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                border: `1px solid ${dealAlerts ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              }}
              onClick={() => setDealAlerts((prev) => !prev)}
            >
              <div style={{
                ...s.toggleKnob,
                left: dealAlerts ? 22 : 3,
              }} />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div style={s.footer}>
          <Button variant="ghost" onClick={fetchPreferences} disabled={saving}>
            Reset
          </Button>
          <Button loading={saving} onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
