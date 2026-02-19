import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';

/**
 * Create a new transaction record.
 * @param {Object} data - Transaction fields
 * @returns {Object} The created transaction record
 */
export async function createTransaction(data) {
  const transaction = {
    id: data.id || uuidv4(),
    dealId: data.dealId,
    offerId: data.offerId,
    wholesalerId: data.wholesalerId,
    investorId: data.investorId,
    status: data.status || 'escrow_funded',        // escrow_funded | under_review | closing | completed | cancelled | disputed
    salePrice: data.salePrice,
    platformFee: data.platformFee,
    platformFeePercent: data.platformFeePercent ?? 5,
    escrowAmount: data.escrowAmount ?? null,
    contractId: data.contractId || null,
    closingDate: data.closingDate || null,
    completedAt: data.completedAt || null,
    statusHistory: data.statusHistory || [
      { status: data.status || 'escrow_funded', timestamp: new Date().toISOString() }
    ],
    createdAt: data.createdAt || new Date().toISOString()
  };

  db.data.transactions.push(transaction);
  await db.write();
  return transaction;
}

/**
 * Find a transaction by its unique id.
 */
export async function findTransactionById(id) {
  return db.data.transactions.find(t => t.id === id) || null;
}

/**
 * Find all transactions involving a specific user (as wholesaler or investor).
 */
export async function findTransactionsByUser(userId) {
  return db.data.transactions.filter(
    t => t.wholesalerId === userId || t.investorId === userId
  );
}

/**
 * Return all transactions, optionally filtered.
 * Supported filters: status, wholesalerId, investorId
 */
export async function findAllTransactions(filters = {}) {
  let results = [...db.data.transactions];

  if (filters.status) {
    results = results.filter(t => t.status === filters.status);
  }
  if (filters.wholesalerId) {
    results = results.filter(t => t.wholesalerId === filters.wholesalerId);
  }
  if (filters.investorId) {
    results = results.filter(t => t.investorId === filters.investorId);
  }

  return results;
}

/**
 * Update an existing transaction by id.
 * Automatically appends to statusHistory when status changes.
 * @returns {Object|null} The updated transaction, or null if not found
 */
export async function updateTransaction(id, updates) {
  const idx = db.data.transactions.findIndex(t => t.id === id);
  if (idx === -1) return null;

  const existing = db.data.transactions[idx];

  // If status is changing, append to history
  if (updates.status && updates.status !== existing.status) {
    const historyEntry = { status: updates.status, timestamp: new Date().toISOString() };
    updates.statusHistory = [...(existing.statusHistory || []), historyEntry];
  }

  db.data.transactions[idx] = { ...existing, ...updates };
  await db.write();
  return db.data.transactions[idx];
}
