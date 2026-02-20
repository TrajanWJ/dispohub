import { useState, useCallback } from 'react';
import {
  calculateARV,
  calculateROI,
  calculateCashOnCash,
  calculateCapRate,
  calculateRehabCost,
  calculateMAO,
  calculateWholesaleFee,
  calculateRentalAnalysis,
} from '../../utils/calculators';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

/* ============================================================
   CALCULATOR DEFINITIONS — matched to actual util signatures
   ============================================================ */

const CALCULATORS = [
  {
    key: 'arv',
    title: 'After Repair Value',
    desc: 'Estimate property value after renovations using comparable sales data',
    icon: '\uD83C\uDFE0',
    gradient: 'linear-gradient(135deg, #6c5ce7, #a78bfa)',
    fields: [
      { name: 'subjectSqft', label: 'Subject Property Sq Ft', placeholder: '1800', type: 'number' },
    ],
    hasComps: true,
    calculate: (vals) => {
      const comps = (vals._comps || []).filter(c => c.salePrice && c.sqft).map(c => ({ salePrice: Number(c.salePrice), sqft: Number(c.sqft) }));
      return calculateARV(comps, Number(vals.subjectSqft) || 0);
    },
    formatResult: (r) => [
      { label: 'Estimated ARV', value: formatCurrency(r.arv), primary: true },
      { label: 'Avg Price / Sq Ft', value: `${formatCurrency(r.avgPricePerSqft)}/sqft` },
    ],
  },
  {
    key: 'roi',
    title: 'Return on Investment',
    desc: 'Calculate total return on your real estate investment',
    icon: '\uD83D\uDCC8',
    gradient: 'linear-gradient(135deg, #00d68f, #00b894)',
    fields: [
      { name: 'purchasePrice', label: 'Purchase Price', placeholder: '150000', type: 'number' },
      { name: 'rehabCost', label: 'Rehab Cost', placeholder: '35000', type: 'number' },
      { name: 'holdingCosts', label: 'Holding Costs', placeholder: '5000', type: 'number' },
      { name: 'salePrice', label: 'Sale Price', placeholder: '250000', type: 'number' },
    ],
    calculate: (vals) => calculateROI(Number(vals.purchasePrice) || 0, Number(vals.rehabCost) || 0, Number(vals.holdingCosts) || 0, Number(vals.salePrice) || 0),
    formatResult: (r) => [
      { label: 'ROI', value: formatPercentage(r.roi), primary: true },
      { label: 'Net Profit', value: formatCurrency(r.profit) },
      { label: 'Total Investment', value: formatCurrency(r.totalInvestment) },
    ],
  },
  {
    key: 'cashoncash',
    title: 'Cash-on-Cash Return',
    desc: 'Measure annual cash return relative to cash invested',
    icon: '\uD83D\uDCB5',
    gradient: 'linear-gradient(135deg, #3498db, #74b9ff)',
    fields: [
      { name: 'annualCashFlow', label: 'Annual Pre-Tax Cash Flow', placeholder: '12000', type: 'number' },
      { name: 'totalCashInvested', label: 'Total Cash Invested', placeholder: '50000', type: 'number' },
    ],
    calculate: (vals) => calculateCashOnCash(Number(vals.annualCashFlow) || 0, Number(vals.totalCashInvested) || 0),
    formatResult: (r) => [
      { label: 'Cash-on-Cash Return', value: formatPercentage(r.cashOnCash), primary: true },
    ],
  },
  {
    key: 'caprate',
    title: 'Capitalization Rate',
    desc: 'Evaluate property profitability independent of financing',
    icon: '\uD83C\uDFE2',
    gradient: 'linear-gradient(135deg, #fdcb6e, #f39c12)',
    fields: [
      { name: 'noi', label: 'Net Operating Income (Annual)', placeholder: '24000', type: 'number' },
      { name: 'propertyValue', label: 'Property Value', placeholder: '300000', type: 'number' },
    ],
    calculate: (vals) => calculateCapRate(Number(vals.noi) || 0, Number(vals.propertyValue) || 0),
    formatResult: (r) => [
      { label: 'Cap Rate', value: formatPercentage(r.capRate), primary: true },
    ],
  },
  {
    key: 'rehab',
    title: 'Rehab Cost Estimator',
    desc: 'Estimate renovation costs by line item',
    icon: '\uD83D\uDD28',
    gradient: 'linear-gradient(135deg, #e17055, #fab1a0)',
    fields: [],
    hasRehabItems: true,
    calculate: (vals) => {
      const items = (vals._rehabItems || []).filter(i => i.name && i.cost).map(i => ({ name: i.name, cost: Number(i.cost), quantity: Number(i.quantity) || 1 }));
      return calculateRehabCost(items);
    },
    formatResult: (r) => [
      { label: 'Total Rehab Cost', value: formatCurrency(r.totalCost), primary: true },
      ...(r.breakdown || []).map(b => ({ label: b.name, value: formatCurrency(b.total) })),
    ],
  },
  {
    key: 'mao',
    title: 'Maximum Allowable Offer',
    desc: 'Calculate your max offer using the 70% rule',
    icon: '\uD83C\uDFAF',
    gradient: 'linear-gradient(135deg, #6c5ce7, #fd79a8)',
    fields: [
      { name: 'arv', label: 'After Repair Value', placeholder: '250000', type: 'number' },
      { name: 'rehabCost', label: 'Estimated Rehab Costs', placeholder: '35000', type: 'number' },
      { name: 'assignmentFee', label: 'Your Assignment Fee', placeholder: '10000', type: 'number' },
      { name: 'discountPercent', label: '% Rule (e.g. 70)', placeholder: '70', type: 'number' },
    ],
    calculate: (vals) => calculateMAO(Number(vals.arv) || 0, Number(vals.rehabCost) || 0, Number(vals.assignmentFee) || 0, Number(vals.discountPercent) || 70),
    formatResult: (r) => [
      { label: 'Maximum Allowable Offer', value: formatCurrency(r.mao), primary: true },
    ],
  },
  {
    key: 'wholesalefee',
    title: 'Wholesale Fee Calculator',
    desc: 'Calculate your assignment fee amount and percentage',
    icon: '\uD83D\uDCB0',
    gradient: 'linear-gradient(135deg, #00cec9, #81ecec)',
    fields: [
      { name: 'salePrice', label: 'Sale Price (to buyer)', placeholder: '115000', type: 'number' },
      { name: 'purchasePrice', label: 'Contract Price (with seller)', placeholder: '100000', type: 'number' },
    ],
    calculate: (vals) => calculateWholesaleFee(Number(vals.salePrice) || 0, Number(vals.purchasePrice) || 0),
    formatResult: (r) => [
      { label: 'Assignment Fee', value: formatCurrency(r.fee), primary: true },
      { label: 'Fee as % of Sale', value: formatPercentage(r.percentage) },
    ],
  },
  {
    key: 'rental',
    title: 'Rental Property Analysis',
    desc: 'Analyze rental cash flow, cap rate, and returns',
    icon: '\uD83C\uDFE1',
    gradient: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
    fields: [
      { name: 'monthlyRent', label: 'Monthly Rent', placeholder: '1800', type: 'number' },
      { name: 'vacancy', label: 'Vacancy Rate (%)', placeholder: '8', type: 'number' },
      { name: 'propertyTax', label: 'Annual Property Tax', placeholder: '3000', type: 'number' },
      { name: 'insurance', label: 'Annual Insurance', placeholder: '1200', type: 'number' },
      { name: 'maintenance', label: 'Annual Maintenance', placeholder: '2000', type: 'number' },
      { name: 'mortgagePayment', label: 'Monthly Mortgage (P&I)', placeholder: '950', type: 'number' },
      { name: 'purchasePrice', label: 'Purchase Price', placeholder: '200000', type: 'number' },
    ],
    calculate: (vals) => calculateRentalAnalysis(
      Number(vals.monthlyRent) || 0,
      Number(vals.vacancy) || 0,
      Number(vals.propertyTax) || 0,
      Number(vals.insurance) || 0,
      Number(vals.maintenance) || 0,
      Number(vals.mortgagePayment) || 0,
      Number(vals.purchasePrice) || 0,
    ),
    formatResult: (r) => [
      { label: 'Monthly Cash Flow', value: formatCurrency(r.monthlyCashFlow), primary: true },
      { label: 'Annual Cash Flow', value: formatCurrency(r.annualCashFlow) },
      { label: 'Cash-on-Cash Return', value: formatPercentage(r.cashOnCash) },
      { label: 'Cap Rate', value: formatPercentage(r.capRate) },
    ],
  },
];

