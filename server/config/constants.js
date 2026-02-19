export const PLATFORM_FEE_PERCENT = 5;

export const SUBSCRIPTION_TIERS = {
  free: { price: 0, offersPerMonth: 3, matchingLevel: 'basic', calculators: 3, analytics: false },
  pro: { price: 29, offersPerMonth: Infinity, matchingLevel: 'advanced', calculators: 8, analytics: 'basic' },
  premium: { price: 99, offersPerMonth: Infinity, matchingLevel: 'priority', calculators: 8, analytics: 'full' }
};

export const MATCHING_WEIGHTS = {
  location: 0.35,
  propertyType: 0.20,
  budgetFit: 0.30,
  reputation: 0.15
};

export const PROPERTY_TYPES = ['SFH', 'Multi-Family', 'Commercial', 'Land'];
export const DEAL_STATUSES = ['draft', 'pending_review', 'active', 'under_contract', 'sold', 'delisted'];
export const OFFER_STATUSES = ['pending', 'accepted', 'rejected', 'withdrawn', 'expired'];
export const TRANSACTION_STATUSES = ['escrow_funded', 'under_review', 'closing', 'completed', 'cancelled', 'disputed'];
export const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
