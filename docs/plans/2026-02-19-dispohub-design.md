# DispoHub - Design Document

## Overview

Local Electron prototype of a wholesale real estate dispo marketplace where wholesalers list contracted deals and investors browse, evaluate, and acquire properties in real time. Built as a demo-able prototype with seeded data, convertible to a web platform later.

## Tech Stack

- **Electron**: Desktop shell, spawns server as child process, loads React frontend in BrowserWindow
- **Express**: Standalone API server on localhost:3001
- **React + Vite**: Frontend SPA on localhost:5173
- **lowdb**: JSON file-based database for local prototype
- **Dark professional theme**: Similar to Robinhood/Discord aesthetic

## Architecture

Electron shell + separate Express server. Electron spawns Express as a child process and loads the React dev server (or built static files) in a BrowserWindow. The server and client can also run independently in a browser during development.

```
dispohub/
├── electron/                          # Electron shell
│   ├── main.js                        # Spawns Express, opens BrowserWindow
│   ├── preload.js                     # Secure IPC bridge
│   └── electron-builder.config.js     # Packaging config
├── server/                            # Express API (standalone)
│   ├── index.js                       # Express entry + CORS + middleware
│   ├── config/
│   │   ├── constants.js               # Fees, tier limits, matching weights
│   │   └── regions.js                 # Region-specific legal data
│   ├── routes/
│   │   ├── auth.js                    # Login, register, dev role-switch
│   │   ├── deals.js                   # CRUD listings, approval, search/filter
│   │   ├── users.js                   # Profiles, verification, deal history
│   │   ├── matching.js                # Preference-based matching
│   │   ├── ratings.js                 # Post-transaction reviews
│   │   ├── transactions.js            # Offer → escrow → close pipeline
│   │   ├── calculators.js             # ARV, ROI, rehab, cash-on-cash, cap rate
│   │   ├── contracts.js               # Template CRUD, signing simulation
│   │   ├── subscriptions.js           # Tier management, billing simulation
│   │   ├── notifications.js           # In-app notifications
│   │   ├── admin.js                   # Moderation, user mgmt, platform stats
│   │   └── education.js               # Course/resource listings
│   ├── services/
│   │   ├── matchingEngine.js          # Location/budget/type preference matching
│   │   ├── reputationEngine.js        # Weighted reputation scoring
│   │   ├── escrowService.js           # Escrow state machine
│   │   ├── dealApproval.js            # Quality control / auto-approval logic
│   │   ├── feeCalculator.js           # 5% transaction fee + tier discounts
│   │   └── notificationService.js     # Notification dispatch
│   ├── models/
│   │   ├── User.js                    # Wholesaler, investor, admin schema
│   │   ├── Deal.js                    # Property listing schema
│   │   ├── Transaction.js             # Offer → escrow → closing schema
│   │   ├── Rating.js                  # Review + score schema
│   │   ├── Contract.js                # Template + signed instances
│   │   ├── Subscription.js            # Tier, billing, features
│   │   └── Notification.js            # Type, read status, target user
│   ├── db/
│   │   ├── db.js                      # lowdb setup
│   │   ├── seed.js                    # Realistic demo data generator
│   │   └── data/                      # JSON files (gitignored)
│   └── middleware/
│       ├── auth.js                    # JWT/session validation
│       ├── roleGuard.js               # Role-based route protection
│       ├── dealValidator.js           # Deal data quality validation
│       └── rateLimiter.js             # Basic rate limiting
├── client/                            # React frontend (Vite)
│   ├── public/assets/                 # Images, icons, logos
│   ├── src/
│   │   ├── main.jsx                   # App entry
│   │   ├── App.jsx                    # Router + layout wrapper
│   │   ├── api/                       # API client modules
│   │   ├── context/                   # Auth, Theme, Notification contexts
│   │   ├── hooks/                     # useAuth, useDeals, useCalculator, etc.
│   │   ├── layouts/                   # AppLayout, Wholesaler, Investor, Admin
│   │   ├── pages/                     # Role-organized pages (see Views section)
│   │   ├── components/                # Organized by domain (see Components)
│   │   ├── utils/                     # Calculator functions, formatters, validators
│   │   └── styles/                    # Dark theme, CSS variables
│   └── vite.config.js
├── docs/plans/
├── package.json
└── .gitignore
```

## User Roles

