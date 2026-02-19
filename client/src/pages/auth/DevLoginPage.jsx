import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

/* ------------------------------------------------------------------ */
/*  Featured dev user cards                                            */
/* ------------------------------------------------------------------ */

const FEATURED = [
  {
    role: 'wholesaler',
    name: 'Marcus Johnson',
    company: 'Johnson Wholesale Properties',
    stars: 4.7,
    accent: '#6c5ce7',       // purple
    accentBg: 'rgba(108, 92, 231, 0.12)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    role: 'investor',
    name: 'Sarah Chen',
    company: 'Clearwater Holdings',
    stars: 4.9,
    accent: '#00d68f',       // green
    accentBg: 'rgba(0, 214, 143, 0.12)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    role: 'admin',
    name: 'Alex Rivera',
    company: 'Platform Admin',
    stars: null,
    accent: '#3498db',       // blue
    accentBg: 'rgba(52, 152, 219, 0.12)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3498db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Star rating renderer                                               */
/* ------------------------------------------------------------------ */

function Stars({ score }) {
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#ffaa00" stroke="#ffaa00" strokeWidth="1">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    } else if (i === full && half) {
      stars.push(
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" strokeWidth="1">
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="#ffaa00" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#halfStar)" />
        </svg>
      );
    } else {
      stars.push(
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    }
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {stars}
      <span style={{ marginLeft: '4px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
        {score}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Role badge                                                         */
/* ------------------------------------------------------------------ */

const ROLE_COLORS = {
  wholesaler: { bg: 'rgba(108, 92, 231, 0.15)', text: '#a29bfe' },
  investor: { bg: 'rgba(0, 214, 143, 0.15)', text: '#55efc4' },
  admin: { bg: 'rgba(52, 152, 219, 0.15)', text: '#74b9ff' },
};

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.investor;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.125rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.6875rem',
        fontWeight: '600',
        textTransform: 'capitalize',
        background: c.bg,
        color: c.text,
      }}
    >
      {role}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline avatar (initials)                                           */
/* ------------------------------------------------------------------ */

function InitialAvatar({ name, size = 36, bg = 'var(--bg-tertiary)' }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: '600',
        color: 'var(--text-primary)',
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const s = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    padding: '3rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  badge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    background: 'rgba(108, 92, 231, 0.15)',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--accent-primary)',
    marginBottom: '0.75rem',
    letterSpacing: '0.04em',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '0 0 0.375rem 0',
  },
  subtitle: {
    fontSize: '0.9375rem',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  cardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    width: '100%',
    maxWidth: '780px',
    marginBottom: '2.5rem',
  },
  card: {
    background: 'var(--bg-card)',
    border: '2px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cardIconWrap: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.75rem',
  },
  cardName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: '0 0 0.25rem 0',
  },
  cardCompany: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    margin: '0 0 0.5rem 0',
  },
  cardRole: {
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '0.75rem',
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(15, 17, 23, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--border-radius-lg)',
  },
  /* Expandable section */
  allUsersSection: {
    width: '100%',
    maxWidth: '780px',
  },
  expandToggle: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'var(--transition)',
  },
  userList: {
    marginTop: '0.75rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    overflow: 'hidden',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    transition: 'var(--transition)',
    borderBottom: '1px solid var(--border-color)',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    margin: 0,
  },
  userMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexShrink: 0,
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid var(--border-color)',
    borderTopColor: 'var(--accent-primary)',
    borderRadius: '50%',
    animation: 'devSpin 0.6s linear infinite',
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DevLoginPage() {
  const navigate = useNavigate();
  const { devSwitch } = useAuth();

  const [switching, setSwitching] = useState(null); // role string or userId
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');

  // Fetch all users when the section is expanded
  useEffect(() => {
    if (!expanded || allUsers.length) return;
    setUsersLoading(true);
    api
      .get('/auth/dev-users')
      .then((res) => setAllUsers(res.data))
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, [expanded, allUsers.length]);

  const handleFeaturedClick = async (role) => {
    if (switching) return;
    setSwitching(role);
    setError('');
    try {
      await devSwitch(role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Switch failed');
      setSwitching(null);
    }
  };

  const handleUserClick = async (userId) => {
    if (switching) return;
    setSwitching(userId);
    setError('');
    try {
      await devSwitch(userId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Switch failed');
      setSwitching(null);
    }
  };

  return (
    <div style={s.page}>
      {/* Spinner keyframes — injected once */}
      <style>{`@keyframes devSpin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={s.header}>
        <span style={s.badge}>DEV MODE</span>
        <h1 style={s.title}>DispoHub Dev Login</h1>
        <p style={s.subtitle}>
          Pick a persona to explore the platform from different perspectives
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid rgba(255, 71, 87, 0.3)',
            borderRadius: 'var(--border-radius)',
            padding: '0.75rem 1rem',
            color: 'var(--accent-danger)',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            maxWidth: '780px',
            width: '100%',
          }}
        >
          {error}
        </div>
      )}

      {/* Featured cards */}
      <div style={s.cardsRow}>
        {FEATURED.map((f) => {
          const isLoading = switching === f.role;
          return (
            <div
              key={f.role}
              style={{
                ...s.card,
                borderColor: switching === f.role ? f.accent : 'var(--border-color)',
              }}
              onClick={() => handleFeaturedClick(f.role)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = f.accent;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.35)`;
              }}
              onMouseLeave={(e) => {
                if (switching !== f.role) {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Loading overlay */}
              {isLoading && (
                <div style={s.loadingOverlay}>
                  <div style={s.spinner} />
                </div>
              )}

              <div style={{ ...s.cardIconWrap, background: f.accentBg }}>
                {f.icon}
              </div>
              <p style={s.cardName}>{f.name}</p>
              <p style={s.cardCompany}>{f.company}</p>
              {f.stars !== null && <Stars score={f.stars} />}
              <p style={{ ...s.cardRole, color: f.accent }}>{f.role}</p>
            </div>
          );
        })}
      </div>

      {/* All Users expandable */}
      <div style={s.allUsersSection}>
        <button
          style={s.expandToggle}
          onClick={() => setExpanded((v) => !v)}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
        >
          <span>All Seeded Users</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: 'transform 0.2s ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {expanded && (
          <div style={s.userList}>
            {usersLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ ...s.spinner, margin: '0 auto' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.75rem' }}>
                  Loading users...
                </p>
              </div>
            ) : allUsers.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                No users found. Make sure the server is running and seeded.
              </div>
            ) : (
              allUsers.map((u, idx) => (
                <div
                  key={u.id}
                  style={{
                    ...s.userRow,
                    ...(idx === allUsers.length - 1 ? { borderBottom: 'none' } : {}),
                    opacity: switching === u.id ? 0.6 : 1,
                  }}
                  onClick={() => handleUserClick(u.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <InitialAvatar name={u.name} />
                  <div style={s.userInfo}>
                    <p style={s.userName}>{u.name}</p>
                    <p style={s.userEmail}>
                      {u.email}
                      {u.company ? ` \u00B7 ${u.company}` : ''}
                    </p>
                  </div>
                  <div style={s.userMeta}>
                    {u.reputationScore > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {u.reputationScore.toFixed(1)}
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="#ffaa00"
                          stroke="#ffaa00"
                          strokeWidth="1"
                          style={{ verticalAlign: '-1px', marginLeft: '2px' }}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </span>
                    )}
                    <RoleBadge role={u.role} />
                    {switching === u.id && <div style={s.spinner} />}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
