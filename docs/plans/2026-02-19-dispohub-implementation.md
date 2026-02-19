# DispoHub Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fully functional Electron prototype of a wholesale real estate dispo marketplace with three user roles, 8 calculators, deal listing/offer flow, matching engine, and seeded demo data.

**Architecture:** Electron shell spawns a separate Express API server (localhost:3001) and loads a React+Vite frontend (localhost:5173) in a BrowserWindow. JSON file database via lowdb. All three processes run independently for dev, Electron orchestrates for production.

**Tech Stack:** Electron, Express, React 18, Vite, lowdb, react-router-dom, recharts (charts), uuid, jsonwebtoken, bcryptjs, CSS custom properties (dark theme)

---

### Task 1: Project Scaffolding & Dependencies

**Files:**
- Create: `package.json` (root workspace)
- Create: `server/package.json`
- Create: `server/index.js`
- Create: `client/package.json`
- Create: `client/vite.config.js`
- Create: `client/index.html`
- Create: `client/src/main.jsx`
- Create: `client/src/App.jsx`
- Create: `electron/package.json`
- Create: `electron/main.js`
- Create: `electron/preload.js`
- Create: `.gitignore`

**Step 1: Initialize root workspace**

Create root `package.json` with npm workspaces pointing to `server`, `client`, `electron`:

```json
{
  "name": "dispohub",
  "private": true,
  "workspaces": ["server", "client", "electron"],
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "npm run dev --workspace=server",
    "dev:client": "npm run dev --workspace=client",
    "dev:electron": "npm run dev --workspace=electron",
    "seed": "npm run seed --workspace=server"
  }
}
```

**Step 2: Initialize server package**

Create `server/package.json`:

```json
{
  "name": "dispohub-server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch index.js",
    "start": "node index.js",
    "seed": "node db/seed.js"
  }
}
```

Install server deps:
```bash
cd server && npm install express cors lowdb uuid jsonwebtoken bcryptjs
```

Create minimal `server/index.js`:

```js
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'DispoHub API' });
});

app.listen(PORT, () => {
  console.log(`DispoHub API running on http://localhost:${PORT}`);
});
```

**Step 3: Initialize client package**

```bash
cd client && npm create vite@latest . -- --template react
```

Then install additional deps:
```bash
npm install react-router-dom recharts axios
```

Update `client/vite.config.js` to proxy API:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
```

Replace `client/src/App.jsx` with minimal shell:

```jsx
function App() {
  return <div style={{ color: '#fff', background: '#0f1117', minHeight: '100vh', padding: '2rem' }}>
    <h1>DispoHub</h1>
    <p>Wholesale Real Estate Dispo Platform</p>
  </div>;
}
export default App;
```

**Step 4: Initialize Electron**

Create `electron/package.json`:

```json
{
  "name": "dispohub-electron",
  "private": true,
  "main": "main.js",
  "scripts": {
    "dev": "electron ."
  }
}
```

```bash
cd electron && npm install electron --save-dev
```

Create `electron/main.js`:

```js
import { app, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let serverProcess = null;

function startServer() {
  serverProcess = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, '..', 'server'),
    stdio: 'inherit'
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#0f1117',
    title: 'DispoHub'
  });

  // In dev, load Vite dev server; in prod, load built files
  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  startServer();
  // Give server a moment to start
  setTimeout(createWindow, 1000);
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});
```

Create `electron/preload.js`:

```js
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isElectron: true
});
```

**Step 5: Create .gitignore**

```
node_modules/
dist/
server/db/data/
.env
*.log
.DS_Store
```

**Step 6: Verify everything runs**

Run: `npm run dev` from root
Expected: Server on :3001 responds to `/api/health`, Client on :5173 shows "DispoHub" header

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: scaffold project with Electron + Express + React + Vite"
```

---

### Task 2: Database Layer, Models & Seed Data

**Files:**
- Create: `server/db/db.js`
- Create: `server/db/seed.js`
- Create: `server/models/User.js`
- Create: `server/models/Deal.js`
- Create: `server/models/Offer.js`
- Create: `server/models/Transaction.js`
- Create: `server/models/Rating.js`
- Create: `server/models/Contract.js`
- Create: `server/models/Subscription.js`
- Create: `server/models/Notification.js`
- Create: `server/config/constants.js`

**Step 1: Create config/constants.js**

Platform-wide constants for fees, tiers, matching:

```js
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
```

**Step 2: Create db/db.js with lowdb setup**

```js
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, 'data');

// Ensure data directory exists
mkdirSync(dataDir, { recursive: true });

const defaultData = {
  users: [],
  deals: [],
  offers: [],
  transactions: [],
  ratings: [],
  contracts: [],
  subscriptions: [],
  notifications: []
};

const adapter = new JSONFile(join(dataDir, 'db.json'));
const db = new Low(adapter, defaultData);

await db.read();
if (!db.data) {
  db.data = defaultData;
  await db.write();
}

export default db;
```

**Step 3: Create all model files**

Each model exports helpers: `create`, `findById`, `findAll`, `update`, `remove`, and model-specific queries. Models use lowdb directly.

Example — `server/models/User.js`:

```js
import { v4 as uuid } from 'uuid';
import db from '../db/db.js';

export function createUser(data) {
  const user = {
    id: uuid(),
    role: data.role || 'investor',
    email: data.email,
    name: data.name,
    avatar: data.avatar || null,
    phone: data.phone || '',
    company: data.company || '',
    bio: data.bio || '',
    location: data.location || { state: '', city: '' },
    verificationStatus: data.verificationStatus || 'pending',
    verificationDocs: data.verificationDocs || [],
    dealCount: data.dealCount || 0,
    reputationScore: data.reputationScore || 0,
    memberSince: data.memberSince || new Date().toISOString(),
    subscriptionTier: data.subscriptionTier || 'free',
    preferences: data.preferences || {},
    passwordHash: data.passwordHash || '',
    createdAt: new Date().toISOString()
  };
  db.data.users.push(user);
  db.write();
  return user;
}

