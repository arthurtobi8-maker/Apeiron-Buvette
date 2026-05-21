import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AUTH } from '../services/auth';
import { PRODUCTS } from '../services/products';
import { ORDERS } from '../services/orders';
import { DRINKS } from '../services/drinks-gallery';
import { PDF } from '../services/pdf';
import { getThemeConfig } from '../services/themes';

export default function ClientMenu() {
  const [searchParams] = useSearchParams();
  const [bid, setBid] = useState(searchParams.get('buvette'));
  const [buvette, setBuvette] = useState(null);
  
  const [products, setProducts] = useState([]);
  const [specials, setSpecials] = useState([]);
  const [cart, setCart] = useState({});
  const [toasts, setToasts] = useState([]);

  // Navigation & UI Modes
  const [viewMode, setViewMode] = useState('loading'); // loading | error | menu | status
  const [errorMsg, setErrorMsg] = useState({ title: '', desc: '' });
  const [currentGroup, setCurrentGroup] = useState('drinks');
  const [currentSubGroup, setCurrentSubGroup] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);
  const [showMomoModal, setShowMomoModal] = useState(false);
  const [momoLoadingStep, setMomoLoadingStep] = useState('input');

  // Order / Cart metadata
  const [clientName, setClientName] = useState('');
  const [clientTable, setClientTable] = useState('');
  const [orderError, setOrderError] = useState('');
  const [sendingOrder, setSendingOrder] = useState(false);
  const [payMode, setPayMode] = useState('cash');
  const [momoOperator, setMomoOperator] = useState('MTN');
  const [momoPhone, setMomoPhone] = useState('');

  // Special Request State
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [specialText, setSpecialText] = useState('');
  const [specialTargetGroup, setSpecialTargetGroup] = useState('drinks');

  // Tracking State
  const [activeOrder, setActiveOrder] = useState(null);

  // Review & Rating State
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasDismissedReview, setHasDismissedReview] = useState(false);

  // Toasts

  const showToast = (msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  useEffect(() => {
    const loadBuvette = async () => {
      try {
          await AUTH.syncFromFirebase(); // Sync from Firebase

        let currentBid = bid;
        if (!currentBid) {
          const logged = AUTH.getCurrentBuvette();
          if (logged) {
            currentBid = logged.id;
            setBid(currentBid);
          }
        }

        if (!currentBid) {
          setErrorMsg({
            title: 'Buvette introuvable',
            desc: "Le lien est incorrect ou la buvette n'existe plus."
          });
          setViewMode('error');
          return;
        }

        const b = await AUTH.getBuvetteById(currentBid);
        if (!b) {
          setErrorMsg({
            title: 'Buvette introuvable',
            desc: "Le lien est incorrect ou la buvette n'existe plus."
          });
          setViewMode('error');
          return;
        }

        // Trial Check (14 days)
        const created = new Date(b.createdAt || Date.now());
        const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 14 && !b.isPremium) {
          setErrorMsg({
            title: 'Menu temporairement indisponible',
            desc: "L'accès à ce menu a expiré. Veuillez contacter l'établissement pour plus d'informations."
          });
          setViewMode('error');
          return;
        }

        setBuvette(b);
        const config = getThemeConfig(b.themePreset, b.themeColor);
        document.documentElement.style.setProperty('--theme', config.themeColor || '#f0a500');

        // Load Products & Orders
        await PRODUCTS.syncFromFirebase(currentBid);
        await ORDERS.syncFromFirebase(currentBid);

        // Fetch products
        setProducts(PRODUCTS.available(currentBid));

        // Restore pending order if any
        const savedOrderId = sessionStorage.getItem(`apeiron_order_${currentBid}`);
        if (savedOrderId) {
          const order = ORDERS.getById(currentBid, savedOrderId);
          if (order && order.status !== 'expired') {
            setActiveOrder(order);
            setViewMode('status');
          } else {
            sessionStorage.removeItem(`apeiron_order_${currentBid}`);
            setViewMode('menu');
          }
        } else {
          setViewMode('menu');
        }

        // Setup listeners
        PRODUCTS.listen(currentBid, (all) => {
          setProducts(all.filter(p => p.available));
        });

      } catch (err) {
        console.error("Init error:", err);
        showToast("Erreur de synchronisation. Veuillez rafraîchir.", "error");
      }
    };

    loadBuvette();
  }, [bid]);

  // Order status real-time listener with vibration/sound effects
  useEffect(() => {
    if (!activeOrder || !bid) return;
    
    const unsubscribe = ORDERS.listen(bid, (allOrders) => {
      const fresh = allOrders.find(o => o.id === activeOrder.id);
      if (fresh) {
        if (fresh.status !== activeOrder.status) {
          // Play sound
          if (fresh.status === 'preparing') {
            const snd = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            snd.volume = 0.8;
            snd.play().catch(() => {});
          } else if (fresh.status === 'paid') {
            const snd = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            snd.volume = 0.8;
            snd.play().catch(() => {});
          }
          // Vibrate
          if (navigator.vibrate) {
            navigator.vibrate([250, 100, 250]);
          }
        }
        setActiveOrder(fresh);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [activeOrder?.id, activeOrder?.status, bid]);

  // Calculations
  const allProds = [...products, ...specials];
  const currency = buvette?.currency || 'FCFA';

  const cartTotal = () => {
    return Object.entries(cart).reduce((sum, [pid, qty]) => {
      const p = allProds.find((x) => x.id === pid);
      return sum + (p ? p.price * qty : 0);
    }, 0);
  };

  const cartCount = () => {
    return Object.values(cart).reduce((sum, v) => sum + v, 0);
  };

  const addToCart = (pid) => {
    const p = allProds.find((x) => x.id === pid);
    if (p && p.stock !== '' && p.stock !== null && p.stock !== undefined && (cart[pid] || 0) >= p.stock) {
      showToast(`Désolé, il ne reste que ${p.stock} unité(s) au frais !`, 'warning');
      return;
    }
    setCart((prev) => ({ ...prev, [pid]: (prev[pid] || 0) + 1 }));
    showToast('Ajouté au panier !', 'success');
  };

  const changeQty = (pid, delta) => {
    const p = allProds.find((x) => x.id === pid);
    if (delta > 0 && p && p.stock !== '' && p.stock !== null && p.stock !== undefined && (cart[pid] || 0) >= p.stock) {
      showToast(`Désolé, stock limite atteint (${p.stock})`, 'warning');
      return;
    }

    setCart((prev) => {
      const next = { ...prev };
      next[pid] = Math.max(0, (next[pid] || 0) + delta);
      if (next[pid] === 0) delete next[pid];
      return next;
    });
  };

  const handleAddSpecial = () => {
    if (!specialText.trim()) {
      showToast('Précisez votre souhait', 'warning');
      return;
    }

    const sid = `sp_${Date.now()}`;
    const specialItem = {
      id: sid,
      name: (specialTargetGroup === 'drinks' ? '🍹 ' : '🍴 ') + specialText.trim(),
      price: 0,
      category: specialTargetGroup === 'drinks' ? 'alcohol' : 'food',
      type: specialTargetGroup === 'drinks' ? 'drink' : 'food',
      isSpecial: true,
    };

    setSpecials((prev) => [...prev, specialItem]);
    setCart((prev) => ({ ...prev, [sid]: 1 }));
    setSpecialText('');
    setShowSpecialModal(false);
    showToast('Ajouté au panier ! ✨', 'success');
  };

  const handleSendOrder = async () => {
    if (!clientName.trim()) {
      setOrderError('Votre prénom est requis.');
      return;
    }
    if (orderMode === 'Sur Place' && !clientTable.trim()) {
      setOrderError('Le numéro de table est requis pour du Sur Place.');
      return;
    }

    if (payMode === 'online') {
      if (!momoPhone.trim()) {
        setOrderError('Le numéro de téléphone Mobile Money est requis.');
        return;
      }
      setShowMomoModal(true);
      setMomoLoadingStep('input');
      return;
    }

    setSendingOrder(true);
    setOrderError('');

    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([pid, qty]) => {
        const p = allProds.find((x) => x.id === pid);
        return { productId: pid, name: p.name, qty, price: p.price };
      });

    try {
      const order = await ORDERS.create(bid, {
        clientName: clientName.trim(),
        tableInfo: orderMode === 'Sur Place' ? `Sur Place (Table: ${clientTable.trim()})` : 'À emporter',
        items,
      });

      sessionStorage.setItem(`apeiron_order_${bid}`, order.id);
      setActiveOrder(order);
      setCart({});
      setShowCartModal(false);
      setViewMode('status');
    } catch (err) {
      setOrderError(err.message || "Erreur lors de l'envoi de la commande.");
    } finally {
      setSendingOrder(false);
    }
  };

  const handleCompleteMomoPayment = async () => {
    setMomoLoadingStep('spinner');
    
    // Simulate push notification delay
    setTimeout(async () => {
      const items = Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([pid, qty]) => {
          const p = allProds.find((x) => x.id === pid);
          return { productId: pid, name: p.name, qty, price: p.price };
        });

      try {
        const order = await ORDERS.create(bid, {
          clientName: clientName.trim(),
          tableInfo: orderMode === 'Sur Place' ? `Sur Place (Table: ${clientTable.trim()})` : 'À emporter',
          items,
          paymentMethod: 'online',
          isPaidOnline: true,
          operator: momoOperator.toUpperCase(),
          momoPhone: momoPhone.trim()
        });

        sessionStorage.setItem(`apeiron_order_${bid}`, order.id);
        setActiveOrder(order);
        setCart({});
        setShowCartModal(false);
        setShowMomoModal(false);
        setViewMode('status');
        showToast('Paiement Mobile reçu avec succès ! 📱', 'success');
      } catch (err) {
        setOrderError(err.message || "Erreur de paiement.");
        setShowMomoModal(false);
      }
    }, 3000);
  };

  const handleDownloadTicket = () => {
    if (!activeOrder || !buvette) return;
    PDF.generate(buvette, activeOrder);
  };

  const handleSubmitReview = async () => {
    if (!activeOrder || !bid) return;
    setSubmittingReview(true);
    try {
      await ORDERS.addReview(bid, activeOrder.id, rating, reviewText);
          showToast("Merci pour votre avis ! ⭐", "success"); // Thank you for your review
    } catch (err) {
      showToast("Impossible d'envoyer l'avis.", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const backToMenu = () => {
    sessionStorage.removeItem(`apeiron_order_${bid}`);
    setActiveOrder(null);
    setViewMode('menu');
  };

  // Filters for products
  const drinkIds = ['alcohol', 'soft', 'hot'];
  const foodIds = ['food', 'dessert', 'other'];

  const filteredProds = allProds.filter((p) => {
    const isInCategory = currentGroup === 'drinks' ? drinkIds.includes(p.category) : foodIds.includes(p.category);
    const matchesSub = currentSubGroup === 'all' || p.category === currentSubGroup;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return isInCategory && matchesSub && matchesSearch;
  });

  if (viewMode === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', background: '#030305' }}>
        <div className="loader-spin"></div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Chargement d'Apeiron Buvette...</div>
      </div>
    );
  }

  if (viewMode === 'error') {
    return (
      <div className="gradient-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
        <div style={{ textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '3rem 2rem', maxWidth: '440px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍺</div>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '.5rem' }}>{errorMsg.title}</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem', lineHeight: '1.6' }}>{errorMsg.desc}</p>
        </div>
      </div>
    );
  }

  const groups = {
    drinks: { label: 'Boissons', emoji: '🍹' },
    food: { label: 'Nourriture', emoji: '🍔' }
  };

  const subGroups = {
    drinks: [
      { id: 'all', label: 'Tout' },
      { id: 'alcohol', label: 'Bières/Alcool' },
      { id: 'soft', label: 'Softs/Jus' },
      { id: 'hot', label: 'Chauds' }
    ],
    food: [
      { id: 'all', label: 'Tout' },
      { id: 'food', label: 'Plats' },
      { id: 'dessert', label: 'Desserts' },
      { id: 'other', label: 'Autres' }
    ]
  };

  const showCartBar = cartCount() > 0;
  const themeConfig = getThemeConfig(buvette?.themePreset, buvette?.themeColor);

  return (
    <div className="gradient-bg" style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Dynamic Animated Mesh Gradients styling */}
      <style>{`
        /* --- Global Scrollbar & Interaction fixes --- */
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
        }

        button, .btn, .nav-item, .cat-tab, .mn-card, .bi-tab, .sub-tab {
          cursor: pointer;
          user-select: none;
          transition: transform 0.1s var(--ease), opacity 0.2s var(--ease);
          position: relative;
        }

        button:active, .btn:active, .mn-card:active, .bi-tab:active, .sub-tab:active {
          transform: scale(0.96);
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
          transform: none !important;
        }

        /* Navigation horizontal scrolling */
        .bi-tabs, .sub-tabs {
          display: flex;
          overflow-x: auto;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 5px;
        }

        .mesh-bg {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
          background: ${themeConfig.bg};
          transition: background 0.8s ease;
        }
        .mesh-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.55;
          mix-blend-mode: screen;
          animation: float-blob 20s infinite alternate ease-in-out;
        }
        .blob1 {
          top: -10%; left: -10%;
          width: 50vw; height: 50vw;
          background: ${themeConfig.color1};
          animation-duration: 25s;
        }
        .blob2 {
          bottom: -10%; right: -10%;
          width: 60vw; height: 60vw;
          background: ${themeConfig.color2};
          animation-duration: 30s;
          animation-delay: -5s;
        }
        .blob3 {
          top: 40%; left: 30%;
          width: 40vw; height: 40vw;
          background: ${themeConfig.color3};
          animation-duration: 20s;
          animation-delay: -10s;
        }
        @keyframes float-blob {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(10vw, 5vh) scale(1.1); }
          100% { transform: translate(-5vw, -10vh) scale(0.95); }
        }
        
        /* Interactive Star Buttons styling */
        .star-btn {
          background: none;
          border: none;
          font-size: 2.5rem;
          cursor: pointer;
          transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          color: var(--border);
        }
        .star-btn.active {
          color: #f0a500;
          text-shadow: 0 0 10px rgba(240, 165, 0, 0.4);
        }
      `}</style>
      <div className="mesh-bg">
        <div className="mesh-blob blob1"></div>
        <div className="mesh-blob blob2"></div>
        <div className="mesh-blob blob3"></div>
      </div>

      {viewMode === 'menu' && (
        <div style={{ paddingBottom: '12rem' }}>
          {/* Header */}
          <div className="mn-header">
            <div className="mn-logo-container">
              <div className="mn-logo-glow"></div>
              <div className="mn-logo-wrap" style={{ background: buvette.logo ? 'transparent' : `linear-gradient(135deg,${buvette.themeColor || '#f0a500'},#e85d04)` }}>
                {buvette.logo ? (
                  <img src={buvette.logo} alt={buvette.name} />
                ) : (
                  <span className="mn-logo-ph" style={{ fontSize: '2.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    {(buvette.name || 'B')[0].toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <h1 className="mn-name">{buvette.name}</h1>
            {buvette.slogan && <div className="mn-slogan">{buvette.slogan}</div>}
            <div className="mn-info" style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
              {buvette.city && <span className="mn-badge">📍 {buvette.city}</span>}
              {buvette.openTime && buvette.closeTime && (
                <span className="mn-badge">🕐 {buvette.openTime} – {buvette.closeTime}</span>
              )}
              {buvette.phone && <span className="mn-badge">📞 {buvette.phone}</span>}
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <div className="bi-tabs">
            {Object.entries(groups).map(([gid, g]) => (
              <div
                key={gid}
                className={`bi-tab ${gid === currentGroup ? 'active' : ''}`}
                onClick={() => {
                  setCurrentGroup(gid);
                  setCurrentSubGroup('all');
                }}
              >
                <span className="tab-icon">{g.emoji}</span>
                <span className="tab-label">{g.label}</span>
              </div>
            ))}
          </div>

          {/* Sub Tabs */}
          <div className="sub-tabs">
            {subGroups[currentGroup].map((s) => (
              <div
                key={s.id}
                className={`sub-tab ${s.id === currentSubGroup ? 'active' : ''}`}
                onClick={() => setCurrentSubGroup(s.id)}
              >
                {s.label}
              </div>
            ))}
          </div>

          {/* Products List */}
          <div style={{ padding: '2rem 1.5rem' }}>
            <div className="client-grid">
              {filteredProds.length > 0 ? (
                filteredProds.map((p, i) => {
                  const outOfStock = p.stock === 0;
                  const isAvail = p.available && !outOfStock;
                  const inCartQty = cart[p.id] || 0;

                  return (
                    <div
                      key={p.id}
                      className={`mn-card ${isAvail ? '' : 'unavail'} ${inCartQty > 0 ? 'in-cart' : ''}`}
                      onClick={() => isAvail && addToCart(p.id)}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className={`mn-qty ${inCartQty > 0 ? 'show' : ''}`}>{inCartQty}</div>
                      {p.type === 'drink' && p.brandId ? (
                        <div className="mn-cap">
                          <div dangerouslySetInnerHTML={{ __html: DRINKS.svg(DRINKS.byId(p.brandId) || { id: '', lines: ['?'], p: '#555', s: '#333', rim: '#888', t: '#fff' }, 62) }} />
                        </div>
                      ) : p.imageData ? (
                        <img className="mn-photo" src={p.imageData} alt={p.name} />
                      ) : (
                        <div style={{ width: '62px', height: '62px', borderRadius: 'var(--r-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '1.5rem' }}>
                          {p.category === 'food' ? '🍔' : p.category === 'dessert' ? '🍰' : '📦'}
                        </div>
                      )}
                      <div className="mn-pname">{p.name}</div>
                      <div className="mn-pprice">{p.price.toLocaleString('fr-FR')} {currency}</div>
                      {p.description && <div className="mn-pdesc">{p.description}</div>}
                      {outOfStock && <div className="mn-pdesc" style={{ color: 'var(--error)', fontWeight: 'bold', marginTop: '.3rem' }}>❌ Épuisé</div>}
                    </div>
                  );
                })
              ) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                  Aucun article trouvé
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className={`mn-search-wrap ${showCartBar ? 'cart-up' : ''}`}>
            <input
              type="text"
              className="mn-search"
              placeholder="🔍 Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* FAB Special Request */}
          <button className={`fab-special ${showCartBar ? 'cart-up' : ''}`} onClick={() => setShowSpecialModal(true)}>
            Demande Spéciale
          </button>

          {/* Cart bar */}
          <div className={`cart-bar ${showCartBar ? 'vis' : ''}`}>
            <div className="cart-info">
              <div className="cart-bubble">{cartCount()}</div>
              <div>
                <div className="cart-lbl" style={{ fontWeight: 800 }}>Mon panier</div>
                <div className="cart-items-lbl" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {cartCount()} {cartCount() > 1 ? 'articles' : 'article'}
                </div>
              </div>
            </div>
            <div className="cart-total" style={{ fontFamily: 'var(--font-d)', fontWeight: 900 }}>
              {cartTotal().toLocaleString('fr-FR')} {currency}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCartModal(true)}>
              Voir →
            </button>
          </div>
          
          {/* Footer branding */}
          <div style={{ textAlign: 'center', marginTop: '3rem', paddingBottom: '2rem', fontSize: '.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Propulsé par <strong style={{ color: 'var(--theme)' }}>Apeiron Studio</strong><br />
            Conçu par <strong style={{ color: '#fff' }}>Arthur Tobi TCHABI</strong>
          </div>
        </div>
      )}

      {/* STATUS TRACKING MODE */}
      {viewMode === 'status' && activeOrder && (
        <div className="status-page" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
          <div className="s-progress">
            <div
              className="s-progress-bar"
              style={{
                width: activeOrder.status === 'pending' ? '33%' : activeOrder.status === 'preparing' ? '66%' : '100%'
              }}
            ></div>
          </div>
          <div className="s-steps" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-3.5rem', position: 'relative', zIndex: 2, marginBottom: '2rem' }}>
            <div className={`s-step ${activeOrder.status === 'pending' ? 'active' : ''}`}>⏳</div>
            <div className={`s-step ${activeOrder.status === 'preparing' ? 'active' : ''}`}>👨‍🍳</div>
            <div className={`s-step ${activeOrder.status === 'paid' ? 'active' : ''}`}>✅</div>
          </div>

          <div className="s-title">
            {activeOrder.status === 'pending'
              ? 'Commande reçue !'
              : activeOrder.status === 'preparing'
                ? 'En cours de service !'
                : 'Commande payée ! 🎉'}
          </div>
          <p className="s-sub" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {activeOrder.status === 'pending'
              ? 'Votre commande est en attente de confirmation.'
              : activeOrder.status === 'preparing'
                ? 'Le serveur exécute votre commande. Elle arrive !'
                : 'Votre paiement a été confirmé. Vous pouvez télécharger votre ticket.'}
            <br />
            <span className="s-order-num" style={{ fontWeight: 800, color: 'var(--theme)' }}>{activeOrder.orderNumber}</span>
          </p>

          <div className="s-items-recap" style={{ background: 'var(--glass)', borderRadius: '1.5rem', padding: '1.5rem', marginTop: '2rem', textAlign: 'left' }}>
            {activeOrder.items.map((it, idx) => (
              <div className="s-item-line" key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                <span>{it.qty}× {it.name}</span>
                <span>{(it.price * it.qty).toLocaleString('fr-FR')} {currency}</span>
              </div>
            ))}
            <div className="s-total" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
              <span>Total</span>
              <span style={{ color: 'var(--theme)' }}>{activeOrder.total.toLocaleString('fr-FR')} {currency}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', alignItems: 'center', marginTop: '1.5rem' }}>
            {activeOrder.status === 'paid' ? (
              <button className="btn dl-btn btn-lg" onClick={handleDownloadTicket}>
                🎫 Télécharger mon ticket PDF
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--text-muted)', fontSize: '.84rem' }}>
                <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                Suivi en temps réel…
              </div>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: '2rem' }} onClick={backToMenu}>
            ← Retour au menu
          </button>
        </div>
      )}

      {/* MODAL: CART */}
      <div className={`modal-overlay ${showCartModal ? 'open' : ''}`}>
        <div className="modal" style={{ maxWidth: '500px' }}>
          <div className="modal-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span className="modal-title" style={{ margin: 0 }}>🛒 Mon Panier</span>
            <button className="modal-close" style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowCartModal(false)}>✕</button>
          </div>
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {Object.entries(cart).map(([pid, qty]) => {
              const p = allProds.find((x) => x.id === pid);
              if (!p) return null;
              return (
                <div className="cart-item-row" key={pid}>
                  {p.type === 'drink' && p.brandId ? (
                    <div style={{ width: '40px', height: '40px' }} dangerouslySetInnerHTML={{ __html: DRINKS.svg(DRINKS.byId(p.brandId) || { id: '', lines: ['?'], p: '#555', s: '#333', rim: '#888', t: '#fff' }, 40) }} />
                  ) : p.imageData ? (
                    <img style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} src={p.imageData} alt={p.name} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                      {p.category === 'food' ? '🍔' : '📦'}
                    </div>
                  )}
                  <div className="cart-item-name">{p.name}</div>
                  <div className="qty-ctrl">
                    <div className="qty-btn" onClick={() => changeQty(pid, -1)}>−</div>
                    <div className="qty-num">{qty}</div>
                    <div className="qty-btn" onClick={() => changeQty(pid, 1)}>+</div>
                  </div>
                  <div className="cart-item-price">{(p.price * qty).toLocaleString('fr-FR')} {currency}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.75rem 0', borderTop: '1px solid var(--border)', marginTop: '.5rem' }}>
            <span style={{ fontWeight: 700 }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--theme)' }}>
              {cartTotal().toLocaleString('fr-FR')} {currency}
            </span>
          </div>
          <div className="divider"></div>
          <div className="form-grid" style={{ gap: '.9rem' }}>
            <div className="form-group">
              <label className="form-label">Mode de consommation <span className="req">*</span></label>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button
                  type="button"
                  className={`btn ${orderMode === 'Sur Place' ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ flex: 1, borderColor: orderMode === 'Sur Place' ? 'var(--border-gold)' : 'var(--border)', background: orderMode === 'Sur Place' ? 'rgba(240,165,0,.08)' : 'transparent' }}
                  onClick={() => setOrderMode('Sur Place')}
                >
                  🍽️ Sur place
                </button>
                <button
                  type="button"
                  className={`btn ${orderMode === 'À emporter' ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ flex: 1, borderColor: orderMode === 'À emporter' ? 'var(--border-gold)' : 'var(--border)', background: orderMode === 'À emporter' ? 'rgba(240,165,0,.08)' : 'transparent' }}
                  onClick={() => setOrderMode('À emporter')}
                >
                  🛍️ À emporter
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Votre prénom / surnom <span className="req">*</span></label>
              <input
                className="form-input"
                type="text"
                placeholder="Ex: Jean"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            {orderMode === 'Sur Place' && (
              <div className="form-group">
                <label className="form-label">Table / Référence <span className="req">*</span></label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ex: Table 5, Terrasse B"
                  value={clientTable}
                  onChange={(e) => setClientTable(e.target.value)}
                />
              </div>
            )}

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Mode de paiement <span className="req">*</span></label>
              <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.5rem' }}>
                <button
                  type="button"
                  className={`btn ${payMode === 'cash' ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ flex: 1, borderColor: payMode === 'cash' ? 'var(--border-gold)' : 'var(--border)', background: payMode === 'cash' ? 'rgba(240,165,0,.08)' : 'transparent', fontSize: '.82rem', padding: '.65rem' }}
                  onClick={() => setPayMode('cash')}
                >
                  💵 Au comptoir / serveur
                </button>
                <button
                  type="button"
                  className={`btn ${payMode === 'online' ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ flex: 1, borderColor: payMode === 'online' ? 'var(--border-gold)' : 'var(--border)', background: payMode === 'online' ? 'rgba(240,165,0,.08)' : 'transparent', fontSize: '.82rem', padding: '.65rem' }}
                  onClick={() => setPayMode('online')}
                >
                  📱 Mobile Money (En ligne)
                </button>
              </div>
            </div>

            {payMode === 'online' && (
              <>
                <div className="form-group">
                  <label className="form-label">Opérateur Mobile <span className="req">*</span></label>
                  <select 
                    className="form-input" 
                    value={momoOperator} 
                    onChange={(e) => setMomoOperator(e.target.value)}
                    style={{ background: '#111', color: '#fff', border: '1px solid var(--border)', height: '42px' }}
                  >
                    <option value="MTN">MTN MoMo</option>
                    <option value="Orange">Orange Money</option>
                    <option value="Moov">Moov Money</option>
                    <option value="Wave">Wave</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Numéro de Téléphone <span className="req">*</span></label>
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="Ex: 0500112233"
                    value={momoPhone}
                    onChange={(e) => setMomoPhone(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          {orderError && <div className="form-error show" style={{ marginTop: '.75rem', fontSize: '.86rem' }}>{orderError}</div>}
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1.25rem' }}
            disabled={sendingOrder}
            onClick={handleSendOrder}
          >
            {sendingOrder ? 'Envoi en cours…' : '🚀 Envoyer la commande'}
          </button>
        </div>
      </div>

      {/* MODAL: SPECIAL REQUEST */}
      <div className={`modal-overlay ${showSpecialModal ? 'open' : ''}`}>
        <div className="modal" style={{ maxWidth: '500px' }}>
          <div className="modal-hdr" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="modal-title" style={{ margin: 0 }}>✨ Demande Spéciale</span>
            <button className="modal-close" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer' }} onClick={() => setShowSpecialModal(false)}>✕</button>
          </div>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: 'var(--r-full)', marginBottom: '2rem' }}>
            <button
              type="button"
              style={{ flex: 1, padding: '1rem', borderRadius: 'var(--r-full)', border: 'none', background: specialTargetGroup === 'drinks' ? 'rgba(255,255,255,0.1)' : 'transparent', color: specialTargetGroup === 'drinks' ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: 800, cursor: 'pointer', transition: '0.3s' }}
              onClick={() => setSpecialTargetGroup('drinks')}
            >
              🍸 Boisson
            </button>
            <button
              type="button"
              style={{ flex: 1, padding: '1rem', borderRadius: 'var(--r-full)', border: 'none', background: specialTargetGroup === 'food' ? 'rgba(255,255,255,0.1)' : 'transparent', color: specialTargetGroup === 'food' ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: 800, cursor: 'pointer', transition: '0.3s' }}
              onClick={() => setSpecialTargetGroup('food')}
            >
              🍴 Nourriture
            </button>
          </div>

          <div className="form-group">
            <textarea
              className="form-input"
              style={{ height: '160px', resize: 'none', background: 'rgba(0,0,0,0.3)', borderRadius: '2rem', padding: '1.5rem', color: '#fff', fontSize: '1.1rem', lineHeight: '1.6' }}
              placeholder="Que pouvons-nous préparer pour vous ?"
              value={specialText}
              onChange={(e) => setSpecialText(e.target.value)}
            ></textarea>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', marginTop: '1.25rem', textAlign: 'center', fontWeight: 500 }}>
              💡 Précisez vos ingrédients ou préférences. <br />Le prix sera ajusté par le barman.
            </p>
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '2rem', padding: '1.25rem', borderRadius: 'var(--r-full)', background: '#fff', color: '#000', border: 'none', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 15px 30px rgba(255,255,255,0.1)' }}
            onClick={handleAddSpecial}
          >
            🚀 Ajouter au Panier
          </button>
        </div>
      </div>

      {/* MODAL: MOBILE MONEY PAYMENT SIMULATION */}
      <div className={`modal-overlay ${showMomoModal ? 'open' : ''}`}>
        <div className="modal" style={{ maxWidth: '420px', textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0 0 .5rem 0' }}>
            Paiement {momoOperator}
          </h2>
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', margin: '0 0 1.5rem 0' }}>
            Montant à payer : <strong style={{ color: 'var(--theme)' }}>{cartTotal().toLocaleString('fr-FR')} {currency}</strong>
          </p>

          {momoLoadingStep === 'input' ? (
            <div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--r-md)', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.25rem' }}>Opérateur</div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>{momoOperator} Money</div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.75rem', marginBottom: '.25rem' }}>Numéro de débit</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>{momoPhone}</div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem' }}
                onClick={handleCompleteMomoPayment}
              >
                📲 Lancer le paiement
              </button>
              
              <button
                className="btn btn-ghost"
                style={{ width: '100%', marginTop: '.5rem', padding: '.75rem', color: 'var(--text-muted)', border: 'none', background: 'transparent', cursor: 'pointer' }}
                onClick={() => setShowMomoModal(false)}
              >
                Annuler
              </button>
            </div>
          ) : (
            <div style={{ padding: '1rem 0' }}>
              <div className="loader-spin" style={{ margin: '0 auto 1.5rem auto', width: '40px', height: '40px' }}></div>
              <p style={{ fontWeight: 600, color: '#fff', fontSize: '.95rem', margin: '0 0 .5rem 0' }}>
                Demande de paiement envoyée...
              </p>
              <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
                Veuillez valider le transfert en tapant votre code PIN sur la notification USSD qui vient d'apparaître sur votre téléphone.
              </p>
              <div style={{ border: '1px dashed rgba(240,165,0,.3)', background: 'rgba(240,165,0,.04)', padding: '.75rem', borderRadius: '8px', fontSize: '.75rem', color: 'var(--theme)' }}>
                ℹ️ Simulation : Le paiement sera validé automatiquement dans quelques secondes.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: AVIS & SATISFACTION */}
      {activeOrder && activeOrder.status === 'paid' && !activeOrder.rating && !hasDismissedReview && (
        <div className="modal-overlay open" style={{ zIndex: 2000 }}>
          <div className="modal" style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ margin: '0 0 .5rem', fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>Votre commande est servie !</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.88rem', marginBottom: '1.5rem' }}>
              Comment s'est passé votre service chez <strong>{buvette?.name}</strong> ?
            </p>
            
            {/* Stars Selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '.5rem', marginBottom: '1.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= rating ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Comment Input */}
            <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Votre avis (optionnel)</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Un mot sur la rapidité, l'ambiance ou la boisson..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                style={{ resize: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setHasDismissedReview(true)}
                disabled={submittingReview}
              >
                Plus tard
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 2 }}
                onClick={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? 'Envoi...' : 'Envoyer ⭐'}
              </button>
            </div>
          </div>
        </div>
      )}

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
