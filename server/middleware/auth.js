import jwt from 'jsonwebtoken';
import { findUserById } from '../models/User.js';

const JWT_SECRET = 'dispohub-dev-secret-key-change-in-production';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await findUserById(payload.userId);
      if (!user) return res.status(401).json({ error: 'User not found' });
      req.user = { ...user };
      delete req.user.passwordHash;
      return next();
    } catch (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  }

  // Dev mode fallback: x-dev-user-id header bypasses JWT when no token is present.
  const devUserId = req.headers['x-dev-user-id'];
  if (devUserId) {
    const user = await findUserById(devUserId);
    if (user) {
      req.user = { ...user };
      delete req.user.passwordHash;
      return next();
    }
  }

  return res.status(401).json({ error: 'No token provided' });
}

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export { JWT_SECRET };