export function findUserById(id) {
  return db.data.users.find(u => u.id === id) || null;
}

export function findUserByEmail(email) {
  return db.data.users.find(u => u.email === email) || null;
}

export function findAllUsers(filters = {}) {
  let results = [...db.data.users];
  if (filters.role) results = results.filter(u => u.role === filters.role);
  if (filters.verificationStatus) results = results.filter(u => u.verificationStatus === filters.verificationStatus);
  return results;
}

export function updateUser(id, updates) {
  const idx = db.data.users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  db.data.users[idx] = { ...db.data.users[idx], ...updates };
  db.write();
  return db.data.users[idx];
}

export function deleteUser(id) {
  const idx = db.data.users.findIndex(u => u.id === id);
  if (idx === -1) return false;
  db.data.users.splice(idx, 1);
  db.write();
  return true;
}
```

Create analogous model files for Deal, Offer, Transaction, Rating, Contract, Subscription, Notification — each with the same CRUD pattern plus model-specific queries (e.g., `findDealsByWholesaler`, `findOffersByDeal`, `findTransactionsByUser`, etc.).

**Step 4: Create seed.js with realistic demo data**

Generate:
- 3 demo users (1 wholesaler, 1 investor, 1 admin) with known credentials for dev login
- 10 additional wholesalers, 15 additional investors with realistic names/companies
- 25 property deals across multiple states with realistic RE data
- 15 offers on various deals
- 8 completed transactions with ratings
- Contracts for completed transactions
- Subscriptions for investors
- Notifications for all users

Use realistic addresses, ARV values ($150k-$800k range), property types, and wholesaler assignment fees (5-15% of sale price).

Run: `npm run seed`
Expected: `server/db/data/db.json` created with all seeded data

**Step 5: Verify database**

Run: `node -e "import('./db/db.js').then(m => console.log(Object.keys(m.default.data).map(k => k + ': ' + m.default.data[k].length)))"`
Expected: Shows counts for all collections

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add database layer, all models, config, and seed data"
```

---

### Task 3: Server Auth & Middleware

**Files:**
- Create: `server/middleware/auth.js`
- Create: `server/middleware/roleGuard.js`
- Create: `server/routes/auth.js`
- Modify: `server/index.js` (mount routes)

**Step 1: Create auth middleware**

JWT-based auth middleware. For dev mode, also support a `x-dev-user-id` header for quick role switching.

```js
import jwt from 'jsonwebtoken';
import { findUserById } from '../models/User.js';

const JWT_SECRET = 'dispohub-dev-secret';

export function authenticateToken(req, res, next) {
  // Dev mode shortcut: x-dev-user-id header
  const devUserId = req.headers['x-dev-user-id'];
  if (devUserId) {
    const user = findUserById(devUserId);
    if (user) {
      req.user = user;
      return next();
    }
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = findUserById(payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
}

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export { JWT_SECRET };
```

**Step 2: Create role guard middleware**

```js
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}
```

**Step 3: Create auth routes**

Login, register, dev-switch, and get current user:

```js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail, findUserById, findAllUsers } from '../models/User.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => { /* email + password login */ });

// POST /api/auth/register
router.post('/register', async (req, res) => { /* create new user */ });

// GET /api/auth/me — get current user
router.get('/me', authenticateToken, (req, res) => {
  const { passwordHash, ...user } = req.user;
  res.json(user);
});

// POST /api/auth/dev-switch — switch to any demo user by role
router.post('/dev-switch', (req, res) => {
  const { role } = req.body;
  const users = findAllUsers({ role });
  if (!users.length) return res.status(404).json({ error: `No ${role} user found` });
  const token = generateToken(users[0].id);
  const { passwordHash, ...user } = users[0];
  res.json({ token, user });
});

// GET /api/auth/dev-users — list all demo users for dev toolbar
router.get('/dev-users', (req, res) => {
  const users = findAllUsers();
  res.json(users.map(({ passwordHash, ...u }) => u));
});

export default router;
```

**Step 4: Mount in server/index.js**

Add to `server/index.js`:
```js
import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);
```

**Step 5: Verify**

Run server, test `POST /api/auth/dev-switch` with `{ "role": "wholesaler" }`.
Expected: Returns token + user object.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add auth routes, JWT middleware, role guard, dev-switch"
```

---

### Task 4: Server Core Routes — Deals, Users, Offers

**Files:**
- Create: `server/routes/deals.js`
- Create: `server/routes/users.js`
- Modify: `server/index.js` (mount routes)

**Step 1: Create deals routes**

Full CRUD for deals with auth + role guards:

- `GET /api/deals` — list all active deals (with filters: state, city, propertyType, priceMin, priceMax, search)
- `GET /api/deals/:id` — get single deal with wholesaler info
- `POST /api/deals` — create deal (wholesaler only, status=pending_review)
- `PUT /api/deals/:id` — update deal (owner wholesaler only)
- `DELETE /api/deals/:id` — delist deal (owner only, sets status=delisted)
- `POST /api/deals/:id/offers` — make offer on a deal (investor only)
- `GET /api/deals/:id/offers` — list offers for a deal (owner wholesaler or admin)
- `PUT /api/deals/:id/offers/:offerId` — accept/reject offer (owner wholesaler only)
- `POST /api/deals/:id/save` — save/bookmark deal (investor)
- `DELETE /api/deals/:id/save` — unsave deal (investor)

**Step 2: Create users routes**

- `GET /api/users/:id` — public profile (excludes sensitive fields)
- `PUT /api/users/:id` — update own profile
- `GET /api/users/:id/deals` — user's deals (public: only active; own: all statuses)
- `GET /api/users/:id/ratings` — user's received ratings
- `PUT /api/users/:id/preferences` — update matching preferences (investor)
- `POST /api/users/:id/verify` — submit verification docs

**Step 3: Mount routes in server/index.js**

```js
import dealRoutes from './routes/deals.js';
import userRoutes from './routes/users.js';
app.use('/api/deals', dealRoutes);
app.use('/api/users', userRoutes);
```

**Step 4: Verify**

Start server with seeded data. Test:
- `GET /api/deals` returns seeded deals
- `GET /api/deals?state=TX` filters correctly
- `POST /api/deals/:id/offers` with investor token creates offer

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add deals and users routes with full CRUD and offer flow"
```

