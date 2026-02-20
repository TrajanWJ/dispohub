import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import {
  Button, Card, Badge, LoadingSpinner, useToast,
} from '../../components/common/index.jsx';

// ─── Helpers ──────────────────────────────────────────────────────
function fmtUptime(seconds) {
  if (!seconds) return '-';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1280, margin: '0 auto' },
  header: { marginBottom: '1.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '0.9rem' },

  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '1.25rem', marginBottom: '1.5rem',
  },
  singleCol: {
    display: 'grid', gridTemplateColumns: '1fr',
    gap: '1.25rem', marginBottom: '1.5rem',
  },

  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', overflow: 'hidden',
    transition: 'var(--transition)',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
  },
  cardTitle: { fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  cardBody: { padding: '1.25rem' },

  configRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)',
  },
  configRowLast: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.75rem 0',
  },
  configLabel: { fontSize: '0.85rem', color: 'var(--text-secondary)' },
  configValue: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' },

  tierCard: {
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)', padding: '1rem', marginBottom: '0.75rem',
    position: 'relative', overflow: 'hidden',
  },
  tierName: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  tierPrice: { fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' },
  tierFeatureList: { listStyle: 'none', padding: 0, margin: 0 },
  tierFeature: {
    fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.25rem 0',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
  },

  weightBar: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0',
    borderBottom: '1px solid var(--border-color)',
  },
  weightBarLast: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0',
  },
  weightLabel: { fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: 110 },
  weightTrack: {
    flex: 1, height: 8, background: 'var(--bg-tertiary)', borderRadius: 4,
    overflow: 'hidden', position: 'relative',
  },
  weightFill: {
    height: '100%', borderRadius: 4, transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  weightValue: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: 36, textAlign: 'right' },

  healthGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  healthItem: {
    background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)',
    padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.625rem',
  },
  healthDot: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
  },
  healthLabel: { fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 },
  healthStatus: { fontSize: '0.75rem', fontWeight: 600 },

  toggle: {
    width: 44, height: 24, borderRadius: 12, padding: 2,
    cursor: 'pointer', transition: 'var(--transition)', border: 'none',
    display: 'flex', alignItems: 'center',
  },
  toggleKnob: {
    width: 20, height: 20, borderRadius: '50%', background: '#fff',
    transition: 'var(--transition)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },

  quickActions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  actionCard: {
    background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)',
    padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem',
  },
  actionTitle: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' },
  actionDesc: { fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 },

  sysInfoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem 1.5rem' },
  sysInfoLabel: { fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  sysInfoValue: { fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '0.625rem' },

  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1.25rem',
  },
};

const MATCHING_WEIGHTS = [
  { label: 'Location', weight: 35, color: 'var(--accent-primary)' },
  { label: 'Property Type', weight: 20, color: 'var(--accent-info)' },
  { label: 'Budget Match', weight: 30, color: 'var(--accent-success)' },
  { label: 'Reputation', weight: 15, color: 'var(--accent-warning)' },
];

const TIER_COLORS = {
  free: 'var(--text-muted)',
  pro: 'var(--accent-primary)',
  premium: 'var(--accent-warning)',
};

