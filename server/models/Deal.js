import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';

/**
 * Create a new deal listing.
 * @param {Object} data - Deal fields
 * @returns {Object} The created deal record
 */
export async function createDeal(data) {
  const deal = {
    id: data.id || uuidv4(),
    wholesalerId: data.wholesalerId,
    status: data.status || 'draft',                // draft | pending_review | active | under_contract | sold | delisted
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip || null,
    county: data.county || null,
    propertyType: data.propertyType || 'SFH',      // SFH | Multi-Family | Commercial | Land
    bedrooms: data.bedrooms ?? null,
    bathrooms: data.bathrooms ?? null,
    sqft: data.sqft ?? null,
    lotSize: data.lotSize || null,
    yearBuilt: data.yearBuilt ?? null,
    photos: data.photos || [],
    askingPrice: data.askingPrice,
    arvEstimate: data.arvEstimate ?? null,
    rehabEstimate: data.rehabEstimate ?? null,
    currentValue: data.currentValue ?? null,
    assignmentFee: data.assignmentFee ?? null,
    description: data.description || '',
    highlights: data.highlights || [],
    approvalStatus: data.approvalStatus || null,
    approvedBy: data.approvedBy || null,
    listedAt: data.listedAt || null,
    delistedAt: data.delistedAt || null,
    viewCount: data.viewCount ?? 0,
    saveCount: data.saveCount ?? 0,
    offerCount: data.offerCount ?? 0,
    savedBy: data.savedBy || [],
    createdAt: data.createdAt || new Date().toISOString()
  };

  db.data.deals.push(deal);
  await db.write();
  return deal;
}

/**
 * Find a deal by its unique id.
 */
export async function findDealById(id) {
  return db.data.deals.find(d => d.id === id) || null;
}

/**
 * Return all deals, optionally filtered.
 * Supported filters: state, city, propertyType, priceMin, priceMax, status, search (address/city)
 */
export async function findAllDeals(filters = {}) {
  let results = [...db.data.deals];

  if (filters.state) {
    results = results.filter(d => d.state === filters.state);
  }
  if (filters.city) {
    const city = filters.city.toLowerCase();
    results = results.filter(d => d.city && d.city.toLowerCase() === city);
  }
  if (filters.propertyType) {
    results = results.filter(d => d.propertyType === filters.propertyType);
  }
  if (filters.priceMin != null) {
    results = results.filter(d => d.askingPrice >= Number(filters.priceMin));
  }
  if (filters.priceMax != null) {
    results = results.filter(d => d.askingPrice <= Number(filters.priceMax));
  }
  if (filters.status) {
    results = results.filter(d => d.status === filters.status);
  }
  if (filters.search) {
    const term = filters.search.toLowerCase();
    results = results.filter(d =>
      (d.address && d.address.toLowerCase().includes(term)) ||
      (d.city && d.city.toLowerCase().includes(term))
    );
  }

  return results;
}

/**
 * Find all deals belonging to a specific wholesaler.
 */
export async function findDealsByWholesaler(wholesalerId) {
  return db.data.deals.filter(d => d.wholesalerId === wholesalerId);
}

/**
 * Update an existing deal by id.
 * @returns {Object|null} The updated deal, or null if not found
 */
export async function updateDeal(id, updates) {
  const idx = db.data.deals.findIndex(d => d.id === id);
  if (idx === -1) return null;

  db.data.deals[idx] = { ...db.data.deals[idx], ...updates };
  await db.write();
  return db.data.deals[idx];
}

/**
 * Delete a deal by id.
 * @returns {boolean} True if deleted, false if not found
 */
export async function deleteDeal(id) {
  const idx = db.data.deals.findIndex(d => d.id === id);
  if (idx === -1) return false;

  db.data.deals.splice(idx, 1);
  await db.write();
  return true;
}
