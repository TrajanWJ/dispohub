import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Button, Badge, Avatar, LoadingSpinner, StatusBadge, StarRating } from '../../components/common';
import { useToast } from '../../components/common';
import { formatNumber } from '../../utils/formatters';

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

  /* Profile header */
  profileHeader: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: '1.375rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  profileEmail: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  /* Stats row */
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '1.25rem',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  statLabel: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
  },

  /* Form section */
  formSection: {
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

  /* Verification */
  verificationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1rem',
    background: 'var(--bg-primary)',
    borderRadius: 'var(--border-radius)',
    border: '1px solid var(--border-color)',
  },
  verificationLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    flex: 1,
  },

  /* Footer */
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    paddingTop: '0.5rem',
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
  loadingWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40vh',
  },
};

/* ============================================================
   US STATES
   ============================================================ */

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

/* ============================================================
   PROFILE PAGE
   ============================================================ */

export default function ProfilePage() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    bio: '',
    state: '',
    city: '',
  });

  const [profile, setProfile] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/auth/me');
      const data = res.data;
      setProfile(data);
      setForm({
        name: data.name || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        company: data.company || '',
        bio: data.bio || '',
        state: data.state || data.location?.state || '',
        city: data.city || data.location?.city || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const userId = profile?._id || profile?.id || user?.id;
      const payload = {
        name: form.name || `${form.firstName} ${form.lastName}`.trim(),
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        company: form.company,
        bio: form.bio,
        state: form.state,
        city: form.city,
      };
      await api.put(`/users/${userId}`, payload);
      toast.success('Profile updated successfully.');
      fetchProfile();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save profile.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
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

  const displayName =
    profile?.name ||
    `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() ||
    user?.email ||
    'User';
  const displayRole = profile?.role || user?.role || 'member';
  const isVerified = profile?.verified || profile?.isVerified || false;
  const totalDeals = profile?.totalDeals || profile?.dealCount || 0;
  const reputation = profile?.reputationScore || profile?.reputation || 0;

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>My Profile</h1>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Profile header */}
      <div style={styles.profileHeader}>
        <Avatar name={displayName} size={72} />
        <div style={styles.profileInfo}>
          <div style={styles.profileName}>{displayName}</div>
          <div style={styles.profileEmail}>{profile?.email || user?.email}</div>
          <div style={styles.badgeRow}>
            <StatusBadge status={displayRole} />
            {isVerified && <Badge variant="success">Verified</Badge>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{formatNumber(totalDeals)}</div>
          <div style={styles.statLabel}>Total Deals</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
            <StarRating value={Math.round(reputation)} size={20} />
          </div>
          <div style={styles.statValue}>{Number(reputation).toFixed(1)}</div>
          <div style={styles.statLabel}>Reputation Score</div>
        </div>
      </div>

      {/* Edit form */}
      <div style={styles.formSection}>
        <div style={styles.sectionTitle}>Edit Profile</div>

        <div style={styles.fieldGrid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>First Name</label>
            <input
              style={styles.input}
              value={form.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="First name"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Last Name</label>
            <input
              style={styles.input}
              value={form.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Display Name</label>
          <input
            style={styles.input}
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Display name"
          />
        </div>

        <div style={styles.fieldGrid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Phone</label>
            <input
              style={styles.input}
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Company</label>
            <input
              style={styles.input}
              value={form.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="Company name"
            />
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Bio</label>
          <textarea
            style={styles.textarea}
            value={form.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="Tell others about yourself..."
          />
        </div>

        <div style={styles.fieldGrid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>State</label>
            <select
              style={styles.input}
              value={form.state}
              onChange={(e) => handleChange('state', e.target.value)}
            >
              <option value="">Select State</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>City</label>
            <input
              style={styles.input}
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="City"
            />
          </div>
        </div>
      </div>

      {/* Verification status */}
      <div style={styles.formSection}>
        <div style={styles.sectionTitle}>Verification</div>
        <div style={styles.verificationRow}>
          <span style={styles.verificationLabel}>Identity Verification</span>
          {isVerified ? (
            <Badge variant="success">Verified</Badge>
          ) : (
            <Badge variant="warning">Not Verified</Badge>
          )}
        </div>
      </div>

      {/* Save */}
      <div style={styles.footer}>
        <Button variant="primary" loading={saving} onClick={handleSave}>
          Save Profile
        </Button>
      </div>
    </div>
  );
}
