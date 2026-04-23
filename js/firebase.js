/* ── APEIRON BUVETTE — FIREBASE MODULE ───────────────────────
   Handles all Firestore synchronization.
   Provides FBSYNC: a key/value store backed by Firestore
   that mirrors localStorage for cross-device access.
   ─────────────────────────────────────────────────────────── */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBP40Z-Yb5uumF2LK8RQqwq2QWslg_Qbz0",
  authDomain: "apeiron-buvette.firebaseapp.com",
  projectId: "apeiron-buvette",
  storageBucket: "apeiron-buvette.firebasestorage.app",
  messagingSenderId: "720825889630",
  appId: "1:720825889630:web:3076a790493a9799d915cf"
};

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();

const FBSYNC = {
  _col: 'apeiron_data',

  /* Write data to Firestore (also keeps localStorage in sync) */
  async push(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      await db.collection(this._col).doc(key).set({
        data: JSON.stringify(data),
        updatedAt: Date.now()
      });
    } catch (e) {
      console.warn('[Firebase] Push failed, using local only:', e.message);
    }
  },

  /* Read data from Firestore, fall back to localStorage */
  async pull(key) {
    try {
      const snap = await db.collection(this._col).doc(key).get();
      if (snap.exists && snap.data().data) {
        const value = JSON.parse(snap.data().data);
        localStorage.setItem(key, JSON.stringify(value)); // keep local in sync
        return value;
      }
    } catch (e) {
      console.warn('[Firebase] Pull failed, using local cache:', e.message);
    }
    // Fallback: try localStorage
    const local = localStorage.getItem(key);
    return local ? JSON.parse(local) : null;
  },

  /* Real-time listener: fires callback whenever data changes in Firestore */
  listen(key, callback) {
    return db.collection(this._col).doc(key).onSnapshot(snap => {
      if (snap.exists && snap.data().data) {
        try {
          const value = JSON.parse(snap.data().data);
          localStorage.setItem(key, JSON.stringify(value));
          callback(value);
        } catch (e) { /* ignore parse errors */ }
      }
    }, err => {
      console.warn('[Firebase] Listener error:', err.message);
    });
  }
};
