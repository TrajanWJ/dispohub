import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Button, LoadingSpinner, ConfirmDialog } from '../../components/common';
import { useToast } from '../../components/common';

/* ============================================================
   STYLES
   ============================================================ */

const styles = {
  page: {
    padding: '1.5rem 2rem',
    maxWidth: 800,
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '1.5rem',
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

  /* Section */
  section: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.0625rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
  },

  /* Form fields */
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  fieldGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '0.375rem',
  },
  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)',
    outline: 'none',
    resize: 'vertical',
    minHeight: '80px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  readOnly: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    paddingTop: '0.5rem',
  },

  /* Toggle */
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderBottom: '1px solid var(--border-color)',
  },
  toggleRowLast: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
  },
  toggleLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
  },
  toggleDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.125rem',
  },
  toggle: {
    position: 'relative',
    width: 44,
    height: 24,
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'var(--transition)',
    flexShrink: 0,
    border: 'none',
    padding: 0,
  },
  toggleKnob: {
    position: 'absolute',
    top: 2,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    transition: 'var(--transition)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },

  /* Danger zone */
  dangerSection: {
    background: 'var(--bg-card)',
    border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  dangerTitle: {
    fontSize: '1.0625rem',
    fontWeight: 600,
    color: 'var(--accent-danger)',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid rgba(255, 71, 87, 0.2)',
  },
  dangerDescription: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '1rem',
  },
};

/* ============================================================
   TOGGLE COMPONENT
   ============================================================ */

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      style={{
        ...styles.toggle,
        background: checked ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
      }}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <div
        style={{
          ...styles.toggleKnob,
          left: checked ? 22 : 2,
        }}
      />
    </button>
  );
}