---

### Task 5: Server Services — Matching, Reputation, Escrow, Fees

**Files:**
- Create: `server/services/matchingEngine.js`
- Create: `server/services/reputationEngine.js`
- Create: `server/services/escrowService.js`
- Create: `server/services/feeCalculator.js`
- Create: `server/services/dealApproval.js`
- Create: `server/services/notificationService.js`
- Create: `server/routes/matching.js`

**Step 1: Create matchingEngine.js**

Scores deals against investor preferences using weighted factors:

```js
import { MATCHING_WEIGHTS } from '../config/constants.js';

export function scoreMatch(deal, investorPreferences) {
  let score = 0;

  // Location match (state exact = full points, city match = bonus)
  if (investorPreferences.states?.includes(deal.state)) {
    score += MATCHING_WEIGHTS.location;
    if (investorPreferences.cities?.includes(deal.city)) {
      score += 0.05; // Bonus for city match
    }
  }

  // Property type match
  if (investorPreferences.propertyTypes?.includes(deal.propertyType)) {
    score += MATCHING_WEIGHTS.propertyType;
  }

  // Budget fit (asking price within investor's range)
  const { minPrice = 0, maxPrice = Infinity } = investorPreferences;
  if (deal.askingPrice >= minPrice && deal.askingPrice <= maxPrice) {
    score += MATCHING_WEIGHTS.budgetFit;
  }

  // Wholesaler reputation
  // Fetched separately, passed in as deal.wholesalerReputation
  const minRep = investorPreferences.minReputation || 0;
  if ((deal.wholesalerReputation || 0) >= minRep) {
    score += MATCHING_WEIGHTS.reputation;
  }

  return {
    score: Math.min(score, 1.0),
    percentage: Math.round(Math.min(score, 1.0) * 100),
    reasons: buildMatchReasons(deal, investorPreferences, score)
  };
}

function buildMatchReasons(deal, prefs, score) {
  const reasons = [];
  if (prefs.states?.includes(deal.state)) reasons.push('Location match');
  if (prefs.propertyTypes?.includes(deal.propertyType)) reasons.push('Property type match');
  if (deal.askingPrice >= (prefs.minPrice || 0) && deal.askingPrice <= (prefs.maxPrice || Infinity)) reasons.push('Within budget');
  return reasons;
}

export function findMatchesForInvestor(deals, investorPreferences) {
  return deals
    .map(deal => ({ deal, match: scoreMatch(deal, investorPreferences) }))
    .filter(m => m.match.percentage > 20)
    .sort((a, b) => b.match.percentage - a.match.percentage);
}
```

**Step 2: Create reputationEngine.js**

Calculates weighted reputation from ratings:

```js
export function calculateReputation(ratings) {
  if (!ratings.length) return 0;

  const weights = { communication: 0.25, dealQuality: 0.35, professionalism: 0.25, timeliness: 0.15 };
  let totalWeightedScore = 0;

  for (const rating of ratings) {
    let ratingScore = 0;
    for (const [category, weight] of Object.entries(weights)) {
      ratingScore += (rating.categories[category] || rating.score) * weight;
    }
    totalWeightedScore += ratingScore;
  }

  return Math.round((totalWeightedScore / ratings.length) * 20) / 20; // Round to nearest 0.05
}
```

**Step 3: Create escrowService.js**

State machine for transaction escrow flow:

```js
const VALID_TRANSITIONS = {
  escrow_funded: ['under_review'],
  under_review: ['closing', 'cancelled', 'disputed'],
  closing: ['completed', 'cancelled', 'disputed'],
  completed: [],
  cancelled: [],
  disputed: ['closing', 'cancelled']
};

export function canTransition(currentStatus, newStatus) {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

export function transitionEscrow(transaction, newStatus) {
  if (!canTransition(transaction.status, newStatus)) {
    throw new Error(`Cannot transition from ${transaction.status} to ${newStatus}`);
  }
  return { ...transaction, status: newStatus, updatedAt: new Date().toISOString() };
}
```

**Step 4: Create feeCalculator.js**

```js
import { PLATFORM_FEE_PERCENT, SUBSCRIPTION_TIERS } from '../config/constants.js';

export function calculatePlatformFee(salePrice, tier = 'free') {
  let feePercent = PLATFORM_FEE_PERCENT;
  // Discount for higher tiers
  if (tier === 'pro') feePercent = 4;
  if (tier === 'premium') feePercent = 3;

  const fee = Math.round(salePrice * (feePercent / 100) * 100) / 100;
  return { fee, feePercent, netToWholesaler: salePrice - fee };
}
```

**Step 5: Create dealApproval.js and notificationService.js**

`dealApproval.js`: checks deal data completeness, flags missing fields, returns approval recommendation.

`notificationService.js`: creates notification records for events (new offer, offer accepted, deal approved, new match, review received).

**Step 6: Create matching route**

- `GET /api/matching/deals` — get matched deals for current investor (uses matchingEngine)
- `GET /api/matching/investors/:dealId` — get matched investors for a deal (wholesaler)

**Step 7: Mount and verify**

