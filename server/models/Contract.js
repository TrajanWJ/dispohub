import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';

/**
 * Create a new contract record.
 * @param {Object} data - Contract fields
 * @returns {Object} The created contract record
 */
export async function createContract(data) {
  const contract = {
    id: data.id || uuidv4(),
    transactionId: data.transactionId,
    templateId: data.templateId || null,
    type: data.type || 'assignment',               // assignment | purchase
    status: data.status || 'draft',                // draft | sent | signed_by_one | fully_signed
    parties: data.parties || [],                   // [{userId, role, signedAt}]
    documentContent: data.documentContent || '',
    createdAt: data.createdAt || new Date().toISOString()
  };

  db.data.contracts.push(contract);
  await db.write();
  return contract;
}

/**
 * Find a contract by its unique id.
 */
export async function findContractById(id) {
  return db.data.contracts.find(c => c.id === id) || null;
}

/**
 * Find all contracts linked to a specific transaction.
 */
export async function findContractsByTransaction(transactionId) {
  return db.data.contracts.filter(c => c.transactionId === transactionId);
}

/**
 * Update an existing contract by id.
 * @returns {Object|null} The updated contract, or null if not found
 */
export async function updateContract(id, updates) {
  const idx = db.data.contracts.findIndex(c => c.id === id);
  if (idx === -1) return null;

  db.data.contracts[idx] = { ...db.data.contracts[idx], ...updates };
  await db.write();
  return db.data.contracts[idx];
}
