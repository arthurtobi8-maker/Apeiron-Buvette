import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBP40Z-Yb5uumF2LK8RQqwq2QWslg_Qbz0",
  authDomain: "apeiron-buvette.firebaseapp.com",
  databaseURL: "https://apeiron-buvette-default-rtdb.firebaseio.com/",
  projectId: "apeiron-buvette",
  storageBucket: "apeiron-buvette.firebasestorage.app",
  messagingSenderId: "720825889630",
  appId: "1:720825889630:web:3076a790493a9799d915cf"
};

if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

export const db = firebase.database();

export const FBSYNC = {
  _base: 'apeiron_data',

  async push(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      await Promise.race([
        db.ref(this._base + '/' + key).set({
          data: JSON.stringify(data),
          updatedAt: firebase.database.ServerValue.TIMESTAMP
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), 5000))
      ]);
    } catch (e) {
      console.warn('[Firebase] Push failed, using local only:', e.message);
    }
  },

  async pull(key) {
    try {
      const snap = await Promise.race([
        db.ref(this._base + '/' + key).once('value'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), 5000))
      ]);
      if (snap.exists() && snap.val().data) {
        const value = JSON.parse(snap.val().data);
        localStorage.setItem(key, JSON.stringify(value));
        return value;
      }
    } catch (e) {
      console.warn('[Firebase] Pull failed, using local cache:', e.message);
    }
    const local = localStorage.getItem(key);
    return local ? JSON.parse(local) : null;
  },

  listen(key, callback) {
    const ref = db.ref(this._base + '/' + key);
    const cb = snap => {
      if (snap.exists() && snap.val().data) {
        try {
          const value = JSON.parse(snap.val().data);
          localStorage.setItem(key, JSON.stringify(value));
          callback(value);
        } catch (e) { /* ignore parse errors */ }
      }
    };
    ref.on('value', cb, err => {
      console.warn('[Firebase] Listener error:', err.message);
    });
    return () => ref.off('value', cb);
  }
};

export default firebase;
