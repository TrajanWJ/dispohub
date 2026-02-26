# DispoHub

Real estate wholesale deal marketplace connecting wholesalers with investors. Wholesalers list distressed properties under contract; investors browse, match, and purchase deals through an escrow-managed transaction pipeline.

Monorepo with three deployment targets: **web app** (Vite + Express), **Vercel serverless**, and **Electron desktop**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Client | React 19, Vite 7, React Router 7 |
| Server | Express 4, Node.js |
| Database | lowdb 7 (JSON file) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Charts | Recharts 3 |
| Desktop | Electron 33 |
| Styling | CSS custom properties + inline styles |
| Deployment | Vercel (serverless) |

## Quick Start

```bash
# Install all workspace dependencies
npm install

# Seed the database with demo data
npm run seed

# Run client + server concurrently
npm run dev
```

Client: `http://localhost:5173` | Server: `http://localhost:3001` | API proxy: Vite forwards `/api/*` to the server.

### Other Scripts

```bash
npm run dev:server      # Server only
npm run dev:client      # Client only (Vite)
npm run electron:dev    # Full stack + Electron desktop app
```

## Project Structure

```
dispohub/
├── client/                     # React SPA (Vite)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js       # Axios instance with auth interceptors
│   │   ├── components/
│   │   │   ├── calculators/
│   │   │   │   └── CalculatorDock.jsx   # Slide-in calculator panel (8 calculators)
│   │   │   ├── common/
│   │   │   │   └── index.jsx   # Button, Card, Modal, Badge, Toast, etc.
│   │   │   └── dev/
│   │   │       └── DevToolbar.jsx       # Dev persona switcher
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # JWT auth + dev-switch
│   │   │   └── NotificationContext.jsx  # Polling notifications (30s)
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx   # Sidebar + Topbar + mobile responsive shell
│   │   ├── pages/
│   │   │   ├── admin/          # 7 admin pages
│   │   │   ├── auth/           # Login, Register, DevLogin
│   │   │   ├── education/      # Courses listing + detail
│   │   │   ├── investor/       # 8 investor pages
│   │   │   ├── shared/         # Profile, Settings, Notifications, Calculators
│   │   │   └── wholesaler/     # 6 wholesaler pages
│   │   ├── styles/
│   │   │   └── globals.css     # CSS variables design system
│   │   ├── utils/
│   │   │   ├── calculators.js  # Pure calculator functions
│   │   │   └── formatters.js   # Currency, date, number formatters
│   │   └── App.jsx             # Router config
│   └── vite.config.js
│
├── server/                     # Express API
│   ├── config/
│   │   └── constants.js        # Platform fees, tiers, statuses, weights
│   ├── db/
│   │   ├── db.js               # lowdb adapter (file or /tmp for Vercel)
│   │   ├── seed.js             # Demo data generator
│   │   └── data/
│   │       └── db.json         # JSON database file (gitignored)
│   ├── middleware/
│   │   ├── auth.js             # JWT verification + dev bypass
│   │   ├── roleGuard.js        # Role-based access control
│   │   ├── dealValidator.js    # Deal creation validation
│   │   └── rateLimiter.js      # Sliding window rate limiter
│   ├── routes/
│   │   ├── auth.js             # Register, login, dev-switch
│   │   ├── deals.js            # CRUD + offers + bookmarks
│   │   ├── users.js            # Profiles + preferences + verification
│   │   ├── transactions.js     # Escrow state machine
│   │   ├── contracts.js        # Contract generation + signing
│   │   ├── subscriptions.js    # Tier management
│   │   ├── notifications.js    # Read/unread management
│   │   ├── ratings.js          # Review system
│   │   ├── matching.js         # AI deal matching
│   │   ├── calculators.js      # RE calculator endpoints
│   │   ├── education.js        # Course content
│   │   └── admin.js            # Platform administration
│   ├── services/
│   │   ├── matchingEngine.js   # Weighted scoring (location, type, budget, reputation)
│   │   ├── escrowService.js    # Transaction state machine
│   │   ├── feeCalculator.js    # Tiered platform fees
│   │   ├── notificationService.js  # Notification factory
│   │   ├── reputationEngine.js     # Weighted reputation scoring
│   │   └── dealApproval.js         # Deal quality scoring for moderation
│   └── index.js                # Express app entry
│
├── electron/                   # Desktop wrapper
│   ├── main.js                 # BrowserWindow + server child process
│   └── preload.cjs             # Context bridge
│
├── api/
│   └── index.js                # Vercel serverless adapter
└── vercel.json                 # Vercel routing config
```

## User Roles

### Wholesaler
Find and list distressed properties under contract. Manage deals through the approval pipeline, receive offers from investors, track transactions and earnings.

