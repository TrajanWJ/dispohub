import { Router } from 'express';

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/calculators/arv — After Repair Value calculator
// ---------------------------------------------------------------------------
router.post('/arv', (req, res) => {
  try {
    const { comps, subjectSqft } = req.body;

    if (!Array.isArray(comps) || comps.length === 0) {
      return res.status(400).json({ error: '"comps" must be a non-empty array of {pricePerSqft, sqft}' });
    }
    if (!subjectSqft || subjectSqft <= 0) {
      return res.status(400).json({ error: '"subjectSqft" must be a positive number' });
    }

    for (let i = 0; i < comps.length; i++) {
      const c = comps[i];
      if (!c.pricePerSqft || c.pricePerSqft <= 0 || !c.sqft || c.sqft <= 0) {
        return res.status(400).json({ error: `Comp at index ${i} must have positive pricePerSqft and sqft` });
      }
    }

    const totalPricePerSqft = comps.reduce((sum, c) => sum + Number(c.pricePerSqft), 0);
    const avgPricePerSqft = Math.round((totalPricePerSqft / comps.length) * 100) / 100;
    const arv = Math.round(avgPricePerSqft * Number(subjectSqft));

    res.json({ arv, avgPricePerSqft });
  } catch (err) {
    res.status(500).json({ error: 'ARV calculation failed: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/calculators/roi — Return on Investment calculator
// ---------------------------------------------------------------------------
router.post('/roi', (req, res) => {
  try {
    const { purchasePrice, rehabCost, holdingCosts, salePrice } = req.body;

    if (purchasePrice == null || purchasePrice < 0) {
      return res.status(400).json({ error: '"purchasePrice" must be a non-negative number' });
    }
    if (rehabCost == null || rehabCost < 0) {
      return res.status(400).json({ error: '"rehabCost" must be a non-negative number' });
    }
    if (holdingCosts == null || holdingCosts < 0) {
      return res.status(400).json({ error: '"holdingCosts" must be a non-negative number' });
    }
    if (salePrice == null || salePrice <= 0) {
      return res.status(400).json({ error: '"salePrice" must be a positive number' });
    }

    const totalInvestment = Number(purchasePrice) + Number(rehabCost) + Number(holdingCosts);
    const profit = Number(salePrice) - totalInvestment;
    const roi = totalInvestment > 0
      ? Math.round((profit / totalInvestment) * 10000) / 100
      : 0;

    res.json({ roi, profit, totalInvestment });
  } catch (err) {
    res.status(500).json({ error: 'ROI calculation failed: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/calculators/cash-on-cash — Cash-on-Cash Return calculator
// ---------------------------------------------------------------------------
router.post('/cash-on-cash', (req, res) => {
  try {
    const { annualCashFlow, totalCashInvested } = req.body;

    if (annualCashFlow == null) {
      return res.status(400).json({ error: '"annualCashFlow" is required' });
    }
    if (!totalCashInvested || totalCashInvested <= 0) {
      return res.status(400).json({ error: '"totalCashInvested" must be a positive number' });
    }

    const cashOnCash = Math.round((Number(annualCashFlow) / Number(totalCashInvested)) * 10000) / 100;

    res.json({ cashOnCash });
  } catch (err) {
    res.status(500).json({ error: 'Cash-on-cash calculation failed: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/calculators/cap-rate — Capitalization Rate calculator
// ---------------------------------------------------------------------------
router.post('/cap-rate', (req, res) => {
  try {
    const { noi, propertyValue } = req.body;

    if (noi == null) {
      return res.status(400).json({ error: '"noi" (Net Operating Income) is required' });
    }
    if (!propertyValue || propertyValue <= 0) {
      return res.status(400).json({ error: '"propertyValue" must be a positive number' });
    }

    const capRate = Math.round((Number(noi) / Number(propertyValue)) * 10000) / 100;

    res.json({ capRate });
  } catch (err) {
    res.status(500).json({ error: 'Cap rate calculation failed: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/calculators/rehab — Rehab Cost Estimator
// ---------------------------------------------------------------------------
router.post('/rehab', (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '"items" must be a non-empty array of {category, cost}' });
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.category || typeof item.category !== 'string') {
        return res.status(400).json({ error: `Item at index ${i} must have a "category" string` });
      }
      if (item.cost == null || Number(item.cost) < 0) {
        return res.status(400).json({ error: `Item at index ${i} must have a non-negative "cost"` });
      }
    }

    const breakdown = {};
    let totalCost = 0;

    for (const item of items) {
      const cost = Number(item.cost);
      totalCost += cost;
      if (breakdown[item.category]) {
        breakdown[item.category] += cost;
      } else {
        breakdown[item.category] = cost;
      }
    }

    totalCost = Math.round(totalCost * 100) / 100;

    res.json({ totalCost, breakdown });
  } catch (err) {
    res.status(500).json({ error: 'Rehab calculation failed: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/calculators/mao — Maximum Allowable Offer calculator
// Formula: ARV x discountPercent - rehabCost - assignmentFee (default 70%)
// ---------------------------------------------------------------------------
router.post('/mao', (req, res) => {
  try {
    const { arv, rehabCost, assignmentFee, discountPercent } = req.body;

    if (!arv || arv <= 0) {
      return res.status(400).json({ error: '"arv" must be a positive number' });
    }
    if (rehabCost == null || rehabCost < 0) {
      return res.status(400).json({ error: '"rehabCost" must be a non-negative number' });
    }
    if (assignmentFee == null || assignmentFee < 0) {
      return res.status(400).json({ error: '"assignmentFee" must be a non-negative number' });
    }

    const discount = discountPercent != null ? Number(discountPercent) / 100 : 0.70;
    const mao = Math.round((Number(arv) * discount - Number(rehabCost) - Number(assignmentFee)) * 100) / 100;

    res.json({ mao });
  } catch (err) {
    res.status(500).json({ error: 'MAO calculation failed: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/calculators/wholesale-fee — Wholesale Fee calculator
// ---------------------------------------------------------------------------
router.post('/wholesale-fee', (req, res) => {
  try {
    const { salePrice, purchasePrice } = req.body;

    if (!salePrice || salePrice <= 0) {
      return res.status(400).json({ error: '"salePrice" must be a positive number' });
    }
    if (!purchasePrice || purchasePrice <= 0) {
      return res.status(400).json({ error: '"purchasePrice" must be a positive number' });
    }

    const fee = Number(salePrice) - Number(purchasePrice);
    const percentage = Math.round((fee / Number(purchasePrice)) * 10000) / 100;

    res.json({ fee, percentage });
  } catch (err) {
    res.status(500).json({ error: 'Wholesale fee calculation failed: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/calculators/rental — Rental Property Analysis calculator
// ---------------------------------------------------------------------------
router.post('/rental', (req, res) => {
  try {
    const {
      monthlyRent,
      vacancy,
      propertyTax,
      insurance,
      maintenance,
      mortgagePayment,
      purchasePrice,
    } = req.body;

    if (!monthlyRent || monthlyRent <= 0) {
      return res.status(400).json({ error: '"monthlyRent" must be a positive number' });
    }
    if (vacancy == null || vacancy < 0 || vacancy > 100) {
      return res.status(400).json({ error: '"vacancy" must be between 0 and 100 (percent)' });
    }
    if (propertyTax == null || propertyTax < 0) {
      return res.status(400).json({ error: '"propertyTax" (monthly) must be a non-negative number' });
    }
    if (insurance == null || insurance < 0) {
      return res.status(400).json({ error: '"insurance" (monthly) must be a non-negative number' });
    }
    if (maintenance == null || maintenance < 0) {
      return res.status(400).json({ error: '"maintenance" (monthly) must be a non-negative number' });
    }
    if (mortgagePayment == null || mortgagePayment < 0) {
      return res.status(400).json({ error: '"mortgagePayment" (monthly) must be a non-negative number' });
    }
    if (!purchasePrice || purchasePrice <= 0) {
      return res.status(400).json({ error: '"purchasePrice" must be a positive number' });
    }

    const effectiveRent = Number(monthlyRent) * (1 - Number(vacancy) / 100);
    const monthlyExpenses = Number(propertyTax) + Number(insurance) + Number(maintenance) + Number(mortgagePayment);
    const monthlyCashFlow = Math.round((effectiveRent - monthlyExpenses) * 100) / 100;
    const annualCashFlow = Math.round(monthlyCashFlow * 12 * 100) / 100;

    // Cash-on-cash uses purchase price as total cash invested
    const cashOnCash = Math.round((annualCashFlow / Number(purchasePrice)) * 10000) / 100;

    // Cap rate uses NOI (before mortgage) / purchase price
    const annualNOI = (effectiveRent - Number(propertyTax) - Number(insurance) - Number(maintenance)) * 12;
    const capRate = Math.round((annualNOI / Number(purchasePrice)) * 10000) / 100;

    res.json({ monthlyCashFlow, annualCashFlow, cashOnCash, capRate });
  } catch (err) {
    res.status(500).json({ error: 'Rental calculation failed: ' + err.message });
  }
});

export default router;
