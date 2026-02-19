import { PLATFORM_FEE_PERCENT, SUBSCRIPTION_TIERS } from '../config/constants.js';

export function calculatePlatformFee(salePrice, tier = 'free') {
  let feePercent = PLATFORM_FEE_PERCENT;
  if (tier === 'pro') feePercent = 4;
  if (tier === 'premium') feePercent = 3;

  const fee = Math.round(salePrice * (feePercent / 100) * 100) / 100;
  return { fee, feePercent, netToWholesaler: salePrice - fee };
}

export function calculateAssignmentFee(salePrice, purchasePrice) {
  const fee = salePrice - purchasePrice;
  const percentage = purchasePrice > 0 ? Math.round((fee / purchasePrice) * 10000) / 100 : 0;
  return { fee, percentage };
}
