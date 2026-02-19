import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

// ─── Helpers ──────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function fmtDateTime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'rgba(95,99,104,0.15)', color: 'var(--text-secondary)' },
  sent: { label: 'Sent', bg: 'rgba(52,152,219,0.12)', color: 'var(--accent-info)' },
  signed_by_one: { label: 'Partially Signed', bg: 'rgba(255,170,0,0.12)', color: 'var(--accent-warning)' },
  fully_signed: { label: 'Fully Signed', bg: 'rgba(0,214,143,0.12)', color: 'var(--accent-success)' },
  expired: { label: 'Expired', bg: 'rgba(255,71,87,0.12)', color: 'var(--accent-danger)' },
  cancelled: { label: 'Cancelled', bg: 'rgba(255,71,87,0.12)', color: 'var(--accent-danger)' },
};

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: { padding: '1.5rem 2rem', maxWidth: 1280, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' },

  /* Table */
  tableWrap: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5,
    borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
  },
  td: {
    padding: '0.85rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
  },
  row: { cursor: 'pointer', transition: 'var(--transition)' },
  badge: {
    display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: 12,
    fontSize: '0.72rem', fontWeight: 600,
  },

  /* Loading / Error / Empty */
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  spinner: {
    width: 36, height: 36, border: '3px solid var(--border-color)',
    borderTopColor: 'var(--accent-primary)', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    background: 'rgba(255,71,87,0.08)', border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)', padding: '1rem 1.25rem',
    color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1.25rem',
  },
  empty: { textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' },

  /* Modal */
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  },
  modal: {
    background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-xl)',
    border: '1px solid var(--border-color)', maxWidth: 760, width: '100%',
    maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)',
  },
  modalTitle: { fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' },
  closeBtn: {
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)', color: 'var(--text-secondary)',
    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '1.1rem',
  },
  modalBody: { padding: '1.5rem' },

  /* Document viewer */
  docViewer: {
    background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '2rem 2.5rem',
    marginBottom: '1.5rem', fontFamily: "'Georgia', 'Times New Roman', serif",
    lineHeight: 1.8, fontSize: '0.9rem', color: 'var(--text-primary)',
    maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre-wrap',
  },
  docHeader: {
    textAlign: 'center', marginBottom: '1.5rem',
    paddingBottom: '1rem', borderBottom: '2px solid var(--border-color)',
  },
  docTitle: {
    fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.5rem',
  },
  docMeta: { fontSize: '0.8rem', color: 'var(--text-secondary)' },

  /* Signature area */
  sigArea: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '1.25rem', marginBottom: '0.75rem',
  },
  sigHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' },
  sigLabel: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 },
  sigName: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 },
  sigDate: { fontSize: '0.78rem', color: 'var(--text-muted)' },
  sigSigned: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-success)',
  },
  sigUnsigned: {
    fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', fontStyle: 'italic',
  },

  /* Info grid */
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', marginBottom: '1.25rem' },
  infoLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '0.6rem' },

  /* Sign button */
  signBtn: {
    background: 'var(--accent-success)', color: '#fff', border: 'none',
    borderRadius: 'var(--border-radius)', padding: '0.7rem 1.75rem',
    fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
    transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: 6,
  },
  signedNotice: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '0.7rem 1.25rem', background: 'rgba(0,214,143,0.08)',
    border: '1px solid rgba(0,214,143,0.2)', borderRadius: 'var(--border-radius)',
    color: 'var(--accent-success)', fontSize: '0.85rem', fontWeight: 600,
  },
};

