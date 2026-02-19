import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Avatar, SearchBar } from '../components/common';

/* ============================================================
   NAV CONFIG PER ROLE
   ============================================================ */

const wholesalerNav = [
  { label: 'Dashboard', path: '/dashboard', icon: '\uD83D\uDCCA' },
  { label: 'My Deals', path: '/wholesaler/deals', icon: '\uD83C\uDFE0' },
  { label: 'Create Deal', path: '/wholesaler/deals/new', icon: '\u2795' },
  { label: 'Transactions', path: '/wholesaler/transactions', icon: '\uD83D\uDCB1' },
  { label: 'Contracts', path: '/wholesaler/contracts', icon: '\uD83D\uDCDD' },
  { label: 'Earnings', path: '/wholesaler/earnings', icon: '\uD83D\uDCB0' },
  { label: 'Calculators', path: '/calculators', icon: '\uD83E\uDDEE' },
  { label: 'Profile', path: '/profile', icon: '\uD83D\uDC64' },
];

const investorNav = [
  { label: 'Dashboard', path: '/dashboard', icon: '\uD83D\uDCCA' },
  { label: 'Browse Deals', path: '/investor/browse', icon: '\uD83D\uDD0D' },
  { label: 'My Matches', path: '/investor/matches', icon: '\uD83C\uDFAF' },
  { label: 'Saved Deals', path: '/investor/saved', icon: '\uD83D\uDD16' },
  { label: 'My Offers', path: '/investor/offers', icon: '\uD83D\uDCE9' },
  { label: 'Transactions', path: '/investor/transactions', icon: '\uD83D\uDCB1' },
  { label: 'Subscription', path: '/investor/subscription', icon: '\u2B50' },
  { label: 'Preferences', path: '/investor/preferences', icon: '\u2699\uFE0F' },
  { label: 'Calculators', path: '/calculators', icon: '\uD83E\uDDEE' },
  { label: 'Profile', path: '/profile', icon: '\uD83D\uDC64' },
];

const adminNav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '\uD83D\uDCCA' },
  { label: 'Users', path: '/admin/users', icon: '\uD83D\uDC65' },
  { label: 'Deal Moderation', path: '/admin/deals', icon: '\uD83D\uDD0D' },
  { label: 'Transactions', path: '/admin/transactions', icon: '\uD83D\uDCB1' },
  { label: 'Disputes', path: '/admin/disputes', icon: '\u26A0\uFE0F' },
  { label: 'Revenue', path: '/admin/revenue', icon: '\uD83D\uDCC8' },
  { label: 'Platform Settings', path: '/admin/settings', icon: '\u2699\uFE0F' },
];

function getNavForRole(role) {
  switch (role) {
    case 'wholesaler':
      return wholesalerNav;
    case 'investor':
      return investorNav;
    case 'admin':
      return adminNav;
    default:
      return wholesalerNav;
  }
}

/* ============================================================
   SIDEBAR
   ============================================================ */

