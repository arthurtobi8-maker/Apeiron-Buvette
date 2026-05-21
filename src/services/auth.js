import firebase, { FBSYNC } from './firebase';

export const AUTH = {
  SESSION_KEY: 'apeiron_session',

  async register(data) {
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(data.email, data.password);
      const uid = userCredential.user.uid;

      const pubData = {
        name: data.name, type: data.type, slogan: data.slogan,
        city: data.city, address: data.address, phone: data.phone,
        currency: data.currency, openTime: data.openTime, closeTime: data.closeTime,
        openDays: data.openDays, logo: data.logo, themeColor: data.themeColor,
        email: data.email, createdAt: new Date().toISOString()
      };

      const privData = {
        ownerName: data.ownerName, ownerPhone: data.ownerPhone,
        email: data.email, motivation: data.motivation, ambitions: data.ambitions, howFound: data.howFound
      };

      await FBSYNC.push(`public_profiles/${uid}`, pubData);
      await FBSYNC.push(`private_profiles/${uid}`, privData);
      
      const sanitizedEmail = data.email.toLowerCase().replace(/[.#$[\]]/g, '_');
      await FBSYNC.push(`lookups/emails/${sanitizedEmail}`, uid);

      return { id: uid, ...pubData, role: 'admin' };
    } catch (err) {
      console.error('[AUTH] Registration error:', err);
      throw err;
    }
  },

  async login(email, password, bid = null) {
    console.log('[AUTH-V2] Login attempt:', { email, bid });
    let uid = bid;
      if (!uid) {
        const sanitizedEmail = email.toLowerCase().replace(/[.#$[\]]/g, '_');
        uid = await FBSYNC.pull(`lookups/emails/${sanitizedEmail}`);
        if (!uid) throw new Error('Email introuvable.');
      }

      const profile = await this.getBuvetteById(uid, true);
      if (!profile) throw new Error('Buvette introuvable dans la base.');

      try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        return { ...profile, id: userCredential.user.uid, role: 'admin' };
      } catch (authErr) {
        if (profile.waiters && Array.isArray(profile.waiters)) {
          const waiter = profile.waiters.find(w => w.code === password);
          if (waiter) {
            this.setSession(uid, 'waiter', false, waiter.name);
            return { ...profile, id: uid, role: 'waiter', waiterName: waiter.name };
          }
        }
        if (profile.waiterPassword) {
          const decoded = decodeURIComponent(escape(atob(profile.waiterPassword)));
          if (decoded === password) {
            this.setSession(uid, 'waiter', false, 'Serveur');
            return { ...profile, id: uid, role: 'waiter', waiterName: 'Serveur' };
          }
        }
        void authErr;
        throw new Error('Code serveur ou mot de passe incorrect.', { cause: authErr });
      }
    
  },

  setSession(buvetteId, role, remember = false, waiterName = null) {
    const data = { buvetteId, role, waiterName, ts: Date.now(), remember };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(data));
  },

  async getBuvetteById(uid, isPublicOnly = false) {
    if (!uid) return null;
    try {
      const pubData = await FBSYNC.pull(`public_profiles/${uid}`);
      let privData = null;
      if (!isPublicOnly) {
        privData = await FBSYNC.pull(`private_profiles/${uid}`);
      }
      if (!pubData && !privData) return null;
      return { id: uid, ...(pubData || {}), ...(privData || {}) };
    } catch {
      return null;
    }
  },

  async updateBuvette(uid, data) {
    const current = await this.getBuvetteById(uid);
    const updated = { ...current, ...data };
    await FBSYNC.push(`public_profiles/${uid}`, updated);
    return updated;
  },

  getCurrentBuvette() {
    const user = firebase.auth().currentUser;
    if (!user) {
      const local = JSON.parse(localStorage.getItem(this.SESSION_KEY) || 'null');
      if (local && local.buvetteId) return { id: local.buvetteId, ...local };
      return local;
    }
    return { id: user.uid, email: user.email, role: 'admin' };
  },

  async checkAuth() {
    return new Promise((resolve) => {
      firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
          const stored = JSON.parse(localStorage.getItem(this.SESSION_KEY) || 'null');
          if (stored) {
            const profile = await this.getBuvetteById(stored.buvetteId);
            if (profile) {
              resolve({ ...profile, id: stored.buvetteId, role: stored.role, waiterName: stored.waiterName });
              return;
            }
          }
          resolve(null);
        } else {
          const profile = await this.getBuvetteById(user.uid);
          if (profile) resolve({ ...profile, id: user.uid, role: 'admin' });
          else {
            await firebase.auth().signOut();
            resolve(null);
          }
        }
      });
    });
  },

  async logout() {
    await firebase.auth().signOut();
    localStorage.removeItem(this.SESSION_KEY);
  }
};
