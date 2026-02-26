import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Settings, X, RefreshCw, Sun } from 'lucide-react';

const ROLE_META = {
  wholesaler: { text: 'var(--text-secondary)', label: 'Wholesaler' },
  investor: { text: 'var(--text-secondary)', label: 'Investor' },
  admin: { text: 'var(--text-secondary)', label: 'Admin' },
};

const ROLE_BUTTONS = [
  { role: 'wholesaler', label: 'Wholesaler' },
  { role: 'investor', label: 'Investor' },
  { role: 'admin', label: 'Admin' },
];

function InitialAvatar({ name, size = 32 }) {
  const initials = (name || '').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: '600', color: 'var(--text-primary)', flexShrink: 0 }}>
      {initials}
    </span>
  );
}

const s = {
  wrapper: { position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 9999, fontFamily: 'var(--font-body)' },
  pill: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9999px', cursor: 'pointer', transition: 'all 200ms ease', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', userSelect: 'none' },
  pillName: { fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-primary)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pillBadge: { padding: '0.125rem 0.4rem', borderRadius: '9999px', fontSize: '0.5625rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' },
  panel: { width: '300px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--border-radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)', overflow: 'hidden' },
  panelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  panelTitle: { fontSize: '0.625rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: 0 },
  closeBtn: { width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '4px', transition: 'var(--transition-fast)', padding: 0 },
  panelBody: { padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  currentUser: { display: 'flex', alignItems: 'center', gap: '0.625rem' },
  currentInfo: { flex: 1, minWidth: 0 },
  currentName: { fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  currentDetail: { fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 },
  sectionTitle: { fontSize: '0.5625rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: 0 },
  roleRow: { display: 'flex', gap: '0.5rem' },
  roleBtn: { flex: 1, padding: '0.5rem 0.375rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', background: 'transparent', fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer', transition: 'all 150ms ease', color: 'var(--text-secondary)' },
  roleBtnActive: { background: '#ffffff', color: '#050507', borderColor: '#ffffff', cursor: 'default' },
  actionRow: { display: 'flex', gap: '0.5rem' },
  actionBtn: { flex: 1, padding: '0.5rem 0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer', transition: 'var(--transition-fast)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' },
  spinner: { width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'devToolbarSpin 0.6s linear infinite', display: 'inline-block' },
  statusMsg: { fontSize: '0.6875rem', padding: '0.375rem 0.5rem', borderRadius: '8px', textAlign: 'center' },
};

export default function DevToolbar() {
  const { user, role, devSwitch } = useAuth();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(null);
  const [reseeding, setReseeding] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => { if (!statusMsg) return; const t = setTimeout(() => setStatusMsg(null), 3000); return () => clearTimeout(t); }, [statusMsg]);
  useEffect(() => { if (!open) return; const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }, [open]);

  if (!user) return null;

  const meta = ROLE_META[role] || ROLE_META.investor;
  const firstName = user.name?.split(' ')[0] || 'User';

  const handleRoleSwitch = async (targetRole) => {
    if (targetRole === role || switching) return;
    setSwitching(targetRole);
    setStatusMsg(null);
    try { await devSwitch(targetRole); setStatusMsg({ type: 'success', text: `Switched to ${targetRole}` }); setTimeout(() => window.location.reload(), 400); }
    catch (err) { setStatusMsg({ type: 'error', text: err.response?.data?.error || 'Switch failed' }); setSwitching(null); }
  };

  const handleReseed = async () => {
    if (reseeding) return;
    setReseeding(true); setStatusMsg(null);
    try { await api.post('/admin/reseed'); setStatusMsg({ type: 'success', text: 'Database reseeded!' }); }
    catch (err) { setStatusMsg({ type: 'error', text: err.response?.data?.error || 'Reseed failed' }); }
    finally { setReseeding(false); }
  };

  if (!open) {
    return (
      <div style={s.wrapper}>
        <div style={s.pill} onClick={() => setOpen(true)} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
          <Settings size={14} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
          <span style={s.pillName}>{firstName}</span>
          <span style={s.pillBadge}>{meta.label}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrapper} ref={panelRef}>
      <style>{`@keyframes devToolbarSpin { to { transform: rotate(360deg) } }`}</style>
      <div style={s.panel}>
        <div style={s.panelHeader}>
          <p style={s.panelTitle}>Dev Toolbar</p>
          <button style={s.closeBtn} onClick={() => setOpen(false)} onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}>
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
        <div style={s.panelBody}>
          <div style={s.currentUser}>
            <InitialAvatar name={user.name} size={36} />
            <div style={s.currentInfo}>
              <p style={s.currentName}>{user.name}</p>
              <p style={s.currentDetail}>{user.email}{' \u00B7 '}<span style={{ color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'capitalize' }}>{role}</span></p>
            </div>
          </div>
          <div>
            <p style={{ ...s.sectionTitle, marginBottom: '0.5rem' }}>Quick Switch</p>
            <div style={s.roleRow}>
              {ROLE_BUTTONS.map((rb) => {
                const isActive = rb.role === role;
                const isLoading = switching === rb.role;
                return (
                  <button key={rb.role} style={{ ...s.roleBtn, ...(isActive ? s.roleBtnActive : {}) }} disabled={isActive || !!switching} onClick={() => handleRoleSwitch(rb.role)}
                    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'; e.currentTarget.style.color = '#ffffff'; } }}
                    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}>
                    {isLoading ? <span style={s.spinner} /> : rb.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p style={{ ...s.sectionTitle, marginBottom: '0.5rem' }}>Actions</p>
            <div style={s.actionRow}>
              <button style={s.actionBtn} onClick={handleReseed} disabled={reseeding} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#ffffff'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                {reseeding ? <span style={s.spinner} /> : <RefreshCw size={12} strokeWidth={1.5} />}Reseed DB
              </button>
              <button style={s.actionBtn} disabled title="Coming soon">
                <Sun size={12} strokeWidth={1.5} />Theme
              </button>
            </div>
          </div>
          {statusMsg && (
            <div style={{ ...s.statusMsg, background: statusMsg.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', color: statusMsg.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)', border: `1px solid ${statusMsg.type === 'success' ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
              {statusMsg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
