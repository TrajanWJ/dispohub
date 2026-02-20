import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import {
  Button, Card, Modal, ConfirmDialog, Badge, StatusBadge,
  StarRating, SearchBar, Avatar, LoadingSpinner, EmptyState, Pagination,
} from '../../components/common/index.jsx';

// ─── Helpers ──────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1280, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' },

  toolbar: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap',
  },
  select: {
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)', padding: '0.5rem 0.75rem', fontSize: '0.875rem',
    color: 'var(--text-primary)', minWidth: 140, cursor: 'pointer',
  },

  tableWrap: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5,
    borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
  },
  td: {
    padding: '0.85rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
  },
  row: { cursor: 'pointer', transition: 'var(--transition)' },

  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1.25rem',
  },

  // Modal detail
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', marginBottom: '1.25rem' },
  infoLabel: {
    fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 2,
  },
  infoValue: { fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '0.6rem' },
  sectionTitle: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', marginTop: '1.25rem' },

  actionsRow: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' },

  textarea: {
    width: '100%', minHeight: 80, background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
    padding: '0.625rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-primary)',
    resize: 'vertical', marginTop: '0.5rem',
  },
};

const ROLE_VARIANTS = {
  admin: 'info',
  wholesaler: 'success',
  investor: 'warning',
};

// ─── Component ────────────────────────────────────────────────────
export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Actions
  const [actionLoading, setActionLoading] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [showBanConfirm, setShowBanConfirm] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (verificationFilter) params.verificationStatus = verificationFilter;

      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, verificationFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openUserDetail = async (user) => {
    setSelectedUser(user);
    setVerifyNotes('');
    setModalLoading(false);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setShowBanConfirm(false);
  };

  const handleVerify = async (status) => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${selectedUser._id || selectedUser.id}/verify`, {
        status,
        notes: verifyNotes,
      });
      setSelectedUser((prev) => prev ? { ...prev, verificationStatus: status } : prev);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status} user.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${selectedUser._id || selectedUser.id}/ban`);
      setSelectedUser((prev) => prev ? { ...prev, status: 'suspended' } : prev);
      setShowBanConfirm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to ban user.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <h1 style={s.title}>User Management</h1>

      {error && <div style={s.errorBox}>{error}</div>}

      {/* Toolbar */}
      <div style={s.toolbar}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search by name or email..."
          style={{ flex: 1, minWidth: 200, maxWidth: 360 }}
        />
        <select
          style={s.select}
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          <option value="wholesaler">Wholesaler</option>
          <option value="investor">Investor</option>
          <option value="admin">Admin</option>
        </select>
        <select
          style={s.select}
          value={verificationFilter}
          onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Verification</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={s.center}>
          <LoadingSpinner size={40} />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          message="Try adjusting your filters or search query."
          icon={'\uD83D\uDC65'}
        />
      ) : (
        <>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Name</th>
                  <th style={s.th}>Role</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Verification</th>
                  <th style={s.th}>Reputation</th>
                  <th style={s.th}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '-';
                  return (
                    <tr
                      key={u._id || u.id}
                      style={s.row}
                      onClick={() => openUserDetail(u)}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <Avatar src={u.avatar} name={name} size="sm" />
                          <span style={{ fontWeight: 500 }}>{name}</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <Badge variant={ROLE_VARIANTS[u.role] || 'neutral'}>
                          {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Unknown'}
                        </Badge>
                      </td>
                      <td style={{ ...s.td, color: 'var(--text-secondary)' }}>{u.email || '-'}</td>
                      <td style={s.td}>
                        <StatusBadge status={u.verificationStatus || 'unverified'} />
                      </td>
                      <td style={s.td}>
                        <StarRating value={u.reputationScore || u.reputation || 0} size={14} />
                      </td>
                      <td style={{ ...s.td, color: 'var(--text-secondary)' }}>
                        {fmtDate(u.createdAt || u.joinDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={pagination.page || page}
            totalPages={pagination.totalPages || 1}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}

      {/* ═══ User Detail Modal ═══ */}
      <Modal
        isOpen={!!selectedUser}
        onClose={closeModal}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <UserDetailContent
            user={selectedUser}
            verifyNotes={verifyNotes}
            setVerifyNotes={setVerifyNotes}
            onVerify={handleVerify}
            onBan={() => setShowBanConfirm(true)}
            actionLoading={actionLoading}
          />
        )}
      </Modal>

      {/* Ban Confirm */}
      <ConfirmDialog
        isOpen={showBanConfirm}
        onClose={() => setShowBanConfirm(false)}
        onConfirm={handleBan}
        title="Ban User"
        message={`Are you sure you want to ban ${selectedUser?.name || selectedUser?.email || 'this user'}? This action will suspend their account.`}
        confirmText="Ban User"
        confirmVariant="danger"
      />
    </div>
  );
}