Mount `/api/matching` route. Test with seeded investor preferences against seeded deals.

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: add matching engine, reputation, escrow, fee services and matching routes"
```

---

### Task 6: Server Supporting Routes — Calculators, Transactions, Contracts, Subscriptions, Notifications, Admin, Education

**Files:**
- Create: `server/routes/calculators.js`
- Create: `server/routes/transactions.js`
- Create: `server/routes/contracts.js`
- Create: `server/routes/subscriptions.js`
- Create: `server/routes/notifications.js`
- Create: `server/routes/admin.js`
- Create: `server/routes/education.js`
- Modify: `server/index.js` (mount all routes)

**Step 1: Create calculators route**

Server-side calculation endpoints (also available as pure client-side utils, but API enables logging/analytics):

- `POST /api/calculators/arv` — { comps[], sqft } → ARV estimate
- `POST /api/calculators/roi` — { purchasePrice, totalInvestment, salePrice } → ROI %
- `POST /api/calculators/cash-on-cash` — { annualCashFlow, totalCashInvested } → CoC %
- `POST /api/calculators/cap-rate` — { noi, propertyValue } → Cap Rate %
- `POST /api/calculators/rehab` — { items[{category, cost}] } → Total rehab cost
- `POST /api/calculators/mao` — { arv, rehabCost, assignmentFee } → MAO (ARV × 70% - rehab - fee)
- `POST /api/calculators/wholesale-fee` — { salePrice, purchasePrice } → Assignment fee + %
- `POST /api/calculators/rental` — { monthlyRent, expenses{}, purchasePrice } → Cash flow, ROI

**Step 2: Create transactions route**

- `GET /api/transactions` — list user's transactions (filtered by role)
- `GET /api/transactions/:id` — single transaction detail
- `POST /api/transactions` — create transaction (from accepted offer, auto-sets escrow_funded)
- `PUT /api/transactions/:id/status` — advance status (uses escrowService state machine)
- `GET /api/transactions/:id/timeline` — get status history for a transaction

**Step 3: Create contracts route**

- `GET /api/contracts/templates` — list contract templates
- `GET /api/contracts/:id` — get contract
- `POST /api/contracts` — create contract for a transaction
- `PUT /api/contracts/:id/sign` — sign contract (current user signs their party)

**Step 4: Create subscriptions route**

- `GET /api/subscriptions/tiers` — list available tiers with features
- `GET /api/subscriptions/mine` — current user's subscription
- `POST /api/subscriptions/upgrade` — upgrade tier (simulated payment)
- `POST /api/subscriptions/cancel` — cancel subscription

**Step 5: Create notifications route**

- `GET /api/notifications` — current user's notifications (supports `?unread=true`)
- `PUT /api/notifications/:id/read` — mark notification as read
- `PUT /api/notifications/read-all` — mark all as read
- `GET /api/notifications/count` — unread count

**Step 6: Create admin route**

- `GET /api/admin/stats` — platform statistics (user counts, deal counts, revenue, etc.)
- `GET /api/admin/users` — all users with filters
- `PUT /api/admin/users/:id/verify` — approve/reject user verification
- `PUT /api/admin/users/:id/ban` — ban a user
- `GET /api/admin/deals/pending` — deals awaiting approval
- `PUT /api/admin/deals/:id/approve` — approve a deal
- `PUT /api/admin/deals/:id/reject` — reject a deal with reason
- `GET /api/admin/disputes` — list open disputes
- `PUT /api/admin/disputes/:id/resolve` — resolve a dispute
- `GET /api/admin/revenue` — revenue breakdown (fees, subscriptions, by period)

**Step 7: Create education route**

- `GET /api/education/courses` — list available courses/resources
- `GET /api/education/courses/:id` — single course detail

Seed some basic educational content (articles, not full courses — keep it simple for prototype).

**Step 8: Mount all routes in server/index.js**

```js
import calculatorRoutes from './routes/calculators.js';
import transactionRoutes from './routes/transactions.js';
import contractRoutes from './routes/contracts.js';
import subscriptionRoutes from './routes/subscriptions.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import educationRoutes from './routes/education.js';

app.use('/api/calculators', calculatorRoutes);
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/contracts', authenticateToken, contractRoutes);
app.use('/api/subscriptions', authenticateToken, subscriptionRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/admin', authenticateToken, requireRole('admin'), adminRoutes);
app.use('/api/education', educationRoutes);
```

**Step 9: Create ratings route**

- `POST /api/ratings` — create rating for a completed transaction
- `GET /api/ratings/user/:userId` — get all ratings for a user

**Step 10: Mount ratings and verify all routes**

Run server. Verify all routes respond correctly with seeded data.

**Step 11: Commit**

```bash
git add -A && git commit -m "feat: add all remaining server routes - calculators, transactions, contracts, subscriptions, notifications, admin, education, ratings"
```

---

### Task 7: Client Foundation — Dark Theme, Common Components, Contexts, Layouts

**Files:**
- Create: `client/src/styles/globals.css` (dark theme CSS variables + reset)
- Create: `client/src/styles/theme.js` (theme tokens for JS access)
- Create: `client/src/context/AuthContext.jsx`
- Create: `client/src/context/ThemeContext.jsx`
- Create: `client/src/context/NotificationContext.jsx`
- Create: `client/src/api/client.js` (axios wrapper)
- Create: `client/src/components/common/` (Button, Card, Modal, Table, Badge, Avatar, SearchBar, Pagination, LoadingSpinner, EmptyState, StatusBadge, StarRating, ConfirmDialog, Toast)
- Create: `client/src/layouts/AppLayout.jsx`
- Create: `client/src/layouts/Sidebar.jsx`
- Modify: `client/src/main.jsx` (wrap with providers)
- Modify: `client/src/App.jsx` (add router)

**Step 1: Create dark theme**

`globals.css` — CSS custom properties:

```css
:root {
  /* Background */
  --bg-primary: #0f1117;
  --bg-secondary: #1a1d27;
  --bg-tertiary: #242836;
  --bg-hover: #2a2e3d;
  --bg-card: #1e2230;

  /* Text */
  --text-primary: #e8eaed;
  --text-secondary: #9aa0a6;
  --text-muted: #5f6368;

  /* Accent */
  --accent-primary: #6c5ce7;
  --accent-primary-hover: #7c6ef7;
  --accent-success: #00d68f;
  --accent-warning: #ffaa00;
  --accent-danger: #ff4757;
  --accent-info: #3498db;

  /* Border */
  --border-color: #2d3140;
  --border-radius: 8px;
  --border-radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.5);

  /* Spacing */
  --sidebar-width: 260px;
  --topbar-height: 56px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
}
```

**Step 2: Create API client wrapper**

`api/client.js` — Axios instance with auth token injection + dev-user-id support:

```js
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('dispohub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const devUserId = localStorage.getItem('dispohub_dev_user_id');
  if (devUserId) config.headers['x-dev-user-id'] = devUserId;

  return config;
});