**Pages:** Dashboard, My Deals, Create Deal, Transactions, Contracts, Earnings, Calculators, Profile

### Investor
Browse the marketplace, get AI-matched deals based on preferences, place offers, manage subscriptions for enhanced features.

**Pages:** Dashboard, Browse Deals, Matched Deals, Saved Deals, My Offers, Transactions, Subscription, Preferences, Calculators, Profile

### Admin
Moderate the platform. Approve deals and user verifications, resolve disputes, monitor revenue and platform health.

**Pages:** Dashboard, User Management, Deal Moderation, Transaction Overview, Dispute Resolution, Revenue Reports, Platform Settings

## Authentication

JWT-based with 7-day token expiry. Tokens stored in `localStorage` (`dispohub_token`).

**Dev mode:** The `DevToolbar` (bottom-right button) and `DevLoginPage` allow instant persona switching via the `/api/auth/dev-switch` endpoint, which bypasses password verification. The `x-dev-user-id` header provides an alternative auth path that skips JWT verification entirely.

**Seeded accounts:**
- Marcus Johnson — wholesaler (4.7 stars)
- Sarah Chen — investor (4.9 stars)
- Alex Rivera — admin

## API Reference

### Public Endpoints (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register (`{email, password, name, role}`) |
| POST | `/api/auth/login` | Login (`{email, password}`) |
| GET | `/api/auth/me` | Current user (requires token) |
| POST | `/api/auth/dev-switch` | Dev persona switch |
| GET | `/api/deals` | List active deals (filterable, paginated) |
| GET | `/api/deals/:id` | Single deal (increments view count) |
| GET | `/api/users/:id` | Public user profile |
| POST | `/api/calculators/*` | 8 calculator endpoints (ARV, ROI, etc.) |
| GET | `/api/education/courses` | Course listing |
| GET | `/api/education/courses/:id` | Course detail |

### Authenticated Endpoints

**Deals**
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/deals` | Wholesaler | Create deal (enters `pending_review`) |
| PUT | `/api/deals/:id` | Owner | Update deal |
| DELETE | `/api/deals/:id` | Owner | Delist deal |
| POST | `/api/deals/:id/offers` | Investor | Place offer |
| GET | `/api/deals/:id/offers` | Owner/Admin | List offers on deal |
| PUT | `/api/deals/:id/offers/:offerId` | Owner | Accept/reject offer |
| POST | `/api/deals/:id/save` | Investor | Bookmark deal |
| DELETE | `/api/deals/:id/save` | Investor | Remove bookmark |
| GET | `/api/deals/saved` | Investor | List saved deals |

**Transactions**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | User's transactions |
| GET | `/api/transactions/:id` | Transaction detail with available transitions |
| POST | `/api/transactions` | Create from accepted offer |
| PUT | `/api/transactions/:id/status` | Advance transaction state |
| GET | `/api/transactions/:id/timeline` | Status history + available transitions |

**Transaction State Machine:**
```
escrow_funded → under_review → closing → completed
                     ↓            ↓
                  cancelled    cancelled
                     ↓            ↓
                  disputed     disputed → closing | cancelled
```

**Matching**
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/matching/deals` | Investor | Matched deals based on preferences |
| GET | `/api/matching/investors/:dealId` | Wholesaler | Matched investors for a deal |

**Contracts**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contracts/templates` | List contract templates |
| GET | `/api/contracts/:id` | Get contract |
| POST | `/api/contracts` | Generate contract from transaction |
| PUT | `/api/contracts/:id/sign` | Sign contract (tracks per-party) |

**Subscriptions**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions/tiers` | List tiers with features |
| GET | `/api/subscriptions/mine` | Current subscription |
| POST | `/api/subscriptions/upgrade` | Upgrade tier |
| POST | `/api/subscriptions/cancel` | Revert to free |

**Notifications**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Paginated notifications |
| GET | `/api/notifications/count` | Unread count |
| PUT | `/api/notifications/read-all` | Mark all read |
| PUT | `/api/notifications/:id/read` | Mark one read |

**Ratings**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ratings` | Rate a completed transaction |
| GET | `/api/ratings/user/:userId` | User's received ratings |

### Admin Endpoints (admin role required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/users` | All users (filterable, paginated) |
| PUT | `/api/admin/users/:id/verify` | Approve/reject verification |
| PUT | `/api/admin/users/:id/ban` | Ban user |
| GET | `/api/admin/deals/pending` | Pending review queue |
| PUT | `/api/admin/deals/:id/approve` | Approve deal |
| PUT | `/api/admin/deals/:id/reject` | Reject deal |
| GET | `/api/admin/disputes` | Disputed transactions |
| PUT | `/api/admin/disputes/:id/resolve` | Resolve dispute |
| GET | `/api/admin/revenue` | Revenue reports (monthly/quarterly/yearly) |
| POST | `/api/admin/reseed` | Reseed database |

