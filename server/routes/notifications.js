import { Router } from 'express';
import {
  findNotificationsByUser,
  markAsRead,
  markAllAsRead,
  countUnread,
} from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ---------------------------------------------------------------------------
// GET /api/notifications — Current user's notifications (with filtering & pagination)
// Query params: ?unread=true, ?type=offer_received, ?page=1&limit=20
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { unread, type, page = 1, limit = 20 } = req.query;

    // Build filters
    const filters = {};
    if (unread === 'true') {
      filters.read = false;
    } else if (unread === 'false') {
      filters.read = true;
    }
    if (type) {
      filters.type = type;
    }

    let notifications = await findNotificationsByUser(req.user.id, filters);

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const total = notifications.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (pageNum - 1) * pageSize;
    const paged = notifications.slice(start, start + pageSize);

    res.json({
      notifications: paged,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/notifications/count — Unread notification count
// ---------------------------------------------------------------------------
router.get('/count', async (req, res) => {
  try {
    const count = await countUnread(req.user.id);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to count notifications: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/notifications/read-all — Mark all notifications as read
// ---------------------------------------------------------------------------
router.put('/read-all', async (req, res) => {
  try {
    const count = await markAllAsRead(req.user.id);
    res.json({ message: `Marked ${count} notifications as read`, count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/notifications/:id/read — Mark single notification as read
// ---------------------------------------------------------------------------
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Verify the notification belongs to the current user
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ notification });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read: ' + err.message });
  }
});

export default router;
