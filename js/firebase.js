/* ── APEIRON BUVETTE — FIREBASE MODULE (Realtime Database) ──────
   Handles all synchronization using Realtime DB instead of Firestore
   to bypass billing requirements.
   ─────────────────────────────────────────────────────────── */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBP40Z-Yb5uumF2LK8RQqwq2QWslg_Qbz0",
  authDomain: "apeiron-buvette.firebaseapp.com",
  databaseURL: "https://apeiron-buvette-default-rtdb.firebaseio.com", // default RTDB URL pattern
  projectId: "apeiron-buvette",
  storageBucket: "apeiron-buvette.firebasestorage.app",
  messagingSenderId: "720825889630",
  appId: "1:720825889630:web:3076a790493a9799d915cf"
};

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();

const FBSYNC = {
  _base: 'apeiron_data',

  /* Write data to RTDB (also keeps localStorage in sync) */
  async push(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      await db.ref(this._base + '/' + key).set({
        data: JSON.stringify(data),
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      });
    } catch (e) {
      console.warn('[Firebase] Push failed, using local only:', e.message);
    }
  },

  /* Read data from RTDB, fall back to localStorage */
  async pull(key) {
    try {
      const snap = await db.ref(this._base + '/' + key).once('value');
      if (snap.exists() && snap.val().data) {
        const value = JSON.parse(snap.val().data);
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

  /* Real-time listener: fires callback whenever data changes in RTDB */
  listen(key, callback) {
    return db.ref(this._base + '/' + key).on('value', snap => {
      if (snap.exists() && snap.val().data) {
        try {
          const value = JSON.parse(snap.val().data);
          localStorage.setItem(key, JSON.stringify(value));
          callback(value);
        } catch (e) { /* ignore parse errors */ }
      }
    }, err => {
      console.warn('[Firebase] Listener error:', err.message);
    });
  }
};
