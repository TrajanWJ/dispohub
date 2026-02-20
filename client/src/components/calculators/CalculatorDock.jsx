import { useState, useEffect, useCallback } from 'react';
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
   STYLES
   ============================================================ */

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(2px)',
    zIndex: 999,
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '420px',
    maxWidth: '100vw',
    background: 'var(--bg-secondary)',
    borderLeft: '1px solid var(--border-color)',
    boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.875rem 1.25rem',
    borderBottom: '1px solid var(--border-color)',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0.25rem',
    lineHeight: 1,
    borderRadius: '4px',
    transition: 'color 0.15s ease',
  },
  tabBar: {
    display: 'flex',
    overflowX: 'auto',
    borderBottom: '1px solid var(--border-color)',
    flexShrink: 0,
    padding: '0 0.5rem',
    gap: '0.125rem',
  },
  tab: (isActive) => ({
    padding: '0.5rem 0.625rem',
    fontSize: '0.6875rem',
    fontWeight: isActive ? 600 : 400,
    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
    background: 'transparent',
    border: 'none',
    borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'color 0.15s ease',
    marginBottom: '-1px',
  }),
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.25rem',
  },
  fieldGroup: {
    marginBottom: '0.875rem',
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '0.3rem',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box',
  },
  calcButton: {
    width: '100%',
    padding: '0.625rem 1rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    background: 'var(--accent-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--border-radius)',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    marginTop: '0.5rem',
    marginBottom: '1rem',
  },
  resultsBox: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '1rem',
  },
  resultsTitle: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '0.75rem',
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.375rem 0',
    borderBottom: '1px solid var(--border-color)',
  },
  resultLabel: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
  },
  resultValue: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  resultHighlight: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--accent-success)',
  },
  compRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  compInput: {
    flex: 1,
    padding: '0.5rem 0.625rem',
    fontSize: '0.8125rem',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  addBtn: {
    background: 'transparent',
    border: '1px dashed var(--border-color)',
    borderRadius: 'var(--border-radius)',
    color: 'var(--text-secondary)',
    fontSize: '0.8125rem',
    padding: '0.375rem 0.75rem',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, color 0.15s ease',
    marginBottom: '0.875rem',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-danger)',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '0.25rem',
    lineHeight: 1,
    flexShrink: 0,
  },
};

/* ============================================================
   INPUT FIELD HELPER
   ============================================================ */

