import { FBSYNC } from './firebase';

export const PRODUCTS = {
  _key(bid) { return `apeiron_products_${bid}`; },

  getAll(bid) {
    const data = JSON.parse(localStorage.getItem(this._key(bid)) || '[]');
    return Array.isArray(data) ? data : [];
  },
  _saveLocal(bid, list) {
    localStorage.setItem(this._key(bid), JSON.stringify(list || []));
  },

  async syncFromFirebase(bid) {
    const remote = await FBSYNC.pull(this._key(bid));
    if (remote !== null) this._saveLocal(bid, remote);
  },

  listen(bid, callback) {
    return FBSYNC.listen(this._key(bid), (data) => {
      this._saveLocal(bid, data);
      callback(data);
    });
  },

  async add(bid, data) {
    const list = this.getAll(bid);
    const p = {
      id:          Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name:        data.name,
      category:    data.category,
      type:        data.type,
      price:       parseFloat(data.price) || 0,
      description: data.description || '',
      brandId:     data.brandId     || null,
      imageData:   data.imageData   || null,
      stock:       (data.stock === '' || data.stock === null || data.stock === undefined)
                     ? '' : parseInt(data.stock, 10),
      available:   data.available !== false,
      createdAt:   new Date().toISOString(),
    };
    list.push(p);
    this._saveLocal(bid, list);
    await FBSYNC.push(this._key(bid), list);
    return p;
  },

  async update(bid, pid, updates) {
    const list = this.getAll(bid);
    const i = list.findIndex(p => p.id === pid);
    if (i === -1) return null;
    list[i] = { ...list[i], ...updates };
    this._saveLocal(bid, list);
    await FBSYNC.push(this._key(bid), list);
    return list[i];
  },

  async del(bid, pid) {
    const list = this.getAll(bid).filter(p => p.id !== pid);
    this._saveLocal(bid, list);
    await FBSYNC.push(this._key(bid), list);
  },

  async toggleAvail(bid, pid) {
    const list = this.getAll(bid);
    const i = list.findIndex(p => p.id === pid);
    if (i === -1) return;
    list[i].available = !list[i].available;
    this._saveLocal(bid, list);
    await FBSYNC.push(this._key(bid), list);
    return list[i];
  },

  async updateStock(bid, pid, variation) {
    const list = this.getAll(bid);
    const p = list.find(x => x.id === pid);
    if (!p || p.stock === '') return;
    p.stock = Math.max(0, p.stock + variation);
    this._saveLocal(bid, list);
    await FBSYNC.push(this._key(bid), list);
  },

  byCat(bid, cat) {
    const all = this.getAll(bid);
    return (!cat || cat === 'all') ? all : all.filter(p => p.category === cat);
  },

  available(bid) {
    return this.getAll(bid).filter(p => p.available !== false);
  },

  CATS: [
    { id:'all',     label:'Tout',              emoji:'🍽️' },
    { id:'alcohol', label:'Bières & Alcools',   emoji:'🍺' },
    { id:'soft',    label:'Softs',              emoji:'🥤' },
    { id:'hot',     label:'Boissons Chaudes',   emoji:'☕' },
    { id:'food',    label:'Nourritures',        emoji:'🍔' },
    { id:'dessert', label:'Desserts',           emoji:'🍰' },
    { id:'other',   label:'Autre',              emoji:'📦' },
  ],
};