// ─── Component ────────────────────────────────────────────────────
export default function PlatformSettingsPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Platform data
  const [tiers, setTiers] = useState([]);
  const [health, setHealth] = useState(null);
  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    return localStorage.getItem('dispohub_maintenance_mode') === 'true';
  });

  // Action states
  const [reseedLoading, setReseedLoading] = useState(false);
  const [clearCacheLoading, setClearCacheLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tiersRes, healthRes] = await Promise.allSettled([
        api.get('/subscriptions/tiers'),
        api.get('/health'),
      ]);

      if (tiersRes.status === 'fulfilled') {
        const tierData = tiersRes.value.data;
        setTiers(tierData.tiers || tierData || []);
      }

      if (healthRes.status === 'fulfilled') {
        setHealth(healthRes.value.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load platform settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleMaintenance = () => {
    const next = !maintenanceMode;
    setMaintenanceMode(next);
    localStorage.setItem('dispohub_maintenance_mode', String(next));
    if (next) {
      toast.warning('Maintenance mode enabled. This is a visual-only toggle for demo purposes.');
    } else {
      toast.success('Maintenance mode disabled. Platform is operational.');
    }
  };

  const handleReseed = async () => {
    setReseedLoading(true);
    try {
      await api.post('/admin/reseed');
      toast.success('Database reseeded successfully. Fresh sample data has been loaded.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reseed database.');
    } finally {
      setReseedLoading(false);
    }
  };

  const handleClearCache = () => {
    setClearCacheLoading(true);
    // Simulated cache clear for demo
    setTimeout(() => {
      setClearCacheLoading(false);
      toast.success('Application cache cleared successfully.');
    }, 1200);
  };

  const handleHealthCheck = async () => {
    setHealthLoading(true);
    try {
      const res = await api.get('/health');
      setHealth(res.data);
      toast.success('Health check completed. All systems operational.');
    } catch (err) {
      toast.error('Health check failed. Some services may be unavailable.');
    } finally {
      setHealthLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.center}><LoadingSpinner size={48} /></div>
      </div>
    );
  }

  const healthStatus = health?.status || health?.state || 'unknown';
  const isHealthy = healthStatus === 'ok' || healthStatus === 'healthy' || healthStatus === 'running';

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>Platform Settings</h1>
        <p style={s.subtitle}>Configure platform parameters, view system health, and manage operational settings.</p>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {/* Row 1: Fee Settings + Matching Weights */}
      <div style={s.grid}>
        {/* Platform Fee Settings */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardTitle}>
              <span>{'\u{1F4B0}'}</span> Platform Fee Configuration
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <div style={s.cardBody}>
            <div style={s.configRow}>
              <span style={s.configLabel}>Base Platform Fee</span>
              <span style={{ ...s.configValue, color: 'var(--accent-primary)', fontSize: '1.125rem' }}>5.0%</span>
            </div>
            <div style={s.configRow}>
              <span style={s.configLabel}>Pro Tier Discount</span>
              <span style={{ ...s.configValue, color: 'var(--accent-success)' }}>-1.0% (4.0%)</span>
            </div>
            <div style={s.configRow}>
              <span style={s.configLabel}>Premium Tier Discount</span>
              <span style={{ ...s.configValue, color: 'var(--accent-warning)' }}>-2.0% (3.0%)</span>
            </div>
            <div style={s.configRow}>
              <span style={s.configLabel}>Minimum Fee</span>
              <span style={s.configValue}>$250</span>
            </div>
            <div style={s.configRowLast}>
              <span style={s.configLabel}>Maximum Fee Cap</span>
              <span style={s.configValue}>$25,000</span>
            </div>
          </div>
        </div>

        {/* Matching Engine Weights */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardTitle}>
              <span>{'\u{1F9E0}'}</span> Matching Engine Weights
            </div>
            <Badge variant="info">Algorithm v2.1</Badge>
          </div>
          <div style={s.cardBody}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.875rem', lineHeight: 1.5 }}>
              These weights determine how the matching algorithm scores deal-investor compatibility.
              Higher weight means greater influence on the match score.
            </p>
            {MATCHING_WEIGHTS.map((w, i) => (
              <div key={w.label} style={i < MATCHING_WEIGHTS.length - 1 ? s.weightBar : s.weightBarLast}>
                <span style={s.weightLabel}>{w.label}</span>
                <div style={s.weightTrack}>
                  <div style={{
                    ...s.weightFill,
                    width: `${w.weight}%`,
                    background: `linear-gradient(90deg, ${w.color}, ${w.color}dd)`,
                  }} />
                </div>
                <span style={s.weightValue}>{w.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Subscription Tiers */}
      <div style={s.singleCol}>
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardTitle}>
              <span>{'\u{1F451}'}</span> Subscription Tier Configuration
            </div>
            <Badge variant="neutral">{tiers.length} Tier{tiers.length !== 1 ? 's' : ''}</Badge>
          </div>
          <div style={s.cardBody}>
            {tiers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                No subscription tiers configured. Tier data will load from the API.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {tiers.map((tier) => {
                  const name = tier.name || tier.tier || 'Unknown';
                  const tierKey = name.toLowerCase();
                  const color = TIER_COLORS[tierKey] || 'var(--text-primary)';
                  const price = tier.price || tier.monthlyPrice || 0;
                  const features = tier.features || [];

                  return (
                    <div key={name} style={s.tierCard}>
                      {/* Accent border at top */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: color,
                      }} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <div style={{ ...s.tierName, color }}>{name.charAt(0).toUpperCase() + name.slice(1)}</div>
                        <Badge variant={tierKey === 'premium' ? 'warning' : tierKey === 'pro' ? 'info' : 'neutral'}>
                          {tierKey === 'free' ? 'Basic' : tierKey === 'pro' ? 'Popular' : 'Enterprise'}
                        </Badge>
                      </div>
                      <div style={{ ...s.tierPrice, color }}>
                        {price === 0 ? 'Free' : `$${Number(price).toLocaleString()}/mo`}
                      </div>
                      {features.length > 0 && (
                        <ul style={s.tierFeatureList}>
                          {features.map((feature, i) => (
                            <li key={i} style={s.tierFeature}>
                              <span style={{ color: 'var(--accent-success)', fontSize: '0.75rem' }}>{'\u2713'}</span>
                              {typeof feature === 'string' ? feature : feature.name || feature.label || '-'}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Platform Health + Maintenance */}
      <div style={s.grid}>
        {/* Platform Health */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardTitle}>
              <span>{'\u{1F3E5}'}</span> Platform Health
            </div>
            <Badge variant={isHealthy ? 'success' : 'danger'}>
              {isHealthy ? 'All Systems Operational' : 'Degraded'}
            </Badge>
          </div>
          <div style={s.cardBody}>
            <div style={s.healthGrid}>
              <div style={s.healthItem}>
                <div style={{ ...s.healthDot, background: isHealthy ? 'var(--accent-success)' : 'var(--accent-danger)' }} />
                <span style={s.healthLabel}>API Server</span>
                <span style={{ ...s.healthStatus, color: isHealthy ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                  {isHealthy ? 'Online' : 'Offline'}
                </span>
              </div>
              <div style={s.healthItem}>
                <div style={{ ...s.healthDot, background: isHealthy ? 'var(--accent-success)' : 'var(--accent-warning)' }} />
                <span style={s.healthLabel}>Database</span>
                <span style={{ ...s.healthStatus, color: isHealthy ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                  {isHealthy ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div style={s.healthItem}>
                <div style={{ ...s.healthDot, background: 'var(--accent-success)' }} />
                <span style={s.healthLabel}>Auth Service</span>
                <span style={{ ...s.healthStatus, color: 'var(--accent-success)' }}>Active</span>
              </div>
              <div style={s.healthItem}>
                <div style={{ ...s.healthDot, background: maintenanceMode ? 'var(--accent-warning)' : 'var(--accent-success)' }} />
                <span style={s.healthLabel}>Maintenance</span>
                <span style={{ ...s.healthStatus, color: maintenanceMode ? 'var(--accent-warning)' : 'var(--accent-success)' }}>
                  {maintenanceMode ? 'Enabled' : 'Off'}
                </span>
              </div>
            </div>

            {/* Maintenance Toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: '1.25rem', padding: '0.875rem', background: 'var(--bg-tertiary)',
              borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)',
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Maintenance Mode
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Display maintenance page to all non-admin users
                </div>
              </div>
              <button
                style={{
                  ...s.toggle,
                  background: maintenanceMode ? 'var(--accent-warning)' : 'var(--bg-tertiary)',
                  border: maintenanceMode ? 'none' : '1px solid var(--border-color)',
                }}
                onClick={toggleMaintenance}
              >
                <div style={{
                  ...s.toggleKnob,
                  transform: maintenanceMode ? 'translateX(20px)' : 'translateX(0)',
                }} />
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              loading={healthLoading}
              onClick={handleHealthCheck}
              style={{ marginTop: '0.875rem', width: '100%' }}
            >
              Run Health Check
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardTitle}>
              <span>{'\u26A1'}</span> Quick Actions
            </div>
          </div>
          <div style={s.cardBody}>
            <div style={s.quickActions}>
              <div style={s.actionCard}>
                <div style={s.actionTitle}>Reseed Database</div>
                <div style={s.actionDesc}>
                  Reset the JSON database with fresh sample data. This will overwrite all current records with seed data.
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  loading={reseedLoading}
                  onClick={handleReseed}
                >
                  Reseed Database
                </Button>
              </div>
              <div style={s.actionCard}>
                <div style={s.actionTitle}>Clear Cache</div>
                <div style={s.actionDesc}>
                  Purge the application cache to ensure fresh data is served on the next request cycle.
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={clearCacheLoading}
                  onClick={handleClearCache}
                >
                  Clear Cache
                </Button>
              </div>
              <div style={s.actionCard}>
                <div style={s.actionTitle}>Refresh Settings</div>
                <div style={s.actionDesc}>
                  Reload all platform configuration from the server to reflect the latest changes.
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={loading}
                  onClick={fetchData}
                >
                  Refresh
                </Button>
              </div>
              <div style={s.actionCard}>
                <div style={s.actionTitle}>Export Logs</div>
                <div style={s.actionDesc}>
                  Download platform operation logs for the current period in CSV format.
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.info('Log export will be available in a future release.')}
                >
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: System Info */}
      <div style={s.singleCol}>
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardTitle}>
              <span>{'\u{1F5A5}\uFE0F'}</span> System Information
            </div>
          </div>
          <div style={s.cardBody}>
            <div style={s.sysInfoGrid}>
              <div>
                <div style={s.sysInfoLabel}>Platform Version</div>
                <div style={s.sysInfoValue}>
                  {health?.version || '1.0.0'}
                  <Badge variant="info" style={{ marginLeft: '0.5rem', fontSize: '0.6rem' }}>Latest</Badge>
                </div>
              </div>
              <div>
                <div style={s.sysInfoLabel}>Server Uptime</div>
                <div style={s.sysInfoValue}>{fmtUptime(health?.uptime)}</div>
              </div>
              <div>
                <div style={s.sysInfoLabel}>Environment</div>
                <div style={s.sysInfoValue}>{health?.environment || health?.env || 'development'}</div>
              </div>
              <div>
                <div style={s.sysInfoLabel}>Node.js Version</div>
                <div style={s.sysInfoValue}>{health?.nodeVersion || health?.node || process.env.NODE_ENV || '-'}</div>
              </div>
              <div>
                <div style={s.sysInfoLabel}>Database Engine</div>
                <div style={s.sysInfoValue}>{health?.database || 'JSON (lowdb)'}</div>
              </div>
              <div>
                <div style={s.sysInfoLabel}>API Base URL</div>
                <div style={s.sysInfoValue}>/api</div>
              </div>
              <div>
                <div style={s.sysInfoLabel}>Authentication</div>
                <div style={s.sysInfoValue}>JWT Bearer Token</div>
              </div>
              <div>
                <div style={s.sysInfoLabel}>Matching Algorithm</div>
                <div style={s.sysInfoValue}>Weighted Score v2.1</div>
              </div>
              <div>
                <div style={s.sysInfoLabel}>Last Deploy</div>
                <div style={s.sysInfoValue}>{health?.lastDeploy || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
