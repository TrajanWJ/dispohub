import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';

/**
 * Create a new notification.
 * @param {Object} data - Notification fields
 * @returns {Object} The created notification record
 */
export async function createNotification(data) {
  const notification = {
    id: data.id || uuidv4(),
    userId: data.userId,
    type: data.type || 'info',
    title: data.title || '',
    message: data.message || '',
    read: data.read ?? false,
    relatedId: data.relatedId || null,
    relatedType: data.relatedType || null,
    createdAt: data.createdAt || new Date().toISOString()
  };

  db.data.notifications.push(notification);
  await db.write();
  return notification;
}

/**
 * Find all notifications for a user, optionally filtered.
 * Supported filters: read (boolean), type
 */
export async function findNotificationsByUser(userId, filters = {}) {
  let results = db.data.notifications.filter(n => n.userId === userId);

  if (filters.read !== undefined) {
    const readVal = typeof filters.read === 'string' ? filters.read === 'true' : !!filters.read;
    results = results.filter(n => n.read === readVal);
  }
  if (filters.type) {
    results = results.filter(n => n.type === filters.type);
  }

  // Return newest first
  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Mark a single notification as read.
 * @returns {Object|null} The updated notification, or null if not found
 */
export async function markAsRead(id) {
  const idx = db.data.notifications.findIndex(n => n.id === id);
  if (idx === -1) return null;

  db.data.notifications[idx].read = true;
  await db.write();
  return db.data.notifications[idx];
}

/**
 * Mark all notifications for a user as read.
 * @returns {number} Number of notifications marked as read
 */
export async function markAllAsRead(userId) {
  let count = 0;
  db.data.notifications.forEach(n => {
    if (n.userId === userId && !n.read) {
      n.read = true;
      count++;
    }
  });
  if (count > 0) await db.write();
  return count;
}

/**
 * Count unread notifications for a user.
 */
export async function countUnread(userId) {
  return db.data.notifications.filter(n => n.userId === userId && !n.read).length;
}
