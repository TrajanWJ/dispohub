import { Router } from 'express';

const router = Router();

// ---------------------------------------------------------------------------
// Hardcoded educational courses
// ---------------------------------------------------------------------------
const COURSES = [
  {
    id: 'edu-101',
    title: 'Wholesale Real Estate 101',
    description: 'Learn the fundamentals of wholesale real estate investing, including how to find deals, negotiate contracts, and assign them to end buyers for a profit.',
    category: 'Fundamentals',
    readTime: '12 min',
    author: 'DispoHub Academy',
    content: `Wholesale real estate is one of the fastest ways to get started in real estate investing with little to no capital. At its core, wholesaling involves finding deeply discounted properties, getting them under contract, and then assigning that contract to an end buyer (usually a fix-and-flip investor or landlord) for a fee.

Here's how the process works:

1. FIND MOTIVATED SELLERS — Look for homeowners who need to sell quickly due to foreclosure, divorce, probate, job relocation, or deferred maintenance. Marketing channels include direct mail, driving for dollars, online ads, and networking.

2. ANALYZE THE DEAL — Calculate the After Repair Value (ARV) using recent comparable sales. Estimate rehab costs by walking the property or using a rehab calculator. Determine your Maximum Allowable Offer (MAO) using the formula: MAO = ARV x 70% - Rehab Costs - Your Fee.

3. GET IT UNDER CONTRACT — Present your offer to the seller. Use an assignable purchase agreement that gives you the right to assign the contract to another buyer. Negotiate terms that work for both parties.

4. FIND YOUR BUYER — Market the deal to your buyer list through platforms like DispoHub, local REIA meetings, social media, and email blasts. Present the numbers clearly: purchase price, ARV, rehab estimate, and potential profit.

5. ASSIGN AND CLOSE — Once you find a buyer, execute an assignment of contract. The buyer takes over your position in the purchase agreement and closes directly with the seller. You collect your assignment fee at closing.

Key Principles:
- Always be transparent about being a wholesaler
- Build your buyer list before you need it
- Focus on building long-term relationships
- Never overcommit — only put deals under contract you can realistically close or assign
- Keep learning and adapting your strategy`,
  },
  {
    id: 'edu-102',
    title: 'Finding Motivated Sellers',
    description: 'Master the art of lead generation to find property owners ready to sell at a discount. Covers direct mail, driving for dollars, online marketing, and more.',
    category: 'Lead Generation',
    readTime: '10 min',
    author: 'DispoHub Academy',
    content: `Finding motivated sellers is the lifeblood of wholesale real estate. Without a steady pipeline of leads, your business will stall. Here are the most effective strategies:

DIRECT MAIL
Direct mail remains one of the top lead generation channels for wholesalers. Target lists include:
- Pre-foreclosure / Notice of Default lists
- Probate leads (inherited properties)
- Absentee owners (landlords who live out of state)
- Tax delinquent properties
- Code violation properties
- High equity homeowners with long ownership duration

Send handwritten-style letters or postcards with a clear call to action. Consistency is key — plan for at least 5-7 touches to the same list.

DRIVING FOR DOLLARS
Get in your car and drive through target neighborhoods looking for signs of distress:
- Overgrown lawns and boarded windows
- Code violation notices on the door
- Accumulated mail or newspapers
- Properties that clearly need repair
Use apps to log addresses and skip trace the owners.

ONLINE MARKETING
- Build a simple website with a property submission form
- Run Google Ads targeting "sell my house fast [city]"
- Post on Craigslist and Facebook Marketplace
- Create social media content about your recent deals
- SEO-optimized blog posts about selling distressed properties

NETWORKING
- Attend local Real Estate Investor Association (REIA) meetings
- Build relationships with probate attorneys and estate planners
- Connect with property managers who know tired landlords
- Partner with real estate agents who encounter off-market deals
- Join online wholesaling communities and forums

COLD CALLING & TEXTING
- Skip trace property owners for phone numbers
- Use virtual assistants to make initial calls
- Follow up with warm leads personally
- Text messaging campaigns (ensure TCPA compliance)

Remember: The fortune is in the follow-up. Most deals close after 5-12 contacts with the seller. Be persistent, professional, and patient.`,
  },
  {
    id: 'edu-103',
    title: 'Analyzing Deals Like a Pro',
    description: 'Deep dive into ARV estimation, comparable sales analysis, rehab cost calculation, and determining your maximum allowable offer.',
    category: 'Deal Analysis',
    readTime: '15 min',
    author: 'DispoHub Academy',
    content: `Accurate deal analysis separates successful wholesalers from those who lose money. Every number matters, and your reputation depends on providing honest, realistic estimates to your buyers.

AFTER REPAIR VALUE (ARV)
The ARV is what the property will be worth after all repairs are completed. To calculate it:

1. Pull comparable sales (comps) from the last 3-6 months within 0.5 miles
2. Look for similar properties: same bedroom/bathroom count, similar square footage (within 20%), similar age and style
3. Adjust for differences: add or subtract value for extra bedrooms, bathrooms, garage, lot size, and condition
4. Calculate the average price per square foot from your best 3-5 comps
5. Multiply by your subject property's square footage

Pro tip: Always use SOLD prices, not listing prices. And be conservative — your buyers will verify your numbers.

REHAB COST ESTIMATION
Walk the property systematically and note every repair needed:

- Roof: $5,000-$15,000 for full replacement
- HVAC: $3,000-$8,000 per unit
- Kitchen: $5,000 (cosmetic) to $25,000+ (full remodel)
- Bathrooms: $3,000-$12,000 each
- Flooring: $2-$8 per square foot
- Paint (interior): $1-$3 per square foot
- Electrical panel: $1,500-$3,000
- Plumbing: $2,000-$10,000 depending on scope
- Foundation: $5,000-$30,000 (get a specialist inspection)
- Windows: $300-$800 each

MAXIMUM ALLOWABLE OFFER (MAO)
The industry-standard formula is:
MAO = ARV x 70% - Rehab Costs - Your Assignment Fee

The 70% rule gives the end buyer a 30% margin for profit, closing costs, and holding costs. Some investors will accept tighter margins (75%) and some require more room (65%), so know your buyers.

Example:
- ARV: $200,000
- Rehab: $30,000
- Your fee: $10,000
- MAO: $200,000 x 0.70 - $30,000 - $10,000 = $100,000

Always present a full analysis package to your buyers including comps, photos, rehab breakdown, and your MAO calculation. Transparency builds trust and repeat business.`,
  },
  {
    id: 'edu-104',
    title: 'Building Your Buyer List',
    description: 'Strategies for building a robust network of cash buyers and investors who are ready to purchase your wholesale deals.',
    category: 'Networking',
    readTime: '8 min',
    author: 'DispoHub Academy',
    content: `Your buyer list is your most valuable asset as a wholesaler. A strong buyer list means you can move deals quickly and consistently earn assignment fees. Here's how to build one:

PLATFORMS LIKE DISPOHUB
Online deal marketplaces are the fastest way to connect with verified, active investors. List your deals with complete information — address, photos, ARV, rehab estimate, and asking price. Serious buyers appreciate transparency and detailed analysis.

LOCAL REIA MEETINGS
Real Estate Investor Association meetings are goldmines for buyer contacts. Attend regularly, introduce yourself, and collect business cards. Many investors at these meetings are actively looking for their next deal.

COURTHOUSE STEPS
Cash buyers attend foreclosure auctions. Go to your county courthouse on auction days and network with the bidders. These are proven cash buyers with funds ready to deploy.

PROPERTY MANAGEMENT COMPANIES
Property managers work with landlords who are always looking to add to their portfolios. Build relationships with local property management companies and offer them a finder's fee for referrals.

SOCIAL MEDIA & ONLINE
- Join Facebook groups dedicated to real estate investing in your market
- Post deal teasers on Instagram and TikTok
- Create a YouTube channel showcasing your deal analysis process
- Build an email list with a simple landing page

CLASSIFY YOUR BUYERS
Not all buyers are the same. Categorize them by:
- Investment strategy: Fix-and-flip vs. buy-and-hold
- Budget range: What price points do they target?
- Location preference: Which neighborhoods or cities?
- Property type: SFH, multi-family, commercial, land?
- Speed: How quickly can they close?

NURTURE RELATIONSHIPS
- Send weekly deal blasts to your list
- Follow up after every deal — even if they didn't buy
- Ask for feedback on your pricing and deal analysis
- Refer deals that don't fit your criteria to other wholesalers
- Host meetups and networking events

Remember: quality over quantity. Having 50 active, funded buyers who trust you is worth more than 5,000 cold contacts.`,
  },
  {
    id: 'edu-105',
    title: 'Contract Essentials',
    description: 'Understand the legal basics of wholesale contracts, assignment agreements, and how to protect yourself in every transaction.',
    category: 'Legal',
    readTime: '11 min',
    author: 'DispoHub Academy',
    content: `Understanding contracts is critical for wholesalers. Every deal involves legal agreements, and mistakes can cost you your fee — or worse, expose you to liability. Here's what you need to know:

THE PURCHASE AGREEMENT
This is the contract between you (the wholesaler) and the seller. Key clauses to include:

1. ASSIGNABILITY CLAUSE — The most important clause for wholesalers. It should state: "Buyer, or buyer's assigns, shall have the right to assign this contract to a third party." Without this clause, you cannot assign the deal.

2. INSPECTION CONTINGENCY — Gives you a period (typically 7-14 days) to inspect the property and back out if issues are discovered. This protects you if the property has hidden problems.

3. EARNEST MONEY DEPOSIT — Typically $100-$1,000 for wholesale deals. This shows good faith. Include language about when and how the deposit is refundable.

4. CLOSING TIMELINE — Specify a realistic closing date, usually 30-45 days. Make sure you have enough time to find a buyer.

5. PROPERTY CONDITION — Include "AS-IS" language so the seller understands they don't need to make repairs.

THE ASSIGNMENT CONTRACT
This is the agreement between you and your end buyer. It transfers your rights under the purchase agreement to them. Key elements:

- Original contract reference (date, parties, property address)
- Assignment fee amount
- Buyer's responsibilities (closing costs, inspections, etc.)
- Timeline for closing
- Earnest money deposit from the assignee

DOUBLE CLOSING ALTERNATIVE
Some states restrict or complicate assignments. In these cases, you can do a double close:
- Transaction A: You buy from the seller
- Transaction B: You immediately sell to your buyer
- Both closings happen on the same day (or within a few days)
- You need transactional funding or your buyer's funds to close Transaction A

LEGAL CONSIDERATIONS
- Check your state's laws on wholesaling — some states require a real estate license for certain activities
- Always use a title company or real estate attorney to handle closings
- Disclose your role as a wholesaler to all parties
- Never misrepresent yourself as the end buyer if you plan to assign
- Keep copies of all signed documents for your records
- Consult with a real estate attorney to review your contracts

COMMON MISTAKES TO AVOID
- Using non-assignable contracts
- Not including enough contingency time
- Overcommitting earnest money you can't afford to lose
- Failing to disclose your assignment fee
- Not having an attorney review your contracts
- Skipping title searches`,
  },
  {
    id: 'edu-106',
    title: 'Scaling Your Wholesale Business',
    description: 'Proven strategies for growing from your first deal to a full-scale wholesale operation with systems, teams, and consistent deal flow.',
    category: 'Growth',
    readTime: '14 min',
    author: 'DispoHub Academy',
    content: `Once you've closed your first few deals, it's time to think about scaling. The difference between a part-time wholesaler and a six-figure operation comes down to systems, team, and consistency.

SYSTEMIZE YOUR PROCESSES
Document every step of your business:
- Lead generation campaigns and schedules
- Lead intake and qualification scripts
- Deal analysis templates and checklists
- Offer presentation templates
- Contract processing workflow
- Buyer marketing and follow-up sequences
- Closing coordination checklist

Use CRM software to track every lead from first contact to closing. Automate follow-ups, reminders, and marketing sequences.

BUILD YOUR TEAM
You can't do everything yourself at scale. Key hires include:

1. ACQUISITION MANAGER — Handles seller calls, property visits, and negotiations. This is often the first hire.
2. DISPOSITION MANAGER — Manages your buyer list, markets deals, and negotiates with buyers.
3. TRANSACTION COORDINATOR — Handles paperwork, coordinates with title companies, and ensures smooth closings.
4. VIRTUAL ASSISTANTS — Handle data entry, skip tracing, cold calling, and list management.
5. MARKETING SPECIALIST — Manages your online presence, ad campaigns, and content creation.

INCREASE YOUR MARKETING CHANNELS
Don't rely on a single lead source. Diversify across:
- Direct mail (multiple lists, multiple campaigns)
- Pay-per-click advertising (Google, Facebook, Instagram)
- SEO and content marketing
- Cold calling and texting
- TV and radio advertising (for established businesses)
- Referral partnerships
- Platform listings (DispoHub, etc.)

FINANCIAL MANAGEMENT
- Track every dollar in and out
- Set aside 30% of profits for taxes
- Reinvest 40-50% of profits into marketing
- Maintain a cash reserve for earnest money deposits
- Consider forming an LLC for liability protection

ADVANCED STRATEGIES
- Novation agreements — Control properties without being on the contract
- Creative financing — Subject-to, seller financing, lease options
- Land development — Wholesale land to builders and developers
- Multi-family — Higher assignment fees on larger deals
- Virtual wholesaling — Work in multiple markets from home
- Fund building — Create a real estate fund for larger acquisitions

METRICS TO TRACK
- Cost per lead (by marketing channel)
- Lead to contract ratio
- Contract to close ratio
- Average assignment fee
- Revenue per marketing dollar spent
- Time from contract to close
- Buyer satisfaction and repeat rate

The most successful wholesalers treat this as a real business, not a side hustle. Invest in your education, build systems, hire great people, and always put relationships first.`,
  },
];

// ---------------------------------------------------------------------------
// GET /api/education/courses — List all courses
// ---------------------------------------------------------------------------
router.get('/courses', (req, res) => {
  // Return courses without full content for list view
  const courses = COURSES.map(({ content, ...course }) => ({
    ...course,
    contentPreview: content.substring(0, 200) + '...',
  }));

  res.json({ courses, total: courses.length });
});

// ---------------------------------------------------------------------------
// GET /api/education/courses/:id — Single course detail
// ---------------------------------------------------------------------------
router.get('/courses/:id', (req, res) => {
  const course = COURSES.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  res.json({ course });
});

export default router;