// ─── Component ────────────────────────────────────────────────────
export default function ContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [signing, setSigning] = useState(false);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Contracts might come from a dedicated endpoint or from transactions
      let list = [];
      try {
        const res = await api.get('/contracts');
        list = res.data.contracts || [];
      } catch {
        // Fallback: derive from transactions
        const txRes = await api.get('/transactions');
        const txns = txRes.data.transactions || [];
        list = txns
          .filter((t) => t.contract || t.contractId)
          .map((t) => ({
            _id: t.contractId || t.contract?._id || t._id,
            type: t.contract?.type || 'Assignment Contract',
            dealAddress: t.dealAddress || t.address || '-',
            status: t.contract?.status || 'draft',
            parties: t.contract?.parties || [
              { name: t.wholesalerName || 'Wholesaler', role: 'wholesaler' },
              { name: t.buyerName || 'Buyer', role: 'buyer' },
            ],
            documentContent: t.contract?.documentContent || '',
            signatures: t.contract?.signatures || [],
            createdAt: t.contract?.createdAt || t.createdAt,
            updatedAt: t.contract?.updatedAt || t.updatedAt,
          }));
      }
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setContracts(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const openContract = (contract) => setSelected(contract);
  const closeContract = () => setSelected(null);

  // Check if current user has signed
  const hasUserSigned = (contract) => {
    if (!contract?.signatures || !user) return false;
    return contract.signatures.some(
      (sig) =>
        (sig.userId === user.id || sig.userId === user._id) && sig.signed
    );
  };

  const handleSign = async () => {
    if (!selected || !user) return;
    setSigning(true);
    try {
      const contractId = selected._id || selected.id;
      await api.put(`/contracts/${contractId}/sign`, {
        userId: user.id || user._id,
      });
      // Refresh
      try {
        const res = await api.get(`/contracts/${contractId}`);
        setSelected(res.data.contract || res.data);
      } catch {
        // Optimistically update local state
        const now = new Date().toISOString();
        const updatedSigs = [
          ...(selected.signatures || []),
          {
            userId: user.id || user._id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            role: 'wholesaler',
            signed: true,
            signedAt: now,
          },
        ];
        const allSigned = (selected.parties || []).every((p) =>
          updatedSigs.some((sig) => sig.role === p.role && sig.signed)
        );
        setSelected({
          ...selected,
          signatures: updatedSigs,
          status: allSigned ? 'fully_signed' : 'signed_by_one',
        });
      }
      fetchContracts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to sign contract.');
    } finally {
      setSigning(false);
    }
  };

  const statusBadge = (status) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return <span style={{ ...s.badge, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>;
  };

  return (
    <div style={s.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <h1 style={s.title}>Contracts</h1>

      {error && <div style={s.errorBox}>{error}</div>}

      {loading && (
        <div style={s.center}>
          <div style={s.spinner} />
        </div>
      )}

      {!loading && contracts.length === 0 && (
        <div style={s.empty}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            No contracts yet
          </p>
          <p>Contracts will appear here when deals move into the transaction phase.</p>
        </div>
      )}

      {!loading && contracts.length > 0 && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Type</th>
                <th style={s.th}>Deal</th>
                <th style={s.th}>Parties</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const parties = c.parties || [];
                const partyNames = parties.map((p) => p.name || p.role || '-').join(', ');

                return (
                  <tr
                    key={c._id || c.id}
                    style={s.row}
                    onClick={() => openContract(c)}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={s.td}>{c.type || 'Assignment Contract'}</td>
                    <td style={s.td}>{c.dealAddress || '-'}</td>
                    <td style={{ ...s.td, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {partyNames || '-'}
                    </td>
                    <td style={s.td}>{statusBadge(c.status)}</td>
                    <td style={{ ...s.td, color: 'var(--text-secondary)' }}>
                      {fmtDate(c.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ Contract Detail Modal ═══ */}
      {selected && (
        <div style={s.overlay} onClick={closeContract}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{selected.type || 'Contract'}</h2>
              <button style={s.closeBtn} onClick={closeContract}>&times;</button>
            </div>
            <div style={s.modalBody}>
              {/* Contract info */}
              <div style={s.infoGrid}>
                <div>
                  <div style={s.infoLabel}>Deal</div>
                  <div style={s.infoValue}>{selected.dealAddress || '-'}</div>
                </div>
                <div>
                  <div style={s.infoLabel}>Status</div>
                  <div style={s.infoValue}>{statusBadge(selected.status)}</div>
                </div>
                <div>
                  <div style={s.infoLabel}>Created</div>
                  <div style={s.infoValue}>{fmtDate(selected.createdAt)}</div>
                </div>
                <div>
                  <div style={s.infoLabel}>Last Updated</div>
                  <div style={s.infoValue}>{fmtDate(selected.updatedAt)}</div>
                </div>
              </div>

              {/* Document content */}
              <div style={s.docViewer}>
                <div style={s.docHeader}>
                  <div style={s.docTitle}>{selected.type || 'Assignment Contract'}</div>
                  <div style={s.docMeta}>
                    {selected.dealAddress || ''} &middot; {fmtDate(selected.createdAt)}
                  </div>
                </div>
                {selected.documentContent ? (
                  selected.documentContent
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '2rem 0' }}>
                    Contract document content will appear here once generated.
                  </div>
                )}
              </div>

              {/* Signature areas */}
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Signatures
              </h3>

              {(selected.parties || []).map((party, i) => {
                const sig = (selected.signatures || []).find(
                  (sig) => sig.role === party.role || sig.userId === party.userId
                );
                const isSigned = sig?.signed;

                return (
                  <div key={i} style={s.sigArea}>
                    <div style={s.sigHeader}>
                      <div>
                        <div style={s.sigLabel}>{party.role || `Party ${i + 1}`}</div>
                        <div style={s.sigName}>{sig?.name || party.name || '-'}</div>
                      </div>
                      {isSigned ? (
                        <div style={s.sigSigned}>
                          <span style={{ fontSize: '1rem' }}>{'\u2713'}</span>
                          Signed
                        </div>
                      ) : (
                        <div style={s.sigUnsigned}>Awaiting signature</div>
                      )}
                    </div>
                    {isSigned && (
                      <div style={s.sigDate}>Signed on {fmtDateTime(sig.signedAt)}</div>
                    )}
                    {!isSigned && (
                      <div
                        style={{
                          borderTop: '1px dashed var(--border-color)',
                          marginTop: '0.5rem',
                          paddingTop: '0.5rem',
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '0.78rem',
                          fontStyle: 'italic',
                        }}
                      >
                        Signature line
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Sign button or signed notice */}
              <div style={{ marginTop: '1rem' }}>
                {hasUserSigned(selected) ? (
                  <div style={s.signedNotice}>
                    <span style={{ fontSize: '1rem' }}>{'\u2713'}</span>
                    You have signed this contract
                  </div>
                ) : (
                  selected.status !== 'fully_signed' &&
                  selected.status !== 'cancelled' &&
                  selected.status !== 'expired' && (
                    <button
                      style={s.signBtn}
                      onClick={handleSign}
                      disabled={signing}
                      onMouseOver={(e) => !signing && (e.currentTarget.style.opacity = '0.9')}
                      onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      {signing ? 'Signing...' : (
                        <>
                          <span style={{ fontSize: '1rem' }}>{'\u270D'}</span>
                          Sign Contract
                        </>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