const DEFAULT_REHAB_ITEMS = [
  { name: 'Roof', cost: '', quantity: '1' },
  { name: 'Kitchen', cost: '', quantity: '1' },
  { name: 'Bathroom', cost: '', quantity: '2' },
  { name: 'Flooring', cost: '', quantity: '1' },
  { name: 'Paint', cost: '', quantity: '1' },
  { name: 'HVAC', cost: '', quantity: '1' },
];

/* ============================================================
   STYLES
   ============================================================ */

const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1280, margin: '0 auto' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '0.9rem' },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  card: (selected) => ({
    background: 'var(--bg-card)',
    border: selected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'var(--transition)',
    position: 'relative',
    overflow: 'hidden',
  }),
  cardBar: (gradient) => ({
    position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: gradient,
  }),
  cardIcon: { fontSize: '1.75rem', marginBottom: '0.5rem' },
  cardTitle: { fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  cardDesc: { fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 },

  section: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    overflow: 'hidden',
  },
  sectionHeader: (gradient) => ({
    padding: '1.25rem 1.5rem',
    background: gradient,
    display: 'flex', alignItems: 'center', gap: '0.75rem',
  }),
  headerIcon: { fontSize: '1.5rem' },
  headerTitle: { fontSize: '1.125rem', fontWeight: 700, color: '#fff' },
  headerDesc: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.125rem' },

  body: { padding: '1.5rem' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.375rem' },
  label: { fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' },
  input: {
    padding: '0.625rem 0.875rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'var(--transition)',
    width: '100%',
    boxSizing: 'border-box',
  },
  btnRow: { display: 'flex', gap: '0.75rem', marginTop: '1.25rem' },
  btn: {
    padding: '0.625rem 1.25rem', borderRadius: 'var(--border-radius)',
    border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'var(--transition)',
  },
  btnPrimary: { background: 'var(--accent-primary)', color: '#fff' },
  btnSecondary: { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },

  results: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem', marginTop: '1.5rem', padding: '1.25rem',
    background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)',
  },
  resultItem: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  resultLabel: { fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 },
  resultValue: (primary) => ({
    fontSize: primary ? '1.5rem' : '1.125rem',
    fontWeight: primary ? 800 : 600,
    color: primary ? 'var(--accent-primary)' : 'var(--text-primary)',
  }),

  compRow: { display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' },
  compInput: {
    flex: 1, padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
  },
  removeBtn: {
    background: 'none', border: 'none', color: 'var(--accent-danger)',
    cursor: 'pointer', fontSize: '1rem', padding: '0.25rem',
  },
  addBtn: {
    background: 'none', border: '1px dashed var(--border-color)', borderRadius: 'var(--border-radius)',
    color: 'var(--text-secondary)', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.8rem',
    marginBottom: '1rem', transition: 'var(--transition)',
  },

  rehabRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 80px 32px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' },
};