export default api;
```

**Step 3: Create AuthContext**

Provides `user`, `login`, `logout`, `devSwitch`, `isAuthenticated`, `role` to entire app.

**Step 4: Create common UI components**

Build combined, reusable components. Each handles the dark theme via CSS variables. Key components:

- **Button**: variants (primary, secondary, danger, ghost), sizes (sm, md, lg), loading state
- **Card**: dark card with header, body, footer slots
- **Modal**: overlay + centered panel, close on Esc/backdrop, title, body, footer actions
- **ConfirmDialog**: extends Modal for destructive actions
- **Toast**: bottom-right toast notifications (success, error, warning, info), auto-dismiss
- **Table**: sortable, dark-styled table with hover rows
- **Badge / StatusBadge**: colored badges for statuses (active=green, pending=yellow, etc.)
- **StarRating**: 1-5 stars, interactive (click to rate) or display-only
- **SearchBar**: search input with icon
- **Avatar**: circular image with fallback initials
- **Pagination**: page navigation
- **LoadingSpinner**: centered spinner
- **EmptyState**: icon + message for empty lists

**Step 5: Create AppLayout and Sidebar**

`AppLayout.jsx` — Main shell: sidebar (left) + topbar (top) + content area. Sidebar content changes based on user role. Topbar has notification bell, calculator icon, user avatar dropdown.

`Sidebar.jsx` — Takes nav items array, renders links with icons. Highlights active route. Collapses on small screens.

**Step 6: Create role-specific nav configs**

Define which sidebar items appear for each role (wholesaler, investor, admin) as arrays of `{ label, path, icon }`.

**Step 7: Update App.jsx with react-router**

Set up routes for all pages (can render placeholder components initially):

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Route structure:
// /login, /register, /dev-login
// /dashboard
// /wholesaler/deals, /wholesaler/deals/new, /wholesaler/deals/:id, ...
// /investor/browse, /investor/matches, /investor/saved, /investor/offers, ...
// /admin/dashboard, /admin/users, /admin/deals, /admin/transactions, ...
// /profile, /settings, /notifications
// /education, /education/:id
```

**Step 8: Update main.jsx with providers**

```jsx
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
```

**Step 9: Verify**

Run client. Should see dark-themed app shell with sidebar, no console errors.

**Step 10: Commit**

```bash
git add -A && git commit -m "feat: add dark theme, common components, auth context, app layout with role-based sidebar"
```

---

### Task 8: Client Auth & Dev Tools

**Files:**
- Create: `client/src/pages/auth/LoginPage.jsx`
- Create: `client/src/pages/auth/RegisterPage.jsx`
- Create: `client/src/pages/auth/DevLoginPage.jsx`
- Create: `client/src/components/dev/DevToolbar.jsx`
- Create: `client/src/components/dev/RoleSwitcher.jsx`

**Step 1: Create LoginPage**

Email + password form, dark-styled. On success, stores token, redirects to `/dashboard`.

**Step 2: Create RegisterPage**

Registration form with role selection (Wholesaler or Investor), name, email, password. Same styling.

**Step 3: Create DevLoginPage**

Special dev page at `/dev-login`. Shows all seeded users as clickable cards grouped by role. One click logs in as that user. Three big cards at top: "Login as Wholesaler", "Login as Investor", "Login as Admin".

**Step 4: Create DevToolbar**

Floating toolbar in bottom-right corner. Only visible in dev mode (check `import.meta.env.DEV`). Contains:
- **RoleSwitcher**: dropdown showing current role, click to switch instantly between the 3 demo accounts
- **Seed Data** button: calls `POST /api/admin/reseed`
- **Current User** display: shows name + role badge
- Compact by default (small floating pill), expands on click

**Step 5: Wire DevToolbar into App.jsx**

Render `<DevToolbar />` outside the router so it's always visible.

**Step 6: Verify**

