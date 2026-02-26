/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from 'react';

/* ============================================================
   BUTTON
   ============================================================ */

const buttonBaseStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  fontWeight: 500,
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  whiteSpace: 'nowrap',
  lineHeight: 1,
  letterSpacing: '0.01em',
};

const buttonVariants = {
  primary: {
    background: '#ffffff',
    color: '#050507',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  },
  danger: {
    background: 'transparent',
    color: 'var(--accent-danger)',
    border: '1px solid rgba(248, 113, 113, 0.25)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
  },
  outline: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  },
};

const buttonHoverVariants = {
  primary: { background: 'rgba(255, 255, 255, 0.85)' },
  secondary: { background: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 255, 255, 0.20)' },
  danger: { background: 'rgba(248, 113, 113, 0.1)', borderColor: 'rgba(248, 113, 113, 0.4)' },
  ghost: { background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-primary)' },
  outline: { background: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 255, 255, 0.20)' },
};

const buttonSizes = {
  sm: { padding: '0.375rem 0.75rem', fontSize: '0.8125rem' },
  md: { padding: '0.5rem 1.25rem', fontSize: '0.875rem' },
  lg: { padding: '0.625rem 1.5rem', fontSize: '1rem' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  onClick,
  type = 'button',
  children,
  style: customStyle,
  ...rest
}) {
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || loading;

  const style = {
    ...buttonBaseStyle,
    ...buttonVariants[variant],
    ...buttonSizes[size],
    ...(hovered && !isDisabled ? buttonHoverVariants[variant] : {}),
    ...(fullWidth ? { width: '100%' } : {}),
    ...(isDisabled ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
    ...customStyle,
  };

  return (
    <button
      type={type}
      style={style}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...rest}
    >
      {loading ? <LoadingSpinner size={16} /> : icon ? <span style={{ lineHeight: 1, display: 'flex' }}>{icon}</span> : null}
      {children}
    </button>
  );
}

/* ============================================================
   CARD
   ============================================================ */

export function Card({
  children,
  className,
  padding = '1.25rem',
  hoverable = false,
  header,
  footer,
  style: customStyle,
  onClick,
}) {
  const [hovered, setHovered] = useState(false);

  const style = {
    background: 'var(--bg-glass)',
    backdropFilter: 'blur(var(--glass-blur))',
    WebkitBackdropFilter: 'blur(var(--glass-blur))',
    borderRadius: 'var(--border-radius-lg)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow: 'var(--glass-highlight)',
    overflow: 'hidden',
    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    ...(hoverable && hovered
      ? {
          borderColor: 'rgba(255, 255, 255, 0.12)',
          transform: 'translateY(-1px)',
        }
      : {}),
    ...(onClick ? { cursor: 'pointer' } : {}),
    ...customStyle,
  };

  return (
    <div
      className={className}
      style={style}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {header && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            fontWeight: 600,
            fontSize: '0.9375rem',
            letterSpacing: '-0.01em',
          }}
        >
          {header}
        </div>
      )}
      <div style={{ padding }}>{children}</div>
      {footer && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MODAL
   ============================================================ */

const modalSizes = {
  sm: '400px',
  md: '540px',
  lg: '720px',
  xl: '960px',
};

export function Modal({ isOpen, onClose, title, size = 'md', children, footer }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: modalSizes[size],
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          animation: 'modalIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.02em' }}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.125rem',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1,
                borderRadius: '4px',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
            >
              &#x2715;
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>{children}</div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              padding: '0.875rem 1.25rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   CONFIRM DIALOG
   ============================================================ */

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  confirmVariant = 'danger',
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

/* ============================================================
   TOAST SYSTEM
   ============================================================ */

const ToastContext = createContext(null);

