import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH } from '../services/auth';
import { ORDERS } from '../services/orders';

export default function ServeurSpace() {
  const navigate = useNavigate();
  const [buvette, setBuvette] = useState(null);
  const [orders, setOrders] = useState([]);
  const [toasts, setToasts] = useState([]);
  const lastPendingCount = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    // Auth guard
    AUTH.checkAuth().then((session) => {
      if (!session) {
        navigate('/login');
        return;
      }
      setBuvette(session);
      document.documentElement.style.setProperty('--theme', session.themeColor || '#f0a500');

      // Initialize orders list
      ORDERS.syncFromFirebase(session.id).then(() => {
        setOrders(ORDERS.getAll(session.id));
      });

      // Realtime listener
      const unsubscribe = ORDERS.listen(session.id, (all) => {
        setOrders(all);

        const pending = all.filter(o => o.status === 'pending' && !o.archived);
        if (pending.length > lastPendingCount.current) {
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio playback failed:', e));
          }
          showToast('Nouvelle commande ! 🔔', 'success');
        }
        lastPendingCount.current = pending.length;
      });

      return () => {
        // Unsubscribe listener if needed
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    });
  }, [navigate]);

  function showToast(msg, type = 'info') {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }

  const handleLogout = async () => {
    await AUTH.logout();
    navigate('/login');
  };

  const handleUpdateStatus = async (oid, status) => {
    if (!buvette) return;
    const waiterName = buvette.waiterName || (buvette.role === 'admin' ? 'Admin' : 'Serveur');
    await ORDERS.updateStatus(buvette.id, oid, status, waiterName);
    showToast('Statut mis à jour !', 'success');
  };

  const handleCloseDay = async () => {
    if (!buvette) return;
    const allPaid = orders.filter(o => o.status === 'paid' && !o.archived);
    if (allPaid.length === 0) {
      showToast('Aucune commande payée à archiver.', 'warning');
      return;
    }

    const total = allPaid.reduce((s, o) => s + o.total, 0);
    const cur = buvette.currency || 'FCFA';
    const confirmed = window.confirm(`Clôturer la journée ?\n\nTotal : ${total.toLocaleString('fr-FR')} ${cur}\nCommandes : ${allPaid.length}`);

    if (confirmed) {
      await ORDERS.archivePaid(buvette.id);
      setOrders(ORDERS.getAll(buvette.id));
      showToast('Journée clôturée !', 'success');
    }
  };

  // Safe interaction to unlock audio
  useEffect(() => {
    const unlock = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }).catch(e => console.log('Audio unlock failed:', e));
      }
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('click', unlock);
    return () => document.removeEventListener('click', unlock);
  }, []);

  if (!buvette) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
        <div className="loader-spin"></div>
        <div style={{ color: 'var(--text-secondary)' }}>Chargement de l'espace serveur...</div>
      </div>
    );
  }

  const cur = buvette.currency || 'FCFA';
  const activeOrders = orders.filter(o => o.status !== 'paid' && !o.archived);
  const paidOrders = orders.filter(o => o.status === 'paid' && !o.archived).slice(0, 30);

  return (
    <div style={{ background: '#030305', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        /* --- Global Scrollbar & Interaction fixes --- */
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
        }

        button, .btn, .order-card {
          cursor: pointer;
          transition: transform 0.1s var(--ease);
        }

        button:active, .btn:active {
          transform: scale(0.97);
        }

        .sv-container { display: flex; flex-direction: column; min-height: 100vh; }
        .sv-header { 
          padding: 1.5rem 2rem; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex; justify-content: space-between; align-items: center; backdrop-filter: blur(20px);
        }
        .sv-name { font-family: var(--font-d); font-weight: 900; font-size: 1.25rem; color: var(--theme, #f0a500); }
        .sv-logout { color: var(--text-muted); cursor: pointer; font-size: .85rem; font-weight: 700; }

        .sv-body { flex: 1; padding: 2rem; overflow-y: auto; }
        .orders-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        @media (max-width: 900px) { .orders-cols { grid-template-columns: 1fr; } }

        .orders-col-title { 
          font-family: var(--font-d); font-weight: 800; font-size: 1rem; margin-bottom: 1.5rem;
          display: flex; align-items: center; gap: .75rem; color: var(--text-secondary);
        }

        .order-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: var(--r-lg); padding: 1.5rem; margin-bottom: 1.25rem;
          transition: all 0.3s; position: relative; overflow: hidden;
        }
        .order-hdr { display: flex; justify-content: space-between; margin-bottom: 1rem; }
        .order-num { font-family: var(--font-d); font-weight: 900; font-size: 1.1rem; }
        .order-client { font-size: .85rem; color: var(--text-muted); font-weight: 600; }
        .order-items { margin-bottom: 1.25rem; }
        .order-it { display: flex; justify-content: space-between; font-size: .9rem; margin-bottom: .4rem; }
        .order-it-qty { color: var(--theme, #f0a500); font-weight: 800; margin-right: .5rem; }
        .order-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1rem; }
        .order-total { font-family: var(--font-d); font-weight: 900; font-size: 1.2rem; color: var(--theme, #f0a500); }

        .btn-action { width: 100%; margin-top: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .badge-pending { background: rgba(240,165,0,.15); color: #f0a500; }
        .badge-preparing { background: rgba(0,180,216,.15); color: #00b4d8; }
        .badge-paid { background: rgba(43,203,186,.15); color: #2bcbba; }
        
        .empty-state { text-align: center; padding: 4rem 2rem; color: var(--text-muted); opacity: 0.5; }
        .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
      `}</style>

      <div className="sv-container">
        <div className="sv-header">
          <div className="sv-name">
            {buvette.name} — {buvette.waiterName || (buvette.role === 'admin' ? 'Admin Space' : 'Serveur')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCloseDay}
              style={{ fontSize: '.78rem', background: 'var(--theme)', color: '#000' }}
            >
              💰 Clôturer la journée
            </button>
            <div className="sv-logout" onClick={handleLogout}>
              Déconnexion 🚪
            </div>
          </div>
        </div>

        <div className="sv-body">
          <div className="orders-cols">
            {/* Active Column */}
            <div>
              <div className="orders-col-title">
                ⏳ Commandes à servir <span className="badge badge-pending">{activeOrders.length}</span>
              </div>
              <div>
                {activeOrders.length > 0 ? (
                  activeOrders.map((o) => (
                    <div className="order-card" key={o.id}>
                      <div className="order-hdr">
                        <div>
                          <div className="order-num">{o.orderNumber}</div>
                          <div className="order-client">
                            {o.clientName} {o.tableInfo ? `— ${o.tableInfo}` : ''}
                          </div>
                          {o.isPaidOnline && (
                            <div style={{ marginTop: '.35rem' }}>
                              <span className="badge" style={{ background: 'rgba(240,165,0,.15)', color: 'var(--theme)', fontWeight: '800', fontSize: '.7rem', display: 'inline-block' }}>
                                📱 PAYÉ EN LIGNE ({o.operator})
                              </span>
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>
                            {new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {o.status === 'pending' ? (
                            <span className="badge badge-pending">⏳ En attente</span>
                          ) : (
                            <span className="badge badge-preparing">👨‍🍳 En cours</span>
                          )}
                        </div>
                      </div>
                      <div className="order-items">
                        {o.items.map((it, idx) => (
                          <div className="order-it" key={idx}>
                            <span>
                              <span className="order-it-qty">{it.qty}×</span> {it.name}
                            </span>
                            <span>
                              {Number(it.price * it.qty).toLocaleString('fr-FR')} {cur}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="order-footer">
                        <span>Total</span>
                        <span className="order-total">
                          {Number(o.total).toLocaleString('fr-FR')} {cur}
                        </span>
                      </div>
                      {o.status === 'pending' ? (
                        <button
                          className="btn btn-primary btn-action"
                          onClick={() => handleUpdateStatus(o.id, 'preparing')}
                        >
                          🚀 Servir la commande
                        </button>
                      ) : (
                        <button
                          className="btn btn-success btn-action"
                          onClick={() => handleUpdateStatus(o.id, 'paid')}
                        >
                          {o.isPaidOnline ? '✅ Marquer comme Livrée' : '✅ Marquer comme payée'}
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">😴</div>
                    <div className="empty-title">Aucune commande active</div>
                  </div>
                )}
              </div>
            </div>

            {/* Paid Column */}
            <div>
              <div className="orders-col-title">
                ✅ Payées <span className="badge badge-paid">{paidOrders.length}</span>
              </div>
              <div>
                {paidOrders.length > 0 ? (
                  paidOrders.map((o) => (
                    <div className="order-card" key={o.id}>
                      <div className="order-hdr">
                        <div>
                          <div className="order-num">{o.orderNumber}</div>
                          <div className="order-client">
                            {o.clientName} {o.tableInfo ? `— ${o.tableInfo}` : ''}
                          </div>
                          {o.isPaidOnline && (
                            <div style={{ marginTop: '.35rem' }}>
                              <span className="badge" style={{ background: 'rgba(240,165,0,.15)', color: 'var(--theme)', fontWeight: '800', fontSize: '.7rem', display: 'inline-block' }}>
                                📱 PAYÉ EN LIGNE ({o.operator})
                              </span>
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>
                            {new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <span className="badge badge-paid">✅ Payée</span>
                        </div>
                      </div>
                      <div className="order-items">
                        {o.items.map((it, idx) => (
                          <div className="order-it" key={idx}>
                            <span>
                              <span className="order-it-qty">{it.qty}×</span> {it.name}
                            </span>
                            <span>
                              {Number(it.price * it.qty).toLocaleString('fr-FR')} {cur}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="order-footer">
                        <span>Total</span>
                        <span className="order-total">
                          {Number(o.total).toLocaleString('fr-FR')} {cur}
                        </span>
                      </div>
                      {o.processedBy && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'right' }}>
                          Servi par : <strong>{o.processedBy}</strong>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">💤</div>
                    <div className="empty-title">Aucune commande payée</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/din_ding.ogg" />

      {/* Toast Box */}
      <div className="toast-box">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type} show`}>
            <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span className="toast-msg">{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