Navigate to `/dev-login`, click "Login as Wholesaler" → should redirect to dashboard with wholesaler sidebar. Click role switcher in dev toolbar → switches to investor view.

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: add login, register, dev login page, and floating dev toolbar with role switcher"
```

---

### Task 9: Client Wholesaler Pages

**Files:**
- Create: `client/src/pages/wholesaler/DashboardPage.jsx`
- Create: `client/src/pages/wholesaler/MyDealsPage.jsx`
- Create: `client/src/pages/wholesaler/CreateDealPage.jsx`
- Create: `client/src/pages/wholesaler/TransactionsPage.jsx`
- Create: `client/src/pages/wholesaler/EarningsPage.jsx`
- Create: `client/src/pages/wholesaler/ContractsPage.jsx`
- Create: `client/src/components/deals/DealCard.jsx`
- Create: `client/src/components/deals/DealForm.jsx`
- Create: `client/src/components/deals/DealDetailModal.jsx`
- Create: `client/src/components/deals/OfferPanel.jsx`
- Create: `client/src/components/deals/DealFilters.jsx`
- Create: `client/src/components/transactions/TransactionCard.jsx`
- Create: `client/src/components/transactions/TransactionDetailModal.jsx`
- Create: `client/src/components/transactions/EscrowStatus.jsx`
- Create: `client/src/components/contracts/ContractViewer.jsx`
- Create: `client/src/components/contracts/ContractSigner.jsx`
- Create: `client/src/components/users/UserProfilePopover.jsx`
- Create: `client/src/api/deals.js`
- Create: `client/src/api/transactions.js`

**Step 1: Create API modules**

`api/deals.js`: `getDeals`, `getDeal`, `createDeal`, `updateDeal`, `delistDeal`, `getOffers`, `respondToOffer`, `saveDeal`, `unsaveDeal`

`api/transactions.js`: `getTransactions`, `getTransaction`, `advanceStatus`

**Step 2: Create deal components**

- **DealCard**: Compact card showing property photo, address, price, ARV, assignment fee, status badge, offer/view counts. Click opens DealDetailModal.
- **DealDetailModal**: Full-screen modal with photo gallery, all property details, financial breakdown, offer list. Actions: edit, delist, view offers.
- **OfferPanel**: Inside DealDetailModal. Lists offers with investor avatar, name, reputation, amount, message, and accept/reject/counter buttons. Hover investor → UserProfilePopover.
- **DealForm**: Multi-step form wizard for creating/editing deals. Steps: Property Info, Financials (with inline calculator buttons), Photos & Description, Review & Submit.
- **DealFilters**: Filter panel (sidebar or popup) with location, type, price range, status filters.

**Step 3: Create wholesaler pages**

- **DashboardPage**: Stats bar row (4 stat cards), "Deals Needing Attention" section (deals with new offers), recent activity feed, quick action buttons.
- **MyDealsPage**: Tab bar for statuses, deal card grid, click opens DealDetailModal. "Create New Deal" button routes to CreateDealPage.
- **CreateDealPage**: Renders DealForm. On submit, calls API, shows toast, redirects to MyDeals.
- **TransactionsPage**: Transaction list with status pipeline badges. Click → TransactionDetailModal with timeline, escrow status, contract link, fee breakdown.
- **EarningsPage**: Revenue chart (recharts), monthly breakdown table, total earned stat card.
- **ContractsPage**: List of contracts with status badges. Click → ContractViewer modal. "Sign" → ContractSigner modal (simulated DocuSign experience).

**Step 4: Create transaction and contract components**

- **TransactionCard**: Summary row with deal address, buyer, status badge, amount, date.
- **TransactionDetailModal**: Full modal with timeline visualization, escrow status bar, parties info, fee breakdown, contract link.
- **EscrowStatus**: Visual progress bar showing escrow stages.
- **ContractViewer**: Modal displaying contract content in a document-style layout.
- **ContractSigner**: Interactive modal where user clicks "Sign" buttons on signature lines, shows signed status.

**Step 5: Create UserProfilePopover**

Popover that appears on hover over any user avatar/name. Shows avatar, name, role, reputation score (stars), verification badge, deal count, "View Profile" link.

**Step 6: Verify**

Login as wholesaler. Dashboard shows stats + seeded deal data. Navigate to My Deals, see deal cards. Click a deal, see detail modal with offers. Create a new deal through the wizard.

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: add all wholesaler pages - dashboard, deals, transactions, earnings, contracts"
```

---

### Task 10: Client Investor Pages

**Files:**
- Create: `client/src/pages/investor/DashboardPage.jsx`
- Create: `client/src/pages/investor/BrowseDealsPage.jsx`
- Create: `client/src/pages/investor/MatchedDealsPage.jsx`
- Create: `client/src/pages/investor/SavedDealsPage.jsx`
- Create: `client/src/pages/investor/MyOffersPage.jsx`
- Create: `client/src/pages/investor/TransactionsPage.jsx`
- Create: `client/src/pages/investor/SubscriptionPage.jsx`
- Create: `client/src/pages/investor/PreferencesPage.jsx`
- Create: `client/src/components/deals/DealGrid.jsx`
- Create: `client/src/components/deals/DealPreviewPopover.jsx`
- Create: `client/src/components/deals/OfferModal.jsx`
- Create: `client/src/components/matching/MatchCard.jsx`
- Create: `client/src/components/matching/PreferenceForm.jsx`
- Create: `client/src/api/matching.js`

**Step 1: Create API modules**

`api/matching.js`: `getMatchedDeals`, `getMatchedInvestors`

**Step 2: Create investor-specific deal components**

- **DealGrid**: Grid layout of DealCards. Supports grid/list toggle.
- **DealPreviewPopover**: Hover popover on deal cards showing key numbers (price, ARV, fee, wholesaler rating) + "Save" and "Make Offer" quick action buttons.
- **OfferModal**: Modal for making an offer on a deal. Fields: offer amount, message, optional terms. Shows deal summary at top.
- **MatchCard**: Deal card extended with match percentage badge and match reasons tags (Location match, Within budget, etc.).

**Step 3: Create investor pages**

- **DashboardPage**: Stats bar (Matched Deals Today / Active Offers / Deals Purchased / Tier badge), "Top Matches" horizontal carousel with MatchCards, recent activity, quick actions.
- **BrowseDealsPage**: Filter sidebar + DealGrid. Grid/List/Map toggle buttons. Click deal → DealDetailModal (investor variant: has "Make Offer" and "Save" buttons, no edit/delist). Hover → DealPreviewPopover. "Make Offer" → OfferModal. "Run Numbers" → opens calculator dock pre-filled.
- **MatchedDealsPage**: MatchCards in grid, sorted by match %. Each shows why it matched. Same click/offer interactions.
- **SavedDealsPage**: Saved deals grid. "Price Changed" / "New Offer" badges on updated deals. Remove button with ConfirmDialog.
- **MyOffersPage**: Tabbed list (Pending/Accepted/Rejected/Withdrawn/Expired). Shows deal summary + your offer amount + status. "Withdraw" → ConfirmDialog. Accepted → "Proceed to Transaction" button.
- **TransactionsPage**: Same as wholesaler TransactionsPage but from investor perspective.
- **SubscriptionPage**: Current tier card with features. Tier comparison table (Free vs Pro vs Premium) with feature checkmarks. "Upgrade" → Upgrade Modal with tier selection and simulated payment form.
- **PreferencesPage**: PreferenceForm — set preferred states (multi-select), cities, property types (checkboxes), price range (min/max sliders), min wholesaler reputation (star rating input). Save button with toast confirmation.

**Step 4: Verify**

