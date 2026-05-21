import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCRlwih46ojgtWgVx0zgXqLLTww3JtZiuA",
  authDomain: "apeiron-buvette-6073c.firebaseapp.com",
  databaseURL: "https://apeiron-buvette-6073c-default-rtdb.firebaseio.com/",
  projectId: "apeiron-buvette-6073c",
  storageBucket: "apeiron-buvette-6073c.firebasestorage.app",
  messagingSenderId: "575372000462",
  appId: "1:575372000462:web:8973a18e8e6b8870dd649f"
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
        } catch { /* ignore parse errors */ }
      }
    };
    ref.on('value', cb, err => {
      console.warn('[Firebase] Listener error:', err.message);
    });
    return () => ref.off('value', cb);
  }
};

export default firebase;
