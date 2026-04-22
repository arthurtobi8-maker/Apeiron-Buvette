/* ── APEIRON BUVETTE — ORDERS MODULE ────────────────────────── */
const ORDERS = {
  _key(bid) { return `apeiron_orders_${bid}`; },

  getAll(bid) {
    return JSON.parse(localStorage.getItem(this._key(bid)) || '[]');
  },
  save(bid, list) {
    localStorage.setItem(this._key(bid), JSON.stringify(list));
  },

  _num() {
    const d = new Date();
    const pad = n => String(n).padStart(2,'0');
    return `#${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  },

  create(bid, data) {
    const list = this.getAll(bid);
    const total = data.items.reduce((s, it) => s + it.price * it.qty, 0);
    const o = {
      id:          Date.now().toString(36) + Math.random().toString(36).substr(2,5),
      orderNumber: this._num(),
      clientName:  data.clientName || 'Client',
      tableInfo:   data.tableInfo  || '',
      items:       data.items,   // [{productId, name, qty, price}]
      total,
      status:      'pending',    // pending | preparing | paid
      createdAt:   new Date().toISOString(),
      paidAt:      null,
      archived:    false,
    };
    list.unshift(o);
    if (typeof PRODUCTS !== 'undefined') {
      data.items.forEach(it => PRODUCTS.updateStock(bid, it.productId, -it.qty));
    }
    this.save(bid, list);
    return o;
  },

  updateStatus(bid, oid, status) {
    const list = this.getAll(bid);
    const i = list.findIndex(o => o.id === oid);
    if (i === -1) return null;
    list[i].status = status;
    if (status === 'paid') list[i].paidAt = new Date().toISOString();
    this.save(bid, list);
    return list[i];
  },

  getById(bid, oid) {
    return this.getAll(bid).find(o => o.id === oid) || null;
  },

  del(bid, oid) {
    const list = this.getAll(bid);
    const order = list.find(o => o.id === oid);
    if (order && typeof PRODUCTS !== 'undefined') {
      order.items.forEach(it => PRODUCTS.updateStock(bid, it.productId, it.qty));
    }
    this.save(bid, list.filter(o => o.id !== oid));
  },

  today(bid) {
    const tod = new Date().toDateString();
    return this.getAll(bid).filter(o => new Date(o.createdAt).toDateString() === tod && !o.archived);
  },

  archivePaid(bid) {
    const list = this.getAll(bid);
    list.forEach(o => { if (o.status === 'paid') o.archived = true; });
    this.save(bid, list);
  },

  stats(bid) {
    const tod = this.today(bid);
    const paid = tod.filter(o => o.status === 'paid');
    const revenue = paid.reduce((s, o) => s + o.total, 0);

    const counts = {};
    paid.forEach(o => o.items.forEach(it => {
      counts[it.name] = (counts[it.name] || 0) + it.qty;
    }));
    let topProduct = '—', topCount = 0;
    Object.entries(counts).forEach(([n, c]) => { if (c > topCount) { topProduct = n; topCount = c; } });

    return {
      total:      tod.length,
      paid:       paid.length,
      pending:    tod.filter(o => o.status !== 'paid').length,
      revenue,
      topProduct,
      topCount,
    };
  },
};
