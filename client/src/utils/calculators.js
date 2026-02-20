/* ============================================================
   CALCULATORS
   Pure calculator functions for real estate analysis.
   No React dependencies.
   ============================================================ */

/**
 * Calculate After Repair Value from comparable sales.
 * @param {Array<{salePrice: number, sqft: number}>} comps - Comparable sales
 * @param {number} subjectSqft - Subject property square footage
 * @returns {{arv: number, avgPricePerSqft: number}}
 */
export function calculateARV(comps, subjectSqft) {
  if (!comps || comps.length === 0 || !subjectSqft) {
    return { arv: 0, avgPricePerSqft: 0 };
  }

  const validComps = comps.filter((c) => c.salePrice > 0 && c.sqft > 0);
  if (validComps.length === 0) {
    return { arv: 0, avgPricePerSqft: 0 };
  }

  const totalPricePerSqft = validComps.reduce(
    (sum, c) => sum + c.salePrice / c.sqft,
    0
  );
  const avgPricePerSqft = totalPricePerSqft / validComps.length;
  const arv = Math.round(avgPricePerSqft * subjectSqft);

  return { arv, avgPricePerSqft: Math.round(avgPricePerSqft * 100) / 100 };
}

/**
 * Calculate Return on Investment.
 * @param {number} purchasePrice
 * @param {number} rehabCost
 * @param {number} holdingCosts
 * @param {number} salePrice
 * @returns {{roi: number, profit: number, totalInvestment: number}}
 */
export function calculateROI(purchasePrice, rehabCost, holdingCosts, salePrice) {
  const totalInvestment =
    Number(purchasePrice || 0) +
    Number(rehabCost || 0) +
    Number(holdingCosts || 0);

  const profit = Number(salePrice || 0) - totalInvestment;

  const roi = totalInvestment > 0
    ? Math.round((profit / totalInvestment) * 10000) / 100
    : 0;

  return { roi, profit: Math.round(profit), totalInvestment: Math.round(totalInvestment) };
}

/**
 * Calculate Cash-on-Cash return.
 * @param {number} annualCashFlow
 * @param {number} totalCashInvested
 * @returns {{cashOnCash: number}}
 */
export function calculateCashOnCash(annualCashFlow, totalCashInvested) {
  const cashOnCash =
    Number(totalCashInvested) > 0
      ? Math.round((Number(annualCashFlow) / Number(totalCashInvested)) * 10000) / 100
      : 0;

  return { cashOnCash };
}

/**
 * Calculate Capitalization Rate.
 * @param {number} noi - Net Operating Income (annual)
 * @param {number} propertyValue
 * @returns {{capRate: number}}
 */
export function calculateCapRate(noi, propertyValue) {
  const capRate =
    Number(propertyValue) > 0
      ? Math.round((Number(noi) / Number(propertyValue)) * 10000) / 100
      : 0;

  return { capRate };
}

/**
 * Calculate total rehab cost from a list of items.
 * @param {Array<{name: string, cost: number, quantity?: number}>} items
 * @returns {{totalCost: number, breakdown: Array<{name: string, total: number}>}}
 */
export function calculateRehabCost(items) {
  if (!items || items.length === 0) {
    return { totalCost: 0, breakdown: [] };
  }

  const breakdown = items.map((item) => {
    const cost = Number(item.cost || 0);
    const quantity = Number(item.quantity || 1);
    return {
      name: item.name || 'Unnamed Item',
      total: Math.round(cost * quantity),
    };
  });

  const totalCost = breakdown.reduce((sum, item) => sum + item.total, 0);

  return { totalCost, breakdown };
}

/**
 * Calculate Maximum Allowable Offer.
 * @param {number} arv - After Repair Value
 * @param {number} rehabCost
 * @param {number} assignmentFee
 * @param {number} [discountPercent=70] - Percentage of ARV (e.g. 70 for 70% rule)
 * @returns {{mao: number}}
 */
export function calculateMAO(arv, rehabCost, assignmentFee, discountPercent = 70) {
  const arvValue = Number(arv || 0);
  const rehab = Number(rehabCost || 0);
  const fee = Number(assignmentFee || 0);
  const discount = Number(discountPercent || 70) / 100;

  const mao = Math.round(arvValue * discount - rehab - fee);

  return { mao: Math.max(0, mao) };
}

/**
 * Calculate wholesale fee and percentage.
 * @param {number} salePrice - Price to the end buyer
 * @param {number} purchasePrice - Contract price with the seller
 * @returns {{fee: number, percentage: number}}
 */
export function calculateWholesaleFee(salePrice, purchasePrice) {
  const sale = Number(salePrice || 0);
  const purchase = Number(purchasePrice || 0);
  const fee = sale - purchase;

  const percentage =
    sale > 0 ? Math.round((fee / sale) * 10000) / 100 : 0;

  return { fee: Math.round(fee), percentage };
}

/**
 * Perform a full rental property analysis.
 * @param {number} monthlyRent
 * @param {number} vacancy - Vacancy rate as percentage (e.g. 5 for 5%)
 * @param {number} propertyTax - Annual property tax
 * @param {number} insurance - Annual insurance
 * @param {number} maintenance - Annual maintenance cost
 * @param {number} mortgagePayment - Monthly mortgage payment
 * @param {number} purchasePrice
 * @returns {{monthlyCashFlow: number, annualCashFlow: number, cashOnCash: number, capRate: number}}
 */
export function calculateRentalAnalysis(
  monthlyRent,
  vacancy,
  propertyTax,
  insurance,
  maintenance,
  mortgagePayment,
  purchasePrice
) {
  const rent = Number(monthlyRent || 0);
  const vacancyRate = Number(vacancy || 0) / 100;
  const tax = Number(propertyTax || 0);
  const ins = Number(insurance || 0);
  const maint = Number(maintenance || 0);
  const mortgage = Number(mortgagePayment || 0);
  const price = Number(purchasePrice || 0);

  // Effective gross income (monthly)
  const effectiveMonthlyRent = rent * (1 - vacancyRate);

  // Annual income
  const annualGrossIncome = effectiveMonthlyRent * 12;

  // Annual operating expenses (excluding mortgage)
  const annualExpenses = tax + ins + maint;

  // Net Operating Income
  const noi = annualGrossIncome - annualExpenses;

  // Monthly cash flow (after mortgage)
  const monthlyCashFlow = Math.round(
    effectiveMonthlyRent - (annualExpenses / 12) - mortgage
  );

  // Annual cash flow
  const annualCashFlow = Math.round(monthlyCashFlow * 12);

  // Cash-on-cash return (assumes full cash purchase if no mortgage)
  const cashOnCash =
    price > 0
      ? Math.round((annualCashFlow / price) * 10000) / 100
      : 0;

  // Cap rate (based on NOI, not including financing)
  const capRate =
    price > 0
      ? Math.round((noi / price) * 10000) / 100
      : 0;

  return { monthlyCashFlow, annualCashFlow, cashOnCash, capRate };
}
