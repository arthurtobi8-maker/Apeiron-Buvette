/* ── APEIRON BUVETTE — ORDERS MODULE (Firebase-backed) ────────
   Orders are stored in Firestore. When a client orders on their
   phone, the barman sees it instantly on their dashboard.
   ─────────────────────────────────────────────────────────── */
const ORDERS = {
  _key(bid) { return `apeiron_orders_${bid}`; },

  /* ── Local read ── */
  getAll(bid) {
    const data = JSON.parse(localStorage.getItem(this._key(bid)) || '[]');
    return Array.isArray(data) ? data : [];
  },
  _saveLocal(bid, list) {
    localStorage.setItem(this._key(bid), JSON.stringify(list || []));
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
  async updateStatus(bid, oid, status) {
    const list = this.getAll(bid);
    const i = list.findIndex(o => o.id === oid);
    if (i === -1) return null;
    
    // Deduct stock when moving from pending to preparing
    if (list[i].status === 'pending' && status === 'preparing') {
      await this.deductStock(bid, list[i].items);
    }

    list[i].status = status;
    if (status === 'paid') list[i].paidAt = new Date().toISOString();
    this._saveLocal(bid, list);
    await FBSYNC.push(this._key(bid), list);
    return list[i];
  },

  /* ── Archive all paid orders (Day Close) ── */
  async archivePaid(bid) {
    const list = this.getAll(bid);
    let count = 0;
    list.forEach(o => {
      if (o.status === 'paid' && !o.archived) {
        o.archived = true;
        o.archivedAt = new Date().toISOString();
        count++;
      }
    });
    if (count > 0) {
      this._saveLocal(bid, list);
      await FBSYNC.push(this._key(bid), list);
    }
    return count;
  },

  async updateItemPrice(bid, oid, itemIdx, newPrice) {
    const list = this.getAll(bid);
    const i = list.findIndex(o => o.id === oid);
    if (i === -1) return null;
    list[i].items[itemIdx].price = parseFloat(newPrice) || 0;
    // Recalculate total
    list[i].total = list[i].items.reduce((s, it) => s + it.price * it.qty, 0);
    this._saveLocal(bid, list);
    await FBSYNC.push(this._key(bid), list);
    return list[i];
  },

  getById(bid, oid) {
    return this.getAll(bid).find(o => o.id === oid) || null;
  },

  /* Get orders from today */
  today(bid) {
    const todayStr = new Date().toDateString();
    return this.getAll(bid).filter(o => !o.archived && new Date(o.createdAt).toDateString() === todayStr);
  },

  /* ── Calculate stats for today ── */
  stats(bid) {
    const todayOrders = this.today(bid);
    const paid = todayOrders.filter(o => o.status === 'paid');

    const revenue = paid.reduce((s, o) => s + o.total, 0);

    /* Count sold quantities per product name */
    const counts = {};
    paid.forEach(o => o.items.forEach(it => {
      counts[it.name] = (counts[it.name] || 0) + it.qty;
    }));

    const sorted   = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top5     = sorted.slice(0, 5);
    const topEntry = sorted[0] || ['Aucun', 0];

    return {
      revenue,
      total:      todayOrders.length,
      paid:       paid.length,
      pending:    todayOrders.filter(o => o.status !== 'paid').length,
      topProduct: topEntry[0],
      topCount:   topEntry[1],
      top5,          // [ [name, qty], … ] — top 5 best sellers today
    };
  },

  /* ── Revenue per day over the last N days (default 7) ── */
  revenue7days(bid, n = 7) {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        label:   d.toLocaleDateString('fr-FR', { weekday: 'short' }),
        dateStr: d.toDateString(),
      });
    }
    const paidOrders = this.getAll(bid).filter(o => o.status === 'paid');
    return days.map(d => ({
      label: d.label,
      val:   paidOrders
               .filter(o => new Date(o.createdAt).toDateString() === d.dateStr)
               .reduce((s, o) => s + o.total, 0),
    }));
  },

  /* Stock deduction when order is confirmed */
  async deductStock(bid, items) {
    const products = PRODUCTS.getAll(bid);
    items.forEach(it => {
      const p = products.find(x => x.id === it.productId);
      if (p && p.stock !== '' && p.stock !== null && p.stock !== undefined) {
        p.stock = Math.max(0, p.stock - it.qty);
      }
    });
    PRODUCTS._saveLocal(bid, products);
    await FBSYNC.push(PRODUCTS._key(bid), products);
  },
};
