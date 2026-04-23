/* ── APEIRON BUVETTE — AUTH MODULE (Firebase-backed) ─────────
   Buvette accounts are stored in Firestore so any device
   (barman's PC, client's phone) can access them.
   ─────────────────────────────────────────────────────────── */
const AUTH = {
  BUVETTES_KEY: 'apeiron_buvettes',
  SESSION_KEY:  'apeiron_session',

  _id() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  /* ── Local helpers (fast, synchronous) ── */
  getBuvettes() {
    return JSON.parse(localStorage.getItem(this.BUVETTES_KEY) || '[]');
  },
  _saveBuvettesLocal(list) {
    localStorage.setItem(this.BUVETTES_KEY, JSON.stringify(list));
  },

  /* ── Firebase sync ── */
  async syncFromFirebase() {
    try {
      const remote = await FBSYNC.pull(this.BUVETTES_KEY);
      if (remote) this._saveBuvettesLocal(remote);
    } catch (e) {
      console.warn('[AUTH] Sync failed, using local data.');
    }
  },

  /* ── Register new buvette ── */
  async register(data) {
    await this.syncFromFirebase(); // Ensure we have latest list
    const list = this.getBuvettes();

    if (list.some(b => b.email === data.email))
      throw new Error('Un compte avec cet email existe déjà.');

    const b = {
      id:         this._id(),
      name:       data.name,
      slogan:     data.slogan     || '',
      type:       data.type,
      city:       data.city       || '',
      address:    data.address    || '',
      phone:      data.phone      || '',
      currency:   data.currency   || 'FCFA',
      openTime:   data.openTime   || '08:00',
      closeTime:  data.closeTime  || '23:00',
      openDays:   data.openDays   || [],
      logo:       data.logo       || null,
      themeColor: data.themeColor || '#f0a500',
      ownerName:  data.ownerName,
      email:      data.email,
      password:   btoa(unescape(encodeURIComponent(data.password))),
      ownerPhone: data.ownerPhone || '',
      motivation: data.motivation || '',
      ambitions:  data.ambitions  || '',
      howFound:   data.howFound   || '',
      createdAt:  new Date().toISOString(),
    };
    list.push(b);

    // Save locally and to Firebase
    this._saveBuvettesLocal(list);
    await FBSYNC.push(this.BUVETTES_KEY, list);

    this.setSession(b.id);
    return b;
  },

  /* ── Login ── */
  async login(email, password) {
    await this.syncFromFirebase(); // Always check latest from Firebase
    const list = this.getBuvettes();
    const b = list.find(x => x.email === email);
    if (!b) throw new Error('Email introuvable.');
    const stored = decodeURIComponent(escape(atob(b.password)));
    if (stored !== password) throw new Error('Mot de passe incorrect.');
    this.setSession(b.id);
    return b;
  },

  /* ── Session management (local only — per device) ── */
  setSession(buvetteId, remember = false) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify({
      buvetteId,
      expiry: Date.now() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000,
    }));
  },

  getSession() {
    const s = JSON.parse(localStorage.getItem(this.SESSION_KEY) || 'null');
    if (!s) return null;
    if (Date.now() > s.expiry) { localStorage.removeItem(this.SESSION_KEY); return null; }
    return s;
  },

  getCurrentBuvette() {
    const s = this.getSession();
    if (!s) return null;
    return this.getBuvettes().find(b => b.id === s.buvetteId) || null;
  },

  getBuvetteById(id) {
    return this.getBuvettes().find(b => b.id === id) || null;
  },

  async updateBuvette(id, updates) {
    const list = this.getBuvettes();
    const i = list.findIndex(b => b.id === id);
    if (i === -1) throw new Error('Buvette introuvable.');
    list[i] = { ...list[i], ...updates };
    this._saveBuvettesLocal(list);
    await FBSYNC.push(this.BUVETTES_KEY, list);
    return list[i];
  },

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    window.location.href = 'login.html';
  },

  requireAuth() {
    const b = this.getCurrentBuvette();
    if (!b) window.location.href = 'login.html';
    return b;
  },
};