// ─── User Detail Content ──────────────────────────────────────────
function UserDetailContent({ user, verifyNotes, setVerifyNotes, onVerify, onBan, actionLoading }) {
  const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '-';
  const isPending = user.verificationStatus === 'pending' || user.verificationStatus === 'unverified';

  return (
    <>
      {/* Profile header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <Avatar src={user.avatar} name={name} size="lg" />
        <div>
          <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {name}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {user.email}
          </div>
          <div style={{ marginTop: '0.375rem', display: 'flex', gap: '0.5rem' }}>
            <Badge variant={ROLE_VARIANTS[user.role] || 'neutral'}>
              {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'}
            </Badge>
            <StatusBadge status={user.verificationStatus || 'unverified'} />
            {user.status === 'suspended' && <Badge variant="danger">Banned</Badge>}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div style={s.infoGrid}>
        <div>
          <div style={s.infoLabel}>Phone</div>
          <div style={s.infoValue}>{user.phone || '-'}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Company</div>
          <div style={s.infoValue}>{user.company || '-'}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Location</div>
          <div style={s.infoValue}>{user.city || user.location || '-'}{user.state ? `, ${user.state}` : ''}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Join Date</div>
          <div style={s.infoValue}>{fmtDate(user.createdAt || user.joinDate)}</div>
        </div>
        <div>
          <div style={s.infoLabel}>Reputation</div>
          <div style={s.infoValue}>
            <StarRating value={user.reputationScore || user.reputation || 0} size={16} />
            <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ({Number(user.reputationScore || user.reputation || 0).toFixed(1)})
            </span>
          </div>
        </div>
        <div>
          <div style={s.infoLabel}>Total Deals</div>
          <div style={s.infoValue}>{user.totalDeals || user.dealsCount || 0}</div>
        </div>
      </div>

      {/* Verification docs */}
      {(user.verificationDocs || user.documents) && (
        <>
          <div style={s.sectionTitle}>Verification Documents</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {(user.verificationDocs || user.documents || []).map((doc, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)', padding: '0.625rem 0.875rem',
                  fontSize: '0.85rem', color: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{'\uD83D\uDCC4'}</span>
                {typeof doc === 'string' ? doc : doc.name || doc.filename || `Document ${i + 1}`}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Bio */}
      {user.bio && (
        <>
          <div style={s.sectionTitle}>Bio</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
            {user.bio}
          </p>
        </>
      )}

      {/* Verification Notes */}
      {isPending && (
        <>
          <div style={s.sectionTitle}>Verification Notes</div>
          <textarea
            style={s.textarea}
            value={verifyNotes}
            onChange={(e) => setVerifyNotes(e.target.value)}
            placeholder="Optional notes for verification decision..."
          />
        </>
      )}

      {/* Actions */}
      <div style={s.actionsRow}>
        {isPending && (
          <>
            <Button
              variant="primary"
              loading={actionLoading}
              onClick={() => onVerify('verified')}
              style={{ background: 'var(--accent-success)' }}
            >
              Verify User
            </Button>
            <Button
              variant="danger"
              loading={actionLoading}
              onClick={() => onVerify('rejected')}
            >
              Reject Verification
            </Button>
          </>
        )}
        {user.status !== 'suspended' && (
          <Button
            variant="danger"
            loading={actionLoading}
            onClick={onBan}
            style={{ marginLeft: isPending ? 'auto' : 0 }}
          >
            Ban User
          </Button>
        )}
        {user.status === 'suspended' && (
          <Badge variant="danger" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            User is Banned
          </Badge>
        )}
      </div>
    </>
  );
}
