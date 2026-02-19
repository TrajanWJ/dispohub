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

// Dev tools
import DevToolbar from './components/dev/DevToolbar';

/* ============================================================
   PLACEHOLDER PAGE FACTORY
   Creates a simple page component that displays its name.
   Real pages replace these as they're built.
   ============================================================ */

function PlaceholderPage({ title }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          fontSize: '2.5rem',
          opacity: 0.15,
          lineHeight: 1,
        }}
      >
        {'\uD83D\uDEA7'}
      </div>
      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        This page is under construction
      </p>
    </div>
  );
}

/* ============================================================
   DASHBOARD (Role-adaptive)
   ============================================================ */

function DashboardPage() {
  const { role } = useAuth();
  if (role === 'wholesaler') return <WholesalerDashboard />;
  if (role === 'admin') return <PlaceholderPage title="Admin Dashboard" />;
  return <PlaceholderPage title="Investor Dashboard" />;
}

/* ============================================================
   INVESTOR PAGES
   ============================================================ */

function BrowseDealsPage() {
  return <PlaceholderPage title="Browse Deals" />;
}
function MatchedDealsPage() {
  return <PlaceholderPage title="Matched Deals" />;
}
function SavedDealsPage() {
  return <PlaceholderPage title="Saved Deals" />;
}
function MyOffersPage() {
  return <PlaceholderPage title="My Offers" />;
}
function InvestorTransactionsPage() {
  return <PlaceholderPage title="Transactions" />;
}
function SubscriptionPage() {
  return <PlaceholderPage title="Subscription" />;
}
function PreferencesPage() {
  return <PlaceholderPage title="Investment Preferences" />;
}

/* ============================================================
   ADMIN PAGES
   ============================================================ */

function AdminDashboard() {
  return <PlaceholderPage title="Admin Dashboard" />;
}
function UserManagementPage() {
  return <PlaceholderPage title="User Management" />;
}
function DealModerationPage() {
  return <PlaceholderPage title="Deal Moderation" />;
}
function TransactionOverviewPage() {
  return <PlaceholderPage title="Transaction Overview" />;
}
function DisputeResolutionPage() {
  return <PlaceholderPage title="Dispute Resolution" />;
}
function RevenueReportsPage() {
  return <PlaceholderPage title="Revenue Reports" />;
}
function PlatformSettingsPage() {
  return <PlaceholderPage title="Platform Settings" />;
}

/* ============================================================
   SHARED PAGES
   ============================================================ */

function ProfilePage() {
  return <PlaceholderPage title="My Profile" />;
}
function UserProfilePage() {
  return <PlaceholderPage title="User Profile" />;
}
function SettingsPage() {
  return <PlaceholderPage title="Settings" />;
}
function NotificationsPage() {
  return <PlaceholderPage title="Notifications" />;
}
function CalculatorsPage() {
  return <PlaceholderPage title="Calculators" />;
}
function CoursesPage() {
  return <PlaceholderPage title="Education Courses" />;
}
function CourseDetailPage() {
  return <PlaceholderPage title="Course Detail" />;
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
      <Route path="*" element={<PlaceholderPage title="404 — Page Not Found" />} />
    </Routes>
    <DevToolbar />
    </>
  );
}