| Role | Capabilities | Dashboard |
|------|-------------|-----------|
| **Wholesaler** | List deals, view/accept/reject offers, manage contracts, view earnings, access calculators, rate investors | Active listings, pending offers, recent transactions, earnings |
| **Investor** | Browse/filter deals, save deals, make offers, set preferences, get matches, manage subscription, rate wholesalers | Matched deals, saved deals, active offers, purchases |
| **Admin** | Approve/reject deals, verify users, manage disputes, view analytics, configure fees/tiers, moderate | Platform stats, pending approvals, disputes, revenue |

## Data Models

### User
```
id, role (wholesaler|investor|admin), email, name, avatar, phone, company, bio,
location, verificationStatus (pending|verified|rejected), verificationDocs[],
dealCount, reputationScore, memberSince, subscriptionTier (free|pro|premium),
preferences {}
```

### Deal (Property Listing)
```
id, wholesalerId, status (draft|pending_review|active|under_contract|sold|delisted),
address, city, state, zip, county, propertyType (SFH|multi|commercial|land),
bedrooms, bathrooms, sqft, lotSize, yearBuilt, photos[],
askingPrice, arvEstimate, rehabEstimate, currentValue, assignmentFee,
description, highlights[], approvalStatus, approvedBy, listedAt, delistedAt,
viewCount, saveCount, offerCount
```

### Offer
```
id, dealId, investorId, amount, message,
status (pending|accepted|rejected|withdrawn|expired),
createdAt, respondedAt, expiresAt
```

### Transaction
```
id, dealId, offerId, wholesalerId, investorId,
status (escrow_funded|under_review|closing|completed|cancelled|disputed),
salePrice, platformFee (5%), escrowAmount, contractId, closingDate, completedAt
```

### Rating
```
id, transactionId, reviewerId, revieweeId, score (1-5), comment,
categories {communication, dealQuality, professionalism, timeliness}, createdAt
```

### Contract
```
id, transactionId, templateId, type (assignment|purchase),
status (draft|sent|signed_by_one|fully_signed),
parties [{userId, signedAt}], documentContent, createdAt
```

### Subscription
```
id, userId, tier (free|pro|premium), price, features[],
startDate, renewalDate, status (active|expired|cancelled)
```

### Notification
```
id, userId, type (offer_received|offer_accepted|deal_approved|new_match|...),
title, message, read, relatedId, createdAt
```

## Role-Specific Views

### Wholesaler Views

**Sidebar**: Dashboard | My Deals | Create Deal | Transactions | Contracts | Earnings | Calculators | Profile

- **Dashboard**: Stats bar (Active Listings / Pending Offers / Total Earned / Reputation), "Deals Needing Attention" cards, activity feed, quick actions
- **My Deals**: Tabbed (Active/Pending/Under Contract/Sold/Drafts/Delisted), deal cards grid with status badges + offer/view counts. Click → Deal Detail Modal with photo gallery + offer list. "View Offers" → Offers Popup with investor reputation, amounts, accept/reject/counter. Hover investor → Quick Profile Popover.
- **Create Deal**: Multi-step wizard (Property Info → Financials → Photos & Description → Review & Submit). Inline calculator buttons next to financial fields → Calculator Slide-Out Panel.
- **Transactions**: Table with status pipeline (Escrow Funded → Under Review → Closing → Completed). Click → Transaction Detail Modal with timeline, buyer info, contract link, fee breakdown. "Sign Contract" → Contract Signing Modal.
- **Earnings**: Total earned chart, monthly breakdown, fee breakdown per transaction, payout history.

### Investor Views

**Sidebar**: Dashboard | Browse Deals | My Matches | Saved Deals | My Offers | Transactions | Subscription | Preferences | Calculators | Profile

- **Dashboard**: Stats bar (Matched Deals Today / Active Offers / Deals Purchased / Tier), "Top Matches" carousel with compatibility %, activity feed, quick actions.
- **Browse Deals**: Filter sidebar/popup (Location, Property Type, Price Range, ARV Range, Wholesaler Reputation min). Grid/List/Map toggle. Hover → Quick Preview Popover with key numbers + Save/Offer buttons. Click → Deal Detail Modal with full info, "Run Numbers" → Calculator Panel pre-filled with deal data, "Make Offer" → Offer Modal.
- **My Matches**: Algorithmically matched deals with match score % and match reasons.
- **Saved Deals**: Bookmarked deals grid with "Price Changed" / "New Offer" update badges.
- **My Offers**: Tabbed (Pending/Accepted/Rejected/Withdrawn/Expired). "Withdraw" → Confirmation Popup.
- **Subscription**: Current tier, comparison table (Free/Pro/Premium), "Upgrade" → Upgrade Modal with simulated payment.
- **Preferences**: Set matching criteria (locations, types, price range, min reputation). Save with toast notification.

