import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoadingSpinner } from './components/common';
import AppLayout from './layouts/AppLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DevLoginPage from './pages/auth/DevLoginPage';

// Wholesaler pages
import WholesalerDashboard from './pages/wholesaler/DashboardPage';
import MyDealsPage from './pages/wholesaler/MyDealsPage';
import CreateDealPage from './pages/wholesaler/CreateDealPage';
import WholesalerTransactionsPage from './pages/wholesaler/TransactionsPage';
import EarningsPage from './pages/wholesaler/EarningsPage';
import ContractsPage from './pages/wholesaler/ContractsPage';

// Investor pages
import InvestorDashboard from './pages/investor/DashboardPage';
import BrowseDealsPage from './pages/investor/BrowseDealsPage';
import MatchedDealsPage from './pages/investor/MatchedDealsPage';
import SavedDealsPage from './pages/investor/SavedDealsPage';
import MyOffersPage from './pages/investor/MyOffersPage';
import InvestorTransactionsPage from './pages/investor/TransactionsPage';
import SubscriptionPage from './pages/investor/SubscriptionPage';
import PreferencesPage from './pages/investor/PreferencesPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import DealModerationPage from './pages/admin/DealModerationPage';
import TransactionOverviewPage from './pages/admin/TransactionOverviewPage';
import DisputeResolutionPage from './pages/admin/DisputeResolutionPage';
import RevenueReportsPage from './pages/admin/RevenueReportsPage';
import PlatformSettingsPage from './pages/admin/PlatformSettingsPage';

// Shared pages
import ProfilePage from './pages/shared/ProfilePage';
import UserProfilePage from './pages/shared/UserProfilePage';
import SettingsPage from './pages/shared/SettingsPage';
import NotificationsPage from './pages/shared/NotificationsPage';
import CalculatorsPage from './pages/shared/CalculatorsPage';

// Education pages
import CoursesPage from './pages/education/CoursesPage';
import CourseDetailPage from './pages/education/CourseDetailPage';

// Dev tools
import DevToolbar from './components/dev/DevToolbar';

/* ============================================================
   DASHBOARD (Role-adaptive)
   ============================================================ */

function DashboardPage() {
  const { role } = useAuth();
  if (role === 'wholesaler') return <WholesalerDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  return <InvestorDashboard />;
}

/* ============================================================
   404 PAGE
   ============================================================ */

function NotFoundPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
      }}
    >
      <div style={{ fontSize: '4rem', opacity: 0.2, lineHeight: 1 }}>404</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 400, textAlign: 'center' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a
        href="/dashboard"
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1.25rem',
          background: 'var(--accent-primary)',
          color: '#fff',
          borderRadius: 'var(--border-radius)',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        Back to Dashboard
      </a>
    </div>
  );
}

/* ============================================================
   PROTECTED ROUTE WRAPPER
   ============================================================ */

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
        }}
      >
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/dev-login" replace />;
  }

  return children;
}

/* ============================================================
   APP (Router)
   ============================================================ */

export default function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/dev-login" element={<DevLoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes inside AppLayout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Wholesaler */}
          <Route path="/wholesaler/deals" element={<MyDealsPage />} />
          <Route path="/wholesaler/deals/new" element={<CreateDealPage />} />
          <Route path="/wholesaler/transactions" element={<WholesalerTransactionsPage />} />
          <Route path="/wholesaler/contracts" element={<ContractsPage />} />
          <Route path="/wholesaler/earnings" element={<EarningsPage />} />

          {/* Investor */}
          <Route path="/investor/browse" element={<BrowseDealsPage />} />
          <Route path="/investor/matches" element={<MatchedDealsPage />} />
          <Route path="/investor/saved" element={<SavedDealsPage />} />
          <Route path="/investor/offers" element={<MyOffersPage />} />
          <Route path="/investor/transactions" element={<InvestorTransactionsPage />} />
          <Route path="/investor/subscription" element={<SubscriptionPage />} />
          <Route path="/investor/preferences" element={<PreferencesPage />} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/deals" element={<DealModerationPage />} />
          <Route path="/admin/transactions" element={<TransactionOverviewPage />} />
          <Route path="/admin/disputes" element={<DisputeResolutionPage />} />
          <Route path="/admin/revenue" element={<RevenueReportsPage />} />
          <Route path="/admin/settings" element={<PlatformSettingsPage />} />

          {/* Shared */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:id" element={<UserProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/calculators" element={<CalculatorsPage />} />
          <Route path="/education" element={<CoursesPage />} />
          <Route path="/education/:id" element={<CourseDetailPage />} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <DevToolbar />
    </>
  );
}
