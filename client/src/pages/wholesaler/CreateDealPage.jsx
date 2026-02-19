import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

// ─── Constants ────────────────────────────────────────────────────
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

const PROPERTY_TYPES = [
  { key: 'SFH', label: 'Single Family', icon: '\u{1F3E0}' },
  { key: 'Multi-Family', label: 'Multi-Family', icon: '\u{1F3E2}' },
  { key: 'Commercial', label: 'Commercial', icon: '\u{1F3E2}' },
  { key: 'Land', label: 'Land', icon: '\u{1F333}' },
];

const STEP_LABELS = ['Property Info', 'Financials', 'Photos & Description', 'Review & Submit'];

function fmt(n) {
  if (n == null || n === '') return '$0';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 820, margin: '0 auto' },
  header: { marginBottom: '1.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '0.875rem' },

  /* Step indicator */
  stepper: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '2rem', gap: 0,
  },
  stepDot: {
    width: 36, height: 36, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, transition: 'var(--transition)',
  },
  stepLine: { width: 60, height: 2, transition: 'var(--transition)' },
  stepLabel: {
    fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center',
    marginTop: 4, width: 80, marginLeft: -22,
  },

  /* Form */
  formSection: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.75rem', marginBottom: '1.5rem',
  },
  sectionTitle: { fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' },
  fieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  fieldFull: { gridColumn: '1 / -1' },
  fieldGroup: { marginBottom: '0.15rem' },
  label: {
    display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)',
    marginBottom: '0.35rem',
  },
  input: {
    width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
    transition: 'var(--transition)',
  },
  select: {
    width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
    transition: 'var(--transition)', appearance: 'auto',
  },
  textarea: {
    width: '100%', padding: '0.75rem', background: 'var(--bg-input)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
    transition: 'var(--transition)', minHeight: 120, resize: 'vertical',
    fontFamily: 'inherit',
  },

  /* Property type cards */
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' },
  typeCard: {
    background: 'var(--bg-input)', border: '2px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.1rem 0.75rem',
    textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)',
  },
  typeCardActive: { borderColor: 'var(--accent-primary)', background: 'rgba(108,92,231,0.08)' },
  typeIcon: { fontSize: '1.5rem', marginBottom: '0.4rem' },
  typeLabel: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' },

  /* Financial helper */
  finHelper: {
    background: 'rgba(108,92,231,0.08)', border: '1px solid rgba(108,92,231,0.2)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem', marginTop: '1.25rem',
  },
  finHelperLabel: { fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 2 },
  finHelperValue: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)' },

  /* Photo upload placeholder */
  dropZone: {
    border: '2px dashed var(--border-color)', borderRadius: 'var(--border-radius-lg)',
    padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)',
    cursor: 'pointer', transition: 'var(--transition)', marginBottom: '1.25rem',
  },
  dropIcon: { fontSize: '2rem', marginBottom: '0.5rem' },

  /* Highlights */
  highlightRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' },
  highlightTag: {
    background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
    padding: '0.25rem 0.7rem', borderRadius: 16, fontSize: '0.8rem',
    display: 'flex', alignItems: 'center', gap: 4,
  },
  removeTag: {
    background: 'none', border: 'none', color: 'var(--accent-danger)',
    cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1,
  },

  /* Review */
  reviewGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem' },
  reviewLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewValue: { fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '0.75rem' },

  /* Navigation buttons */
  navRow: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' },
  prevBtn: {
    background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
    transition: 'var(--transition)',
  },
  nextBtn: {
    background: 'var(--accent-primary)', color: '#fff', border: 'none',
    borderRadius: 'var(--border-radius)', padding: '0.6rem 1.5rem',
    fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'var(--transition)',
  },
  submitBtn: {
    background: 'var(--accent-success)', color: '#fff', border: 'none',
    borderRadius: 'var(--border-radius)', padding: '0.7rem 2rem',
    fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'var(--transition)',
  },

  /* Misc */
  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '0.85rem 1.1rem',
    color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: '1.25rem',
  },
  fieldError: { fontSize: '0.75rem', color: 'var(--accent-danger)', marginTop: 3 },
  calcIcon: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none',
  },
  inputWrap: { position: 'relative' },
};