const toastTypeStyles = {
  success: { borderColor: 'var(--accent-success)', icon: '\u2713' },
  error: { borderColor: 'var(--accent-danger)', icon: '\u2717' },
  warning: { borderColor: 'var(--accent-warning)', icon: '\u26A0' },
  info: { borderColor: 'var(--accent-info)', icon: '\u2139' },
};

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const typeConfig = toastTypeStyles[toast.type] || toastTypeStyles.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 200);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 'var(--border-radius)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderLeft: `2px solid ${typeConfig.borderColor}`,
        boxShadow: 'var(--shadow-md), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        minWidth: '300px',
        maxWidth: '420px',
        animation: exiting ? 'toastOut 0.2s ease forwards' : 'toastIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'all',
      }}
    >
      <span
        style={{
          fontSize: '0.875rem',
          lineHeight: 1,
          marginTop: '2px',
          flexShrink: 0,
          color: typeConfig.borderColor,
        }}
      >
        {typeConfig.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.125rem' }}>
            {toast.title}
          </div>
        )}
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
          {toast.message}
        </div>
      </div>
      <button
        onClick={() => {
          setExiting(true);
          setTimeout(() => onRemove(toast.id), 200);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '0.125rem',
          fontSize: '0.875rem',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        &#x2715;
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idCounter = useRef(0);

  const addToast = useCallback(({ type = 'info', title, message, duration }) => {
    const id = ++idCounter.current;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useMemo(
    () => ({
      success: (message, title) => addToast({ type: 'success', message, title }),
      error: (message, title) => addToast({ type: 'error', message, title }),
      warning: (message, title) => addToast({ type: 'warning', message, title }),
      info: (message, title) => addToast({ type: 'info', message, title }),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast container */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          right: '1.25rem',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(40px); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/* ============================================================
   BADGE
   ============================================================ */

const badgeVariants = {
  success: { background: 'rgba(52, 211, 153, 0.12)', color: 'var(--accent-success)' },
  warning: { background: 'rgba(251, 191, 36, 0.12)', color: 'var(--accent-warning)' },
  danger: { background: 'rgba(248, 113, 113, 0.12)', color: 'var(--accent-danger)' },
  info: { background: 'rgba(96, 165, 250, 0.12)', color: 'var(--accent-info)' },
  neutral: { background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)' },
};

export function Badge({ children, variant = 'neutral', style: customStyle }) {
  const variantStyle = badgeVariants[variant] || badgeVariants.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.1875rem 0.5rem',
        fontSize: '0.6875rem',
        fontWeight: 500,
        borderRadius: '9999px',
        lineHeight: 1.4,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        ...variantStyle,
        ...customStyle,
      }}
    >
      {children}
    </span>
  );
}

/* ============================================================
   STATUS BADGE
   ============================================================ */

const statusVariantMap = {
  active: 'success',
  pending: 'warning',
  pending_review: 'warning',
  under_contract: 'info',
  sold: 'neutral',
  expired: 'neutral',
  rejected: 'danger',
  withdrawn: 'neutral',
  accepted: 'success',
  declined: 'danger',
  countered: 'warning',
  cancelled: 'neutral',
  in_progress: 'info',
  completed: 'success',
  failed: 'danger',
  disputed: 'danger',
  verified: 'success',
  unverified: 'warning',
  suspended: 'danger',
  trial: 'info',
  pro: 'success',
  free: 'neutral',
  escrow_funded: 'info',
  under_review: 'warning',
  closing: 'info',
  delisted: 'neutral',
};

const statusLabelMap = {
  pending_review: 'Pending Review',
  under_contract: 'Under Contract',
  in_progress: 'In Progress',
  escrow_funded: 'Escrow Funded',
  under_review: 'Under Review',
};

export function StatusBadge({ status }) {
  const variant = statusVariantMap[status] || 'neutral';
  const label =
    statusLabelMap[status] ||
    (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown');

  return <Badge variant={variant}>{label}</Badge>;
}

/* ============================================================
   STAR RATING
   ============================================================ */

export function StarRating({ value = 0, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);
  const interactive = typeof onChange === 'function';

  return (
    <div style={{ display: 'inline-flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? '#ffffff' : 'none'}
            stroke={filled ? '#ffffff' : 'rgba(255, 255, 255, 0.15)'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            onClick={interactive ? () => onChange(star) : undefined}
            onMouseEnter={interactive ? () => setHover(star) : undefined}
            onMouseLeave={interactive ? () => setHover(0) : undefined}
            style={{
              cursor: interactive ? 'pointer' : 'default',
              transition: 'all 150ms ease',
              userSelect: 'none',
            }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
    </div>
  );
}

/* ============================================================
   SEARCH BAR
   ============================================================ */

export function SearchBar({ value, onChange, placeholder = 'Search...', style: customStyle }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        ...customStyle,
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: '0.75rem',
          color: 'var(--text-muted)',
          pointerEvents: 'none',
          lineHeight: 1,
          display: 'flex',
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          paddingLeft: '2.25rem',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--border-radius)',
          padding: '0.5rem 0.75rem 0.5rem 2.25rem',
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
        }}
      />
    </div>
  );
}

/* ============================================================
   AVATAR
   ============================================================ */

const avatarSizeMap = {
  sm: 32,
  md: 40,
  lg: 56,
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ src, name, size = 'md' }) {
  const [imgError, setImgError] = useState(false);
  const px = typeof size === 'number' ? size : avatarSizeMap[size] || 40;
  const fontSize = px * 0.38;

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '2px solid rgba(255, 255, 255, 0.15)',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.08)',
        border: '2px solid rgba(255, 255, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${fontSize}px`,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {getInitials(name)}
    </div>
  );
}

/* ============================================================
   LOADING SPINNER
   ============================================================ */

export function LoadingSpinner({ size = 32 }) {
  const px = typeof size === 'number' ? size : 32;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: px > 24 ? '2rem' : 0,
      }}
    >
      <div
        style={{
          width: px,
          height: px,
          border: `${Math.max(2, px / 12)}px solid rgba(255, 255, 255, 0.06)`,
          borderTopColor: '#ffffff',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */

export function EmptyState({ title, message, action, icon }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}
    >
      {icon && (
        <div
          style={{
            marginBottom: '1rem',
            color: 'var(--text-muted)',
            lineHeight: 1,
          }}
        >
          {typeof icon === 'string' ? (
            <span style={{ fontSize: '2.5rem', opacity: 0.3 }}>{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}
      <h3
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          marginBottom: '0.375rem',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h3>
      {message && (
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            maxWidth: '360px',
            marginBottom: action ? '1.25rem' : 0,
          }}
        >
          {message}
        </p>
      )}
      {action && action}
    </div>
  );
}

/* ============================================================
   PAGINATION
   ============================================================ */

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const btnStyle = (isActive) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '2rem',
    height: '2rem',
    padding: '0 0.5rem',
    fontSize: '0.8125rem',
    fontWeight: isActive ? 600 : 400,
    fontFamily: 'var(--font-mono)',
    background: isActive ? '#ffffff' : 'transparent',
    color: isActive ? '#050507' : 'var(--text-secondary)',
    border: 'none',
    borderRadius: '8px',
    cursor: isActive ? 'default' : 'pointer',
    transition: 'var(--transition-fast)',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        justifyContent: 'center',
        padding: '0.75rem 0',
      }}
    >
      <button
        onClick={() => page > 1 && onPageChange(page - 1)}
        disabled={page === 1}
        style={{
          ...btnStyle(false),
          opacity: page === 1 ? 0.3 : 1,
          cursor: page === 1 ? 'not-allowed' : 'pointer',
        }}
      >
        &#8592;
      </button>
      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} style={{ color: 'var(--text-muted)', padding: '0 0.25rem' }}>
            ...
          </span>
        ) : (
          <button key={p} onClick={() => onPageChange(p)} style={btnStyle(p === page)}>
            {p}
          </button>
        )
      )}
      <button
        onClick={() => page < totalPages && onPageChange(page + 1)}
        disabled={page === totalPages}
        style={{
          ...btnStyle(false),
          opacity: page === totalPages ? 0.3 : 1,
          cursor: page === totalPages ? 'not-allowed' : 'pointer',
        }}
      >
        &#8594;
      </button>
    </div>
  );
}

/* ============================================================
   TABS
   ============================================================ */

export function Tabs({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.25rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1.25rem',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            style={{
              padding: '0.625rem 1rem',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive
                ? '2px solid #ffffff'
                : '2px solid transparent',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              marginBottom: '-1px',
              letterSpacing: '-0.01em',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
