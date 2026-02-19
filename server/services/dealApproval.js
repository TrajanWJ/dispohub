export function evaluateDealQuality(deal) {
  const issues = [];
  const warnings = [];

  if (!deal.address) issues.push('Missing address');
  if (!deal.city) issues.push('Missing city');
  if (!deal.state) issues.push('Missing state');
  if (!deal.askingPrice || deal.askingPrice <= 0) issues.push('Invalid asking price');
  if (!deal.propertyType) issues.push('Missing property type');

  if (!deal.arvEstimate) warnings.push('No ARV estimate provided');
  if (!deal.rehabEstimate) warnings.push('No rehab estimate provided');
  if (!deal.description || deal.description.length < 20) warnings.push('Description is too short');
  if (!deal.photos?.length) warnings.push('No photos provided');
  if (deal.assignmentFee && deal.askingPrice && (deal.assignmentFee / deal.askingPrice) > 0.20) {
    warnings.push('Assignment fee exceeds 20% of asking price');
  }

  return {
    approved: issues.length === 0,
    autoApprovable: issues.length === 0 && warnings.length === 0,
    issues,
    warnings,
    score: Math.max(0, 100 - (issues.length * 25) - (warnings.length * 10))
  };
}
