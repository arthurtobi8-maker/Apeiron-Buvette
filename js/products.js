/* ── APEIRON BUVETTE — PRODUCTS MODULE ───────────────────── */
const PRODUCTS = {
  _key(bid) { return `apeiron_products_${bid}`; },

  getAll(bid) {
    return JSON.parse(localStorage.getItem(this._key(bid)) || '[]');
  },
  save(bid, list) {
    localStorage.setItem(this._key(bid), JSON.stringify(list));
  },

  add(bid, data) {
    const list = this.getAll(bid);
    const p = {
      id:          Date.now().toString(36) + Math.random().toString(36).substr(2,5),
      name:        data.name,
      category:    data.category,   // alcohol|soft|hot|food|dessert|other
      type:        data.type,       // drink|food
      price:       parseFloat(data.price) || 0,
      description: data.description || '',
      brandId:     data.brandId     || null,  // for drink capsule icons
      imageData:   data.imageData   || null,  // base64 for food photos
      stock:       (data.stock === '' || data.stock === null || data.stock === undefined) ? '' : parseInt(data.stock, 10),
      available:   data.available   !== false,
      createdAt:   new Date().toISOString(),
    };
    list.push(p);
    this.save(bid, list);
    return p;
  },

  update(bid, pid, updates) {
    const list = this.getAll(bid);
    const i = list.findIndex(p => p.id === pid);
    if (i === -1) return null;
    list[i] = { ...list[i], ...updates };
    this.save(bid, list);
    return list[i];
  },

  toggleAvail(bid, pid) {
    const list = this.getAll(bid);
    const i = list.findIndex(p => p.id === pid);
    if (i === -1) return;
    list[i].available = !list[i].available;
    this.save(bid, list);
    return list[i];
  },

  updateStock(bid, pid, variation) {
    const list = this.getAll(bid);
    const p = list.find(x => x.id === pid);
    if (!p || p.stock === '') return; // Unlimited or not found
    let newVal = p.stock + variation;
    if (newVal < 0) newVal = 0;
    p.stock = newVal;
    this.save(bid, list);
  },

  del(bid, pid) {
    this.save(bid, this.getAll(bid).filter(p => p.id !== pid));
  },

  byCat(bid, cat) {
    const all = this.getAll(bid);
    return (!cat || cat === 'all') ? all : all.filter(p => p.category === cat);
  },

  available(bid) {
    return this.getAll(bid).filter(p => p.available);
  },

  CATS: [
    { id:'all',     label:'Tout',          emoji:'🍽️' },
    { id:'alcohol', label:'Bières & Alcools', emoji:'🍺' },
    { id:'soft',    label:'Softs',         emoji:'🥤' },
    { id:'hot',     label:'Boissons Chaudes', emoji:'☕' },
    { id:'food',    label:'Nourritures',   emoji:'🍔' },
    { id:'dessert', label:'Desserts',      emoji:'🍰' },
    { id:'other',   label:'Autre',         emoji:'📦' },
  ],
};
