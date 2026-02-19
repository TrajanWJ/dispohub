import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';

/**
 * Create a new offer on a deal.
 * @param {Object} data - Offer fields
 * @returns {Object} The created offer record
 */
export async function createOffer(data) {
  const offer = {
    id: data.id || uuidv4(),
    dealId: data.dealId,
    investorId: data.investorId,
    amount: data.amount,
    message: data.message || '',
    status: data.status || 'pending',              // pending | accepted | rejected | withdrawn | expired
    createdAt: data.createdAt || new Date().toISOString(),
    respondedAt: data.respondedAt || null,
    expiresAt: data.expiresAt || null
  };

  db.data.offers.push(offer);
  await db.write();
  return offer;
}

/**
 * Find an offer by its unique id.
 */
export async function findOfferById(id) {
  return db.data.offers.find(o => o.id === id) || null;
}

/**
 * Find all offers for a specific deal.
 */
export async function findOffersByDeal(dealId) {
  return db.data.offers.filter(o => o.dealId === dealId);
}

/**
 * Find all offers placed by a specific investor.
 */
export async function findOffersByInvestor(investorId) {
  return db.data.offers.filter(o => o.investorId === investorId);
}

/**
 * Update an existing offer by id.
 * @returns {Object|null} The updated offer, or null if not found
 */
export async function updateOffer(id, updates) {
  const idx = db.data.offers.findIndex(o => o.id === id);
  if (idx === -1) return null;

  db.data.offers[idx] = { ...db.data.offers[idx], ...updates };
  await db.write();
  return db.data.offers[idx];
}
