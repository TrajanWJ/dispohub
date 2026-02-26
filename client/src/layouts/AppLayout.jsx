import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Avatar, SearchBar } from '../components/common';
import CalculatorDock from '../components/calculators/CalculatorDock';
import {
  LayoutDashboard, Home, Plus, ArrowLeftRight, FileText, Wallet,
  Calculator, User, Search, Target, Bookmark, Mail, Star, Settings,
  Users, TrendingUp, AlertTriangle, ShieldCheck, Menu, X, Bell, ChevronDown,
} from 'lucide-react';

const MOBILE_BREAKPOINT = 768;
const ICON_PROPS = { size: 18, strokeWidth: 1.5 };

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

/* ============================================================
   NAV CONFIG PER ROLE
   ============================================================ */

const wholesalerNav = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard {...ICON_PROPS} /> },
  { label: 'My Deals', path: '/wholesaler/deals', icon: <Home {...ICON_PROPS} /> },
  { label: 'Create Deal', path: '/wholesaler/deals/new', icon: <Plus {...ICON_PROPS} /> },
  { label: 'Transactions', path: '/wholesaler/transactions', icon: <ArrowLeftRight {...ICON_PROPS} /> },
  { label: 'Contracts', path: '/wholesaler/contracts', icon: <FileText {...ICON_PROPS} /> },
  { label: 'Earnings', path: '/wholesaler/earnings', icon: <Wallet {...ICON_PROPS} /> },
  { label: 'Calculators', path: '/calculators', icon: <Calculator {...ICON_PROPS} /> },
  { label: 'Profile', path: '/profile', icon: <User {...ICON_PROPS} /> },
];

const investorNav = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard {...ICON_PROPS} /> },
  { label: 'Browse Deals', path: '/investor/browse', icon: <Search {...ICON_PROPS} /> },
  { label: 'My Matches', path: '/investor/matches', icon: <Target {...ICON_PROPS} /> },
  { label: 'Saved Deals', path: '/investor/saved', icon: <Bookmark {...ICON_PROPS} /> },
  { label: 'My Offers', path: '/investor/offers', icon: <Mail {...ICON_PROPS} /> },
  { label: 'Transactions', path: '/investor/transactions', icon: <ArrowLeftRight {...ICON_PROPS} /> },
  { label: 'Subscription', path: '/investor/subscription', icon: <Star {...ICON_PROPS} /> },
  { label: 'Preferences', path: '/investor/preferences', icon: <Settings {...ICON_PROPS} /> },
  { label: 'Calculators', path: '/calculators', icon: <Calculator {...ICON_PROPS} /> },
  { label: 'Profile', path: '/profile', icon: <User {...ICON_PROPS} /> },
];

const adminNav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard {...ICON_PROPS} /> },
  { label: 'Users', path: '/admin/users', icon: <Users {...ICON_PROPS} /> },
  { label: 'Deal Moderation', path: '/admin/deals', icon: <ShieldCheck {...ICON_PROPS} /> },
  { label: 'Transactions', path: '/admin/transactions', icon: <ArrowLeftRight {...ICON_PROPS} /> },
  { label: 'Disputes', path: '/admin/disputes', icon: <AlertTriangle {...ICON_PROPS} /> },
  { label: 'Revenue', path: '/admin/revenue', icon: <TrendingUp {...ICON_PROPS} /> },
  { label: 'Platform Settings', path: '/admin/settings', icon: <Settings {...ICON_PROPS} /> },
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

function Sidebar({ navItems, isOpen, onClose, isMobile }) {
  const location = useLocation();

  useEffect(() => {
    if (isMobile) onClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Overlay */}
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 89,
          }}
        />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'var(--sidebar-width)',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 90,
          transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 'var(--topbar-height)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            gap: '0.625rem',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: '0.9375rem',
              color: '#ffffff',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            DH
          </span>
          <span
            style={{
              width: '1px',
              height: '16px',
              background: 'rgba(255, 255, 255, 0.12)',
            }}
          />
          <span style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
            DispoHub
          </span>
          {isMobile && (
            <button
              onClick={onClose}
              aria-label="Close sidebar"
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                padding: '0.25rem',
                lineHeight: 1,
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.625rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5625rem 0.75rem',
                borderRadius: 'var(--border-radius)',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: 'transparent',
                textDecoration: 'none',
                marginBottom: '0.125rem',
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                borderLeft: isActive ? '2px solid #ffffff' : '2px solid transparent',
                paddingLeft: isActive ? 'calc(0.75rem - 2px)' : '0.75rem',
              })}
            >
              {({ isActive }) => (
                <>
                  <span style={{ display: 'flex', opacity: isActive ? 1 : 0.6 }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.625rem',
            fontWeight: 500,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          DispoHub v0.1.0
        </div>
      </aside>
    </>
  );
}

/* ============================================================
   TOPBAR
   ============================================================ */

function Topbar({ onToggleCalc, onToggleSidebar, isMobile }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
        left: isMobile ? 0 : 'var(--sidebar-width)',
        right: 0,
        height: 'var(--topbar-height)',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 0.75rem' : '0 1.25rem',
        gap: isMobile ? '0.5rem' : '1rem',
        zIndex: 80,
      }}
    >
      {/* Hamburger */}
      {isMobile && (
        <button
          onClick={onToggleSidebar}
          aria-label="Open menu"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            padding: '0.375rem',
            lineHeight: 1,
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
          }}
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
      )}

      {/* Search */}
      <div style={{ flex: 1, maxWidth: isMobile ? 'none' : '480px', minWidth: 0 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search deals, users, transactions..."
        />
      </div>

      {/* Spacer */}
      {!isMobile && <div style={{ flex: 1 }} />}

      {/* Calculator icon */}
      <button
        onClick={onToggleCalc}
        title="Calculator"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '0.375rem',
          borderRadius: 'var(--border-radius)',
          transition: 'var(--transition-fast)',
          lineHeight: 1,
          display: 'flex',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <Calculator size={18} strokeWidth={1.5} />
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
          cursor: 'pointer',
          padding: '0.375rem',
          borderRadius: 'var(--border-radius)',
          transition: 'var(--transition-fast)',
          lineHeight: 1,
          display: 'flex',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <Bell size={18} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#ffffff',
            }}
          />
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
          {!isMobile && (
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
          )}
          <ChevronDown
            size={12}
            strokeWidth={1.5}
            style={{
              color: 'var(--text-muted)',
              transition: 'transform 0.2s ease',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
            }}
          />
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              right: 0,
              width: '200px',
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--border-radius-lg)',
              boxShadow: 'var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              overflow: 'hidden',
              zIndex: 100,
              animation: 'dropdownIn 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
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

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
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
        background: hovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        color: danger ? 'var(--accent-danger)' : 'var(--text-secondary)',
        border: 'none',
        cursor: 'pointer',
        transition: 'var(--transition-fast)',
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
  const [calcOpen, setCalcOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const navItems = getNavForRole(user?.role);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar
        navItems={navItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      <Topbar
        onToggleCalc={() => setCalcOpen((p) => !p)}
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        isMobile={isMobile}
      />

      {/* Main content */}
      <main
        style={{
          marginLeft: isMobile ? 0 : 'var(--sidebar-width)',
          marginTop: 'var(--topbar-height)',
          padding: isMobile ? '1rem' : '1.5rem',
          minHeight: 'calc(100vh - var(--topbar-height))',
        }}
      >
        <Outlet />
      </main>

      {/* Calculator dock */}
      <CalculatorDock isOpen={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  );
}
