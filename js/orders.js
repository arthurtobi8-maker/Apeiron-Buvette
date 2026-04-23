/* ── APEIRON BUVETTE — ORDERS MODULE (Firebase-backed) ────────
   Orders are stored in Firestore. When a client orders on their
   phone, the barman sees it instantly on their dashboard.
   ─────────────────────────────────────────────────────────── */
const ORDERS = {
  _key(bid) { return `apeiron_orders_${bid}`; },

  /* ── Local read ── */
  getAll(bid) {
    return JSON.parse(localStorage.getItem(this._key(bid)) || '[]');
  },
  _saveLocal(bid, list) {
    localStorage.setItem(this._key(bid), JSON.stringify(list));
  },

  /* ── Sync from Firebase (called on page load) ── */
  async syncFromFirebase(bid) {
    const remote = await FBSYNC.pull(this._key(bid));
    if (remote !== null) this._saveLocal(bid, remote);
  },

  /* ── Real-time listener (fires whenever an order changes status) ── */
  listen(bid, callback) {
    return FBSYNC.listen(this._key(bid), (data) => {
      this._saveLocal(bid, data);
      callback(data);
    });
  },

  /* ── Create new order ── */
  async create(bid, data) {
    const list = this.getAll(bid);
    const total = data.items.reduce((s, it) => s + it.price * it.qty, 0);
    const order = {
      id:          Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      orderNumber: 'CMD-' + String(list.length + 1).padStart(3, '0'),
      clientName:  data.clientName,
      tableInfo:   data.tableInfo  || '',
      items:       data.items,
      total,
      status:      'pending',    // pending | preparing | paid
      createdAt:   new Date().toISOString(),
    };
    list.unshift(order); // newest first
    this._saveLocal(bid, list);
    await FBSYNC.push(this._key(bid), list);
    return order;
  },

  /* ── Update order status ── */
  async setStatus(bid, oid, status) {
    const list = this.getAll(bid);
    const i = list.findIndex(o => o.id === oid);
    if (i === -1) return null;
    list[i].status = status;
    if (status === 'paid') list[i].paidAt = new Date().toISOString();
    this._saveLocal(bid, list);
    await FBSYNC.push(this._key(bid), list);
    return list[i];
  },

  getById(bid, oid) {
    return this.getAll(bid).find(o => o.id === oid) || null;
  },

  async clearPaid(bid) {
    const list = this.getAll(bid).filter(o => o.status !== 'paid');
    this._saveLocal(bid, list);
    await FBSYNC.push(this._key(bid), list);
  },

  /* Stock deduction when order is confirmed */
  async deductStock(bid, items) {
    const products = PRODUCTS.getAll(bid);
    items.forEach(it => {
      const p = products.find(x => x.id === it.productId);
      if (p && p.stock !== '' && p.stock > 0) {
        p.stock = Math.max(0, p.stock - it.qty);
      }
    });
    PRODUCTS._saveLocal(bid, products);
    await FBSYNC.push(PRODUCTS._key(bid), products);
  },
};