Login as investor. Dashboard shows matched deals. Browse deals with filters. Hover deals for preview. Make offer via modal. Check saved deals. View subscription tier.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add all investor pages - browse, matches, offers, subscription, preferences"
```

---

### Task 11: Client Admin Pages

**Files:**
- Create: `client/src/pages/admin/AdminDashboard.jsx`
- Create: `client/src/pages/admin/UserManagementPage.jsx`
- Create: `client/src/pages/admin/DealModerationPage.jsx`
- Create: `client/src/pages/admin/TransactionOverviewPage.jsx`
- Create: `client/src/pages/admin/DisputeResolutionPage.jsx`
- Create: `client/src/pages/admin/RevenueReportsPage.jsx`
- Create: `client/src/pages/admin/PlatformSettingsPage.jsx`
- Create: `client/src/components/charts/RevenueChart.jsx`
- Create: `client/src/components/charts/DealVolumeChart.jsx`
- Create: `client/src/components/charts/UserGrowthChart.jsx`
- Create: `client/src/api/admin.js`

**Step 1: Create admin API module**

`api/admin.js`: `getStats`, `getUsers`, `verifyUser`, `banUser`, `getPendingDeals`, `approveDeal`, `rejectDeal`, `getDisputes`, `resolveDispute`, `getRevenue`

**Step 2: Create chart components using recharts**

- **RevenueChart**: Line/area chart showing revenue over time (monthly). Two lines: subscription revenue + transaction fees.
- **DealVolumeChart**: Bar chart showing deals listed vs deals sold per month.
- **UserGrowthChart**: Area chart showing cumulative user registrations over time.

**Step 3: Create admin pages**

- **AdminDashboard**: Stats cards row (Total Users / Active Deals / Transactions This Month / Revenue This Month), charts row (RevenueChart + DealVolumeChart + UserGrowthChart), alerts section (pending verifications count, flagged deals, open disputes).
- **UserManagementPage**: Searchable table with columns: Name, Role, Email, Verification Status, Reputation, Join Date, Actions. Click row → User Detail Modal (full profile, verification docs display, deal history, ratings list, action buttons: Verify/Reject/Ban with ConfirmDialog).
- **DealModerationPage**: Queue of pending deals as cards. Click → Deal Review Modal showing all deal data + property photos + wholesaler profile link + Approve/Reject buttons. Reject requires a reason (text input in modal). Separate "Flagged" tab for investor-reported deals.
- **TransactionOverviewPage**: Full table of all platform transactions. Filterable by status, date range, amount. Click → TransactionDetailModal with full audit trail.
- **DisputeResolutionPage**: Open disputes list. Click → Dispute Detail Modal showing both parties' claims, transaction history, resolution options (refund, side with wholesaler, side with investor, escalate). Resolution requires a written explanation.
- **RevenueReportsPage**: Charts (subscription vs transaction fee revenue), detailed fee table with all collected fees, Export button → Export Options Popup (CSV download with date range selector).
- **PlatformSettingsPage**: Form sections: Transaction fee % input, Subscription tier price inputs, Tier feature toggles, Auto-approval threshold settings. Save with toast.

**Step 4: Verify**

Login as admin. Dashboard shows platform stats + charts with seeded data. Navigate to User Management, see user table. Click user → detail modal with verify/ban actions. Go to Deal Moderation, approve/reject a deal.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add all admin pages - dashboard, user management, moderation, disputes, revenue, settings"
```

---

### Task 12: Client Global Components — Calculators, Notifications, Shared Pages

**Files:**
- Create: `client/src/components/calculators/CalculatorDock.jsx`
- Create: `client/src/components/calculators/ARVCalculator.jsx`
- Create: `client/src/components/calculators/ROICalculator.jsx`
- Create: `client/src/components/calculators/CashOnCashCalculator.jsx`
- Create: `client/src/components/calculators/CapRateCalculator.jsx`
- Create: `client/src/components/calculators/RehabCostCalculator.jsx`
- Create: `client/src/components/calculators/MAOCalculator.jsx`
- Create: `client/src/components/calculators/WholesaleFeeCalculator.jsx`
- Create: `client/src/components/calculators/RentalAnalysisCalculator.jsx`
- Create: `client/src/utils/calculators.js`
- Create: `client/src/components/notifications/NotificationBell.jsx`
- Create: `client/src/components/notifications/NotificationDropdown.jsx`
- Create: `client/src/pages/shared/ProfilePage.jsx`
- Create: `client/src/pages/shared/UserProfilePage.jsx`
- Create: `client/src/pages/shared/SettingsPage.jsx`
- Create: `client/src/pages/shared/NotificationsPage.jsx`
- Create: `client/src/pages/education/CoursesPage.jsx`
- Create: `client/src/components/users/ReviewModal.jsx`
- Create: `client/src/components/users/ReputationScore.jsx`
- Create: `client/src/components/users/DealHistory.jsx`

**Step 1: Create calculator utility functions**

`utils/calculators.js` — Pure functions for all 8 calculations:

```js
// ARV: average of comps' price per sqft × subject sqft
export function calculateARV(comps, subjectSqft) { ... }

// ROI: ((salePrice - totalInvestment) / totalInvestment) × 100
export function calculateROI(purchasePrice, rehabCost, holdingCosts, salePrice) { ... }

// Cash-on-Cash: (annualCashFlow / totalCashInvested) × 100
export function calculateCashOnCash(annualCashFlow, totalCashInvested) { ... }

// Cap Rate: (NOI / propertyValue) × 100
export function calculateCapRate(noi, propertyValue) { ... }

// Rehab: sum of category costs
export function calculateRehabCost(items) { ... }

// MAO: ARV × 0.70 - rehabCost - assignmentFee
export function calculateMAO(arv, rehabCost, assignmentFee) { ... }

// Wholesale Fee: salePrice - purchasePrice
export function calculateWholesaleFee(salePrice, purchasePrice) { ... }

// Rental: monthlyRent - expenses = cash flow, annualized for ROI
export function calculateRentalAnalysis(monthlyRent, expenses, purchasePrice) { ... }
```

