import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';

/**
 * Create a new user.
 * @param {Object} data - User fields
 * @returns {Object} The created user record
 */
export async function createUser(data) {
  const user = {
    id: data.id || uuidv4(),
    role: data.role || 'investor',
    email: data.email,
    name: data.name,
    avatar: data.avatar || null,
    phone: data.phone || null,
    company: data.company || null,
    bio: data.bio || null,
    location: {
      state: data.location?.state || null,
      city: data.location?.city || null
    },
    verificationStatus: data.verificationStatus || 'pending',
    verificationDocs: data.verificationDocs || [],
    dealCount: data.dealCount || 0,
    reputationScore: data.reputationScore ?? 0,
    memberSince: data.memberSince || new Date().toISOString(),
    subscriptionTier: data.subscriptionTier || 'free',
    preferences: data.preferences || {},
    passwordHash: data.passwordHash || null,
    createdAt: data.createdAt || new Date().toISOString()
  };

  db.data.users.push(user);
  await db.write();
  return user;
}

/**
 * Find a user by their unique id.
 */
export async function findUserById(id) {
  return db.data.users.find(u => u.id === id) || null;
}

/**
 * Find a user by email address.
 */
export async function findUserByEmail(email) {
  return db.data.users.find(u => u.email === email) || null;
}

/**
 * Return all users, optionally filtered.
 * Supported filters: role, verificationStatus, subscriptionTier, search (name/email)
 */
export async function findAllUsers(filters = {}) {
  let results = [...db.data.users];

  if (filters.role) {
    results = results.filter(u => u.role === filters.role);
  }
  if (filters.verificationStatus) {
    results = results.filter(u => u.verificationStatus === filters.verificationStatus);
  }
  if (filters.subscriptionTier) {
    results = results.filter(u => u.subscriptionTier === filters.subscriptionTier);
  }
  if (filters.search) {
    const term = filters.search.toLowerCase();
    results = results.filter(u =>
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
  }

  return results;
}

/**
 * Update an existing user by id.
 * @returns {Object|null} The updated user, or null if not found
 */
export async function updateUser(id, updates) {
  const idx = db.data.users.findIndex(u => u.id === id);
  if (idx === -1) return null;

  if (updates.location) {
    updates.location = { ...db.data.users[idx].location, ...updates.location };
  }

  db.data.users[idx] = { ...db.data.users[idx], ...updates };
  await db.write();
  return db.data.users[idx];
}

/**
 * Delete a user by id.
 * @returns {boolean} True if deleted, false if not found
 */
export async function deleteUser(id) {
  const idx = db.data.users.findIndex(u => u.id === id);
  if (idx === -1) return false;

  db.data.users.splice(idx, 1);
  await db.write();
  return true;
}
