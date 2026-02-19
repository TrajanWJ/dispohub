import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';

/**
 * Create a new subscription record.
 * @param {Object} data - Subscription fields
 * @returns {Object} The created subscription record
 */
export async function createSubscription(data) {
  const subscription = {
    id: data.id || uuidv4(),
    userId: data.userId,
    tier: data.tier || 'free',
    price: data.price ?? 0,
    features: data.features || [],
    startDate: data.startDate || new Date().toISOString(),
    renewalDate: data.renewalDate || null,
    status: data.status || 'active'
  };

  db.data.subscriptions.push(subscription);
  await db.write();
  return subscription;
}

/**
 * Find the active subscription for a given user.
 * Returns the most recent subscription for that user.
 */
export async function findSubscriptionByUser(userId) {
  const subs = db.data.subscriptions.filter(s => s.userId === userId);
  if (subs.length === 0) return null;
  return subs.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
}

/**
 * Update an existing subscription by id.
 * @returns {Object|null} The updated subscription, or null if not found
 */
export async function updateSubscription(id, updates) {
  const idx = db.data.subscriptions.findIndex(s => s.id === id);
  if (idx === -1) return null;

  db.data.subscriptions[idx] = { ...db.data.subscriptions[idx], ...updates };
  await db.write();
  return db.data.subscriptions[idx];
}
