import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    padding: '2rem 1rem',
  },
  card: {
    width: '100%',
    maxWidth: '520px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '2.5rem 2rem',
    boxShadow: 'var(--shadow-lg)',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '1.75rem',
  },
  logoIcon: {
    width: '48px',
    height: '48px',
    background: 'var(--accent-primary)',
    borderRadius: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.75rem',
    fontSize: '1.5rem',
    color: '#fff',
    fontWeight: '700',
  },
  logoTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '0 0 0.25rem 0',
  },
  logoSub: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  },
  labelOptional: {
    fontWeight: '400',
    color: 'var(--text-muted)',
    marginLeft: '0.25rem',
  },
  input: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'var(--transition)',
  },
  select: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'var(--transition)',
    appearance: 'none',
    backgroundImage:
      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%239aa0a6\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    paddingRight: '2rem',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  sectionLabel: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
  },
  roleSelector: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  roleCard: {
    padding: '1rem',
    background: 'var(--bg-tertiary)',
    border: '2px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    cursor: 'pointer',
    transition: 'var(--transition)',
    textAlign: 'center',
  },
  roleCardActive: {
    borderColor: 'var(--accent-primary)',
    background: 'rgba(108, 92, 231, 0.1)',
  },
  roleIcon: {
    fontSize: '1.75rem',
    marginBottom: '0.375rem',
    display: 'block',
  },
  roleName: {
    fontSize: '0.9375rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0,
  },
  roleDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    margin: '0.25rem 0 0 0',
  },
  submitBtn: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'var(--accent-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--border-radius)',
    fontSize: '0.9375rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)',
    marginTop: '0.25rem',
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    background: 'rgba(255, 71, 87, 0.1)',
    border: '1px solid rgba(255, 71, 87, 0.3)',
    borderRadius: 'var(--border-radius)',
    padding: '0.75rem 1rem',
    color: 'var(--accent-danger)',
    fontSize: '0.8125rem',
    lineHeight: '1.4',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
  },
  footerText: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  link: {
    color: 'var(--accent-primary)',
    textDecoration: 'none',
    fontWeight: '500',
  },
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    company: '',
    state: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  const selectRole = (role) => () => {
    setForm((prev) => ({ ...prev, role }));
    if (error) setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return 'Please enter a valid email address.';
    if (!form.password) return 'Password is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!form.role) return 'Please select a role.';
    if (!form.state) return 'Please select your state.';
    if (!form.city.trim()) return 'Please enter your city.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        company: form.company.trim() || undefined,
        location: {
          state: form.state,
          city: form.city.trim(),
        },
      });
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo / Title */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>D</div>
          <h1 style={styles.logoTitle}>Create Account</h1>
          <p style={styles.logoSub}>Join DispoHub and start closing deals</p>
        </div>

        {/* Error */}
        {error && <div style={{ ...styles.error, marginBottom: '1rem' }}>{error}</div>}

        {/* Form */}
        <form style={styles.form} onSubmit={handleSubmit}>
          {/* Name */}
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="reg-name">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={updateField('name')}
              style={styles.input}
              autoComplete="name"
              autoFocus
            />
          </div>

          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="reg-email">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={updateField('email')}
              style={styles.input}
              autoComplete="email"
            />
          </div>

          {/* Password row */}
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="reg-password">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={updateField('password')}
                style={styles.input}
                autoComplete="new-password"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="reg-confirm">
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type="password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                style={styles.input}
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Role selector */}
          <div>
            <p style={styles.sectionLabel}>I am a...</p>
            <div style={styles.roleSelector}>
              <div
                style={{
                  ...styles.roleCard,
                  ...(form.role === 'wholesaler' ? styles.roleCardActive : {}),
                }}
                onClick={selectRole('wholesaler')}
                onMouseEnter={(e) => {
                  if (form.role !== 'wholesaler')
                    e.currentTarget.style.borderColor = 'var(--text-muted)';
                }}
                onMouseLeave={(e) => {
                  if (form.role !== 'wholesaler')
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <span style={styles.roleIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </span>
                <p style={styles.roleName}>Wholesaler</p>
                <p style={styles.roleDesc}>I source and list deals</p>
              </div>
              <div
                style={{
                  ...styles.roleCard,
                  ...(form.role === 'investor' ? styles.roleCardActive : {}),
                }}
                onClick={selectRole('investor')}
                onMouseEnter={(e) => {
                  if (form.role !== 'investor')
                    e.currentTarget.style.borderColor = 'var(--text-muted)';
                }}
                onMouseLeave={(e) => {
                  if (form.role !== 'investor')
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <span style={styles.roleIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </span>
                <p style={styles.roleName}>Investor</p>
                <p style={styles.roleDesc}>I find and fund deals</p>
              </div>
            </div>
          </div>

          {/* Company */}
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="reg-company">
              Company Name
              <span style={styles.labelOptional}>(optional)</span>
            </label>
            <input
              id="reg-company"
              type="text"
              placeholder="Your company or LLC"
              value={form.company}
              onChange={updateField('company')}
              style={styles.input}
            />
          </div>

          {/* Location row */}
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="reg-state">
                State
              </label>
              <select
                id="reg-state"
                value={form.state}
                onChange={updateField('state')}
                style={{
                  ...styles.select,
                  color: form.state ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <option value="">Select state</option>
                {US_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="reg-city">
                City
              </label>
              <input
                id="reg-city"
                type="text"
                placeholder="Your city"
                value={form.city}
                onChange={updateField('city')}
                style={styles.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.submitBtnDisabled : {}),
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = 'var(--accent-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent-primary)';
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Already have an account?{' '}
            <Link to="/login" style={styles.link}>
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