/* ============================================================
   COMPONENT
   ============================================================ */

export default function CalculatorsPage() {
  const [selected, setSelected] = useState(null);
  const [values, setValues] = useState({});
  const [comps, setComps] = useState([{ salePrice: '', sqft: '' }]);
  const [rehabItems, setRehabItems] = useState(DEFAULT_REHAB_ITEMS.map(i => ({ ...i })));
  const [result, setResult] = useState(null);

  const calc = CALCULATORS.find(c => c.key === selected);

  const handleSelect = useCallback((key) => {
    setSelected(key);
    setValues({});
    setComps([{ salePrice: '', sqft: '' }]);
    setRehabItems(DEFAULT_REHAB_ITEMS.map(i => ({ ...i })));
    setResult(null);
  }, []);

  const handleChange = useCallback((name, val) => {
    setValues(prev => ({ ...prev, [name]: val }));
    setResult(null);
  }, []);

  const handleCalculate = useCallback(() => {
    if (!calc) return;
    try {
      const allVals = { ...values, _comps: comps, _rehabItems: rehabItems };
      const res = calc.calculate(allVals);
      setResult(calc.formatResult(res));
    } catch {
      setResult([{ label: 'Error', value: 'Check your inputs', primary: true }]);
    }
  }, [calc, values, comps, rehabItems]);

  const handleReset = useCallback(() => {
    setValues({});
    setComps([{ salePrice: '', sqft: '' }]);
    setRehabItems(DEFAULT_REHAB_ITEMS.map(i => ({ ...i })));
    setResult(null);
  }, []);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Investment Calculators</h1>
        <p style={s.subtitle}>
          8 professional real estate calculators to analyze deals, estimate costs, and maximize returns
        </p>
      </div>

      <div style={s.grid}>
        {CALCULATORS.map((c) => (
          <div
            key={c.key}
            style={s.card(selected === c.key)}
            onClick={() => handleSelect(c.key)}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={s.cardBar(c.gradient)} />
            <div style={s.cardIcon}>{c.icon}</div>
            <div style={s.cardTitle}>{c.title}</div>
            <div style={s.cardDesc}>{c.desc}</div>
          </div>
        ))}
      </div>

      {calc && (
        <div style={s.section}>
          <div style={s.sectionHeader(calc.gradient)}>
            <span style={s.headerIcon}>{calc.icon}</span>
            <div>
              <div style={s.headerTitle}>{calc.title}</div>
              <div style={s.headerDesc}>{calc.desc}</div>
            </div>
          </div>

          <div style={s.body}>
            {/* Comparable sales input for ARV */}
            {calc.hasComps && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={s.label}>Comparable Sales</div>
                {comps.map((comp, i) => (
                  <div key={i} style={s.compRow}>
                    <input
                      type="number"
                      placeholder="Sale Price"
                      value={comp.salePrice}
                      onChange={(e) => {
                        setComps(prev => prev.map((c, j) => j === i ? { ...c, salePrice: e.target.value } : c));
                        setResult(null);
                      }}
                      style={s.compInput}
                    />
                    <input
                      type="number"
                      placeholder="Sq Ft"
                      value={comp.sqft}
                      onChange={(e) => {
                        setComps(prev => prev.map((c, j) => j === i ? { ...c, sqft: e.target.value } : c));
                        setResult(null);
                      }}
                      style={s.compInput}
                    />
                    {comps.length > 1 && (
                      <button style={s.removeBtn} onClick={() => setComps(prev => prev.filter((_, j) => j !== i))}>
                        {'\u2715'}
                      </button>
                    )}
                  </div>
                ))}
                <button
                  style={s.addBtn}
                  onClick={() => setComps(prev => [...prev, { salePrice: '', sqft: '' }])}
                >
                  + Add Comparable Sale
                </button>
              </div>
            )}

            {/* Rehab items for Rehab Cost */}
            {calc.hasRehabItems && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={s.label}>Rehab Line Items</div>
                <div style={{ ...s.rehabRow, marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>ITEM</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>COST</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>QTY</span>
                  <span />
                </div>
                {rehabItems.map((item, i) => (
                  <div key={i} style={s.rehabRow}>
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => {
                        setRehabItems(prev => prev.map((it, j) => j === i ? { ...it, name: e.target.value } : it));
                        setResult(null);
                      }}
                      style={s.compInput}
                    />
                    <input
                      type="number"
                      placeholder="Cost"
                      value={item.cost}
                      onChange={(e) => {
                        setRehabItems(prev => prev.map((it, j) => j === i ? { ...it, cost: e.target.value } : it));
                        setResult(null);
                      }}
                      style={s.compInput}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        setRehabItems(prev => prev.map((it, j) => j === i ? { ...it, quantity: e.target.value } : it));
                        setResult(null);
                      }}
                      style={{ ...s.compInput, width: 80 }}
                    />
                    <button style={s.removeBtn} onClick={() => setRehabItems(prev => prev.filter((_, j) => j !== i))}>
                      {'\u2715'}
                    </button>
                  </div>
                ))}
                <button
                  style={s.addBtn}
                  onClick={() => setRehabItems(prev => [...prev, { name: '', cost: '', quantity: '1' }])}
                >
                  + Add Line Item
                </button>
              </div>
            )}

            {/* Standard fields */}
            {calc.fields.length > 0 && (
              <div style={s.formGrid}>
                {calc.fields.map((f) => (
                  <div key={f.name} style={s.fieldGroup}>
                    <label style={s.label}>{f.label}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      style={s.input}
                      placeholder={f.placeholder}
                      value={values[f.name] || ''}
                      onChange={(e) => handleChange(f.name, e.target.value)}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div style={s.btnRow}>
              <button style={{ ...s.btn, ...s.btnPrimary }} onClick={handleCalculate}>
                Calculate
              </button>
              <button style={{ ...s.btn, ...s.btnSecondary }} onClick={handleReset}>
                Reset
              </button>
            </div>

            {result && (
              <div style={s.results}>
                {result.map((r, i) => (
                  <div key={i} style={s.resultItem}>
                    <span style={s.resultLabel}>{r.label}</span>
                    <span style={s.resultValue(r.primary)}>{r.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
