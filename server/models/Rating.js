import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';

/**
 * Create a new rating / review.
 * @param {Object} data - Rating fields
 * @returns {Object} The created rating record
 */
export async function createRating(data) {
  const rating = {
    id: data.id || uuidv4(),
    transactionId: data.transactionId,
    reviewerId: data.reviewerId,
    revieweeId: data.revieweeId,
    score: data.score,                             // 1-5
    comment: data.comment || '',
    categories: {
      communication: data.categories?.communication ?? null,
      dealQuality: data.categories?.dealQuality ?? null,
      professionalism: data.categories?.professionalism ?? null,
      timeliness: data.categories?.timeliness ?? null
    },
    createdAt: data.createdAt || new Date().toISOString()
  };

  db.data.ratings.push(rating);
  await db.write();
  return rating;
}

/**
 * Find all ratings where a user is the reviewee.
 */
export async function findRatingsByUser(userId) {
  return db.data.ratings.filter(r => r.revieweeId === userId);
}

/**
 * Find a specific rating for a transaction by a given reviewer.
 */
export async function findRatingByTransaction(transactionId, reviewerId) {
  return db.data.ratings.find(
    r => r.transactionId === transactionId && r.reviewerId === reviewerId
  ) || null;
}

/**
 * Return all ratings in the database.
 */
export async function findAllRatings() {
  return [...db.data.ratings];
}
