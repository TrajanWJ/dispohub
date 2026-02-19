import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '2.5rem 2rem',
    boxShadow: 'var(--shadow-lg)',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '2rem',
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
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
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
  devLink: {
    fontSize: '0.8125rem',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    transition: 'var(--transition)',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '0.25rem 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'var(--border-color)',
  },
  dividerText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Login failed. Please try again.';
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
          <h1 style={styles.logoTitle}>DispoHub</h1>
          <p style={styles.logoSub}>Wholesale Real Estate Dispo Platform</p>
        </div>

        {/* Error */}
        {error && <div style={{ ...styles.error, marginBottom: '1rem' }}>{error}</div>}

        {/* Form */}
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoComplete="current-password"
            />
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
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Footer links */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Don't have an account?{' '}
            <Link to="/register" style={styles.link}>
              Register
            </Link>
          </p>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine} />
          </div>

          <Link
            to="/dev-login"
            style={styles.devLink}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Use Dev Login
          </Link>
        </div>
      </div>
    </div>
  );
}
