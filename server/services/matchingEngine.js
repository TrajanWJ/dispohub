import { MATCHING_WEIGHTS } from '../config/constants.js';
import { findUserById } from '../models/User.js';

export function scoreMatch(deal, investorPreferences) {
  let score = 0;
  const reasons = [];

  // Location match (35%): state exact match = full, city match = bonus
  if (investorPreferences.states?.includes(deal.state)) {
    score += MATCHING_WEIGHTS.location;
    reasons.push('Location match');
    if (investorPreferences.cities?.includes(deal.city)) {
      score += 0.05;
      reasons.push('City match');
    }
  }

  // Property type match (20%)
  if (!investorPreferences.propertyTypes?.length || investorPreferences.propertyTypes.includes(deal.propertyType)) {
    score += MATCHING_WEIGHTS.propertyType;
    reasons.push('Property type match');
  }

  // Budget fit (30%): asking price within range
  const minPrice = investorPreferences.minPrice || 0;
  const maxPrice = investorPreferences.maxPrice || Infinity;
  if (deal.askingPrice >= minPrice && deal.askingPrice <= maxPrice) {
    score += MATCHING_WEIGHTS.budgetFit;
    reasons.push('Within budget');
  }

  // Wholesaler reputation (15%)
  const minRep = investorPreferences.minReputation || 0;
  const wholesalerRep = deal.wholesalerReputation || 0;
  if (wholesalerRep >= minRep) {
    score += MATCHING_WEIGHTS.reputation;
    reasons.push('Meets reputation threshold');
  }

  return {
    score: Math.min(score, 1.0),
    percentage: Math.round(Math.min(score, 1.0) * 100),
    reasons
  };
}

export function findMatchesForInvestor(deals, investorPreferences) {
  return deals
    .map(deal => ({ deal, match: scoreMatch(deal, investorPreferences) }))
    .filter(m => m.match.percentage > 20)
    .sort((a, b) => b.match.percentage - a.match.percentage);
}

export function findMatchingInvestorsForDeal(deal, investors) {
  return investors
    .filter(inv => inv.preferences && Object.keys(inv.preferences).length > 0)
    .map(investor => ({
      investor: { id: investor.id, name: investor.name, company: investor.company, reputationScore: investor.reputationScore, verificationStatus: investor.verificationStatus },
      match: scoreMatch(deal, investor.preferences)
    }))
    .filter(m => m.match.percentage > 20)
    .sort((a, b) => b.match.percentage - a.match.percentage);
}
