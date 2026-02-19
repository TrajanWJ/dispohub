import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail, findUserById, findAllUsers } from '../models/User.js';
import { createSubscription } from '../models/Subscription.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, company, location } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (!['wholesaler', 'investor'].includes(role)) {
      return res.status(400).json({ error: 'Role must be wholesaler or investor' });
    }
    
    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({
      email, name, role, company, location,
      passwordHash,
      verificationStatus: 'pending',
      subscriptionTier: 'free'
    });

    // Create default subscription for investors
    if (role === 'investor') {
      await createSubscription({
        userId: user.id,
        tier: 'free',
        price: 0,
        features: ['Browse deals', '3 offers/month', 'Basic matching', '3 calculators'],
        status: 'active'
      });
    }
    
    const token = generateToken(user.id);
    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = generateToken(user.id);
    const { passwordHash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// POST /api/auth/dev-switch — quick role switch for dev toolbar
router.post('/dev-switch', async (req, res) => {
  const { role, userId } = req.body;

  let user;
  if (userId) {
    user = await findUserById(userId);
  } else if (role) {
    const users = await findAllUsers({ role });
    user = users[0];
  }

  if (!user) return res.status(404).json({ error: 'No user found for that role/id' });

  const token = generateToken(user.id);
  const { passwordHash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// GET /api/auth/dev-users — list all users for dev toolbar
router.get('/dev-users', async (req, res) => {
  const users = await findAllUsers();
  res.json(users.map(({ passwordHash, ...u }) => u));
});

export default router;