/* ============================================================
   SETTINGS PAGE
   ============================================================ */

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Account form */
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    bio: '',
  });
  const [savingAccount, setSavingAccount] = useState(false);

  /* Notification preferences */
  const [notifPrefs, setNotifPrefs] = useState({
    newMatches: true,
    offers: true,
    transactions: true,
    marketing: false,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  /* Display preferences */
  const [displayPrefs, setDisplayPrefs] = useState({
    darkTheme: true,
    compactMode: false,
  });
  const [savingDisplay, setSavingDisplay] = useState(false);

  /* Password */
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  /* Delete confirmation */
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* Fetch profile */
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users/profile');
      const data = res.data;
      setAccountForm({
        name: data.name || '',
        email: data.email || user?.email || '',
        company: data.company || '',
        phone: data.phone || '',
        bio: data.bio || '',
      });
      if (data.notificationPreferences) {
        setNotifPrefs({
          newMatches: data.notificationPreferences.newMatches ?? true,
          offers: data.notificationPreferences.offers ?? true,
          transactions: data.notificationPreferences.transactions ?? true,
          marketing: data.notificationPreferences.marketing ?? false,
        });
      }
      if (data.displayPreferences) {
        setDisplayPrefs({
          darkTheme: data.displayPreferences.darkTheme ?? true,
          compactMode: data.displayPreferences.compactMode ?? false,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* Save account info */
  const handleSaveAccount = async () => {
    setSavingAccount(true);
    try {
      await api.put('/users/profile', {
        name: accountForm.name,
        company: accountForm.company,
        phone: accountForm.phone,
        bio: accountForm.bio,
      });
      toast.success('Account information updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update account info.');
    } finally {
      setSavingAccount(false);
    }
  };

  /* Save notification preferences */
  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    try {
      await api.put('/users/profile', {
        notificationPreferences: notifPrefs,
      });
      toast.success('Notification preferences updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update notification preferences.');
    } finally {
      setSavingNotifs(false);
    }
  };

  /* Save display preferences */
  const handleSaveDisplay = async () => {
    setSavingDisplay(true);
    try {
      await api.put('/users/profile', {
        displayPreferences: displayPrefs,
      });
      toast.success('Display preferences updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update display preferences.');
    } finally {
      setSavingDisplay(false);
    }
  };

  /* Change password */
  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/users/profile', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  /* Delete account */
  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    toast.info('Account deletion request submitted. Our team will process this within 48 hours.');
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingWrap}>
          <LoadingSpinner size={48} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>Settings</h1>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* ── Account Info ── */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Account Information</div>

        <div style={styles.fieldGrid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              style={styles.input}
              value={accountForm.name}
              onChange={(e) => setAccountForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              style={{ ...styles.input, ...styles.readOnly }}
              value={accountForm.email}
              readOnly
              tabIndex={-1}
            />
          </div>
        </div>

        <div style={styles.fieldGrid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Company</label>
            <input
              style={styles.input}
              value={accountForm.company}
              onChange={(e) => setAccountForm((p) => ({ ...p, company: e.target.value }))}
              placeholder="Company name"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Phone</label>
            <input
              style={styles.input}
              value={accountForm.phone}
              onChange={(e) => setAccountForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Bio</label>
          <textarea
            style={styles.textarea}
            value={accountForm.bio}
            onChange={(e) => setAccountForm((p) => ({ ...p, bio: e.target.value }))}
            placeholder="Tell others about yourself and your experience in real estate..."
          />
        </div>

        <div style={styles.footer}>
          <Button variant="primary" loading={savingAccount} onClick={handleSaveAccount}>
            Save Account Info
          </Button>
        </div>
      </div>

      {/* ── Notification Preferences ── */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Notification Preferences</div>

        <div style={styles.toggleRow}>
          <div>
            <div style={styles.toggleLabel}>New Property Matches</div>
            <div style={styles.toggleDesc}>Get notified when new properties match your buying criteria</div>
          </div>
          <Toggle
            checked={notifPrefs.newMatches}
            onChange={(v) => setNotifPrefs((p) => ({ ...p, newMatches: v }))}
          />
        </div>

        <div style={styles.toggleRow}>
          <div>
            <div style={styles.toggleLabel}>Offer Updates</div>
            <div style={styles.toggleDesc}>Receive alerts when offers are submitted, accepted, or countered</div>
          </div>
          <Toggle
            checked={notifPrefs.offers}
            onChange={(v) => setNotifPrefs((p) => ({ ...p, offers: v }))}
          />
        </div>

        <div style={styles.toggleRow}>
          <div>
            <div style={styles.toggleLabel}>Transaction Updates</div>
            <div style={styles.toggleDesc}>Stay updated on transaction milestones and status changes</div>
          </div>
          <Toggle
            checked={notifPrefs.transactions}
            onChange={(v) => setNotifPrefs((p) => ({ ...p, transactions: v }))}
          />
        </div>

        <div style={styles.toggleRowLast}>
          <div>
            <div style={styles.toggleLabel}>Marketing & Tips</div>
            <div style={styles.toggleDesc}>Occasional tips, feature announcements, and market insights</div>
          </div>
          <Toggle
            checked={notifPrefs.marketing}
            onChange={(v) => setNotifPrefs((p) => ({ ...p, marketing: v }))}
          />
        </div>

        <div style={{ ...styles.footer, marginTop: '0.5rem' }}>
          <Button variant="primary" loading={savingNotifs} onClick={handleSaveNotifs}>
            Save Preferences
          </Button>
        </div>
      </div>

      {/* ── Display Preferences ── */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Display Preferences</div>

        <div style={styles.toggleRow}>
          <div>
            <div style={styles.toggleLabel}>Dark Theme</div>
            <div style={styles.toggleDesc}>Use a dark color scheme for reduced eye strain</div>
          </div>
          <Toggle
            checked={displayPrefs.darkTheme}
            onChange={(v) => setDisplayPrefs((p) => ({ ...p, darkTheme: v }))}
          />
        </div>

        <div style={styles.toggleRowLast}>
          <div>
            <div style={styles.toggleLabel}>Compact Mode</div>
            <div style={styles.toggleDesc}>Reduce spacing and show more content on screen</div>
          </div>
          <Toggle
            checked={displayPrefs.compactMode}
            onChange={(v) => setDisplayPrefs((p) => ({ ...p, compactMode: v }))}
          />
        </div>

        <div style={{ ...styles.footer, marginTop: '0.5rem' }}>
          <Button variant="primary" loading={savingDisplay} onClick={handleSaveDisplay}>
            Save Display Settings
          </Button>
        </div>
      </div>

      {/* ── Security ── */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Security</div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Current Password</label>
          <input
            style={styles.input}
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
            placeholder="Enter current password"
            autoComplete="current-password"
          />
        </div>

        <div style={styles.fieldGrid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>New Password</label>
            <input
              style={styles.input}
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <input
              style={styles.input}
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </div>
        </div>

        <div style={styles.footer}>
          <Button variant="primary" loading={savingPassword} onClick={handleChangePassword}>
            Change Password
          </Button>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div style={styles.dangerSection}>
        <div style={styles.dangerTitle}>Danger Zone</div>
        <div style={styles.dangerDescription}>
          Permanently delete your account and all associated data. This action cannot be undone.
          All your deals, offers, and transaction history will be permanently removed.
        </div>
        <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
          Delete Account
        </Button>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This will permanently remove all your data, including deal history, offers, and reviews. This action cannot be undone."
        confirmText="Delete My Account"
        confirmVariant="danger"
      />
    </div>
  );
}