## Subscription Tiers

| Tier | Price | Offers/Month | Matching | Calculators | Analytics | Platform Fee |
|------|-------|-------------|----------|-------------|-----------|-------------|
| Free | $0 | 3 | Basic | 3 | None | 5% |
| Pro | $29/mo | Unlimited | Advanced | 8 | Basic | 4% |
| Premium | $99/mo | Unlimited | Priority | 8 | Full | 3% |

## Matching Engine

Weighted scoring algorithm (`0.0` – `1.0`) comparing deal attributes against investor preferences:

| Factor | Weight | Logic |
|--------|--------|-------|
| Location | 35% | State match required; +5% city bonus |
| Property Type | 20% | Exact match or "any" preference |
| Budget Fit | 30% | Asking price within min/max range |
| Reputation | 15% | Wholesaler score >= investor minimum |

Deals scoring above 20% are surfaced as matches, sorted by score descending.

## Calculators

Eight real estate calculators available both client-side (pure JS) and via API:

1. **ARV** — After Repair Value from comparable sales
2. **ROI** — Return on Investment
3. **Cash-on-Cash** — Annual cash flow / total cash invested
4. **Cap Rate** — NOI / property value
5. **Rehab Cost** — Itemized renovation estimator
6. **MAO** — Maximum Allowable Offer (70% rule)
7. **Wholesale Fee** — Assignment fee calculation
8. **Rental Analysis** — Monthly/annual cash flow, CoC, cap rate

## Shared Components

All in `client/src/components/common/index.jsx`:

| Component | Description |
|-----------|-------------|
| `Button` | Variants: primary, secondary, danger, ghost, outline. Loading state. |
| `Card` | Hoverable card container with header/footer slots |
| `Modal` | Overlay modal (sm/md/lg/xl). ESC to close, scroll lock. |
| `ConfirmDialog` | Action confirmation modal |
| `ToastProvider` / `useToast` | Toast notifications (success/error/warning/info) |
| `Badge` | Status pill (success/warning/danger/info/neutral) |
| `StatusBadge` | Maps entity statuses to Badge variants |
| `StarRating` | Display or interactive 1-5 star rating |
| `SearchBar` | Input with search icon |
| `Avatar` | Image or initials fallback with hashed color |
| `LoadingSpinner` | Spinning circle |
| `EmptyState` | Empty state with icon, title, message, action |
| `Pagination` | Page numbers with ellipsis |
| `Tabs` | Horizontal tab bar with underline indicator |

## Design System

Dark theme using CSS custom properties defined in `globals.css`:

```css
--bg-primary: #0f1117        /* darkest background */
--bg-secondary: #1a1d27      /* sidebar, topbar */
--bg-tertiary: #242836       /* inputs, hover targets */
--bg-card: #1e2230           /* card surfaces */
--accent-primary: #6c5ce7    /* purple */
--accent-success: #00d68f    /* green */
--accent-warning: #ffaa00    /* amber */
--accent-danger: #ff4757     /* red */
--accent-info: #3498db       /* blue */
--sidebar-width: 260px
--topbar-height: 56px
```

All styling is done through inline React styles referencing these variables. No Tailwind, no CSS modules.

## Mobile Support

The sidebar is responsive with a `768px` breakpoint:
- **Desktop (>=768px):** Fixed 260px sidebar always visible
- **Mobile (<768px):** Sidebar hidden off-screen, opened via hamburger menu in topbar. Dark overlay when open. Auto-closes on route change.

## Deployment

### Vercel

The project is configured for Vercel deployment. The `api/index.js` serverless function wraps the Express app. The database uses `/tmp/db.json` (ephemeral between cold starts, seeded from committed snapshot).

```bash
vercel              # Preview deployment
vercel --prod       # Production deployment
```

**Production URL:** https://dispohub.vercel.app

### Electron

```bash
npm run electron:dev
```

Spawns the Express server as a child process, waits for health check, then opens a BrowserWindow pointed at the Vite dev server (dev) or bundled `dist/index.html` (production).

## Database

lowdb with a single JSON file. Collections: `users`, `deals`, `offers`, `transactions`, `ratings`, `contracts`, `subscriptions`, `notifications`, `education`.

Seed with demo data:
```bash
npm run seed
```

The seed generates realistic wholesalers across US cities, investors, an admin, deals with varied property types and pricing, historical transactions for revenue charts, and pre-built notification history.