### Admin Views

**Sidebar**: Dashboard | Users | Deal Moderation | Transactions | Disputes | Revenue | Platform Settings

- **Dashboard**: Stats cards (Total Users / Active Deals / Transactions / Revenue), charts (user growth, deal volume, revenue trend, market heatmap), alerts.
- **User Management**: Searchable/filterable user table. Click → User Detail Modal with profile, verification docs, deal history, ratings, verify/reject/ban actions. "Verify" → Verification Review Modal.
- **Deal Moderation**: Queue of pending deals. Click → Deal Review Modal with all data, approve/reject with reason. Flagged deals tab.
- **Transactions**: All platform transactions, filterable. Click → Transaction Detail Modal with audit trail.
- **Disputes**: Open disputes list. Click → Dispute Detail Modal with claims, history, resolution actions.
- **Revenue**: Charts (subscription vs transaction fees), fee table, Export → Export Options Popup (CSV/PDF).
- **Platform Settings**: Fee config, tier features, auto-approval rules, region settings.

## Global Popups & Modals

| Trigger | Modal/Popup |
|---------|------------|
| Notification bell | Notification Dropdown Panel with mark-read |
| Calculator icon (always in nav) | Calculator Dock - slide-out with all 8 calculators in tabs |
| Click any user avatar | User Profile Popover with quick stats |
| Rate a transaction | Review Modal with star ratings per category + written review |
| Any destructive action | Confirmation Dialog with context |
| Dev toolbar role switch | Role Switcher Popup - instant switch demo accounts |
| First login | Onboarding Tour Modal - feature walkthrough |
| Session timeout | Re-auth Modal |

## Calculators

All 8 accessible from a global calculator dock (slide-out panel with tabs):

1. **ARV Calculator** - After Repair Value based on comps
2. **ROI Calculator** - Return on Investment
3. **Cash-on-Cash Calculator** - Cash-on-Cash Return
4. **Cap Rate Calculator** - Capitalization Rate
5. **Rehab Cost Calculator** - Renovation cost estimator by category
6. **MAO Calculator** - Maximum Allowable Offer (ARV × 70% - repairs - assignment fee)
7. **Wholesale Fee Calculator** - Assignment fee calculation
8. **Rental Analysis Calculator** - Rental income vs expenses

## Core Transaction Flow

1. Wholesaler creates deal → submitted for review
2. Admin approves deal → deal goes live on marketplace
3. Investors browse / get matched → view deal details
4. Investor makes offer (via modal) → wholesaler receives notification
5. Wholesaler accepts offer → transaction initiated
6. Escrow simulation funded → under review
7. Contract signing (DocuSign-style modal) → both parties sign
8. Transaction closes → platform takes 5% fee
9. Both parties rate each other (review modal)

## Matching Engine

Scores deals against investor preferences:
- Location match (state, city, zip proximity)
- Property type match
- Budget fit (asking price within investor range)
- Wholesaler reputation threshold
- Returns compatibility percentage

## Subscription Tiers

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Browse deals | Yes | Yes | Yes |
| Make offers | 3/month | Unlimited | Unlimited |
| Matching | Basic | Advanced | Priority |
| Calculator access | 3 calcs | All 8 | All 8 |
| Analytics | None | Basic | Full |
| Price | $0 | $29/mo | $99/mo |

## Dev Tools

Floating toolbar (bottom-right, dev mode only):
- **Role Switcher**: One-click switch between Demo Wholesaler / Demo Investor / Demo Admin
- **Data Seeder**: Re-generate fresh demo data
- **State Inspector**: View current auth state, active filters
- **Theme Toggle**: Dark/light preview

## Design Principles

- Dark professional theme with accent colors
- Modal/popup-heavy UI - keep users in context
- Combine related components where sensible (avoid over-splitting files)
- Seeded with realistic demo data for investor pitches
- Architecture designed for easy conversion to web platform