function Sidebar({ navItems, collapsed, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 89,
            display: 'none',
          }}
          className="sidebar-overlay"
        />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'var(--sidebar-width)',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 90,
          transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.25s ease',
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 'var(--topbar-height)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            gap: '0.625rem',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent-primary), #a78bfa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              color: '#fff',
            }}
          >
            DH
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.0625rem', letterSpacing: '-0.01em' }}>
            DispoHub
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.625rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5625rem 0.75rem',
                borderRadius: 'var(--border-radius)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-hover)' : 'transparent',
                textDecoration: 'none',
                marginBottom: '0.125rem',
                transition: 'var(--transition)',
              })}
            >
              <span style={{ fontSize: '1.125rem', lineHeight: 1, width: '1.5rem', textAlign: 'center' }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          DispoHub v0.1.0
        </div>
      </aside>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-overlay {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}

/* ============================================================
   TOPBAR
   ============================================================ */

function Topbar({ onToggleSidebar, onToggleCalc }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 'var(--sidebar-width)',
        right: 0,
        height: 'var(--topbar-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.25rem',
        gap: '1rem',
        zIndex: 80,
      }}
    >
      {/* Hamburger (mobile) */}
      <button
        onClick={onToggleSidebar}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          color: 'var(--text-primary)',
          fontSize: '1.25rem',
          cursor: 'pointer',
          padding: '0.25rem',
        }}
        className="hamburger-btn"
      >
        {'\u2630'}
      </button>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: '480px' }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search deals, users, transactions..."
        />
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Calculator icon */}
      <button
        onClick={onToggleCalc}
        title="Calculator"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: '1.25rem',
          cursor: 'pointer',
          padding: '0.375rem',
          borderRadius: 'var(--border-radius)',
          transition: 'var(--transition)',
          lineHeight: 1,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="8" y2="10.01" />
          <line x1="12" y1="10" x2="12" y2="10.01" />
          <line x1="16" y1="10" x2="16" y2="10.01" />
          <line x1="8" y1="14" x2="8" y2="14.01" />
          <line x1="12" y1="14" x2="12" y2="14.01" />
          <line x1="16" y1="14" x2="16" y2="14.01" />
          <line x1="8" y1="18" x2="8" y2="18.01" />
          <line x1="12" y1="18" x2="16" y2="18" />
        </svg>
      </button>

      {/* Notifications bell */}
      <button
        onClick={() => navigate('/notifications')}
        title="Notifications"
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: '1.25rem',
          cursor: 'pointer',
          padding: '0.375rem',
          borderRadius: 'var(--border-radius)',
          transition: 'var(--transition)',
          lineHeight: 1,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              minWidth: '16px',
              height: '16px',
              borderRadius: '9999px',
              background: 'var(--accent-danger)',
              color: '#fff',
              fontSize: '0.625rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* User dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen((p) => !p)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: 'var(--border-radius)',
          }}
        >
          <Avatar src={user?.avatar} name={user?.name || user?.email || 'User'} size="sm" />
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.name || user?.email || 'User'}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: 'transform 0.2s ease',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              right: 0,
              width: '200px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              zIndex: 100,
              animation: 'dropdownIn 0.15s ease',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {user?.role || 'member'}
              </div>
            </div>
            <DropdownItem
              label="Profile"
              onClick={() => {
                navigate('/profile');
                setDropdownOpen(false);
              }}
            />
            <DropdownItem
              label="Settings"
              onClick={() => {
                navigate('/settings');
                setDropdownOpen(false);
              }}
            />
            <div style={{ borderTop: '1px solid var(--border-color)' }}>
              <DropdownItem
                label="Sign out"
                danger
                onClick={() => {
                  logout();
                  navigate('/dev-login');
                  setDropdownOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Responsive + dropdown animation */}
      <style>{`
        @media (max-width: 768px) {
          .hamburger-btn {
            display: flex !important;
          }
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}

function DropdownItem({ label, onClick, danger = false }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        width: '100%',
        padding: '0.5rem 1rem',
        fontSize: '0.8125rem',
        textAlign: 'left',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        color: danger ? 'var(--accent-danger)' : 'var(--text-secondary)',
        border: 'none',
        cursor: 'pointer',
        transition: 'var(--transition)',
      }}
    >
      {label}
    </button>
  );
}

/* ============================================================
   APP LAYOUT
   ============================================================ */

export default function AppLayout() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const navItems = getNavForRole(user?.role);

  // Collapse sidebar by default on small screens
  useEffect(() => {
    const checkWidth = () => {
      setSidebarCollapsed(window.innerWidth <= 768);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar
        navItems={navItems}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarCollapsed(true)}
      />

      <Topbar
        onToggleSidebar={() => setSidebarCollapsed((p) => !p)}
        onToggleCalc={() => setCalcOpen((p) => !p)}
      />

      {/* Main content */}
      <main
        style={{
          marginLeft: sidebarCollapsed ? 0 : 'var(--sidebar-width)',
          marginTop: 'var(--topbar-height)',
          padding: '1.5rem',
          minHeight: 'calc(100vh - var(--topbar-height))',
          transition: 'margin-left 0.25s ease',
        }}
      >
        <Outlet />
      </main>

      {/* Calculator dock placeholder */}
      {calcOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            width: '360px',
            maxHeight: '480px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 95,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Calculator</span>
            <button
              onClick={() => setCalcOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1rem',
                lineHeight: 1,
              }}
            >
              &#x2715;
            </button>
          </div>
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
            }}
          >
            Calculator dock coming soon
          </div>
        </div>
      )}

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          header {
            left: 0 !important;
          }
          main {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