**Step 2: Create CalculatorDock**

Slide-out panel from right side of screen. Tab bar at top with all 8 calculator names. Each tab renders the corresponding calculator component. Can be opened from:
- Calculator icon in topbar (always visible)
- "Run Numbers" button on deal pages (pre-fills with deal data)
- Inline calculator buttons on deal creation form

The dock accepts optional `prefillData` prop to auto-populate fields from a deal.

**Step 3: Create individual calculator components**

Each calculator: labeled input fields, "Calculate" button, results display with formatted currency/percentage. All use the pure functions from `utils/calculators.js`.

Specific fields per calculator:

- **ARV**: Comparable properties list (add comps with price + sqft), subject property sqft → ARV result
- **ROI**: Purchase price, rehab cost, holding costs, expected sale price → ROI %
- **Cash-on-Cash**: Annual pre-tax cash flow, total cash invested → CoC %
- **Cap Rate**: Net Operating Income, property value → Cap Rate %
- **Rehab Cost**: Category line items (Kitchen, Bathroom, Roof, HVAC, Flooring, Paint, etc. with preset cost ranges) → Total
- **MAO**: ARV input, rehab cost, desired assignment fee → Maximum Allowable Offer
- **Wholesale Fee**: Sale price to investor, original purchase price → Assignment fee amount + percentage
- **Rental Analysis**: Monthly rent, vacancy %, property tax, insurance, maintenance, mortgage payment, purchase price → Monthly cash flow, annual cash flow, cash-on-cash return

**Step 4: Create notification components**

- **NotificationBell**: Icon in topbar with red badge showing unread count. Click toggles NotificationDropdown.
- **NotificationDropdown**: Panel below bell showing recent notifications. Each item: icon by type, title, message preview, time ago, read/unread indicator. "Mark All Read" button. "View All" link to full notifications page.

**Step 5: Create shared pages**

- **ProfilePage**: View/edit own profile. Avatar upload (simulated), name, email, phone, company, bio, location. Verification status display. Deal stats.
- **UserProfilePage**: Public view of another user. Avatar, name, company, reputation score, verification badge, deal history list, ratings/reviews list.
- **SettingsPage**: Account settings — email, password change, notification preferences (checkboxes for email/in-app per event type).
- **NotificationsPage**: Full-page list of all notifications with filters (all, unread, by type). Click notification navigates to related item.

**Step 6: Create user components**

- **ReviewModal**: Modal for rating a completed transaction. Star ratings for each category (communication, deal quality, professionalism, timeliness), written comment text area, submit button.
- **ReputationScore**: Displays reputation as stars + numeric score + total reviews count. Expandable to show per-category breakdown.
- **DealHistory**: List of past deals with status, date, amount.

**Step 7: Create education pages**

- **CoursesPage**: Grid of educational resource cards. Each card: title, description, category tag, read time estimate. Click opens CourseDetailPage or a modal with article content.

**Step 8: Wire CalculatorDock and NotificationBell into AppLayout**

Add calculator icon to topbar. Add NotificationBell to topbar. Render CalculatorDock as a global overlay.

**Step 9: Verify**

Click calculator icon → dock slides out with all 8 calculators. Run calculations. Click notification bell → shows notifications. Visit profile page. Visit education page.

**Step 10: Commit**

```bash
git add -A && git commit -m "feat: add all 8 calculators, notification system, profiles, reviews, education pages"
```

---

### Task 13: Electron Integration & Packaging

**Files:**
- Modify: `electron/main.js` (finalize server spawning, window management)
- Create: `electron/electron-builder.config.js`
- Modify: root `package.json` (add electron scripts)

**Step 1: Finalize electron/main.js**

Improve server process management:
- Wait for server health check (`GET /api/health`) before opening window
- Handle server crash with restart attempt
- Proper cleanup on app quit
- Add app menu with basic items (File, Edit, View, Dev)

**Step 2: Create electron-builder config**

```js
module.exports = {
  appId: 'com.dispohub.app',
  productName: 'DispoHub',
  directories: { output: 'dist-electron' },
  files: ['electron/**/*', 'server/**/*', 'client/dist/**/*'],
  mac: { category: 'public.app-category.business' },
  linux: { target: ['AppImage', 'deb'] }
};
```

**Step 3: Add root scripts**

```json
{
  "electron:dev": "concurrently \"npm run dev:server\" \"npm run dev:client\" \"sleep 3 && npm run dev:electron\"",
  "electron:build": "npm run build --workspace=client && electron-builder"
}
```

**Step 4: Verify**

Run `npm run electron:dev` → Electron window opens showing the full app. Server starts, client loads inside Electron.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: finalize Electron integration with server management and packaging config"
```

---

### Task 14: Polish, Integration Testing & Final Touches

**Files:**
- Modify: various files for bug fixes and polish
- Create: `client/src/components/common/OnboardingTour.jsx` (optional)

**Step 1: Verify complete transaction flow**

Walk through the full flow as each role:
1. Login as admin → approve a pending deal
2. Login as investor → browse deals → make offer
3. Login as wholesaler → view offer → accept
4. Login as investor → proceed to transaction
5. Verify escrow → contract signing → completion → both parties rate

Fix any broken connections or missing data in the flow.

**Step 2: Verify all calculator data flows**

Open calculator dock from topbar. Open from deal detail with pre-filled data. Verify all 8 calculators produce correct results. Fix any calculation errors.

**Step 3: Verify dev tools**

Test role switcher — all 3 roles switch cleanly. Sidebar changes. Dashboard data changes. Test data re-seeder.

**Step 4: UI polish pass**

- Ensure consistent spacing and alignment
- Check all modals have proper close behavior (Esc, backdrop click)
- Verify all status badges use correct colors
- Check loading states and empty states render properly
- Ensure all toast notifications appear correctly

**Step 5: Final commit**

```bash
git add -A && git commit -m "feat: polish UI, verify integration flows, finalize DispoHub prototype"
```
