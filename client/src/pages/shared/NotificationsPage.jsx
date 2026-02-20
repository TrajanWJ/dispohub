import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  Button,
  LoadingSpinner,
  EmptyState,
  Pagination,
  Tabs,
} from '../../components/common';
import { useToast } from '../../components/common';
import { formatTimeAgo } from '../../utils/formatters';

/* ============================================================
   STYLES
   ============================================================ */

const styles = {
  page: {
    padding: '1.5rem 2rem',
    maxWidth: 800,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.25rem',
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  loadingWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40vh',
  },
  errorBox: {
    background: 'rgba(255,71,87,0.08)',
    border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)',
    padding: '0.875rem 1rem',
    color: 'var(--accent-danger)',
    fontSize: '0.875rem',
    marginBottom: '1.25rem',
  },

  /* Notification list */
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  notificationCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.875rem',
    padding: '1rem 1.25rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    cursor: 'pointer',
    transition: 'var(--transition)',
    position: 'relative',
  },
  notificationCardUnread: {
    background: 'rgba(108, 92, 231, 0.04)',
    borderColor: 'rgba(108, 92, 231, 0.2)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.125rem',
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
    minWidth: 0,
  },
  notifTitle: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  notifMessage: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: '0.375rem',
  },
  notifTime: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  unreadDot: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--accent-primary)',
  },
};

/* ============================================================
   TYPE CONFIGURATIONS
   ============================================================ */

const typeConfig = {
  offer_received: {
    icon: '\uD83D\uDCE9',
    color: 'var(--accent-primary)',
    bg: 'rgba(108, 92, 231, 0.12)',
    category: 'offers',
  },
  offer_accepted: {
    icon: '\u2705',
    color: 'var(--accent-success)',
    bg: 'rgba(0, 214, 143, 0.12)',
    category: 'offers',
  },
  offer_rejected: {
    icon: '\u274C',
    color: 'var(--accent-danger)',
    bg: 'rgba(255, 71, 87, 0.12)',
    category: 'offers',
  },
  deal_approved: {
    icon: '\uD83C\uDF89',
    color: 'var(--accent-success)',
    bg: 'rgba(0, 214, 143, 0.12)',
    category: 'transactions',
  },
  deal_rejected: {
    icon: '\uD83D\uDEAB',
    color: 'var(--accent-danger)',
    bg: 'rgba(255, 71, 87, 0.12)',
    category: 'transactions',
  },
  transaction_update: {
    icon: '\uD83D\uDD04',
    color: 'var(--accent-info)',
    bg: 'rgba(52, 152, 219, 0.12)',
    category: 'transactions',
  },
  dispute_resolved: {
    icon: '\u2696\uFE0F',
    color: 'var(--accent-warning)',
    bg: 'rgba(255, 170, 0, 0.12)',
    category: 'transactions',
  },
  verification: {
    icon: '\uD83D\uDEE1\uFE0F',
    color: 'var(--accent-info)',
    bg: 'rgba(52, 152, 219, 0.12)',
    category: 'system',
  },
  system: {
    icon: '\u2699\uFE0F',
    color: 'var(--text-secondary)',
    bg: 'var(--bg-tertiary)',
    category: 'system',
  },
};

const defaultTypeConfig = {
  icon: '\uD83D\uDD14',
  color: 'var(--text-secondary)',
  bg: 'var(--bg-tertiary)',
  category: 'system',
};

/* ============================================================
   TABS CONFIG
   ============================================================ */

const filterTabs = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Offers', value: 'offers' },
  { label: 'Transactions', value: 'transactions' },
  { label: 'System', value: 'system' },
];

/* ============================================================
   RELATED ITEM ROUTES
   ============================================================ */

function getRelatedRoute(notification) {
  const { relatedType, relatedId } = notification;
  if (!relatedId) return null;
  switch (relatedType) {
    case 'deal':
      return `/deals/${relatedId}`;
    case 'offer':
      return `/offers/${relatedId}`;
    case 'transaction':
      return `/transactions/${relatedId}`;
    case 'user':
      return `/profile/${relatedId}`;
    default:
      return null;
  }
}

/* ============================================================
   NOTIFICATIONS PAGE
   ============================================================ */

const LIMIT = 20;

export default function NotificationsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [activeTab, setActiveTab] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async (page = 1, filter = 'all') => {
    setLoading(true);
    setError(null);
    try {
      let url = `/notifications?page=${page}&limit=${LIMIT}`;
      if (filter === 'unread') {
        url += '&unread=true';
      }
      const res = await api.get(url);
      const data = res.data;
      let items = data.notifications || data.data || [];

      // Client-side category filter
      if (['offers', 'transactions', 'system'].includes(filter)) {
        items = items.filter((n) => {
          const cfg = typeConfig[n.type] || defaultTypeConfig;
          return cfg.category === filter;
        });
      }

      setNotifications(items);
      setPagination({
        page: data.pagination?.page || page,
        totalPages: data.pagination?.totalPages || Math.ceil((data.pagination?.total || items.length) / LIMIT) || 1,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1, activeTab);
  }, [fetchNotifications, activeTab]);

  const handleMarkRead = async (notification) => {
    if (notification.read) return;
    try {
      await api.put(`/notifications/${notification._id || notification.id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === (notification._id || notification.id)
            ? { ...n, read: true }
            : n
        )
      );
    } catch {
      // Silently fail — non-critical
    }
  };

  const handleNotificationClick = async (notification) => {
    await handleMarkRead(notification);
    const route = getRelatedRoute(notification);
    if (route) {
      navigate(route);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark all as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  const handlePageChange = (page) => {
    fetchNotifications(page, activeTab);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" loading={markingAll} onClick={handleMarkAllRead}>
            Mark All Read
          </Button>
        )}
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Filter tabs */}
      <Tabs tabs={filterTabs} active={activeTab} onChange={handleTabChange} />

      {/* Loading */}
      {loading ? (
        <div style={styles.loadingWrap}>
          <LoadingSpinner size={48} />
        </div>
      ) : notifications.length === 0 ? (
        /* Empty state */
        <EmptyState
          icon={'\uD83C\uDF1F'}
          title="You're all caught up!"
          message="No notifications to display. We'll let you know when something important happens."
        />
      ) : (
        /* Notification list */
        <>
          <div style={styles.list}>
            {notifications.map((notification) => {
              const cfg = typeConfig[notification.type] || defaultTypeConfig;
              const isUnread = !notification.read;

              return (
                <div
                  key={notification._id || notification.id}
                  style={{
                    ...styles.notificationCard,
                    ...(isUnread ? styles.notificationCardUnread : {}),
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isUnread
                      ? 'rgba(108, 92, 231, 0.2)'
                      : 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Type icon */}
                  <div
                    style={{
                      ...styles.iconWrap,
                      background: cfg.bg,
                      color: cfg.color,
                    }}
                  >
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={styles.notifContent}>
                    <div style={{
                      ...styles.notifTitle,
                      fontWeight: isUnread ? 700 : 600,
                    }}>
                      {notification.title}
                    </div>
                    <div style={styles.notifMessage}>{notification.message}</div>
                    <div style={styles.notifTime}>{formatTimeAgo(notification.createdAt)}</div>
                  </div>

                  {/* Unread indicator */}
                  {isUnread && <div style={styles.unreadDot} />}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
