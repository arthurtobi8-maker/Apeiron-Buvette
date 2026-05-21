import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH } from '../services/auth';
import { PRODUCTS } from '../services/products';
import { ORDERS } from '../services/orders';
import { DRINKS } from '../services/drinks-gallery';
import { FOODS } from '../services/food-gallery';
import { PDF } from '../services/pdf';
import { THEME_PRESETS, getThemeConfig } from '../services/themes';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [buvette, setBuvette] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Grouped UI State
  const [ui, setUi] = useState({
    activeTab: 'products',
    sidebarOpen: false,
    prodSearch: '',
    currentCat: 'all',
    showWaiterModal: false,
    showProdModal: false,
    showDelModal: false,
    showGalModal: false,
    showFoodGalModal: false,
    loading: true
  });

  // Grouped Forms State
  const [prodForm, setProdForm] = useState({
    id: null,
    type: 'drink',
    name: '',
    category: 'alcohol',
    price: '',
    stock: '',
    description: '',
    available: true,
    brandId: null,
    imageData: null,
    error: ''
  });

  const [settings, setSettings] = useState({
    name: '', slogan: '', city: '', address: '',
    currency: 'FCFA', phone: '', openTime: '08:00',
    closeTime: '23:00', themeColor: '#f0a500', themePreset: 'amber-gold'
  });

  // Sfx
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  // Register State
  const [regStart, setRegStart] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [regEnd, setRegEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [regSearch, setRegSearch] = useState('');

  const [waiterNameInput, setWaiterNameInput] = useState('');
  const [waiterCodeInput, setWaiterCodeInput] = useState('');
  const [editingWaiterIdx, setEditingWaiterIdx] = useState(-1);
  const [deletingId, setDeletingId] = useState(null);
  const [activationCode, setActivationCode] = useState('');
  const [galSearch, setGalSearch] = useState('');
  const [galCat, setGalCat] = useState('all');
  const [foodGalSearch, setFoodGalSearch] = useState('');
  const [foodGalCat, setFoodGalCat] = useState('all');

  const showToast = (msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const updateUi = (key, val) => setUi(prev => ({ ...prev, [key]: val }));
  const updateProdForm = (key, val) => setProdForm(prev => ({ ...prev, [key]: val }));
  const updateSettings = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  useEffect(() => {
    // Auth & setup
    AUTH.checkAuth().then(async (session) => {
      if (!session) {
        navigate('/login');
        return;
      }
      if (session.role !== 'admin') {
        navigate('/serveur');
        return;
      }
      setBuvette(session);
      updateUi('loading', false);
      const config = getThemeConfig(session.themePreset, session.themeColor);
      document.documentElement.style.setProperty('--theme', config.themeColor || '#f0a500');

      await PRODUCTS.syncFromFirebase(session.id);
      await ORDERS.syncFromFirebase(session.id);
      setProducts(PRODUCTS.getAll(session.id));
      setOrders(ORDERS.getAll(session.id));

      setSettings({
        name: session.name || '',
        slogan: session.slogan || '',
        city: session.city || '',
        address: session.address || '',
        currency: session.currency || 'FCFA',
        phone: session.phone || '',
        openTime: session.openTime || '08:00',
        closeTime: session.closeTime || '23:00',
        themeColor: session.themeColor || '#f0a500',
        themePreset: session.themePreset || 'amber-gold'
      });

      // Check Trial (14 days)
      const created = new Date(session.createdAt || Date.now());
      const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 14 && !session.isPremium) {
        alert("Période d'essai expirée ! Contactez l'administrateur.");
        AUTH.logout().then(() => navigate('/login'));
        return;
      }

      // Live Listeners
      const unsubscribeProds = PRODUCTS.listen(session.id, (allProds) => {
        setProducts(allProds);
      });

      let lastPending = 0;
      const unsubscribeOrders = ORDERS.listen(session.id, (allOrders) => {
        setOrders(allOrders);

        const pending = allOrders.filter(o => o.status === 'pending' && !o.archived).length;
        if (pending > lastPending) {
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio playback block:', e));
          }
          showToast('Nouvelle commande ! 🔔', 'success');
        }
        lastPending = pending;
      });

      return () => {
        if (typeof unsubscribeProds === 'function') unsubscribeProds();
        if (typeof unsubscribeOrders === 'function') unsubscribeOrders();
      };
    });
  }, [navigate]);

  // Redraw stats chart when stats tab or orders data changes
  useEffect(() => {
    if (activeTab === 'stats' && canvasRef.current && buvette) {
      drawChart();
    }
  }, [activeTab, orders, buvette]);

  const handleLogout = async () => {
    await AUTH.logout();
    navigate('/login');
  };

  // Helper for prices
  const cur = buvette?.currency || 'FCFA';
  const fmt = (val) => `${Number(val).toLocaleString('fr-FR')} ${cur}`;

  // Tab navigation
  const handleNav = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // Waiter handlers
  const handleOpenWaiterModal = (idx = -1) => {
    setEditingWaiterIdx(idx);
    const waitersList = buvette.waiters || [];
    if (idx === -1) {
      setWaiterNameInput('');
      setWaiterCodeInput('');
    } else {
      setWaiterNameInput(waitersList[idx].name);
      setWaiterCodeInput(waitersList[idx].code);
    }
    setShowWaiterModal(true);
  };

  const handleSaveWaiter = async (e) => {
    e.preventDefault();
    if (!waiterNameInput.trim() || !waiterCodeInput.trim()) {
      showToast('Nom et code requis', 'warning');
      return;
    }
    const updatedWaiters = [...(buvette.waiters || [])];
    if (editingWaiterIdx === -1) {
      updatedWaiters.push({ name: waiterNameInput.trim(), code: waiterCodeInput.trim() });
    } else {
      updatedWaiters[editingWaiterIdx] = { name: waiterNameInput.trim(), code: waiterCodeInput.trim() };
    }

    try {
      const updated = await AUTH.updateBuvette(buvette.id, { waiters: updatedWaiters });
      setBuvette(updated);
      setShowWaiterModal(false);
      showToast('Équipe mise à jour ✅', 'success');
    } catch (err) {
      void err;
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleDeleteWaiter = async (idx) => {
    if (!window.confirm('Supprimer ce serveur ?')) return;
    const updatedWaiters = [...(buvette.waiters || [])];
    updatedWaiters.splice(idx, 1);
    try {
      const updated = await AUTH.updateBuvette(buvette.id, { waiters: updatedWaiters });
      setBuvette(updated);
      showToast('Serveur supprimé', 'info');
    } catch (err) {
      void err;
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  // Product CRUD Handlers
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setSelectedBrandId(null);
    setFoodPhotoData(null);
    setProdType('drink');
    setProdNameInput('');
    setProdCatInput('alcohol');
    setProdPriceInput('');
    setProdStockInput('');
    setProdDescInput('');
    setProdAvailInput(true);
    setProdError('');
    setShowProdModal(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    setSelectedBrandId(p.brandId || null);
    setFoodPhotoData(p.imageData || null);
    setProdType(p.type || 'drink');
    setProdNameInput(p.name);
    setProdCatInput(p.category);
    setProdPriceInput(p.price);
    setProdStockInput(p.stock !== undefined && p.stock !== null ? p.stock : '');
    setProdDescInput(p.description || '');
    setProdAvailInput(p.available);
    setProdError('');
    setShowProdModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!prodNameInput.trim()) {
      setProdError('Le nom est requis.');
      return;
    }
    const price = parseFloat(prodPriceInput);
    if (isNaN(price) || price < 0) {
      setProdError('Prix invalide.');
      return;
    }
    if (prodType === 'drink' && !selectedBrandId) {
      setProdError('Choisissez une icône de capsule.');
      return;
    }

    setProdError('');
    const data = {
      name: prodNameInput.trim(),
      price,
      category: prodCatInput,
      type: prodType,
      stock: prodStockInput !== '' ? Number(prodStockInput) : '',
      description: prodDescInput.trim(),
      available: prodAvailInput,
      brandId: prodType === 'drink' ? selectedBrandId : null,
      imageData: prodType === 'food' ? foodPhotoData : null,
    };

    try {
      if (editingProduct) {
        await PRODUCTS.update(buvette.id, editingProduct.id, data);
      } else {
        await PRODUCTS.add(buvette.id, data);
      }
      setShowProdModal(false);
      showToast(editingProduct ? 'Produit modifié ✅' : 'Produit ajouté ✅', 'success');
    } catch (err) {
      void err;
      setProdError('Erreur lors de l\'opération');
    }
  };

  const handleAskDelete = (pid) => {
    setDeletingId(pid);
    setShowDelModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await PRODUCTS.del(buvette.id, deletingId);
      setDeletingId(null);
      setShowDelModal(false);
      showToast('Produit supprimé', 'warning');
    }
  };

  // Toggle single product availability directly
  const handleToggleAvail = async (p) => {
    await PRODUCTS.toggleAvail(buvette.id, p.id);
    showToast(`Produit ${p.available ? 'désactivé' : 'activé'}`, 'info');
  };

  // Drinks Capsule selection helpers
  const handleChooseBrand = (brand) => {
    setSelectedBrandId(brand.id);
  };

  // Food Photo Upload Helpers
  const handleFoodPhotoUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) {
      showToast('Fichier trop volumineux (max 3 MB)', 'error');
      return;
    }
    const r = new FileReader();
    r.onload = (evt) => {
      setFoodPhotoData(evt.target.result);
    };
    r.readAsDataURL(f);
  };

  // Orders Operations
  const handleUpdateOrderStatus = async (oid, status) => {
    const waiterName = buvette.role === 'admin' ? 'Admin' : 'Serveur';
    await ORDERS.updateStatus(buvette.id, oid, status, waiterName);
    showToast(status === 'paid' ? 'Commande payée ✅' : 'Commande en préparation 👨‍🍳', 'success');
  };

  const handlePromptEditPrice = async (oid, idx, curPrice) => {
    const pStr = window.prompt('Entrez le nouveau prix unitaire :', curPrice);
    if (pStr !== null && !isNaN(pStr) && pStr.trim() !== '') {
      await ORDERS.updateItemPrice(buvette.id, oid, idx, parseFloat(pStr));
      showToast('Prix mis à jour 💸', 'success');
    }
  };

  const handleDownloadTicket = (oid) => {
    const order = ORDERS.getById(buvette.id, oid);
    if (order) {
      PDF.generate(buvette, order);
      showToast('Ticket téléchargé 🎫', 'success');
    }
  };

  const handleCloseDay = async () => {
    const activePaid = orders.filter((o) => o.status === 'paid' && !o.archived);
    if (activePaid.length === 0) {
      showToast('Aucune commande payée à clôturer.', 'warning');
      return;
    }

    const total = activePaid.reduce((s, o) => s + o.total, 0);
    const byWaiter = {};
    activePaid.forEach((o) => {
      const w = o.processedBy || 'Inconnu';
      byWaiter[w] = (byWaiter[w] || 0) + o.total;
    });

    const waiterSummary = Object.entries(byWaiter)
      .map(([w, amt]) => `• ${w} : ${fmt(amt)}`)
      .join('\n');

    const confirmed = window.confirm(
      `Voulez-vous clôturer la journée ?\n\nTotal encaissé : ${fmt(total)}\nNombre de commandes : ${
        activePaid.length
      }\n\nRépartition par équipe :\n${waiterSummary}\n\nCes commandes seront archivées dans le Registre.`
    );

    if (confirmed) {
      await ORDERS.archivePaid(buvette.id);
      showToast('Journée clôturée et archivée ! 📖', 'success');
    }
  };

  const getReviewStats = () => {
    const ratedOrders = orders.filter(o => o.rating);
    const count = ratedOrders.length;
    if (count === 0) return { avg: 0, count: 0, stars: [0, 0, 0, 0, 0] };
    const sum = ratedOrders.reduce((acc, o) => acc + (o.rating || 0), 0);
    const avg = (sum / count).toFixed(1);
    const stars = [0, 0, 0, 0, 0];
    ratedOrders.forEach(o => {
      const idx = Math.min(5, Math.max(1, o.rating)) - 1;
      stars[idx] += 1;
    });
    return { avg, count, stars };
  };

  // Settings operations
  const handleSaveSettings = async () => {
    const updates = {
      name: settingsName.trim() || buvette.name,
      slogan: settingsSlogan.trim(),
      city: settingsCity.trim(),
      address: settingsAddress.trim(),
      currency: settingsCurrency,
      phone: settingsPhone.trim(),
      openTime: settingsOpen,
      closeTime: settingsClose,
      themeColor: settingsTheme,
      themePreset: settingsThemePreset,
    };

    try {
      const updated = await AUTH.updateBuvette(buvette.id, updates);
      setBuvette(updated);
      showToast('Paramètres enregistrés ✅', 'success');
    } catch (err) {
      showToast('Erreur lors de la sauvegarde des paramètres', 'error');
    }
  };

  const handleUploadLogoSettings = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      showToast('Max 2 MB', 'error');
      return;
    }
    const r = new FileReader();
    r.onload = async (evt) => {
      const updated = await AUTH.updateBuvette(buvette.id, { logo: evt.target.result });
      setBuvette(updated);
      showToast('Logo mis à jour ✅', 'success');
    };
    r.readAsDataURL(f);
  };

  const verifyLicenseKey = (buvetteId, enteredCode) => {
    const cleanCode = enteredCode.trim().toUpperCase();
    const secretSalt = "ApeironBuvetteSecret2026";
    
    for (const plan of ['Pro', 'Ultimate']) {
      const input = `${buvetteId}-${plan}-${secretSalt}`;
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const positiveHash = Math.abs(hash);
      const base36 = positiveHash.toString(36).toUpperCase().padStart(8, '0');
      const expectedKey = `${plan.toUpperCase()}-${base36.slice(0, 4)}-${base36.slice(4, 8)}`;
      
      if (cleanCode === expectedKey) {
        return plan;
      }
    }
    
    if (cleanCode === 'APEIRON-VIP-999') {
      return 'Ultimate';
    }
    
    return null;
  };

  const handleActivatePremium = async () => {
    if (!activationCode.trim()) {
      showToast("Veuillez entrer un code d'activation", 'warning');
      return;
    }
    
    const matchedPlan = verifyLicenseKey(buvette.id, activationCode);

    if (matchedPlan) {
      try {
        const updated = await AUTH.updateBuvette(buvette.id, {
          isPremium: true,
          plan: matchedPlan,
          activationCodeUsed: activationCode.trim().toUpperCase(),
          activatedAt: new Date().toISOString()
        });
        setBuvette(updated);
        setActivationCode('');
        showToast(`Félicitations ! Abonnement ${matchedPlan} activé ! 🎉`, 'success');
      } catch (err) {
        void err;
        showToast("Erreur lors de l'activation de l'abonnement", 'error');
      }
    } else {
      showToast("Code d'activation invalide", 'error');
    }
  };

  // Chart Rendering
  function drawChart() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth;
    const H = 160;
    canvas.width = W;
    canvas.height = H;
    const pad = { t: 20, r: 20, b: 40, l: 60 };

    const data = ORDERS.revenue7days(buvette.id, 7);
    const maxVal = Math.max(...data.map((d) => d.val), 1);
    const barW = (W - pad.l - pad.r) / data.length;

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      const y = pad.t + (H - pad.t - pad.b) * (1 - f);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '10px Inter';
      ctx.textAlign = 'right';
      ctx.fillText((maxVal * f).toFixed(0), pad.l - 6, y + 4);
    });

    // Bars
    data.forEach((d, i) => {
      const bh = (H - pad.t - pad.b) * (d.val / maxVal);
      const bx = pad.l + i * barW + barW * 0.15;
      const by = H - pad.b - bh;
      const bww = barW * 0.7;

      const grad = ctx.createLinearGradient(0, by, 0, by + bh);
      grad.addColorStop(0, 'rgba(240,165,0,.9)');
      grad.addColorStop(1, 'rgba(232,93,4,.5)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(bx, by, bww, bh, [4, 4, 0, 0]);
      ctx.fill();

      // Day label
      ctx.fillStyle = 'rgba(144,144,168,0.8)';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, pad.l + i * barW + barW / 2, H - pad.b + 14);

      if (d.val > 0) {
        ctx.fillStyle = 'rgba(240,165,0,.9)';
        ctx.font = 'bold 9px Inter';
        ctx.fillText(d.val.toFixed(0), pad.l + i * barW + barW / 2, by - 5);
      }
    });
  };

  // Products filtering
  const filteredProducts = products.filter((p) => {
    const matchesCat = currentCat === 'all' || p.category === currentCat;
    const matchesSearch =
      !prodSearch ||
      p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(prodSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Orders division
  const activeOrders = orders.filter((o) => o.status !== 'paid' && !o.archived);
  const paidOrders = orders.filter((o) => o.status === 'paid' && !o.archived).slice(0, 30);
  const pendingOrdersBadge = activeOrders.filter((o) => o.status === 'pending').length;

  // Stats calculation
  const stats = buvette ? ORDERS.stats(buvette.id) : { revenue: 0, total: 0, paid: 0, pending: 0, topProduct: '—', topCount: 0, top5: [] };

  // Bookkeeping register filtering
  const filteredRegisterOrders = orders.filter((o) => {
    if (o.status !== 'paid') return false;

    // Date Range
    if (regStart && regEnd) {
      const sDate = new Date(regStart); sDate.setHours(0,0,0,0);
      const eDate = new Date(regEnd); eDate.setHours(23,59,59,999);
      const oDate = new Date(o.createdAt);
      if (oDate < sDate || oDate > eDate) return false;
    }

    // Search Query
    if (regSearch) {
      const q = regSearch.toLowerCase();
      const matchName = o.clientName.toLowerCase().includes(q);
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchWaiter = o.processedBy && o.processedBy.toLowerCase().includes(q);
      if (!matchName && !matchNum && !matchWaiter) return false;
    }

    return true;
  });

  const registerTotalAmt = filteredRegisterOrders.reduce((sum, o) => sum + o.total, 0);

  // Link for clients
  const clientMenuUrl = `${window.location.origin}/#/menu?buvette=${buvette?.id}`;

  if (!buvette) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', background: '#030305' }}>
        <div className="loader-spin"></div>
        <div style={{ color: 'var(--text-secondary)' }}>Chargement du dashboard...</div>
      </div>
    );
  }

  return (
    <div className="app-layout" style={{ minHeight: '100vh', background: '#030305' }}>
      <style>{`
        /* --- Global Scrollbar & Interaction fixes --- */
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
        }

        .nav-item, .cat-tab, .prod-card, button, .btn {
          cursor: pointer;
          user-select: none;
          transition: transform 0.1s var(--ease), opacity 0.2s var(--ease);
        }

        .nav-item:active, .cat-tab:active, .prod-card:active, button:active:not(:disabled), .btn:active:not(:disabled) {
          transform: scale(0.97);
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .cat-tabs {
          display: flex;
          overflow-x: auto;
          white-space: nowrap;
          gap: 0.5rem;
        }

        .gf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 0.6rem; max-height: 250px; overflow-y: auto; padding: 0.25rem; }
        .gf-item { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.6rem; border: 1px solid var(--border); border-radius: var(--r-md); background: var(--bg-glass); cursor: pointer; transition: all 0.2s; }
        .gf-item.on { border-color: var(--theme); background: rgba(240,165,0,0.08); }
        .gf-item img, .gf-item svg { width: 44px; height: 44px; object-fit: contain; }
        .gf-name { font-size: 0.7rem; text-align: center; margin-top: 0.4rem; color: var(--text-secondary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; width: 100%; }
        .editable-price:hover { text-decoration: underline; }
      `}</style>

      {/* Mobile Topbar */}
      <div className="mobile-topbar">
        <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, color: 'var(--theme)', fontSize: '1rem' }}>🍺 Apeiron</div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '.5rem .75rem', color: 'var(--text-primary)', fontSize: '1.1rem', cursor: 'pointer' }}
        >
          ☰
        </button>
      </div>

      {/* Sidebar Nav */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-hdr">
          <div className="sidebar-logo">🍺 Apeiron Buvette</div>
          <div className="sidebar-bname">{buvette.name}</div>
        </div>
        <div className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => handleNav('products')}>
            <span className="nav-icon">🍹</span> Produits
          </div>
          <div className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => handleNav('orders')}>
            <span className="nav-icon">📋</span> Commandes
            {pendingOrdersBadge > 0 && <span className="nav-badge show">{pendingOrdersBadge}</span>}
          </div>
          <div className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => handleNav('stats')}>
            <span className="nav-icon">📊</span> Statistiques
          </div>
          <div className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => handleNav('reviews')}>
            <span className="nav-icon">⭐</span> Avis Clients
          </div>
          <div className={`nav-item ${activeTab === 'waiters' ? 'active' : ''}`} onClick={() => handleNav('waiters')}>
            <span className="nav-icon">👨‍🍳</span> Serveurs
          </div>
          <div className={`nav-item ${activeTab === 'register' ? 'active' : ''}`} onClick={() => handleNav('register')}>
            <span className="nav-icon">📖</span> Registre
          </div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleNav('settings')}>
            <span className="nav-icon">⚙️</span> Paramètres
          </div>
          <div className={`nav-item ${activeTab === 'subscription' ? 'active' : ''}`} onClick={() => handleNav('subscription')}>
            <span className="nav-icon">💳</span> Abonnement
          </div>
          <div
            className="nav-item"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '.5rem', paddingTop: '1rem', color: 'var(--theme)' }}
            onClick={() => window.open(`/#/menu?buvette=${buvette.id}`, '_blank')}
          >
            <span className="nav-icon">👁️</span> Voir mon menu
          </div>
        </div>
        <div className="sidebar-ft">
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', gap: '.6rem', color: 'var(--error)', marginBottom: '.75rem' }} onClick={handleLogout}>
            <span>🚪</span> Déconnexion
          </button>
          <div style={{ textAlign: 'center', fontSize: '.68rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '.75rem', lineHeight: '1.4' }}>
            Apeiron Studio Ecosystem<br />
            Founder: <strong>A. T. TCHABI</strong>
          </div>
        </div>
      </nav>

      {sidebarOpen && <div className="sb-overlay show" onClick={() => setSidebarOpen(false)}></div>}

      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="section active">
            <div className="main-hdr">
              <span className="main-title">🍹 Mes Produits</span>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="🔍 Rechercher..."
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  style={{ width: '200px', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>+ Ajouter</button>
              </div>
            </div>
            <div className="main-body">
              <div className="cat-tabs">
                {PRODUCTS.CATS.map((c) => (
                  <div
                    key={c.id}
                    className={`cat-tab ${c.id === currentCat ? 'active' : ''}`}
                    onClick={() => setCurrentCat(c.id)}
                  >
                    {c.emoji} {c.label}
                  </div>
                ))}
              </div>
              <div className="prod-grid">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const icon = p.type === 'drink' && p.brandId ? (
                      <div className="prod-icon" dangerouslySetInnerHTML={{ __html: DRINKS.svg(DRINKS.byId(p.brandId) || { id: '', lines: ['?'], p: '#555', s: '#333', rim: '#888', t: '#fff' }, 70) }} />
                    ) : p.imageData ? (
                      <img className="prod-photo" src={p.imageData} alt={p.name} loading="lazy" />
                    ) : (
                      <div style={{ width: '70px', height: '70px', borderRadius: 'var(--r-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        {p.category === 'food' ? '🍔' : p.category === 'dessert' ? '🍰' : '📦'}
                      </div>
                    );

                    return (
                      <div className={`prod-card ${p.available ? '' : 'off'}`} key={p.id}>
                        {icon}
                        <div className="prod-name">{p.name}</div>
                        <div className="prod-price">{fmt(p.price)}</div>
                        {p.description && <div className="prod-desc">{p.description}</div>}
                        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.5rem', marginTop: '.4rem' }}>
                          <div className="badge badge-cat">
                            {PRODUCTS.CATS.find((c) => c.id === p.category)?.emoji || ''} {PRODUCTS.CATS.find((c) => c.id === p.category)?.label || p.category}
                          </div>
                          {p.stock !== '' && p.stock !== null && p.stock !== undefined && (
                            <div
                              className={`badge ${p.stock === 0 ? 'badge-error' : p.stock <= 5 ? 'badge-warning' : ''}`}
                              style={{
                                background: p.stock === 0 ? 'var(--error-bg)' : p.stock <= 5 ? 'var(--warning-bg)' : 'var(--bg-glass)',
                                color: p.stock === 0 ? 'var(--error)' : p.stock <= 5 ? 'var(--warning)' : 'var(--text-secondary)',
                                border: `1px solid ${p.stock === 0 ? 'var(--error)' : p.stock <= 5 ? 'var(--warning)' : 'var(--border)'}`
                              }}
                            >
                              📦 {p.stock === 0 ? 'Épuisé' : p.stock}
                            </div>
                          )}
                        </div>
                        <div className="prod-actions">
                          <label className="toggle" title={p.available ? 'Désactiver' : 'Activer'}>
                            <input type="checkbox" checked={p.available} onChange={() => handleToggleAvail(p)} />
                            <div className="toggle-sl"></div>
                          </label>
                          <button className="btn btn-ghost btn-icon" onClick={() => handleOpenEditModal(p)} title="Modifier">✏️</button>
                          <button className="btn btn-danger btn-icon" onClick={() => handleAskDelete(p.id)} title="Supprimer">🗑️</button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                    <div className="empty-icon">🍹</div>
                    <div className="empty-title">Aucun produit trouvé</div>
                    <div className="empty-desc">Essayez un autre filtre ou une autre recherche.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="section active">
            <div className="main-hdr">
              <span className="main-title">📋 Commandes</span>
              <button className="btn btn-primary btn-sm" onClick={handleCloseDay} style={{ fontSize: '.78rem', background: 'var(--theme)', color: '#000' }}>
                💰 Clôturer la journée
              </button>
            </div>
            <div className="main-body" style={{ overflowY: 'auto' }}>
              <div className="orders-cols">
                {/* Column Pending */}
                <div>
                  <div className="orders-col-title">
                    ⏳ En attente / En cours <span className="badge badge-pending">{activeOrders.length}</span>
                  </div>
                  <div>
                    {activeOrders.length > 0 ? (
                      activeOrders.map((o) => (
                        <div className="order-card" key={o.id}>
                          <div className="order-hdr">
                            <span className="order-num">{o.orderNumber}</span>
                            {o.status === 'pending' ? (
                              <span className="badge badge-pending">⏳ En attente</span>
                            ) : (
                              <span className="badge badge-preparing">👨‍🍳 En cours</span>
                            )}
                            <span className="order-time">
                              {new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="order-client">👤 {o.clientName} {o.tableInfo ? `· ${o.tableInfo}` : ''}</div>
                          <div className="order-items">
                            {o.items.map((it, idx) => (
                              <div className="order-item-row" key={idx}>
                                <span>{it.qty}× {it.name}</span>
                                <span
                                  className="editable-price"
                                  onClick={() => handlePromptEditPrice(o.id, idx, it.price)}
                                  style={{ cursor: 'pointer', color: 'var(--theme)', fontWeight: 700 }}
                                  title="Modifier le prix"
                                >
                                  {fmt(it.price * it.qty)} ✏️
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="order-total">
                            <span>Total</span>
                            <span className="order-total-amt">{fmt(o.total)}</span>
                          </div>
                          <div className="order-actions">
                            {o.status === 'pending' && (
                              <button className="btn btn-warning btn-sm" onClick={() => handleUpdateOrderStatus(o.id, 'preparing')}>
                                👨‍🍳 En préparation
                              </button>
                            )}
                            <button className="btn btn-success btn-sm" onClick={() => handleUpdateOrderStatus(o.id, 'paid')}>
                              💳 Marquer Payée
                            </button>
                          </div>
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

                {/* Column Paid */}
                <div>
                  <div className="orders-col-title">
                    ✅ Payées <span className="badge badge-paid">{paidOrders.length}</span>
                  </div>
                  <div>
                    {paidOrders.length > 0 ? (
                      paidOrders.map((o) => (
                        <div className="order-card" key={o.id}>
                          <div className="order-hdr">
                            <span className="order-num">{o.orderNumber}</span>
                            <span className="badge badge-paid">✅ Payée</span>
                            <span className="order-time">
                              {new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="order-client">👤 {o.clientName} {o.tableInfo ? `· ${o.tableInfo}` : ''}</div>
                          <div className="order-items">
                            {o.items.map((it, idx) => (
                              <div className="order-item-row" key={idx}>
                                <span>{it.qty}× {it.name}</span>
                                <span>{fmt(it.price * it.qty)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="order-total">
                            <span>Total</span>
                            <span className="order-total-amt">{fmt(o.total)}</span>
                          </div>
                          <div className="order-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadTicket(o.id)}>
                              🎫 Télécharger Ticket
                            </button>
                          </div>
                          {o.processedBy && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right' }}>
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
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="section active">
            <div className="main-hdr"><span className="main-title">📊 Statistiques du jour</span></div>
            <div className="main-body" style={{ overflowY: 'auto' }}>
              <div className="stats-grid">
                <div className="stat-card" style={{ padding: '1.1rem', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyBuvette: 'space-between', alignItems: 'flex-start' }}>
                    <div className="stat-icon" style={{ fontSize: '1.4rem' }}>💰</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Aujourd'hui</div>
                  </div>
                  <div className="stat-val" style={{ fontSize: '1.4rem', marginTop: '0.4rem' }}>{stats.revenue.toFixed(0)} {cur}</div>
                  <div className="stat-lbl">Revenus du jour</div>
                </div>
                <div className="stat-card" style={{ padding: '1.1rem', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyBuvette: 'space-between', alignItems: 'flex-start' }}>
                    <div className="stat-icon" style={{ fontSize: '1.4rem' }}>📋</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Aujourd'hui</div>
                  </div>
                  <div className="stat-val" style={{ fontSize: '1.4rem', marginTop: '0.4rem' }}>{stats.total}</div>
                  <div className="stat-lbl">Commandes totales</div>
                </div>
                <div className="stat-card" style={{ padding: '1.1rem', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyBuvette: 'space-between', alignItems: 'flex-start' }}>
                    <div className="stat-icon" style={{ fontSize: '1.4rem' }}>✅</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Aujourd'hui</div>
                  </div>
                  <div className="stat-val" style={{ fontSize: '1.4rem', marginTop: '0.4rem' }}>{stats.paid}</div>
                  <div className="stat-lbl">Payées</div>
                </div>
                <div className="stat-card" style={{ padding: '1.1rem', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyBuvette: 'space-between', alignItems: 'flex-start' }}>
                    <div className="stat-icon" style={{ fontSize: '1.4rem' }}>⏳</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Aujourd'hui</div>
                  </div>
                  <div className="stat-val" style={{ fontSize: '1.4rem', marginTop: '0.4rem' }}>{stats.pending}</div>
                  <div className="stat-lbl">En attente</div>
                </div>
                <div className="stat-card" style={{ padding: '1.1rem', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyBuvette: 'space-between', alignItems: 'flex-start' }}>
                    <div className="stat-icon" style={{ fontSize: '1.4rem' }}>🏆</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Top</div>
                  </div>
                  <div className="stat-val" style={{ fontSize: '1.2rem', marginTop: '0.4rem', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {stats.topProduct} (×{stats.topCount})
                  </div>
                  <div className="stat-lbl">Top Produit du Jour</div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: 'var(--font-d)', fontWeight: 600, fontSize: '.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  📈 Revenus — 7 derniers jours
                </div>
                <canvas ref={canvasRef} id="revenueChart" height="160"></canvas>
              </div>

              <div className="card">
                <div style={{ fontFamily: 'var(--font-d)', fontWeight: 600, fontSize: '.95rem', marginBottom: '1rem' }}>
                  🏆 Top Produits du Jour
                </div>
                <div>
                  {stats.top5 && stats.top5.length > 0 ? (
                    stats.top5.map(([name, qty], i) => {
                      const maxQty = stats.top5[0][1];
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }} key={i}>
                          <span style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: '.85rem', color: 'var(--theme)', width: '1.2rem' }}>
                            {i + 1}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '.88rem', fontWeight: 500, marginBottom: '.25rem' }}>{name}</div>
                            <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${((qty / maxQty) * 100).toFixed(0)}%`, background: 'linear-gradient(90deg,var(--theme),var(--orange))', borderRadius: '3px' }}></div>
                            </div>
                          </div>
                          <span style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>×{qty}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-desc" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      Aucune vente aujourd'hui
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (() => {
          const stats = getReviewStats();
          const ratedOrders = orders.filter(o => o.rating).sort((a, b) => new Date(b.reviewedAt || b.date) - new Date(a.reviewedAt || a.date));
          
          return (
            <div className="section active">
              <div className="main-hdr">
                <span className="main-title">⭐ Avis & Satisfaction Clients</span>
              </div>
              <div className="main-body" style={{ overflowY: 'auto' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Consultez les notes et les commentaires laissés par vos clients après la validation de leur paiement.
                </p>

                {/* Stats Summary Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                  <div className="card glass-gold" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--theme)' }}>
                      {stats.avg} <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>/ 5</span>
                    </div>
                    <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: '.5rem', fontWeight: 600 }}>Note Globale Moyenne</div>
                    <div style={{ color: '#f0a500', fontSize: '1.2rem', marginTop: '.25rem' }}>
                      {'★'.repeat(Math.round(stats.avg)) + '☆'.repeat(5 - Math.round(stats.avg))}
                    </div>
                  </div>
                  <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.count}</div>
                    <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: '.5rem', fontWeight: 600 }}>Nombre d'avis reçus</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)', marginTop: '.25rem' }}>Depuis la création du menu</div>
                  </div>
                  <div className="card" style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.5rem', fontWeight: 600 }}>Répartition des Notes</div>
                    {[5, 4, 3, 2, 1].map(num => {
                      const count = stats.stars[num - 1];
                      const pct = stats.count > 0 ? (count / stats.count) * 100 : 0;
                      return (
                        <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.8rem', marginBottom: '.25rem' }}>
                          <span style={{ width: '45px', textAlign: 'right' }}>{num} ★</span>
                          <div style={{ flex: 1, height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--theme)' }}></div>
                          </div>
                          <span style={{ width: '25px', color: 'var(--text-muted)' }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* List of Reviews */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem' }}>Historique des retours</div>
                  {ratedOrders.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {ratedOrders.map((o) => (
                        <div key={o.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.5rem' }}>
                            <div>
                              <strong style={{ color: '#fff' }}>#{o.orderNumber}</strong>
                              <span style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}> - par {o.clientName || 'Anonyme'} {o.clientTable ? `(Table ${o.clientTable})` : ''}</span>
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '.75rem' }}>
                              {new Date(o.reviewedAt || o.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ color: '#f0a500', fontSize: '1.1rem', marginBottom: '.5rem' }}>
                            {'★'.repeat(o.rating) + '☆'.repeat(5 - o.rating)}
                          </div>
                          {o.review ? (
                            <p style={{ fontStyle: 'italic', color: '#fff', fontSize: '.9rem', background: 'rgba(255,255,255,0.02)', padding: '.75rem', borderRadius: '8px', borderLeft: '3px solid var(--theme)', margin: '0 0 .5rem 0' }}>
                              "{o.review}"
                            </p>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '.8rem', fontStyle: 'italic' }}>Aucun commentaire textuel</span>
                          )}
                          <div style={{ color: 'var(--text-secondary)', fontSize: '.78rem' }}>
                            <strong>Articles : </strong>
                            {o.items.map(it => `${it.qty}x ${it.name}`).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✉️</div>
                      Aucun avis client n'a été enregistré pour le moment.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* WAITERS TAB */}
        {activeTab === 'waiters' && (
          <div className="section active">
            <div className="main-hdr">
              <span className="main-title">👨‍🍳 Équipe de Serveurs</span>
              <button className="btn btn-primary btn-sm" onClick={() => handleOpenWaiterModal()}>+ Ajouter un serveur</button>
            </div>
            <div className="main-body" style={{ overflowY: 'auto' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Gérez les accès de votre équipe. Chaque serveur se connecte avec son propre code secret.
              </p>
              <div className="prod-grid">
                {buvette.waiters && buvette.waiters.length > 0 ? (
                  buvette.waiters.map((w, idx) => (
                    <div className="prod-card" key={idx}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>👤</div>
                      <div className="prod-name">{w.name}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-d)', letterSpacing: '1px', background: 'var(--bg-elevated)', padding: '.2rem .5rem', borderRadius: '4px' }}>
                        CODE: {w.code}
                      </div>
                      <div className="prod-actions" style={{ marginTop: '1rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenWaiterModal(idx)}>✏️</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteWaiter(idx)} style={{ color: 'var(--error)' }}>🗑️</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                    <div className="empty-icon">🤝</div>
                    <div className="empty-title">Aucun serveur enregistré</div>
                    <div className="empty-desc">Ajoutez votre premier membre d'équipe.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REGISTER BOOKKEEPING TAB */}
        {activeTab === 'register' && (
          <div className="section active">
            <div className="main-hdr"><span className="main-title">📖 Registre & Comptabilité</span></div>
            <div className="main-body" style={{ overflowY: 'auto' }}>
              <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '140px' }}>
                  <label className="form-label">Du</label>
                  <input type="date" className="form-input" value={regStart} onChange={(e) => setRegStart(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '140px' }}>
                  <label className="form-label">Au</label>
                  <input type="date" className="form-input" value={regEnd} onChange={(e) => setRegEnd(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: 2, minWidth: '200px' }}>
                  <label className="form-label">Rechercher</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Client ou Serveur..."
                    value={regSearch}
                    onChange={(e) => setRegSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="stats-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '1.5rem' }}>
                <div className="border-premium">
                  <div className="border-premium-inner" style={{ padding: '1.4rem' }}>
                    <div className="stat-icon">💰</div>
                    <div className="stat-val" style={{ color: 'var(--theme)' }}>
                      {fmt(registerTotalAmt)}
                    </div>
                    <div className="stat-lbl">Chiffre d'affaires sur la période</div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Date & Heure</th>
                      <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>N° Client</th>
                      <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Montant</th>
                      <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Billets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegisterOrders.length > 0 ? (
                      filteredRegisterOrders.map((o) => {
                        const d = new Date(o.createdAt);
                        const dateStr = d.toLocaleDateString('fr-FR');
                        const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} key={o.id}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: 500, fontFamily: 'var(--font-d)' }}>{dateStr}</div>
                              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{timeStr}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: 500 }}>{o.orderNumber}</div>
                              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                                👤 {o.clientName} {o.processedBy ? `· 👨‍🍳 ${o.processedBy}` : ''}
                              </div>
                            </td>
                            <td style={{ padding: '1rem', fontFamily: 'var(--font-d)', fontWeight: 700, color: 'var(--theme)' }}>
                              {fmt(o.total)}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleDownloadTicket(o.id)} title="Télécharger">🎫</button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Aucune donnée sur cette période
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="section active">
            <div className="main-hdr"><span className="main-title">⚙️ Paramètres</span></div>
            <div className="main-body" style={{ overflowY: 'auto' }}>
              <div className="settings-section">
                <div className="settings-title">🍺 Lien Menu Client</div>
                <p style={{ fontSize: '.85rem', color: 'var(--text-secondary)', marginBottom: '.75rem' }}>
                  Partagez ce lien avec vos clients ou imprimez le QR Code ci-dessous.
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div className="share-box">
                      <span className="share-url" style={{ wordBreak: 'break-all' }}>{clientMenuUrl}</span>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(clientMenuUrl);
                          showToast('Lien copié ! 📋', 'success');
                        }}
                      >
                        📋 Copier
                      </button>
                    </div>
                    <a href={clientMenuUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: '.75rem', display: 'inline-flex' }}>
                      🔗 Ouvrir le menu client
                    </a>
                  </div>

                  <div style={{ background: '#fff', padding: '.75rem', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem', boxShadow: '0 10px 30px rgba(0,0,0,.3)' }}>
                    <img
                      src={`https://quickchart.io/qr?text=${encodeURIComponent(clientMenuUrl)}&size=120&margin=0`}
                      alt="Menu QR Code"
                      style={{ width: '120px', height: '120px', display: 'block' }}
                    />
                    <span style={{ fontSize: '.65rem', fontWeight: 700, color: '#1a1a1a' }}>MENU QR CODE</span>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-title">📱 Téléchargement des Applications (Gratuit)</div>
                <p style={{ fontSize: '.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Téléchargez et installez les applications natives d'Apeiron Buvette sur vos appareils.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {/* PC App card */}
                  <div className="share-box" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '.75rem', padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontWeight: 600 }}>
                      <span>💻</span> Application PC (Windows)
                    </div>
                    <p style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                      Idéal pour le gérant. Permet d'avoir le dashboard en plein écran et une meilleure gestion des impressions.
                    </p>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ textAlign: 'center', justifyContent: 'center' }}
                      disabled
                      title="En cours de développement..."
                    >
                      ⏳ Bientôt disponible (Windows)
                    </button>
                  </div>

                  {/* Android App card */}
                  <div className="share-box" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '.75rem', padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontWeight: 600 }}>
                      <span>🤖</span> Application Mobile (Android)
                    </div>
                    <p style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                      Pour le gérant et les serveurs. Permet d'avoir les notifications et alertes sonores de commande en arrière-plan.
                    </p>
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, textAlign: 'center', justifyContent: 'center', minWidth: '120px' }}
                        disabled
                        title="En cours de développement..."
                      >
                        ⏳ Bientôt disponible (APK)
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, minWidth: '140px' }}
                        onClick={() => {
                          const apkUrl = `${window.location.origin}/ApeironBuvette.apk`;
                          const message = encodeURIComponent(
                            `Salut ! Voici le lien pour installer l'application mobile d'Apeiron Buvette pour notre établissement : ${apkUrl}\n\nUne fois installée, connecte-toi avec l'adresse email "${buvette.email || ''}" et ton code serveur personnel !`
                          );
                          window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
                        }}
                      >
                        💬 Partager aux Serveurs
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-title">✏️ Informations de la buvette</div>
                <div className="form-grid" style={{ gap: '1rem' }}>
                  <div className="form-grid g2">
                    <div className="form-group">
                      <label className="form-label">Nom</label>
                      <input className="form-input" type="text" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Slogan</label>
                      <input className="form-input" type="text" value={settingsSlogan} onChange={(e) => setSettingsSlogan(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-grid g2">
                    <div className="form-group">
                      <label className="form-label">Ville</label>
                      <input className="form-input" type="text" value={settingsCity} onChange={(e) => setSettingsCity(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Adresse</label>
                      <input className="form-input" type="text" value={settingsAddress} onChange={(e) => setSettingsAddress(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-grid g2">
                    <div className="form-group">
                      <label className="form-label">Devise</label>
                      <select className="form-select" value={settingsCurrency} onChange={(e) => setSettingsCurrency(e.target.value)}>
                        <option value="FCFA">FCFA</option>
                        <option value="EUR">EUR €</option>
                        <option value="USD">USD $</option>
                        <option value="GBP">GBP £</option>
                        <option value="MAD">MAD</option>
                        <option value="XOF">XOF</option>
                        <option value="NGN">NGN</option>
                        <option value="GHS">GHS</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Téléphone</label>
                      <input className="form-input" type="tel" value={settingsPhone} onChange={(e) => setSettingsPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-grid g2">
                    <div className="form-group">
                      <label className="form-label">Ouverture</label>
                      <input className="form-input" type="time" value={settingsOpen} onChange={(e) => setSettingsOpen(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fermeture</label>
                      <input className="form-input" type="time" value={settingsClose} onChange={(e) => setSettingsClose(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Thème Visuel Client (Mesh Gradient Animé)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginTop: '0.5rem', marginBottom: '1.25rem' }}>
                      {Object.values(THEME_PRESETS).map((p) => {
                        const isSelected = settingsThemePreset === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            style={{
                              padding: '.75rem',
                              fontSize: '.85rem',
                              border: isSelected ? '1px solid var(--theme)' : '1px solid var(--border)',
                              background: isSelected ? 'var(--theme)' : 'rgba(255,255,255,0.03)',
                              color: isSelected ? '#000' : '#fff',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '.25rem',
                              borderRadius: '12px',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setSettingsThemePreset(p.id);
                              setSettingsTheme(p.themeColor);
                            }}
                          >
                            <span style={{ fontWeight: 700 }}>{p.label}</span>
                            <span style={{ fontSize: '.7rem', opacity: 0.8 }}>({p.themeColor})</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className={`btn ${settingsThemePreset === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          padding: '.75rem',
                          fontSize: '.85rem',
                          border: settingsThemePreset === 'custom' ? '1px solid var(--theme)' : '1px solid var(--border)',
                          background: settingsThemePreset === 'custom' ? 'var(--theme)' : 'rgba(255,255,255,0.03)',
                          color: settingsThemePreset === 'custom' ? '#000' : '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '.25rem',
                          borderRadius: '12px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSettingsThemePreset('custom')}
                      >
                        <span style={{ fontWeight: 700 }}>Personnalisé 🎨</span>
                        <span style={{ fontSize: '.7rem', opacity: 0.8 }}>({settingsTheme})</span>
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Couleur accentuée personnalisée</label>
                    <div className="color-picker">
                      {['#f0a500', '#e85d04', '#ef4444', '#ec4899', '#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#22c55e'].map((c) => (
                        <div
                          key={c}
                          className={`c-swatch ${c === settingsTheme ? 'on' : ''}`}
                          style={{ background: c }}
                          onClick={() => {
                            setSettingsTheme(c);
                            setSettingsThemePreset('custom');
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={handleSaveSettings}>
                  💾 Enregistrer
                </button>
              </div>

              <div className="settings-section">
                <div className="settings-title">📸 Logo de la buvette</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', background: 'linear-gradient(135deg,var(--theme),#e85d04)', color: '#fff', fontFamily: 'var(--font-d)', fontWeight: 800, overflow: 'hidden', flexShrink: 0 }}>
                    {buvette.logo ? (
                      <img src={buvette.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (buvette.name || 'B')[0].toUpperCase()
                    )}
                  </div>
                  <button className="btn btn-secondary" onClick={() => document.getElementById('sLogoFileInput').click()}>
                    Changer le logo
                  </button>
                  <input type="file" id="sLogoFileInput" accept="image/*" style={{ display: 'none' }} onChange={handleUploadLogoSettings} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === 'subscription' && (
          <div className="section active">
            <div className="main-hdr"><span className="main-title">💳 Gestion de l'Abonnement</span></div>
            <div className="main-body" style={{ overflowY: 'auto' }}>
              
              {/* CURRENT STATUS */}
              <div className="settings-section" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut de l'établissement</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.25rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{buvette.isPremium ? '💎' : '⏳'}</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: buvette.isPremium ? '#10b981' : 'var(--theme)' }}>
                        {buvette.isPremium ? `Formule ${buvette.plan || 'Premium'} Active` : "Période d'essai de 14 jours"}
                      </span>
                    </div>
                    <p style={{ fontSize: '.84rem', color: 'var(--text-secondary)', marginTop: '.5rem' }}>
                      {buvette.isPremium 
                        ? `Activé avec succès. Merci de faire confiance à Apeiron Buvette pour votre établissement !`
                        : `Votre période d'essai gratuite prendra fin bientôt. Activez une formule premium pour conserver l'accès au menu client.`
                      }
                    </p>
                    <div style={{ marginTop: '.75rem', fontSize: '.82rem', color: 'var(--text-muted)' }}>
                      <strong>ID Établissement :</strong> <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{buvette.id}</span>
                    </div>
                  </div>

                  {/* Activation / Upgrade Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', minWidth: '280px', flex: 1, maxWidth: '400px' }}>
                    <div className="share-box" style={{ padding: '.5rem .75rem', gap: '.5rem' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Code d'activation" 
                        style={{ border: 'none', background: 'transparent', height: 'auto', padding: '.25rem', color: '#fff', fontSize: '.88rem' }}
                        value={activationCode}
                        onChange={(e) => setActivationCode(e.target.value)}
                      />
                      <button className="btn btn-primary btn-sm" onClick={handleActivatePremium}>
                        Activer
                      </button>
                    </div>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ justifyContent: 'center', gap: '.5rem' }}
                      onClick={() => {
                        const message = encodeURIComponent(`Bonjour ! J'aimerais souscrire à un abonnement premium pour ma buvette "${buvette.name || ''}" (ID: ${buvette.id}). Comment puis-je procéder ?`);
                        window.open(`https://api.whatsapp.com/send?phone=+2290169809064&text=${message}`, '_blank');
                      }}
                    >
                      💬 Contacter le Support WhatsApp
                    </button>
                  </div>
                </div>
              </div>

              {/* SUBSCRIPTION PLANS */}
              <div style={{ marginTop: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: '1.6rem', color: '#fff' }}>Choisissez votre formule d'Apeiron Buvette</h2>
                  <p style={{ fontSize: '.88rem', color: 'var(--text-secondary)', marginTop: '.25rem' }}>Des fonctionnalités professionnelles adaptées à la taille de votre commerce</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  
                  {/* Plan 1 */}
                  <div className="share-box" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1.25rem', padding: '1.75rem', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Découverte</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>Pour débuter et tester l'outil</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginTop: '1rem', fontFamily: 'var(--font-d)' }}>
                        0 FCFA <span style={{ fontSize: '.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 14 jours</span>
                      </div>
                    </div>
                    <div className="divider" style={{ margin: 0 }}></div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '.6rem', fontSize: '.82rem', color: 'var(--text-muted)' }}>
                      <li>✅ Menu Client interactif en ligne</li>
                      <li>✅ Commandes en direct limitées</li>
                      <li>✅ 1 seul serveur connecté</li>
                      <li>❌ Statistiques et rapports financiers</li>
                      <li>❌ Téléchargement de tickets PDF</li>
                      <li>❌ Applications natives (PC & Mobile)</li>
                    </ul>
                    <button className="btn btn-ghost btn-sm" disabled style={{ width: '100%', justifyContent: 'center' }}>
                      Inclus à l'inscription
                    </button>
                  </div>

                  {/* Plan 2 */}
                  <div className="share-box" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1.25rem', padding: '1.75rem', background: 'rgba(240,165,0,0.02)', border: '1px solid rgba(240,165,0,0.15)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '.75rem', right: '.75rem', background: 'linear-gradient(135deg,var(--theme),#e85d04)', color: '#fff', fontSize: '.65rem', fontWeight: 800, padding: '.25rem .5rem', borderRadius: 'var(--r-full)', textTransform: 'uppercase' }}>Populaire</div>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--theme)' }}>Pro</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>Idéal pour les buvettes & bars de taille moyenne</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginTop: '1rem', fontFamily: 'var(--font-d)' }}>
                        10 000 FCFA <span style={{ fontSize: '.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ mois</span>
                      </div>
                    </div>
                    <div className="divider" style={{ margin: 0 }}></div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '.6rem', fontSize: '.82rem', color: 'var(--text-secondary)' }}>
                      <li>✅ Menu Client interactif en ligne</li>
                      <li>✅ Commandes en direct illimitées</li>
                      <li>✅ Jusqu'à 5 serveurs connectés</li>
                      <li>✅ Registre & Statistiques de base</li>
                      <li>✅ Téléchargement de tickets PDF</li>
                      <li>✅ Applications natives (PC & Mobile)</li>
                    </ul>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--theme)' }}
                      onClick={() => {
                        const message = encodeURIComponent(`Bonjour ! Je souhaite activer la formule PRO pour ma buvette "${buvette.name || ''}" (ID: ${buvette.id})`);
                        window.open(`https://api.whatsapp.com/send?phone=+2290169809064&text=${message}`, '_blank');
                      }}
                    >
                      Choisir cette formule
                    </button>
                  </div>

                  {/* Plan 3 */}
                  <div className="share-box" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1.25rem', padding: '1.75rem', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Ultimate</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>Tout illimité pour les grands établissements</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginTop: '1rem', fontFamily: 'var(--font-d)' }}>
                        25 000 FCFA <span style={{ fontSize: '.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ mois</span>
                      </div>
                    </div>
                    <div className="divider" style={{ margin: 0 }}></div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '.6rem', fontSize: '.82rem', color: 'var(--text-secondary)' }}>
                      <li>✅ Tout illimité (Produits, serveurs, commandes)</li>
                      <li>✅ Statistiques et analyses graphiques avancées</li>
                      <li>✅ Personnalisation thématique complète</li>
                      <li>✅ Accès prioritaire VIP support 24/7</li>
                      <li>✅ Applications natives incluses et optimisées</li>
                    </ul>
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => {
                        const message = encodeURIComponent(`Bonjour ! Je souhaite activer la formule ULTIMATE pour ma buvette "${buvette.name || ''}" (ID: ${buvette.id})`);
                        window.open(`https://api.whatsapp.com/send?phone=+2290169809064&text=${message}`, '_blank');
                      }}
                    >
                      Choisir cette formule
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* MODAL: ADD / EDIT PRODUCT */}
      {showProdModal && (
        <div className="modal-overlay open">
          <div className="modal modal-wide">
            <div className="modal-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span className="modal-title">{editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}</span>
              <button className="modal-close" style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowProdModal(false)}>✕</button>
            </div>

            {/* Type selector */}
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                className={`type-tab ${prodType === 'drink' ? 'on' : ''}`}
                onClick={() => {
                  setProdType('drink');
                  setProdCatInput('alcohol');
                }}
              >
                🍺 Boisson
              </button>
              <button
                type="button"
                className={`type-tab ${prodType === 'food' ? 'on' : ''}`}
                onClick={() => {
                  setProdType('food');
                  setProdCatInput('food');
                }}
              >
                🍔 Nourriture
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="form-grid" style={{ gap: '1.1rem' }}>
              {/* Drink section */}
              {prodType === 'drink' && (
                <div className="form-group" style={{ marginBottom: '.75rem' }}>
                  <label className="form-label">Icône de capsule <span className="req">*</span></label>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.75rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', cursor: 'pointer' }}
                    onClick={() => {
                      setGalCat('all');
                      setGalSearch('');
                      setShowGalModal(true);
                    }}
                  >
                    <div style={{ width: '52px', height: '52px', flexShrink: 0 }}>
                      {selectedBrandId ? (
                        <div dangerouslySetInnerHTML={{ __html: DRINKS.svg(DRINKS.byId(selectedBrandId) || { id: '', lines: ['?'], p: '#555', s: '#333', rim: '#888', t: '#fff' }, 52) }} />
                      ) : (
                        <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="26" cy="26" r="25" fill="var(--bg-elevated)" stroke="var(--border)" strokeWidth="1.5" />
                          <text x="26" y="30" textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontFamily="sans-serif">
                            Choisir
                          </text>
                        </svg>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.9rem', color: selectedBrandId ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {selectedBrandId ? DRINKS.byId(selectedBrandId)?.name : 'Sélectionner une marque'}
                      </div>
                      <div style={{ fontSize: '.76rem', color: 'var(--text-muted)' }}>Cliquer pour ouvrir la galerie</div>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>Parcourir →</button>
                  </div>
                </div>
              )}

              {/* Food section */}
              {prodType === 'food' && (
                <div className="form-group" style={{ marginBottom: '.75rem' }}>
                  <label className="form-label">Photo du plat</label>
                  <div style={{ display: 'flex', gap: '.75rem', marginBottom: '.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '.6rem' }}
                      onClick={() => {
                        setFoodGalCat('all');
                        setFoodGalSearch('');
                        setShowFoodGalModal(true);
                      }}
                    >
                      📸 Galerie Rapide
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '.6rem' }} onClick={() => document.getElementById('foodPhotoFileInput').click()}>
                      📤 Importer image
                    </button>
                    <input type="file" id="foodPhotoFileInput" accept="image/*" style={{ display: 'none' }} onChange={handleFoodPhotoUpload} />
                  </div>
                  <div
                    style={{ textAlign: 'center', border: '1px dashed var(--border)', background: 'var(--bg-glass)', padding: '1rem', borderRadius: 'var(--r-md)', cursor: 'pointer' }}
                    onClick={() => {
                      setFoodGalCat('all');
                      setFoodGalSearch('');
                      setShowFoodGalModal(true);
                    }}
                  >
                    {foodPhotoData ? (
                      <img src={foodPhotoData} alt="Aperçu" style={{ width: '80px', height: '80px', borderRadius: 'var(--r-sm)', objectFit: 'cover', display: 'block', margin: '0 auto .4rem' }} />
                    ) : (
                      <span style={{ fontSize: '1.8rem' }}>🍔</span>
                    )}
                    <div style={{ fontSize: '.84rem', color: 'var(--text-secondary)', margin: '.4rem 0 .2rem' }}>
                      {foodPhotoData ? 'Cliquer pour changer' : 'Aucune photo sélectionnée'}
                    </div>
                  </div>
                </div>
              )}

              {/* Common fields */}
              <div className="form-grid g2">
                <div className="form-group">
                  <label className="form-label">Nom du produit <span className="req">*</span></label>
                  <input className="form-input" type="text" placeholder="Ex: Heineken 65cl" value={prodNameInput} onChange={(e) => setProdNameInput(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Catégorie <span className="req">*</span></label>
                  <select className="form-select" value={prodCatInput} onChange={(e) => setProdCatInput(e.target.value)}>
                    <option value="alcohol">🍺 Bières &amp; Alcools</option>
                    <option value="soft">🥤 Softs</option>
                    <option value="hot">☕ Boissons Chaudes</option>
                    <option value="food">🍔 Nourritures</option>
                    <option value="dessert">🍰 Desserts</option>
                    <option value="other">📦 Autre</option>
                  </select>
                </div>
              </div>

              <div className="form-grid g2">
                <div className="form-group">
                  <label className="form-label">Prix <span className="req">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type="number" min="0" step="any" placeholder="0" style={{ paddingRight: '3.5rem' }} value={prodPriceInput} onChange={(e) => setProdPriceInput(e.target.value)} />
                    <span style={{ position: 'absolute', right: '.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '.82rem', pointerEvents: 'none' }}>
                      {cur}
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Stock en réserve</label>
                  <input className="form-input" type="number" min="0" placeholder="Vide = Illimité" value={prodStockInput} onChange={(e) => setProdStockInput(e.target.value)} />
                </div>
              </div>

              <div className="form-grid g2">
                <div className="form-group">
                  <label className="form-label">Description courte</label>
                  <input className="form-input" type="text" placeholder="Ex: Bière blonde fraîche..." value={prodDescInput} onChange={(e) => setProdDescInput(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Disponibilité</label>
                  <div className="toggle-wrap" style={{ height: '48px' }}>
                    <label className="toggle">
                      <input type="checkbox" checked={prodAvailInput} onChange={(e) => setProdAvailInput(e.target.checked)} />
                      <div className="toggle-sl"></div>
                    </label>
                    <span style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>
                      {prodAvailInput ? 'Disponible' : 'Indisponible'}
                    </span>
                  </div>
                </div>
              </div>

              {prodError && <div className="form-error show" style={{ margin: '.75rem 0', fontSize: '.87rem' }}>{prodError}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.6rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProdModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">💾 Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DRINKS CAPSULES GALLERY */}
      {showGalModal && (
        <div className="modal-overlay open" style={{ zIndex: 400 }}>
          <div className="modal modal-wide" style={{ maxWidth: '640px' }}>
            <div className="modal-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span className="modal-title">🍺 Galerie des marques</span>
              <button className="modal-close" style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowGalModal(false)}>✕</button>
            </div>
            <input
              className="gallery-search"
              placeholder="🔍 Rechercher une marque…"
              value={galSearch}
              onChange={(e) => setGalSearch(e.target.value)}
            />
            <div className="gallery-filters" style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button type="button" className={`gf-btn ${galCat === 'all' ? 'on' : ''}`} onClick={() => setGalCat('all')}>Toutes</button>
              <button type="button" className={`gf-btn ${galCat === 'alcohol' ? 'on' : ''}`} onClick={() => setGalCat('alcohol')}>🍺 Alcools</button>
              <button type="button" className={`gf-btn ${galCat === 'soft' ? 'on' : ''}`} onClick={() => setGalCat('soft')}>🥤 Softs</button>
              <button type="button" className={`gf-btn ${galCat === 'hot' ? 'on' : ''}`} onClick={() => setGalCat('hot')}>☕ Chauds</button>
            </div>

            <div className="gf-grid">
              {DRINKS.all()
                .filter((brand) => {
                  const matchCat = galCat === 'all' || brand.cat === galCat;
                  const matchSearch = !galSearch || brand.name.toLowerCase().includes(galSearch.toLowerCase());
                  return matchCat && matchSearch;
                })
                .map((brand) => (
                  <div
                    key={brand.id}
                    className={`gf-item ${selectedBrandId === brand.id ? 'on' : ''}`}
                    onClick={() => handleChooseBrand(brand)}
                  >
                    <div style={{ width: '44px', height: '44px' }} dangerouslySetInnerHTML={{ __html: DRINKS.svg(brand, 44) }} />
                    <span className="gf-name">{brand.name}</span>
                  </div>
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-primary" onClick={() => setShowGalModal(false)}>
                ✓ Confirmer la sélection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FOOD GALLERY */}
      {showFoodGalModal && (
        <div className="modal-overlay open" style={{ zIndex: 400 }}>
          <div className="modal modal-wide" style={{ maxWidth: '640px' }}>
            <div className="modal-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span className="modal-title">🍔 Galerie de Plats</span>
              <button className="modal-close" style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowFoodGalModal(false)}>✕</button>
            </div>
            <input
              className="gallery-search"
              placeholder="🔍 Rechercher un plat…"
              value={foodGalSearch}
              onChange={(e) => setFoodGalSearch(e.target.value)}
            />
            <div className="gallery-filters" style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button type="button" className={`gf-btn ${foodGalCat === 'all' ? 'on' : ''}`} onClick={() => setFoodGalCat('all')}>Toutes</button>
              <button type="button" className={`gf-btn ${foodGalCat === 'fastfood' ? 'on' : ''}`} onClick={() => setFoodGalCat('fastfood')}>🍔 Fast Food</button>
              <button type="button" className={`gf-btn ${foodGalCat === 'plats' ? 'on' : ''}`} onClick={() => setFoodGalCat('plats')}>🍗 Plats</button>
              <button type="button" className={`gf-btn ${foodGalCat === 'desserts' ? 'on' : ''}`} onClick={() => setFoodGalCat('desserts')}>🍰 Desserts</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: '.75rem', maxHeight: '300px', overflowY: 'auto', paddingBottom: '1rem' }}>
              {FOODS.all()
                .filter((food) => {
                  const matchCat = foodGalCat === 'all' || food.cat === foodGalCat;
                  const matchSearch = !foodGalSearch || food.name.toLowerCase().includes(foodGalSearch.toLowerCase());
                  return matchCat && matchSearch;
                })
                .map((food) => (
                  <div
                    key={food.id}
                    className={`food-item ${foodPhotoData === food.url ? 'on' : ''}`}
                    style={{ backgroundImage: `url(${food.url})` }}
                    onClick={() => setFoodPhotoData(food.url)}
                  >
                    <span className="food-label">{food.name}</span>
                  </div>
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-primary" onClick={() => setShowFoodGalModal(false)}>
                ✓ Confirmer la sélection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE */}
      {showDelModal && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: '380px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
            <div className="modal-title" style={{ marginBottom: '.5rem', margin: 0 }}>Supprimer ce produit ?</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.88rem', marginBottom: '1.5rem', marginTop: '0.5rem' }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDelModal(false)}>Annuler</button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WAITER */}
      {showWaiterModal && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: '420px' }}>
            <div className="modal-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span className="modal-title">{editingWaiterIdx === -1 ? 'Ajouter un serveur' : 'Modifier le serveur'}</span>
              <button className="modal-close" style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowWaiterModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveWaiter} className="form-grid" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nom du serveur</label>
                <input className="form-input" type="text" placeholder="Ex: Marc" value={waiterNameInput} onChange={(e) => setWaiterNameInput(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Code d'accès (secret)</label>
                <input className="form-input" type="text" placeholder="Ex: 5588" value={waiterCodeInput} onChange={(e) => setWaiterCodeInput(e.target.value)} />
                <div className="form-hint" style={{ marginTop: '0.4rem' }}>C'est le code que le serveur utilisera pour se connecter.</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.6rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowWaiterModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">💾 Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <audio ref={audioRef} id="ding" src="https://actions.google.com/sounds/v1/alarms/din_ding.ogg"></audio>

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