function Field({ label, value, onChange, placeholder, type = 'number', prefix }) {
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              pointerEvents: 'none',
            }}
          >
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '0'}
          style={{
            ...styles.input,
            ...(prefix ? { paddingLeft: '1.5rem' } : {}),
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   RESULT DISPLAY HELPER
   ============================================================ */

function Results({ rows, highlight }) {
  if (!rows || rows.length === 0) return null;

  return (
    <div style={styles.resultsBox}>
      <div style={styles.resultsTitle}>Results</div>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            ...styles.resultRow,
            ...(i === rows.length - 1 ? { borderBottom: 'none' } : {}),
          }}
        >
          <span style={styles.resultLabel}>{row.label}</span>
          <span
            style={
              row.label === highlight
                ? styles.resultHighlight
                : {
                    ...styles.resultValue,
                    ...(row.negative ? { color: 'var(--accent-danger)' } : {}),
                  }
            }
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   INDIVIDUAL CALCULATORS
   ============================================================ */

function ARVCalculator({ prefillData }) {
  const [comps, setComps] = useState(
    prefillData?.comps || [{ salePrice: '', sqft: '' }]
  );
  const [subjectSqft, setSubjectSqft] = useState(prefillData?.subjectSqft || '');
  const [results, setResults] = useState(null);

  const updateComp = (index, field, value) => {
    setComps((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addComp = () => setComps((prev) => [...prev, { salePrice: '', sqft: '' }]);
  const removeComp = (index) => setComps((prev) => prev.filter((_, i) => i !== index));

  const handleCalc = () => {
    const parsed = comps
      .filter((c) => c.salePrice && c.sqft)
      .map((c) => ({ salePrice: Number(c.salePrice), sqft: Number(c.sqft) }));
    const result = calculateARV(parsed, Number(subjectSqft));
    setResults(result);
  };

  return (
    <div>
      <div style={styles.label}>Comparable Sales</div>
      {comps.map((comp, i) => (
        <div key={i} style={styles.compRow}>
          <input
            type="number"
            placeholder="Sale Price"
            value={comp.salePrice}
            onChange={(e) => updateComp(i, 'salePrice', e.target.value)}
            style={styles.compInput}
          />
          <input
            type="number"
            placeholder="Sq Ft"
            value={comp.sqft}
            onChange={(e) => updateComp(i, 'sqft', e.target.value)}
            style={styles.compInput}
          />
          {comps.length > 1 && (
            <button style={styles.removeBtn} onClick={() => removeComp(i)}>
              &#x2715;
            </button>
          )}
        </div>
      ))}
      <button
        style={styles.addBtn}
        onClick={addComp}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
          e.currentTarget.style.color = 'var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        + Add Comp
      </button>
      <Field label="Subject Property Sq Ft" value={subjectSqft} onChange={setSubjectSqft} />
      <button
        style={styles.calcButton}
        onClick={handleCalc}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
      >
        Calculate ARV
      </button>
      {results && (
        <Results
          highlight="After Repair Value"
          rows={[
            { label: 'Avg Price/Sq Ft', value: formatCurrency(results.avgPricePerSqft) },
            { label: 'After Repair Value', value: formatCurrency(results.arv) },
          ]}
        />
      )}
    </div>
  );
}

function ROICalculator({ prefillData }) {
  const [purchasePrice, setPurchasePrice] = useState(prefillData?.purchasePrice || '');
  const [rehabCost, setRehabCost] = useState(prefillData?.rehabCost || '');
  const [holdingCosts, setHoldingCosts] = useState(prefillData?.holdingCosts || '');
  const [salePrice, setSalePrice] = useState(prefillData?.salePrice || '');
  const [results, setResults] = useState(null);

  const handleCalc = () => {
    const result = calculateROI(
      Number(purchasePrice),
      Number(rehabCost),
      Number(holdingCosts),
      Number(salePrice)
    );
    setResults(result);
  };

  return (
    <div>
      <Field label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" />
      <Field label="Rehab Cost" value={rehabCost} onChange={setRehabCost} prefix="$" />
      <Field label="Holding Costs" value={holdingCosts} onChange={setHoldingCosts} prefix="$" />
      <Field label="Sale Price" value={salePrice} onChange={setSalePrice} prefix="$" />
      <button
        style={styles.calcButton}
        onClick={handleCalc}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
      >
        Calculate ROI
      </button>
      {results && (
        <Results
          highlight="ROI"
          rows={[
            { label: 'Total Investment', value: formatCurrency(results.totalInvestment) },
            {
              label: 'Profit',
              value: formatCurrency(results.profit),
              negative: results.profit < 0,
            },
            { label: 'ROI', value: formatPercentage(results.roi) },
          ]}
        />
      )}
    </div>
  );
}

function CashOnCashCalculator() {
  const [annualCashFlow, setAnnualCashFlow] = useState('');
  const [totalCashInvested, setTotalCashInvested] = useState('');
  const [results, setResults] = useState(null);

  const handleCalc = () => {
    const result = calculateCashOnCash(Number(annualCashFlow), Number(totalCashInvested));
    setResults(result);
  };

  return (
    <div>
      <Field label="Annual Cash Flow" value={annualCashFlow} onChange={setAnnualCashFlow} prefix="$" />
      <Field label="Total Cash Invested" value={totalCashInvested} onChange={setTotalCashInvested} prefix="$" />
      <button
        style={styles.calcButton}
        onClick={handleCalc}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
      >
        Calculate Cash-on-Cash
      </button>
      {results && (
        <Results
          highlight="Cash-on-Cash Return"
          rows={[{ label: 'Cash-on-Cash Return', value: formatPercentage(results.cashOnCash) }]}
        />
      )}
    </div>
  );
}

function CapRateCalculator() {
  const [noi, setNoi] = useState('');
  const [propertyValue, setPropertyValue] = useState('');
  const [results, setResults] = useState(null);

  const handleCalc = () => {
    const result = calculateCapRate(Number(noi), Number(propertyValue));
    setResults(result);
  };

  return (
    <div>
      <Field label="Net Operating Income (Annual)" value={noi} onChange={setNoi} prefix="$" />
      <Field label="Property Value" value={propertyValue} onChange={setPropertyValue} prefix="$" />
      <button
        style={styles.calcButton}
        onClick={handleCalc}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
      >
        Calculate Cap Rate
      </button>
      {results && (
        <Results
          highlight="Cap Rate"
          rows={[{ label: 'Cap Rate', value: formatPercentage(results.capRate) }]}
        />
      )}
    </div>
  );
}

function RehabCostCalculator() {
  const [items, setItems] = useState([{ name: '', cost: '', quantity: '1' }]);
  const [results, setResults] = useState(null);

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { name: '', cost: '', quantity: '1' }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleCalc = () => {
    const parsed = items
      .filter((item) => item.name && item.cost)
      .map((item) => ({
        name: item.name,
        cost: Number(item.cost),
        quantity: Number(item.quantity || 1),
      }));
    const result = calculateRehabCost(parsed);
    setResults(result);
  };

  return (
    <div>
      <div style={styles.label}>Rehab Items</div>
      {items.map((item, i) => (
        <div key={i} style={{ ...styles.compRow, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Item Name"
            value={item.name}
            onChange={(e) => updateItem(i, 'name', e.target.value)}
            style={{ ...styles.compInput, flex: 2, minWidth: '100px' }}
          />
          <input
            type="number"
            placeholder="Cost"
            value={item.cost}
            onChange={(e) => updateItem(i, 'cost', e.target.value)}
            style={{ ...styles.compInput, flex: 1, minWidth: '70px' }}
          />
          <input
            type="number"
            placeholder="Qty"
            value={item.quantity}
            onChange={(e) => updateItem(i, 'quantity', e.target.value)}
            style={{ ...styles.compInput, flex: 0, width: '50px', minWidth: '50px' }}
          />
          {items.length > 1 && (
            <button style={styles.removeBtn} onClick={() => removeItem(i)}>
              &#x2715;
            </button>
          )}
        </div>
      ))}
      <button
        style={styles.addBtn}
        onClick={addItem}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
          e.currentTarget.style.color = 'var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        + Add Item
      </button>
      <button
        style={styles.calcButton}
        onClick={handleCalc}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
      >
        Calculate Rehab Cost
      </button>
      {results && (
        <Results
          highlight="Total Rehab Cost"
          rows={[
            ...results.breakdown.map((item) => ({
              label: item.name,
              value: formatCurrency(item.total),
            })),
            { label: 'Total Rehab Cost', value: formatCurrency(results.totalCost) },
          ]}
        />
      )}
    </div>
  );
}

function MAOCalculator({ prefillData }) {
  const [arv, setArv] = useState(prefillData?.arv || '');
  const [rehabCost, setRehabCost] = useState(prefillData?.rehabCost || '');
  const [assignmentFee, setAssignmentFee] = useState(prefillData?.assignmentFee || '');
  const [discountPercent, setDiscountPercent] = useState(prefillData?.discountPercent || '70');
  const [results, setResults] = useState(null);

  const handleCalc = () => {
    const result = calculateMAO(
      Number(arv),
      Number(rehabCost),
      Number(assignmentFee),
      Number(discountPercent)
    );
    setResults(result);
  };

  return (
    <div>
      <Field label="After Repair Value (ARV)" value={arv} onChange={setArv} prefix="$" />
      <Field label="Rehab Cost" value={rehabCost} onChange={setRehabCost} prefix="$" />
      <Field label="Assignment Fee" value={assignmentFee} onChange={setAssignmentFee} prefix="$" />
      <Field
        label="Discount % (e.g. 70 for the 70% Rule)"
        value={discountPercent}
        onChange={setDiscountPercent}
      />
      <button
        style={styles.calcButton}
        onClick={handleCalc}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
      >
        Calculate MAO
      </button>
      {results && (
        <Results
          highlight="Maximum Allowable Offer"
          rows={[{ label: 'Maximum Allowable Offer', value: formatCurrency(results.mao) }]}
        />
      )}
    </div>
  );
}

function WholesaleFeeCalculator({ prefillData }) {
  const [salePrice, setSalePrice] = useState(prefillData?.salePrice || '');
  const [purchasePrice, setPurchasePrice] = useState(prefillData?.purchasePrice || '');
  const [results, setResults] = useState(null);

  const handleCalc = () => {
    const result = calculateWholesaleFee(Number(salePrice), Number(purchasePrice));
    setResults(result);
  };

  return (
    <div>
      <Field label="Sale Price (to End Buyer)" value={salePrice} onChange={setSalePrice} prefix="$" />
      <Field label="Purchase Price (Contract)" value={purchasePrice} onChange={setPurchasePrice} prefix="$" />
      <button
        style={styles.calcButton}
        onClick={handleCalc}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
      >
        Calculate Wholesale Fee
      </button>
      {results && (
        <Results
          highlight="Wholesale Fee"
          rows={[
            {
              label: 'Wholesale Fee',
              value: formatCurrency(results.fee),
              negative: results.fee < 0,
            },
            { label: 'Fee Percentage', value: formatPercentage(results.percentage) },
          ]}
        />
      )}
    </div>
  );
}

function RentalAnalysisCalculator() {
  const [monthlyRent, setMonthlyRent] = useState('');
  const [vacancy, setVacancy] = useState('5');
  const [propertyTax, setPropertyTax] = useState('');
  const [insurance, setInsurance] = useState('');
  const [maintenance, setMaintenance] = useState('');
  const [mortgagePayment, setMortgagePayment] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [results, setResults] = useState(null);

  const handleCalc = () => {
    const result = calculateRentalAnalysis(
      Number(monthlyRent),
      Number(vacancy),
      Number(propertyTax),
      Number(insurance),
      Number(maintenance),
      Number(mortgagePayment),
      Number(purchasePrice)
    );
    setResults(result);
  };

  return (
    <div>
      <Field label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} prefix="$" />
      <Field label="Vacancy Rate (%)" value={vacancy} onChange={setVacancy} />
      <Field label="Annual Property Tax" value={propertyTax} onChange={setPropertyTax} prefix="$" />
      <Field label="Annual Insurance" value={insurance} onChange={setInsurance} prefix="$" />
      <Field label="Annual Maintenance" value={maintenance} onChange={setMaintenance} prefix="$" />
      <Field label="Monthly Mortgage Payment" value={mortgagePayment} onChange={setMortgagePayment} prefix="$" />
      <Field label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" />
      <button
        style={styles.calcButton}
        onClick={handleCalc}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
      >
        Analyze Rental
      </button>
      {results && (
        <Results
          highlight="Monthly Cash Flow"
          rows={[
            {
              label: 'Monthly Cash Flow',
              value: formatCurrency(results.monthlyCashFlow),
              negative: results.monthlyCashFlow < 0,
            },
            {
              label: 'Annual Cash Flow',
              value: formatCurrency(results.annualCashFlow),
              negative: results.annualCashFlow < 0,
            },
            { label: 'Cash-on-Cash Return', value: formatPercentage(results.cashOnCash) },
            { label: 'Cap Rate', value: formatPercentage(results.capRate) },
          ]}
        />
      )}
    </div>
  );
}

/* ============================================================
   TABS CONFIG
   ============================================================ */

const CALC_TABS = [
  { key: 'arv', label: 'ARV' },
  { key: 'roi', label: 'ROI' },
  { key: 'coc', label: 'Cash-on-Cash' },
  { key: 'cap', label: 'Cap Rate' },
  { key: 'rehab', label: 'Rehab Cost' },
  { key: 'mao', label: 'MAO' },
  { key: 'wholesale', label: 'Wholesale Fee' },
  { key: 'rental', label: 'Rental Analysis' },
];

/* ============================================================
   CALCULATOR DOCK
   ============================================================ */

export default function CalculatorDock({ isOpen, onClose, prefillData }) {
  const [activeTab, setActiveTab] = useState('arv');

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const renderCalculator = useCallback(() => {
    switch (activeTab) {
      case 'arv':
        return <ARVCalculator prefillData={prefillData} />;
      case 'roi':
        return <ROICalculator prefillData={prefillData} />;
      case 'coc':
        return <CashOnCashCalculator />;
      case 'cap':
        return <CapRateCalculator />;
      case 'rehab':
        return <RehabCostCalculator />;
      case 'mao':
        return <MAOCalculator prefillData={prefillData} />;
      case 'wholesale':
        return <WholesaleFeeCalculator prefillData={prefillData} />;
      case 'rental':
        return <RentalAnalysisCalculator />;
      default:
        return null;
    }
  }, [activeTab, prefillData]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div style={styles.overlay} onClick={onClose} />

      {/* Panel */}
      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.headerTitle}>Calculators</span>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            &#x2715;
          </button>
        </div>

        {/* Tab bar */}
        <div style={styles.tabBar}>
          {CALC_TABS.map((tab) => (
            <button
              key={tab.key}
              style={styles.tab(activeTab === tab.key)}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={styles.body}>{renderCalculator()}</div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