// ─── Component ────────────────────────────────────────────────────
export default function CreateDealPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    // Step 1
    address: '', city: '', state: '', zip: '', county: '',
    propertyType: '', bedrooms: '', bathrooms: '', sqft: '', lotSize: '', yearBuilt: '',
    // Step 2
    askingPrice: '', arv: '', rehabEstimate: '', currentValue: '', assignmentFee: '',
    // Step 3
    description: '', highlights: [],
  });

  const [highlightInput, setHighlightInput] = useState('');

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  // ── Validation ──
  const validateStep = (idx) => {
    const errs = {};
    if (idx === 0) {
      if (!form.address.trim()) errs.address = 'Required';
      if (!form.city.trim()) errs.city = 'Required';
      if (!form.state) errs.state = 'Required';
      if (!form.zip.trim()) errs.zip = 'Required';
      if (!form.propertyType) errs.propertyType = 'Select a property type';
    }
    if (idx === 1) {
      if (!form.askingPrice || Number(form.askingPrice) <= 0) errs.askingPrice = 'Required';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) setStep((p) => Math.min(p + 1, 3));
  };
  const goPrev = () => setStep((p) => Math.max(p - 1, 0));

  // ── Submit ──
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        county: form.county,
        propertyType: form.propertyType,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        sqft: form.sqft ? Number(form.sqft) : undefined,
        lotSize: form.lotSize ? Number(form.lotSize) : undefined,
        yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : undefined,
        askingPrice: Number(form.askingPrice),
        arv: form.arv ? Number(form.arv) : undefined,
        rehabEstimate: form.rehabEstimate ? Number(form.rehabEstimate) : undefined,
        currentValue: form.currentValue ? Number(form.currentValue) : undefined,
        assignmentFee: form.assignmentFee ? Number(form.assignmentFee) : undefined,
        description: form.description,
        highlights: form.highlights,
      };
      await api.post('/deals', body);
      navigate('/wholesaler/deals');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create deal.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Highlights ──
  const addHighlight = () => {
    const tag = highlightInput.trim();
    if (tag && !form.highlights.includes(tag)) {
      set('highlights', [...form.highlights, tag]);
    }
    setHighlightInput('');
  };
  const removeHighlight = (tag) => {
    set('highlights', form.highlights.filter((h) => h !== tag));
  };

  // ── Computed financial values ──
  const askingPrice = Number(form.askingPrice) || 0;
  const arv = Number(form.arv) || 0;
  const rehabEstimate = Number(form.rehabEstimate) || 0;
  const mao = arv > 0 ? arv * 0.7 - rehabEstimate : 0;
  const potentialRoi = arv > 0 && askingPrice > 0 ? (((arv - askingPrice - rehabEstimate) / askingPrice) * 100) : 0;

  // ── Render helpers ──
  const renderField = (label, field, opts = {}) => {
    const { type = 'text', placeholder = '', half = true, prefix = '' } = opts;
    return (
      <div style={{ ...s.fieldGroup, ...(half ? {} : s.fieldFull) }}>
        <label style={s.label}>{label}</label>
        <div style={s.inputWrap}>
          <input
            style={s.input}
            type={type}
            placeholder={placeholder}
            value={form[field]}
            onChange={(e) => set(field, e.target.value)}
          />
          {prefix === '$' && <span style={s.calcIcon}>$</span>}
        </div>
        {fieldErrors[field] && <div style={s.fieldError}>{fieldErrors[field]}</div>}
      </div>
    );
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>Create New Deal</h1>
        <p style={s.subtitle}>Fill in the details to list your deal on DispoHub.</p>
      </div>

      {/* Step Indicator */}
      <div style={s.stepper}>
        {STEP_LABELS.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  ...s.stepDot,
                  background: i <= step ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: i <= step ? '#fff' : 'var(--text-muted)',
                  border: i === step ? '2px solid var(--accent-primary-hover)' : '2px solid transparent',
                }}
              >
                {i < step ? '\u2713' : i + 1}
              </div>
              <div style={{ ...s.stepLabel, color: i <= step ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                {label}
              </div>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                style={{
                  ...s.stepLine,
                  background: i < step ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  marginBottom: 20,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {/* ═══ Step 1: Property Info ═══ */}
      {step === 0 && (
        <div style={s.formSection}>
          <h2 style={s.sectionTitle}>Property Information</h2>

          <div style={s.fieldGrid}>
            <div style={{ ...s.fieldGroup, ...s.fieldFull }}>
              <label style={s.label}>Address *</label>
              <input
                style={s.input}
                placeholder="123 Main Street"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
              />
              {fieldErrors.address && <div style={s.fieldError}>{fieldErrors.address}</div>}
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>City *</label>
              <input
                style={s.input}
                placeholder="Miami"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
              {fieldErrors.city && <div style={s.fieldError}>{fieldErrors.city}</div>}
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>State *</label>
              <select
                style={s.select}
                value={form.state}
                onChange={(e) => set('state', e.target.value)}
              >
                <option value="">Select state</option>
                {US_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              {fieldErrors.state && <div style={s.fieldError}>{fieldErrors.state}</div>}
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Zip Code *</label>
              <input
                style={s.input}
                placeholder="33101"
                value={form.zip}
                onChange={(e) => set('zip', e.target.value)}
              />
              {fieldErrors.zip && <div style={s.fieldError}>{fieldErrors.zip}</div>}
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>County</label>
              <input
                style={s.input}
                placeholder="Miami-Dade"
                value={form.county}
                onChange={(e) => set('county', e.target.value)}
              />
            </div>
          </div>

          {/* Property Type */}
          <div style={{ marginTop: '1.5rem' }}>
            <label style={s.label}>Property Type *</label>
            <div style={s.typeGrid}>
              {PROPERTY_TYPES.map((pt) => (
                <div
                  key={pt.key}
                  style={{
                    ...s.typeCard,
                    ...(form.propertyType === pt.key ? s.typeCardActive : {}),
                  }}
                  onClick={() => set('propertyType', pt.key)}
                >
                  <div style={s.typeIcon}>{pt.icon}</div>
                  <div style={s.typeLabel}>{pt.label}</div>
                </div>
              ))}
            </div>
            {fieldErrors.propertyType && <div style={s.fieldError}>{fieldErrors.propertyType}</div>}
          </div>

          {/* Property specs */}
          <div style={{ ...s.fieldGrid, marginTop: '1.5rem' }}>
            {renderField('Bedrooms', 'bedrooms', { type: 'number', placeholder: '3' })}
            {renderField('Bathrooms', 'bathrooms', { type: 'number', placeholder: '2' })}
            {renderField('Sqft', 'sqft', { type: 'number', placeholder: '1,800' })}
            {renderField('Lot Size (sqft)', 'lotSize', { type: 'number', placeholder: '5,000' })}
            {renderField('Year Built', 'yearBuilt', { type: 'number', placeholder: '1985' })}
          </div>
        </div>
      )}

      {/* ═══ Step 2: Financials ═══ */}
      {step === 1 && (
        <div style={s.formSection}>
          <h2 style={s.sectionTitle}>Financial Details</h2>

          <div style={s.fieldGrid}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Asking Price *</label>
              <div style={s.inputWrap}>
                <input
                  style={s.input}
                  type="number"
                  placeholder="150000"
                  value={form.askingPrice}
                  onChange={(e) => set('askingPrice', e.target.value)}
                />
                <span style={s.calcIcon}>$</span>
              </div>
              {fieldErrors.askingPrice && <div style={s.fieldError}>{fieldErrors.askingPrice}</div>}
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>ARV Estimate</label>
              <div style={s.inputWrap}>
                <input
                  style={s.input}
                  type="number"
                  placeholder="250000"
                  value={form.arv}
                  onChange={(e) => set('arv', e.target.value)}
                />
                <span style={s.calcIcon}>$</span>
              </div>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Rehab Estimate</label>
              <div style={s.inputWrap}>
                <input
                  style={s.input}
                  type="number"
                  placeholder="45000"
                  value={form.rehabEstimate}
                  onChange={(e) => set('rehabEstimate', e.target.value)}
                />
                <span style={s.calcIcon}>$</span>
              </div>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Current Value</label>
              <div style={s.inputWrap}>
                <input
                  style={s.input}
                  type="number"
                  placeholder="120000"
                  value={form.currentValue}
                  onChange={(e) => set('currentValue', e.target.value)}
                />
                <span style={s.calcIcon}>$</span>
              </div>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Assignment Fee</label>
              <div style={s.inputWrap}>
                <input
                  style={s.input}
                  type="number"
                  placeholder="10000"
                  value={form.assignmentFee}
                  onChange={(e) => set('assignmentFee', e.target.value)}
                />
                <span style={s.calcIcon}>$</span>
              </div>
            </div>
          </div>

          {/* Computed values */}
          {(arv > 0 || askingPrice > 0) && (
            <div style={s.finHelper}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={s.finHelperLabel}>Potential ROI for Investor</div>
                  <div style={s.finHelperValue}>
                    {potentialRoi > 0 ? `${potentialRoi.toFixed(1)}%` : '--'}
                  </div>
                </div>
                <div>
                  <div style={s.finHelperLabel}>MAO (70% Rule)</div>
                  <div style={s.finHelperValue}>
                    {mao > 0 ? fmt(mao) : '--'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Step 3: Photos & Description ═══ */}
      {step === 2 && (
        <div style={s.formSection}>
          <h2 style={s.sectionTitle}>Photos & Description</h2>

          {/* Photo drop zone */}
          <div
            style={s.dropZone}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <div style={s.dropIcon}>{'\u{1F4F7}'}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Drag and drop photos here
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              or click to browse -- JPG, PNG up to 10MB each
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={s.label}>Description</label>
            <textarea
              style={s.textarea}
              placeholder="Describe the property, neighborhood, and any key selling points..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* Highlights */}
          <div>
            <label style={s.label}>Highlights</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                style={{ ...s.input, flex: 1 }}
                placeholder="e.g. Corner lot, New roof, Cash only"
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addHighlight();
                  }
                }}
              />
              <button
                style={{
                  ...s.nextBtn,
                  padding: '0.6rem 1rem',
                  fontSize: '0.85rem',
                }}
                type="button"
                onClick={addHighlight}
              >
                Add
              </button>
            </div>
            {form.highlights.length > 0 && (
              <div style={s.highlightRow}>
                {form.highlights.map((h) => (
                  <span key={h} style={s.highlightTag}>
                    {h}
                    <button style={s.removeTag} onClick={() => removeHighlight(h)}>&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Step 4: Review & Submit ═══ */}
      {step === 3 && (
        <div style={s.formSection}>
          <h2 style={s.sectionTitle}>Review Your Deal</h2>

          {/* Property info */}
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Property Information
          </h3>
          <div style={s.reviewGrid}>
            {[
              ['Address', form.address],
              ['City', form.city],
              ['State', form.state],
              ['Zip', form.zip],
              ['County', form.county || '-'],
              ['Property Type', form.propertyType],
              ['Bedrooms', form.bedrooms || '-'],
              ['Bathrooms', form.bathrooms || '-'],
              ['Sqft', form.sqft ? Number(form.sqft).toLocaleString() : '-'],
              ['Lot Size', form.lotSize ? Number(form.lotSize).toLocaleString() : '-'],
              ['Year Built', form.yearBuilt || '-'],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={s.reviewLabel}>{label}</div>
                <div style={s.reviewValue}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0 1.25rem' }} />

          {/* Financials */}
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Financials
          </h3>
          <div style={s.reviewGrid}>
            {[
              ['Asking Price', fmt(form.askingPrice)],
              ['ARV Estimate', form.arv ? fmt(form.arv) : '-'],
              ['Rehab Estimate', form.rehabEstimate ? fmt(form.rehabEstimate) : '-'],
              ['Current Value', form.currentValue ? fmt(form.currentValue) : '-'],
              ['Assignment Fee', form.assignmentFee ? fmt(form.assignmentFee) : '-'],
              ['Potential ROI', potentialRoi > 0 ? `${potentialRoi.toFixed(1)}%` : '-'],
              ['MAO (70% Rule)', mao > 0 ? fmt(mao) : '-'],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={s.reviewLabel}>{label}</div>
                <div style={s.reviewValue}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0 1.25rem' }} />

          {/* Description & Highlights */}
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Description & Highlights
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <div style={s.reviewLabel}>Description</div>
            <div style={{ ...s.reviewValue, whiteSpace: 'pre-wrap' }}>
              {form.description || '-'}
            </div>
          </div>
          {form.highlights.length > 0 && (
            <div>
              <div style={s.reviewLabel}>Highlights</div>
              <div style={{ ...s.highlightRow, marginTop: '0.35rem' }}>
                {form.highlights.map((h) => (
                  <span key={h} style={s.highlightTag}>{h}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={s.navRow}>
        {step > 0 ? (
          <button style={s.prevBtn} onClick={goPrev}>
            &larr; Previous
          </button>
        ) : (
          <button
            style={s.prevBtn}
            onClick={() => navigate('/wholesaler/deals')}
          >
            Cancel
          </button>
        )}

        {step < 3 ? (
          <button
            style={s.nextBtn}
            onClick={goNext}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
          >
            Next &rarr;
          </button>
        ) : (
          <button
            style={s.submitBtn}
            onClick={handleSubmit}
            disabled={submitting}
            onMouseOver={(e) => !submitting && (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        )}
      </div>
    </div>
  );
}
