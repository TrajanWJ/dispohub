import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

/* ------------------------------------------------------------------ */
/*  Role badge colors                                                  */
/* ------------------------------------------------------------------ */

const ROLE_META = {
  wholesaler: { bg: 'rgba(108, 92, 231, 0.20)', text: '#a29bfe', label: 'Wholesaler' },
  investor: { bg: 'rgba(0, 214, 143, 0.20)', text: '#55efc4', label: 'Investor' },
  admin: { bg: 'rgba(52, 152, 219, 0.20)', text: '#74b9ff', label: 'Admin' },
};

const ROLE_BUTTONS = [
  { role: 'wholesaler', color: '#6c5ce7', label: 'Wholesaler' },
  { role: 'investor', color: '#00d68f', label: 'Investor' },
  { role: 'admin', color: '#3498db', label: 'Admin' },
];

/* ------------------------------------------------------------------ */
/*  Initials avatar                                                    */
/* ------------------------------------------------------------------ */

function InitialAvatar({ name, size = 32 }) {
  const initials = (name || '')
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
        background: 'var(--bg-tertiary)',
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
  wrapper: {
    position: 'fixed',
    bottom: '1rem',
    right: '1rem',
    zIndex: 9999,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  /* -- Collapsed pill ------------------------------------------------ */
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.875rem',
    background: 'rgba(30, 34, 48, 0.92)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border-color)',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
    userSelect: 'none',
  },
  pillIcon: {
    fontSize: '0.875rem',
  },
  pillName: {
    fontSize: '0.8125rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    maxWidth: '120px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  pillBadge: {
    padding: '0.125rem 0.4rem',
    borderRadius: '9999px',
    fontSize: '0.625rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },

  /* -- Expanded panel ------------------------------------------------ */
  panel: {
    width: '300px',
    background: 'rgba(30, 34, 48, 0.95)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border-color)',
  },
  panelTitle: {
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--accent-primary)',
    margin: 0,
  },
  closeBtn: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'var(--transition)',
    padding: 0,
  },
  panelBody: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  /* -- Current user section ------------------------------------------ */
  currentUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  currentInfo: {
    flex: 1,
    minWidth: 0,
  },
  currentName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  currentDetail: {
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
    margin: 0,
  },

  /* -- Section -------------------------------------------------------- */
  sectionTitle: {
    fontSize: '0.6875rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    margin: 0,
  },

  /* -- Role switcher ------------------------------------------------- */
  roleRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  roleBtn: {
    flex: 1,
    padding: '0.5rem 0.375rem',
    border: '1.5px solid',
    borderRadius: 'var(--border-radius)',
    background: 'transparent',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative',
  },
  roleBtnActive: {
    opacity: 0.5,
    cursor: 'default',
  },

  /* -- Action buttons ------------------------------------------------ */
  actionRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionBtn: {
    flex: 1,
    padding: '0.5rem 0.5rem',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'var(--transition)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
  },

  /* -- Spinner ------------------------------------------------------- */
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid var(--border-color)',
    borderTopColor: 'var(--accent-primary)',
    borderRadius: '50%',
    animation: 'devToolbarSpin 0.6s linear infinite',
    display: 'inline-block',
  },

  /* -- Status message ------------------------------------------------ */
  statusMsg: {
    fontSize: '0.6875rem',
    padding: '0.375rem 0.5rem',
    borderRadius: 'var(--border-radius)',
    textAlign: 'center',
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DevToolbar() {
  const { user, role, devSwitch } = useAuth();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(null); // role being switched to
  const [reseeding, setReseeding] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success'|'error', text }
  const panelRef = useRef(null);

  // Clear status message after 3 seconds
  useEffect(() => {
    if (!statusMsg) return;
    const t = setTimeout(() => setStatusMsg(null), 3000);
    return () => clearTimeout(t);
  }, [statusMsg]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Don't render if there's no logged-in user
  if (!user) return null;

  const meta = ROLE_META[role] || ROLE_META.investor;
  const firstName = user.name?.split(' ')[0] || 'User';

  const handleRoleSwitch = async (targetRole) => {
    if (targetRole === role || switching) return;
    setSwitching(targetRole);
    setStatusMsg(null);
    try {
      await devSwitch(targetRole);
      setStatusMsg({ type: 'success', text: `Switched to ${targetRole}` });
      // Short delay then reload so entire UI updates for new role
      setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.error || 'Switch failed',
      });
      setSwitching(null);
    }
  };

  const handleReseed = async () => {
    if (reseeding) return;
    setReseeding(true);
    setStatusMsg(null);
    try {
      await api.post('/admin/reseed');
      setStatusMsg({ type: 'success', text: 'Database reseeded!' });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.error || 'Reseed failed',
      });
    } finally {
      setReseeding(false);
    }
  };

  /* -- Collapsed pill ------------------------------------------------ */
  if (!open) {
    return (
      <div style={s.wrapper}>
        <div
          style={s.pill}
          onClick={() => setOpen(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(108, 92, 231, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
          }}
        >
          <span style={s.pillIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <span style={s.pillName}>{firstName}</span>
          <span
            style={{
              ...s.pillBadge,
              background: meta.bg,
              color: meta.text,
            }}
          >
            {meta.label}
          </span>
        </div>
      </div>
    );
  }

  /* -- Expanded panel ------------------------------------------------ */
  return (
    <div style={s.wrapper} ref={panelRef}>
      {/* Spinner keyframes */}
      <style>{`@keyframes devToolbarSpin { to { transform: rotate(360deg) } }`}</style>

      <div style={s.panel}>
        {/* Header */}
        <div style={s.panelHeader}>
          <p style={s.panelTitle}>Dev Toolbar</p>
          <button
            style={s.closeBtn}
            onClick={() => setOpen(false)}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={s.panelBody}>
          {/* Current user */}
          <div style={s.currentUser}>
            <InitialAvatar name={user.name} size={36} />
            <div style={s.currentInfo}>
              <p style={s.currentName}>{user.name}</p>
              <p style={s.currentDetail}>
                {user.email}
                {' \u00B7 '}
                <span
                  style={{
                    color: meta.text,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}
                >
                  {role}
                </span>
              </p>
            </div>
          </div>

          {/* Role switcher */}
          <div>
            <p style={{ ...s.sectionTitle, marginBottom: '0.5rem' }}>Quick Switch</p>
            <div style={s.roleRow}>
              {ROLE_BUTTONS.map((rb) => {
                const isActive = rb.role === role;
                const isLoading = switching === rb.role;
                return (
                  <button
                    key={rb.role}
                    style={{
                      ...s.roleBtn,
                      borderColor: isActive ? rb.color : 'var(--border-color)',
                      color: isActive ? rb.color : 'var(--text-secondary)',
                      background: isActive
                        ? `${rb.color}15`
                        : 'transparent',
                      ...(isActive ? s.roleBtnActive : {}),
                    }}
                    disabled={isActive || !!switching}
                    onClick={() => handleRoleSwitch(rb.role)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = rb.color;
                        e.currentTarget.style.color = rb.color;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    {isLoading ? <span style={s.spinner} /> : rb.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div>
            <p style={{ ...s.sectionTitle, marginBottom: '0.5rem' }}>Actions</p>
            <div style={s.actionRow}>
              <button
                style={s.actionBtn}
                onClick={handleReseed}
                disabled={reseeding}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {reseeding ? (
                  <span style={s.spinner} />
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                )}
                Reseed DB
              </button>
              <button
                style={s.actionBtn}
                disabled
                title="Coming soon"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                Theme
              </button>
            </div>
          </div>

          {/* Status message */}
          {statusMsg && (
            <div
              style={{
                ...s.statusMsg,
                background:
                  statusMsg.type === 'success'
                    ? 'rgba(0, 214, 143, 0.1)'
                    : 'rgba(255, 71, 87, 0.1)',
                color:
                  statusMsg.type === 'success'
                    ? 'var(--accent-success)'
                    : 'var(--accent-danger)',
                border: `1px solid ${
                  statusMsg.type === 'success'
                    ? 'rgba(0, 214, 143, 0.25)'
                    : 'rgba(255, 71, 87, 0.25)'
                }`,
              }}
            >
              {statusMsg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
