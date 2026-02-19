/**
 * DispoHub Seed Script
 * Generates realistic demo data for investor prototype demonstrations.
 *
 * Run from the server directory:  node db/seed.js
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from './db.js';
import { PLATFORM_FEE_PERCENT, SUBSCRIPTION_TIERS } from '../config/constants.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

function monthsFromNow(n) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString();
}

// Round to nearest thousand
function roundK(n) {
  return Math.round(n / 1000) * 1000;
}

// ---------------------------------------------------------------------------
// Static data pools
// ---------------------------------------------------------------------------

const STREET_NAMES = [
  'Oak', 'Maple', 'Cedar', 'Elm', 'Pine', 'Birch', 'Magnolia', 'Willow',
  'Peachtree', 'Sunset', 'Highland', 'Riverside', 'Lakeview', 'Spring',
  'Main', 'Church', 'Washington', 'Jackson', 'Madison', 'Jefferson',
  'Liberty', 'Franklin', 'Lincoln', 'Park', 'Meadow', 'Heritage',
  'Cypress', 'Dogwood', 'Sycamore', 'Chestnut'
];

const STREET_TYPES = ['St', 'Ave', 'Dr', 'Ln', 'Blvd', 'Ct', 'Pl', 'Way', 'Rd', 'Cir'];

const LOCATIONS = [
  { state: 'TX', city: 'Houston', county: 'Harris', zips: ['77001', '77002', '77003', '77004', '77005', '77006'] },
  { state: 'TX', city: 'Dallas', county: 'Dallas', zips: ['75201', '75202', '75203', '75204', '75205'] },
  { state: 'TX', city: 'San Antonio', county: 'Bexar', zips: ['78201', '78202', '78203', '78204'] },
  { state: 'FL', city: 'Jacksonville', county: 'Duval', zips: ['32201', '32202', '32204', '32205'] },
  { state: 'FL', city: 'Tampa', county: 'Hillsborough', zips: ['33601', '33602', '33603', '33604'] },
  { state: 'FL', city: 'Orlando', county: 'Orange', zips: ['32801', '32803', '32804', '32806'] },
  { state: 'CA', city: 'Sacramento', county: 'Sacramento', zips: ['95811', '95814', '95816', '95818'] },
  { state: 'CA', city: 'Fresno', county: 'Fresno', zips: ['93701', '93702', '93703', '93704'] },
  { state: 'GA', city: 'Atlanta', county: 'Fulton', zips: ['30301', '30303', '30305', '30306', '30308'] },
  { state: 'GA', city: 'Savannah', county: 'Chatham', zips: ['31401', '31404', '31405', '31406'] },
  { state: 'OH', city: 'Cleveland', county: 'Cuyahoga', zips: ['44101', '44102', '44103', '44104'] },
  { state: 'OH', city: 'Columbus', county: 'Franklin', zips: ['43201', '43202', '43203', '43204'] },
  { state: 'NC', city: 'Charlotte', county: 'Mecklenburg', zips: ['28201', '28202', '28203', '28204'] },
  { state: 'NC', city: 'Raleigh', county: 'Wake', zips: ['27601', '27603', '27604', '27605'] },
  { state: 'AZ', city: 'Phoenix', county: 'Maricopa', zips: ['85001', '85003', '85004', '85006'] },
  { state: 'AZ', city: 'Tucson', county: 'Pima', zips: ['85701', '85702', '85705', '85710'] },
];

const WHOLESALER_COMPANIES = [
  'Keystone Property Group', 'Apex Deal Source', 'Metro Wholesale Holdings',
  'Liberty Property Solutions', 'Summit Acquisitions', 'Trident Real Estate',
  'Cornerstone Dispo', 'Horizon Deal Flow', 'Atlas Property Partners',
  'Pinnacle Wholesale Group'
];

const FIRST_NAMES_M = ['James', 'Robert', 'David', 'Michael', 'Daniel', 'Anthony', 'Kevin', 'Brandon', 'Carlos', 'Derek'];
const FIRST_NAMES_F = ['Jennifer', 'Maria', 'Amanda', 'Jessica', 'Stephanie', 'Nicole', 'Ashley', 'Brittany', 'Tiffany', 'Crystal'];
const LAST_NAMES = [
  'Williams', 'Brown', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson',
  'Thompson', 'White', 'Lee', 'Harris', 'Clark', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King'
];

const INVESTOR_COMPANIES = [
  'Vanguard Capital RE', 'Prestige Investments LLC', 'Clearwater Holdings',
  'Redstone Capital Partners', 'Pacific Equity Group', 'Northern Trust RE',
  'Emerald City Investments', 'Golden State Acquisitions', 'Ironclad Properties',
  'Beacon Hill Capital', 'Silverline Investments', 'Crossroads Capital Group',
  'Eclipse Property Fund', 'Patriot Real Estate', 'Cascade Investment Group'
];

const PROPERTY_HIGHLIGHTS = [
  'Below market value - motivated seller',
  'Recently appraised, strong ARV potential',
  'Corner lot with extra parking',
  'New roof installed 2024',
  'Updated kitchen and bathrooms',
  'Large backyard - great for additions',
  'Near major employment centers',
  'Excellent school district',
  'Tenant-occupied - immediate cash flow',
  'Zoned for multi-family conversion',
  'Historic district - appreciation potential',
  'No HOA fees',
  'Owner financing available',
  'Quiet cul-de-sac location',
  'Walk score 85+ near transit',
  'Foundation recently inspected - solid',
  'Newer HVAC system (2023)',
  'Hardwood floors throughout',
  'Full basement - extra living space',
  'Rental comps support strong ROI'
];

const DEAL_DESCRIPTIONS = [
  'Excellent flip opportunity in a rapidly appreciating neighborhood. The property needs cosmetic updates but has solid bones. Recent comps in the area support a strong ARV.',
  'Distressed property with significant upside potential. Seller is motivated and ready for a quick close. Perfect for experienced rehabbers looking for their next project.',
  'Buy-and-hold opportunity in a strong rental market. Current tenant paying below market rent with lease expiring soon. Opportunity to increase rents by 15-20%.',
  'Off-market deal sourced directly from a probate situation. Family is eager to sell quickly. Property is in livable condition but dated - light cosmetic rehab needed.',
  'Vacant lot in a high-demand area with approved plans for a single-family home. All permits in hand. Turnkey development opportunity.',
  'Three-bedroom ranch in a desirable neighborhood. Needs updated kitchen, bathrooms, and flooring. Strong comps within 0.5 miles support the ARV estimate.',
  'Duplex with both units occupied. Below market rents with month-to-month leases. Value-add opportunity through renovations and rent increases.',
  'Estate sale property with deferred maintenance. Large lot with potential for an ADU. City has streamlined ADU permits in this zone.',
  'Pre-foreclosure deal - owner willing to do a short sale. Bank has approved the price. Quick close possible with proof of funds.',
  'Solid brick construction in an established neighborhood. Needs roof, HVAC, and cosmetic updates. After repair, comparable properties are selling in 14 days or less.'
];

const NOTIFICATION_TEMPLATES = [
  { type: 'offer', title: 'New Offer Received', message: 'You received a new offer of ${amount} on your property at ${address}.' },
  { type: 'offer', title: 'Offer Accepted', message: 'Your offer on ${address} has been accepted! Next steps: review the contract.' },
  { type: 'offer', title: 'Offer Rejected', message: 'Unfortunately, your offer on ${address} was not accepted. Keep searching for your next deal!' },
  { type: 'deal', title: 'New Deal Match', message: 'A new deal at ${address} matches your investment criteria. Check it out!' },
  { type: 'deal', title: 'Deal Status Update', message: 'The deal at ${address} has been updated to ${status}.' },
  { type: 'transaction', title: 'Transaction Update', message: 'Your transaction for ${address} has moved to ${status}.' },
  { type: 'transaction', title: 'Closing Scheduled', message: 'Closing for ${address} is scheduled. Please review the contract documents.' },
  { type: 'system', title: 'Welcome to DispoHub', message: 'Your account has been verified. Start exploring wholesale deals in your area!' },
  { type: 'system', title: 'Subscription Renewed', message: 'Your ${tier} subscription has been renewed. Thank you for being a member!' },
  { type: 'rating', title: 'New Review', message: 'You received a ${score}-star review from a recent transaction. Check your profile!' },
  { type: 'deal', title: 'Price Drop Alert', message: 'The asking price on ${address} has been reduced. Now listed at ${price}.' },
  { type: 'system', title: 'Complete Your Profile', message: 'Add a profile photo and bio to build trust with other users.' },
];

const OFFER_MESSAGES = [
  'Interested in this property. Cash buyer, can close in 14 days.',
  'We have been looking in this area for months. Ready to move quickly with proof of funds available.',
  'Strong offer backed by our investment fund. We can accommodate your preferred timeline.',
  'Cash offer, no contingencies. We have closed 50+ deals this year and can provide references.',
  'Offering above asking - this fits our portfolio perfectly. Can we schedule a walkthrough?',
  'We love the numbers on this one. Our rehab crew is ready to start immediately after closing.',
  'Serious buyer here. We close with our own capital - no lending delays. Let us know your timeline.',
  'This is exactly what we are looking for. Flexible on closing date. Would like to discuss terms.',
  'Ready to wire earnest money today. Our attorney can handle closing within 10 business days.',
  'We are a local investment group and can close fast. Happy to work with your title company.'
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed() {
  console.log('\n  DispoHub Database Seeder');
  console.log('  =======================\n');

  // 1. Reset database
  db.data = {
    users: [],
    deals: [],
    offers: [],
    transactions: [],
    ratings: [],
    contracts: [],
    subscriptions: [],
    notifications: [],
    education: []
  };

  const passwordHash = bcrypt.hashSync('demo123', 10);

  // ------------------------------------------------------------------
  // 2. Demo Users (known credentials)
  // ------------------------------------------------------------------

  const demoWholesaler = {
    id: uuidv4(),
    role: 'wholesaler',
    email: 'marcus@demo.com',
    name: 'Marcus Johnson',
    avatar: null,
    phone: '(713) 555-0142',
    company: 'Johnson Wholesale Properties',
    bio: 'Houston-based wholesaler with 8 years of experience. Specializing in single-family fix-and-flip deals across Texas and the Southeast. Closed 200+ deals with a focus on transparent, investor-friendly transactions.',
    location: { state: 'TX', city: 'Houston' },
    verificationStatus: 'verified',
    verificationDocs: ['drivers_license.pdf', 'business_registration.pdf'],
    dealCount: 47,
    reputationScore: 4.7,
    memberSince: monthsAgo(18),
    subscriptionTier: 'pro',
    preferences: { notifyNewOffers: true, notifyDealMatches: true },
    passwordHash,
    createdAt: monthsAgo(18)
  };

  const demoInvestor = {
    id: uuidv4(),
    role: 'investor',
    email: 'sarah@demo.com',
    name: 'Sarah Chen',
    avatar: null,
    phone: '(404) 555-0298',
    company: 'Clearwater Holdings',
    bio: 'Real estate investor and portfolio manager focused on value-add residential properties in growth markets. Our fund targets 15-25% cash-on-cash returns. We close fast and honor our commitments.',
    location: { state: 'GA', city: 'Atlanta' },
    verificationStatus: 'verified',
    verificationDocs: ['passport.pdf', 'proof_of_funds.pdf', 'llc_docs.pdf'],
    dealCount: 32,
    reputationScore: 4.9,
    memberSince: monthsAgo(14),
    subscriptionTier: 'premium',
    preferences: {
      targetStates: ['GA', 'FL', 'TX', 'NC'],
      targetPropertyTypes: ['SFH', 'Multi-Family'],
      budgetMin: 80000,
      budgetMax: 350000,
      notifyNewDeals: true
    },
    passwordHash,
    createdAt: monthsAgo(14)
  };

  const demoAdmin = {
    id: uuidv4(),
    role: 'admin',
    email: 'alex@demo.com',
    name: 'Alex Rivera',
    avatar: null,
    phone: '(512) 555-0177',
    company: 'DispoHub Inc.',
    bio: 'Platform administrator.',
    location: { state: 'TX', city: 'Austin' },
    verificationStatus: 'verified',
    verificationDocs: [],
    dealCount: 0,
    reputationScore: 0,
    memberSince: monthsAgo(24),
    subscriptionTier: 'premium',
    preferences: {},
    passwordHash,
    createdAt: monthsAgo(24)
  };

  const allUsers = [demoWholesaler, demoInvestor, demoAdmin];

  // ------------------------------------------------------------------
  // 3. Additional wholesalers (10)
  // ------------------------------------------------------------------

  const wholesalers = [demoWholesaler];
  for (let i = 0; i < 10; i++) {
    const isMale = i % 2 === 0;
    const first = isMale ? FIRST_NAMES_M[i % FIRST_NAMES_M.length] : FIRST_NAMES_F[i % FIRST_NAMES_F.length];
    const last = LAST_NAMES[i];
    const loc = LOCATIONS[i % LOCATIONS.length];
    const joined = monthsAgo(randInt(3, 20));

    const user = {
      id: uuidv4(),
      role: 'wholesaler',
      email: `${first.toLowerCase()}.${last.toLowerCase()}@email.com`,
      name: `${first} ${last}`,
      avatar: null,
      phone: `(${randInt(200, 999)}) 555-${String(randInt(1000, 9999))}`,
      company: WHOLESALER_COMPANIES[i],
      bio: `Experienced wholesaler operating in the ${loc.city}, ${loc.state} market. Focused on finding great deals for serious investors.`,
      location: { state: loc.state, city: loc.city },
      verificationStatus: i < 8 ? 'verified' : 'pending',
      verificationDocs: i < 8 ? ['drivers_license.pdf'] : [],
      dealCount: randInt(5, 60),
      reputationScore: randFloat(3.5, 5.0),
      memberSince: joined,
      subscriptionTier: pick(['free', 'pro', 'pro']),
      preferences: { notifyNewOffers: true },
      passwordHash,
      createdAt: joined
    };

    wholesalers.push(user);
    allUsers.push(user);
  }

  // ------------------------------------------------------------------
  // 4. Additional investors (15)
  // ------------------------------------------------------------------

  const investors = [demoInvestor];
  for (let i = 0; i < 15; i++) {
    const isMale = i % 2 === 0;
    const first = isMale ? FIRST_NAMES_M[(i + 3) % FIRST_NAMES_M.length] : FIRST_NAMES_F[(i + 3) % FIRST_NAMES_F.length];
    const last = LAST_NAMES[(i + 10) % LAST_NAMES.length];
    const loc = LOCATIONS[(i + 4) % LOCATIONS.length];
    const tier = pick(['free', 'free', 'pro', 'pro', 'premium']);
    const joined = monthsAgo(randInt(1, 16));

    const user = {
      id: uuidv4(),
      role: 'investor',
      email: `${first.toLowerCase()}.${last.toLowerCase()}@email.com`,
      name: `${first} ${last}`,
      avatar: null,
      phone: `(${randInt(200, 999)}) 555-${String(randInt(1000, 9999))}`,
      company: INVESTOR_COMPANIES[i],
      bio: `Real estate investor specializing in ${pick(['fix-and-flip', 'buy-and-hold', 'BRRRR strategy', 'value-add multifamily', 'turnkey rentals'])} properties in ${loc.state}.`,
      location: { state: loc.state, city: loc.city },
      verificationStatus: i < 12 ? 'verified' : 'pending',
      verificationDocs: i < 12 ? ['proof_of_funds.pdf'] : [],
      dealCount: randInt(2, 40),
      reputationScore: randFloat(3.2, 5.0),
      memberSince: joined,
      subscriptionTier: tier,
      preferences: {
        targetStates: [loc.state],
        targetPropertyTypes: ['SFH'],
        budgetMin: pick([50000, 80000, 100000]),
        budgetMax: pick([250000, 350000, 500000]),
        notifyNewDeals: true
      },
      passwordHash,
      createdAt: joined
    };

    investors.push(user);
    allUsers.push(user);
  }

  db.data.users = allUsers;

  // ------------------------------------------------------------------
  // 5. Deals (25)
  // ------------------------------------------------------------------

  const PROPERTY_TYPES = ['SFH', 'SFH', 'SFH', 'SFH', 'Multi-Family', 'Multi-Family', 'Commercial', 'Land'];
  const STATUSES_POOL = [
    'active', 'active', 'active', 'active', 'active', 'active', 'active', 'active', 'active', 'active',
    'active', 'active', 'active', 'active', 'active',
    'pending_review', 'pending_review', 'pending_review',
    'sold', 'sold', 'sold',
    'under_contract', 'under_contract',
    'draft',
    'delisted'
  ];

  const deals = [];

  for (let i = 0; i < 25; i++) {
    const loc = LOCATIONS[i % LOCATIONS.length];
    const propType = PROPERTY_TYPES[i % PROPERTY_TYPES.length];
    const streetNum = randInt(100, 9999);
    const streetName = pick(STREET_NAMES);
    const streetType = pick(STREET_TYPES);
    const address = `${streetNum} ${streetName} ${streetType}`;

    let askingPrice, bedrooms, bathrooms, sqft, lotSize, yearBuilt;

    if (propType === 'SFH') {
      askingPrice = roundK(randInt(80, 350) * 1000);
      bedrooms = randInt(2, 5);
      bathrooms = pick([1, 1.5, 2, 2, 2.5, 3]);
      sqft = randInt(900, 2800);
      lotSize = `${randFloat(0.1, 0.5)} acres`;
      yearBuilt = randInt(1955, 2010);
    } else if (propType === 'Multi-Family') {
      askingPrice = roundK(randInt(150, 500) * 1000);
      bedrooms = randInt(4, 10);
      bathrooms = randInt(2, 6);
      sqft = randInt(2000, 5000);
      lotSize = `${randFloat(0.2, 0.8)} acres`;
      yearBuilt = randInt(1960, 2005);
    } else if (propType === 'Commercial') {
      askingPrice = roundK(randInt(200, 500) * 1000);
      bedrooms = null;
      bathrooms = randInt(2, 4);
      sqft = randInt(3000, 10000);
      lotSize = `${randFloat(0.3, 1.5)} acres`;
      yearBuilt = randInt(1970, 2015);
    } else {
      // Land
      askingPrice = roundK(randInt(30, 150) * 1000);
      bedrooms = null;
      bathrooms = null;
      sqft = null;
      lotSize = `${randFloat(0.5, 5.0)} acres`;
      yearBuilt = null;
    }

    const arvMultiplier = randFloat(1.3, 1.6);
    const arvEstimate = roundK(askingPrice * arvMultiplier);
    const rehabEstimate = propType === 'Land' ? 0 : roundK(randInt(15, 80) * 1000);
    const currentValue = roundK(askingPrice * randFloat(0.85, 1.05));
    const assignmentFee = roundK(randInt(5, 25) * 1000);

    const status = STATUSES_POOL[i];
    const wholesaler = wholesalers[i % wholesalers.length];
    const createdAt = daysAgo(randInt(5, 90));
    const listedAt = (status !== 'draft') ? createdAt : null;

    const numHighlights = randInt(2, 4);
    const shuffled = [...PROPERTY_HIGHLIGHTS].sort(() => Math.random() - 0.5);
    const highlights = shuffled.slice(0, numHighlights);

    const deal = {
      id: uuidv4(),
      wholesalerId: wholesaler.id,
      status,
      address,
      city: loc.city,
      state: loc.state,
      zip: pick(loc.zips),
      county: loc.county,
      propertyType: propType,
      bedrooms,
      bathrooms,
      sqft,
      lotSize,
      yearBuilt,
      photos: [],
      askingPrice,
      arvEstimate,
      rehabEstimate,
      currentValue,
      assignmentFee,
      description: DEAL_DESCRIPTIONS[i % DEAL_DESCRIPTIONS.length],
      highlights,
      approvalStatus: (status === 'draft' || status === 'pending_review') ? null : 'approved',
      approvedBy: (status !== 'draft' && status !== 'pending_review') ? demoAdmin.id : null,
      listedAt,
      delistedAt: status === 'delisted' ? daysAgo(randInt(1, 10)) : null,
      viewCount: randInt(10, 450),
      saveCount: randInt(2, 40),
      offerCount: 0,   // Will be updated when offers are created
      savedBy: [],
      createdAt
    };

    deals.push(deal);
  }

  db.data.deals = deals;

  // ------------------------------------------------------------------
  // 6. Offers (20) on active / under_contract deals
  // ------------------------------------------------------------------

  const activeDeals = deals.filter(d => d.status === 'active' || d.status === 'under_contract');
  const offers = [];
  const OFFER_STATUS_POOL = [
    'pending', 'pending', 'pending', 'pending', 'pending', 'pending',
    'accepted', 'accepted', 'accepted', 'accepted',
    'rejected', 'rejected', 'rejected',
    'withdrawn'
  ];

  for (let i = 0; i < 20; i++) {
    const deal = activeDeals[i % activeDeals.length];
    const investor = investors[i % investors.length];

    // Skip if investor is also the wholesaler (shouldn't happen, but safety check)
    if (investor.id === deal.wholesalerId) continue;

    const offerAmount = roundK(deal.askingPrice * randFloat(0.88, 1.08));
    const status = OFFER_STATUS_POOL[i % OFFER_STATUS_POOL.length];
    const createdAt = daysAgo(randInt(1, 30));

    const offer = {
      id: uuidv4(),
      dealId: deal.id,
      investorId: investor.id,
      amount: offerAmount,
      message: OFFER_MESSAGES[i % OFFER_MESSAGES.length],
      status,
      createdAt,
      respondedAt: status !== 'pending' ? daysAgo(randInt(0, 5)) : null,
      expiresAt: monthsFromNow(1)
    };

    offers.push(offer);

    // Update deal's offer count
    const dealIdx = deals.findIndex(d => d.id === deal.id);
    deals[dealIdx].offerCount++;
  }

  db.data.offers = offers;

  // ------------------------------------------------------------------
  // 7. Transactions (8 completed)
  // ------------------------------------------------------------------

  // Use sold deals + accepted offers to create realistic transactions
  const soldDeals = deals.filter(d => d.status === 'sold');
  const acceptedOffers = offers.filter(o => o.status === 'accepted');
  const transactions = [];
  const contractsList = [];

  // Create transactions from sold deals first
  for (let i = 0; i < Math.min(soldDeals.length, 3); i++) {
    const deal = soldDeals[i];
    const investor = investors[i % investors.length];
    const salePrice = deal.askingPrice;
    const platformFee = roundK(salePrice * (PLATFORM_FEE_PERCENT / 100));
    const closingDate = daysAgo(randInt(5, 30));

    const contractId = uuidv4();
    const txn = {
      id: uuidv4(),
      dealId: deal.id,
      offerId: null,
      wholesalerId: deal.wholesalerId,
      investorId: investor.id,
      status: 'completed',
      salePrice,
      platformFee,
      platformFeePercent: PLATFORM_FEE_PERCENT,
      escrowAmount: roundK(salePrice * 0.01),
      contractId,
      closingDate,
      completedAt: closingDate,
      statusHistory: [
        { status: 'escrow_funded', timestamp: daysAgo(randInt(40, 60)) },
        { status: 'under_review', timestamp: daysAgo(randInt(30, 39)) },
        { status: 'closing', timestamp: daysAgo(randInt(15, 29)) },
        { status: 'completed', timestamp: closingDate }
      ],
      createdAt: daysAgo(randInt(40, 60))
    };

    transactions.push(txn);

    // Create matching contract
    contractsList.push({
      id: contractId,
      transactionId: txn.id,
      templateId: 'tpl-assignment-v1',
      type: 'assignment',
      status: 'fully_signed',
      parties: [
        { userId: deal.wholesalerId, role: 'assignor', signedAt: daysAgo(randInt(31, 40)) },
        { userId: investor.id, role: 'assignee', signedAt: daysAgo(randInt(28, 30)) }
      ],
      documentContent: `ASSIGNMENT OF CONTRACT\n\nThis Assignment of Contract ("Agreement") is entered into between the parties identified below for the property located at ${deal.address}, ${deal.city}, ${deal.state} ${deal.zip}.\n\nAssignment Fee: $${deal.assignmentFee?.toLocaleString()}\nPurchase Price: $${salePrice.toLocaleString()}\n\n[Full contract terms would appear here in production]`,
      createdAt: daysAgo(randInt(40, 50))
    });
  }

  // Create transactions from accepted offers
  for (let i = 0; i < Math.min(acceptedOffers.length, 5); i++) {
    const offer = acceptedOffers[i];
    const deal = deals.find(d => d.id === offer.dealId);
    if (!deal) continue;

    const salePrice = offer.amount;
    const platformFee = roundK(salePrice * (PLATFORM_FEE_PERCENT / 100));
    const isCompleted = i < 3;
    const closingDate = isCompleted ? daysAgo(randInt(3, 20)) : monthsFromNow(1);

    const contractId = uuidv4();
    const status = isCompleted ? 'completed' : (i === 3 ? 'closing' : 'under_review');

    const statusHistory = [
      { status: 'escrow_funded', timestamp: daysAgo(randInt(30, 50)) },
      { status: 'under_review', timestamp: daysAgo(randInt(20, 29)) }
    ];
    if (status === 'closing' || status === 'completed') {
      statusHistory.push({ status: 'closing', timestamp: daysAgo(randInt(10, 19)) });
    }
    if (status === 'completed') {
      statusHistory.push({ status: 'completed', timestamp: closingDate });
    }

    const txn = {
      id: uuidv4(),
      dealId: deal.id,
      offerId: offer.id,
      wholesalerId: deal.wholesalerId,
      investorId: offer.investorId,
      status,
      salePrice,
      platformFee,
      platformFeePercent: PLATFORM_FEE_PERCENT,
      escrowAmount: roundK(salePrice * 0.01),
      contractId,
      closingDate,
      completedAt: isCompleted ? closingDate : null,
      statusHistory,
      createdAt: daysAgo(randInt(30, 50))
    };

    transactions.push(txn);

    const contractStatus = isCompleted ? 'fully_signed' : (i === 3 ? 'signed_by_one' : 'sent');
    const parties = [
      { userId: deal.wholesalerId, role: 'assignor', signedAt: daysAgo(randInt(20, 30)) }
    ];
    if (contractStatus === 'signed_by_one' || contractStatus === 'fully_signed') {
      parties.push({ userId: offer.investorId, role: 'assignee', signedAt: isCompleted ? daysAgo(randInt(10, 19)) : null });
    }
    if (contractStatus === 'fully_signed') {
      parties[1].signedAt = daysAgo(randInt(10, 19));
    }

    contractsList.push({
      id: contractId,
      transactionId: txn.id,
      templateId: 'tpl-assignment-v1',
      type: pick(['assignment', 'assignment', 'purchase']),
      status: contractStatus,
      parties,
      documentContent: `ASSIGNMENT OF CONTRACT\n\nThis Assignment of Contract ("Agreement") is entered into between the parties identified below for the property located at ${deal.address}, ${deal.city}, ${deal.state} ${deal.zip}.\n\nOffer Amount: $${salePrice.toLocaleString()}\n\n[Full contract terms would appear here in production]`,
      createdAt: daysAgo(randInt(30, 50))
    });
  }

  db.data.transactions = transactions;
  db.data.contracts = contractsList;

  // ------------------------------------------------------------------
  // 8. Ratings (2 per completed transaction)
  // ------------------------------------------------------------------

  const completedTransactions = transactions.filter(t => t.status === 'completed');
  const ratings = [];

  const REVIEW_COMMENTS_POSITIVE = [
    'Excellent to work with. Transparent about the property condition and very responsive throughout the process.',
    'Smooth transaction from start to finish. Would definitely work with them again.',
    'Very professional and kept us updated every step of the way. Numbers were accurate.',
    'Great communication and followed through on everything. The deal closed on time as promised.',
    'Top-notch professionalism. The property was exactly as described and the financials checked out.',
    'One of the best transactions I have done. Clear documentation and no surprises.',
    'Responsive, honest, and easy to work with. Looking forward to the next deal.',
    'Closed quickly and efficiently. Great partner for wholesale deals.'
  ];

  const REVIEW_COMMENTS_MIXED = [
    'Good overall experience. Communication could have been a bit more timely during due diligence.',
    'Deal was solid but took longer to close than expected. Would still work with them again.',
    'Numbers were slightly off from initial estimates but still a profitable deal.',
    'Professional but hard to reach at times. The end result was positive though.'
  ];

  for (const txn of completedTransactions) {
    const isPositive1 = Math.random() > 0.2;
    const isPositive2 = Math.random() > 0.2;

    // Wholesaler reviews investor
    const score1 = isPositive1 ? randInt(4, 5) : randInt(3, 4);
    ratings.push({
      id: uuidv4(),
      transactionId: txn.id,
      reviewerId: txn.wholesalerId,
      revieweeId: txn.investorId,
      score: score1,
      comment: isPositive1
        ? pick(REVIEW_COMMENTS_POSITIVE)
        : pick(REVIEW_COMMENTS_MIXED),
      categories: {
        communication: randInt(score1 - 1 || 1, 5),
        dealQuality: randInt(score1 - 1 || 1, 5),
        professionalism: randInt(score1, 5),
        timeliness: randInt(score1 - 1 || 1, 5)
      },
      createdAt: daysAgo(randInt(1, 15))
    });

    // Investor reviews wholesaler
    const score2 = isPositive2 ? randInt(4, 5) : randInt(3, 4);
    ratings.push({
      id: uuidv4(),
      transactionId: txn.id,
      reviewerId: txn.investorId,
      revieweeId: txn.wholesalerId,
      score: score2,
      comment: isPositive2
        ? pick(REVIEW_COMMENTS_POSITIVE)
        : pick(REVIEW_COMMENTS_MIXED),
      categories: {
        communication: randInt(score2 - 1 || 1, 5),
        dealQuality: randInt(score2 - 1 || 1, 5),
        professionalism: randInt(score2, 5),
        timeliness: randInt(score2 - 1 || 1, 5)
      },
      createdAt: daysAgo(randInt(1, 15))
    });
  }

  db.data.ratings = ratings;

  // ------------------------------------------------------------------
  // 9. Subscriptions (all investors + wholesalers with paid tiers)
  // ------------------------------------------------------------------

  const subscriptions = [];

  for (const user of allUsers) {
    if (user.role === 'admin') continue;

    const tier = user.subscriptionTier;
    const tierInfo = SUBSCRIPTION_TIERS[tier];
    const startDate = user.memberSince;

    const features = [];
    if (tier === 'pro' || tier === 'premium') {
      features.push('Unlimited offers per month', 'Advanced matching');
    }
    if (tier === 'premium') {
      features.push('Priority matching', 'Full analytics dashboard', 'Dedicated support');
    }
    if (tier === 'free') {
      features.push('3 offers per month', 'Basic matching', '3 calculators');
    }

    subscriptions.push({
      id: uuidv4(),
      userId: user.id,
      tier,
      price: tierInfo.price,
      features,
      startDate,
      renewalDate: tier !== 'free' ? monthsFromNow(randInt(1, 11)) : null,
      status: 'active'
    });
  }

  db.data.subscriptions = subscriptions;

  // ------------------------------------------------------------------
  // 10. Notifications (30 across all users)
  // ------------------------------------------------------------------

  const notifications = [];
  const notificationRecipients = allUsers.filter(u => u.role !== 'admin');

  for (let i = 0; i < 30; i++) {
    const recipient = notificationRecipients[i % notificationRecipients.length];
    const template = NOTIFICATION_TEMPLATES[i % NOTIFICATION_TEMPLATES.length];
    const deal = deals[i % deals.length];

    // Simple template variable replacement
    let message = template.message
      .replace('${amount}', `$${roundK(randInt(80, 350) * 1000).toLocaleString()}`)
      .replace('${address}', `${deal.address}, ${deal.city}`)
      .replace('${status}', deal.status)
      .replace('${tier}', recipient.subscriptionTier)
      .replace('${score}', String(randInt(4, 5)))
      .replace('${price}', `$${deal.askingPrice.toLocaleString()}`);

    notifications.push({
      id: uuidv4(),
      userId: recipient.id,
      type: template.type,
      title: template.title,
      message,
      read: i < 15,   // First half are read, second half unread
      relatedId: deal.id,
      relatedType: template.type === 'system' ? null : 'deal',
      createdAt: daysAgo(randInt(0, 30))
    });
  }

  db.data.notifications = notifications;

  // ------------------------------------------------------------------
  // 11. Write everything to disk
  // ------------------------------------------------------------------

  await db.write();

  // ------------------------------------------------------------------
  // 12. Summary
  // ------------------------------------------------------------------

  console.log('  Seeded successfully!\n');
  console.log('  Summary:');
  console.log('  --------');
  console.log(`  Users:          ${db.data.users.length}`);
  console.log(`    - Wholesalers:  ${db.data.users.filter(u => u.role === 'wholesaler').length}`);
  console.log(`    - Investors:    ${db.data.users.filter(u => u.role === 'investor').length}`);
  console.log(`    - Admins:       ${db.data.users.filter(u => u.role === 'admin').length}`);
  console.log(`  Deals:          ${db.data.deals.length}`);
  console.log(`    - Active:       ${db.data.deals.filter(d => d.status === 'active').length}`);
  console.log(`    - Pending:      ${db.data.deals.filter(d => d.status === 'pending_review').length}`);
  console.log(`    - Sold:         ${db.data.deals.filter(d => d.status === 'sold').length}`);
  console.log(`    - Under contract: ${db.data.deals.filter(d => d.status === 'under_contract').length}`);
  console.log(`  Offers:         ${db.data.offers.length}`);
  console.log(`  Transactions:   ${db.data.transactions.length}`);
  console.log(`    - Completed:    ${db.data.transactions.filter(t => t.status === 'completed').length}`);
  console.log(`  Ratings:        ${db.data.ratings.length}`);
  console.log(`  Contracts:      ${db.data.contracts.length}`);
  console.log(`  Subscriptions:  ${db.data.subscriptions.length}`);
  console.log(`  Notifications:  ${db.data.notifications.length}`);
  console.log('\n  Demo credentials:');
  console.log('  -----------------');
  console.log('  Wholesaler:  marcus@demo.com / demo123');
  console.log('  Investor:    sarah@demo.com  / demo123');
  console.log('  Admin:       alex@demo.com   / demo123');
  console.log('');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
