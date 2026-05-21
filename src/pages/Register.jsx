import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AUTH } from '../services/auth';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form Fields State
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [slogan, setSlogan] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('FCFA');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('23:00');
  const [openDays, setOpenDays] = useState(new Set(['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']));
  const [themeColor, setThemeColor] = useState('#f0a500');
  const [logoData, setLogoData] = useState(null);
  // Grouped State (Advice #2)
  const [formData, setFormData] = useState({
    name: '', type: '', slogan: '', city: '', address: '', phone: '',
    currency: 'FCFA', openTime: '08:00', closeTime: '23:00',
    openDays: new Set(['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']),
    themeColor: '#f0a500', logoData: null,
    fname: '', lname: '', email: '', ophone: '',
    password: '', passwordConfirm: '',
    motivation: '', ambitions: '', howFound: '',
    cguChecked: false
  });

  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [email, setEmail] = useState('');
  const [ophone, setOphone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [motivation, setMotivation] = useState('');
  const [ambitions, setAmbitions] = useState('');
  const [howFound, setHowFound] = useState('');
  const [cguChecked, setCguChecked] = useState(false);

  // UI state
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [pwStrength, setPwStrength] = useState(0);

  // Generic update handler
  const updateField = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    updateField(name, type === 'checkbox' ? checked : value);
  };

  useEffect(() => {
    // Guest route guard
    AUTH.checkAuth().then((session) => {
      if (session) {
        if (session.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/serveur');
        }
      }
    });
  }, [navigate]);

  // Toast Helper
  const showToast = (msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Day Selection
  const dayNames = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const toggleDay = (d) => {
    const next = new Set(openDays);
    const next = new Set(formData.openDays);
    if (next.has(d)) {
      next.delete(d);
    } else {
      next.add(d);
    }
    setOpenDays(next);
    updateField('openDays', next);
  };

  // Custom styling elements
  const palette = ['#f0a500','#e85d04','#ef4444','#ec4899','#a855f7','#3b82f6','#06b6d4','#10b981','#22c55e','#ffffff'];

  // Handle Logo Upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Fichier trop volumineux (max 2 MB)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      setLogoData(evt.target.result);
      updateField('logoData', evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Check password strength
  const handlePasswordChange = (val) => {
    setPassword(val);
    updateField('password', val);
    const score = [
      val.length >= 8,
      /[A-Z]/.test(val),
      /[0-9]/.test(val),
      /[^A-Za-z0-9]/.test(val)
    ].filter(Boolean).length;
    setPwStrength(score);
  };

  const getStrengthBarStyles = () => {
    const widths = ['0%','25%','50%','75%','100%'];
    const colors = ['','var(--error)','var(--warning)','var(--info)','var(--success)'];
    return {
      width: widths[pwStrength],
      background: colors[pwStrength] || 'transparent'
    };
  };

  // Form Validation
  const validate = (s) => {
    if (s === 1) {
      if (!name.trim()) {
      if (!formData.name.trim()) {
        showToast('Le nom de la buvette est requis', 'error');
        return false;
      }
      if (!type) {
      if (!formData.type) {
        showToast("Choisissez un type d'établissement", 'error');
        return false;
      }
    }
    if (s === 2) {
      if (!fname.trim() || !lname.trim()) {
      if (!formData.fname.trim() || !formData.lname.trim()) {
        showToast('Prénom et nom requis', 'error');
        return false;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        showToast('Email invalide', 'error');
        return false;
      }
      if (password.length < 8) {
      if (formData.password.length < 8) {
        showToast('Mot de passe trop court (min. 8 car.)', 'error');
        return false;
      }
      if (password !== passwordConfirm) {
      if (formData.password !== formData.passwordConfirm) {
        showToast('Les mots de passe ne correspondent pas', 'error');
        return false;
      }
    }
    return true;
  };

  const goStep = (to) => {
    if (to > step && !validate(step)) return;
    setStep(to);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate(3)) return;
    if (!motivation.trim()) {
    if (!formData.motivation.trim()) {
      showToast("Dites-nous pourquoi vous choisissez Apeiron", 'error');
      return;
    }
    if (!cguChecked) {
    if (!formData.cguChecked) {
      showToast("Vous devez accepter les CGU pour continuer.", 'error');
      return;
    }

    setLoading(true);
    setRegError('');

    try {
      const b = await AUTH.register({
        name: name.trim(),
        type,
        slogan: slogan.trim(),
        city: city.trim(),
        address: address.trim(),
        phone: phone.trim(),
        currency,
        openTime,
        closeTime,
        openDays: Array.from(openDays),
        logo: logoData,
        themeColor,
        ownerName: `${fname.trim()} ${lname.trim()}`,
        email: email.trim(),
        ownerPhone: ophone.trim(),
        password,
        motivation: motivation.trim(),
        ambitions: ambitions.trim(),
        howFound,
        name: formData.name.trim(),
        type: formData.type,
        slogan: formData.slogan.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        currency: formData.currency,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        openDays: Array.from(formData.openDays),
        logo: formData.logoData,
        themeColor: formData.themeColor,
        ownerName: `${formData.fname.trim()} ${formData.lname.trim()}`,
        email: formData.email.trim(),
        ownerPhone: formData.ophone.trim(),
        password: formData.password,
        motivation: formData.motivation.trim(),
        ambitions: formData.ambitions.trim(),
        howFound: formData.howFound,
      });

      AUTH.setSession(b.id, 'admin', true);
      showToast('Buvette créée ! Bienvenue 🎆', 'success');
      setTimeout(() => navigate('/dashboard'), 1400);
    } catch (err) {
      setRegError(err.message || 'Une erreur est survenue lors de la création.');
      setLoading(false);
    }
  };

  return (
    <div className="gradient-bg" style={{ minHeight: '100vh' }}>
      <style>{`
        /* --- Optimisation des interactions et Scrollbars --- */
        
        /* Rendre les barres de défilement invisibles sur tout le site */
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
        }

        /* Effet de clic sur les boutons pour une sensation de "vrai" bouton */
        button, .btn, .nav-item, .cat-tab, .mn-card, .day-btn, .c-swatch {
          cursor: pointer;
          user-select: none;
          transition: transform 0.1s var(--ease), opacity 0.2s var(--ease);
        }

        button:active, .btn:active, .day-btn:active, .mn-card:active {
          transform: scale(0.96);
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
          transform: none !important;
        }

        .day-btn { padding:.4rem .85rem; border-radius:var(--r-full); border:1px solid var(--border); background:var(--bg-glass); color:var(--text-secondary); font-size:.82rem; font-weight:500; cursor:pointer; transition:all var(--t-fast) var(--ease); }
        .day-btn.on { background:linear-gradient(135deg,var(--gold),var(--orange)); color:#fff; border-color:transparent; }
        .feat-item { display:flex; gap:.75rem; align-items:center; padding:1rem; }
        .feat-icon { font-size:1.7rem; flex-shrink:0; }
        .feat-title { font-weight:600; font-size:.88rem; margin-bottom:.15rem; }
        .feat-desc  { font-size:.78rem; color:var(--text-muted); }
        .pw-strength { height:4px; border-radius:2px; margin-top:.4rem; background:var(--border); overflow:hidden; }
        .pw-strength-bar { height:100%; border-radius:2px; transition:all .4s var(--ease); }
        .cgu-checkbox {
          width: 20px; height: 20px; border-radius: 5px; border: 2px solid var(--border);
          background: var(--bg-glass); flex-shrink: 0; display: flex; align-items: center;
          justify-content: center; margin-top: 2px; transition: all .2s; cursor: pointer;
        }
        .cgu-checkbox.checked {
          background: linear-gradient(135deg,var(--gold),var(--orange));
          border: none;
        }
      `}</style>

      <div className="reg-page">
        {/* Left Hero */}
        <aside className="reg-hero">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '2.5rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🍺</span>
              <span style={{ fontFamily: 'var(--font-d)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)', letterSpacing: '.05em' }}>Apeiron Buvette</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '2rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem' }}>
              Gérez votre bar<br />
              <span className="gradient-text">avec élégance.</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '2rem', fontSize: '.9rem' }}>
              La plateforme tout-en-un pour les buvettes modernes. Menu numérique partageable, commandes en temps réel, et tickets PDF automatiques.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              <div className="glass-gold feat-item">
                <span className="feat-icon">📱</span>
                <div>
                  <div className="feat-title">Menu numérique</div>
                  <div className="feat-desc">Partagez votre carte via un simple lien</div>
                </div>
              </div>
              <div className="glass-gold feat-item">
                <span className="feat-icon">🎟️</span>
                <div>
                  <div className="feat-title">Tickets PDF</div>
                  <div className="feat-desc">Générés automatiquement après paiement</div>
                </div>
              </div>
              <div className="glass-gold feat-item">
                <span className="feat-icon">📊</span>
                <div>
                  <div className="feat-title">Statistiques</div>
                  <div className="feat-desc">Suivez vos ventes en temps réel</div>
                </div>
              </div>
              <div className="glass-gold feat-item">
                <span className="feat-icon">🍺</span>
                <div>
                  <div className="feat-title">Galerie de capsules</div>
                  <div className="feat-desc">Icônes de marques prêtes à l'emploi</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>Déjà un compte ?</p>
              <Link to="/login" className="btn btn-ghost btn-sm">Se connecter →</Link>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', fontSize: '.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Une création de <strong style={{ color: 'var(--gold)' }}>Apeiron Studio</strong><br />
              Conçu par <strong style={{ color: '#fff' }}>Arthur Tobi TCHABI</strong>
            </div>
          </div>
        </aside>

        {/* Right Form */}
        <main className="reg-main">
          <div className="reg-inner">
            <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '.4rem' }}>Créer votre buvette</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '.88rem' }}>Quelques informations pour configurer votre espace.</p>

            {/* Steps Nav */}
            <div className="steps">
              <div className="step-wrap">
                <div className="step-row">
                  <div className={`step-circle ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
                    {step > 1 ? '✓' : '1'}
                  </div>
                  <div className={`step-line ${step > 1 ? 'done' : ''}`}></div>
                </div>
                <span className={`step-label ${step === 1 ? 'active' : ''}`}>Votre Buvette</span>
              </div>
              <div className="step-wrap">
                <div className="step-row">
                  <div className={`step-circle ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
                    {step > 2 ? '✓' : '2'}
                  </div>
                  <div className={`step-line ${step > 2 ? 'done' : ''}`}></div>
                </div>
                <span className={`step-label ${step === 2 ? 'active' : ''}`}>Votre Compte</span>
              </div>
              <div className="step-wrap" style={{ flex: 0 }}>
                <div className="step-row">
                  <div className={`step-circle ${step === 3 ? 'active' : ''}`}>3</div>
                </div>
                <span className={`step-label ${step === 3 ? 'active' : ''}`}>Motivation</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* STEP 1: Buvette */}
              {step === 1 && (
                <div className="step-panel active">
                  <div className="form-grid" style={{ gap: '1.2rem' }}>
                    <div className="form-grid g2">
                      <div className="form-group">
                        <label className="form-label">Nom de la buvette <span className="req">*</span></label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Ex: Bar Le Terminus"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Type d'établissement <span className="req">*</span></label>
                        <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                          <option value="">Sélectionner…</option>
                          <option value="bar">Bar / Buvette</option>
                          <option value="restaurant">Restaurant</option>
                          <option value="snack">Snack / Fast-food</option>
                          <option value="mixte">Bar-Restaurant Mixte</option>
                          <option value="kiosque">Kiosque</option>
                          <option value="boite">Boîte de Nuit</option>
                          <option value="maquis">Maquis</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Slogan / Description courte</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder='"Fraîcheur et convivialité garanties"'
                        maxLength="80"
                        value={slogan}
                        onChange={(e) => setSlogan(e.target.value)}
                      />
                    </div>

                    <div className="form-grid g2">
                      <div className="form-group">
                        <label className="form-label">Ville</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Ex: Douala"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quartier / Adresse</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Ex: Akwa, Rue 1234"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-grid g2">
                      <div className="form-group">
                        <label className="form-label">Téléphone buvette</label>
                        <input
                          className="form-input"
                          type="tel"
                          placeholder="+237 6XX XXX XXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Devise <span className="req">*</span></label>
                        <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                          <option value="FCFA">FCFA — Franc CFA</option>
                          <option value="EUR">EUR — Euro €</option>
                          <option value="USD">USD — Dollar $</option>
                          <option value="GBP">GBP — Livre Sterling £</option>
                          <option value="MAD">MAD — Dirham marocain</option>
                          <option value="DZD">DZD — Dinar algérien</option>
                          <option value="TND">TND — Dinar tunisien</option>
                          <option value="XOF">XOF — Franc CFA BCEAO</option>
                          <option value="NGN">NGN — Naira nigérian</option>
                          <option value="GHS">GHS — Cedi ghanéen</option>
                          <option value="KES">KES — Shilling kenyan</option>
                          <option value="CAD">CAD — Dollar canadien</option>
                          <option value="CHF">CHF — Franc suisse</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid g2">
                      <div className="form-group">
                        <label className="form-label">Heure d'ouverture</label>
                        <input
                          className="form-input"
                          type="time"
                          value={openTime}
                          onChange={(e) => setOpenTime(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Heure de fermeture</label>
                        <input
                          className="form-input"
                          type="time"
                          value={closeTime}
                          onChange={(e) => setCloseTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Jours d'ouverture</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.45rem', marginTop: '.3rem' }}>
                        {dayNames.map((d) => (
                          <button
                            key={d}
                            type="button"
                            className={`day-btn ${openDays.has(d) ? 'on' : ''}`}
                            onClick={() => toggleDay(d)}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Couleur thème (interface client)</label>
                      <div className="color-picker" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                        {palette.map((c) => (
                          <div
                            key={c}
                            className={`c-swatch ${c === themeColor ? 'on' : ''}`}
                            className={`c-swatch ${c === formData.themeColor ? 'on' : ''}`}
                            style={{ background: c }}
                            title={c}
                            role="button"
                            onClick={() => setThemeColor(c)}
                            onClick={() => updateField('themeColor', c)}
                          ></div>
                        ))}
                        <label style={{ cursor: 'pointer', position: 'relative' }}>
                          <div className="c-swatch" style={{ background: 'conic-gradient(red,yellow,green,blue,red)' }} title="Personnalisé"></div>
                          <input
                            type="color"
                            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                            value={themeColor}
                            onChange={(e) => setThemeColor(e.target.value)}
                            value={formData.themeColor}
                            onChange={(e) => updateField('themeColor', e.target.value)}
                          />
                        </label>
                      </div>
                      <div className="form-hint mt-1">Visible par vos clients sur le menu public.</div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Logo / Photo de la buvette</label>
                      <div className="upload-area" onClick={() => document.getElementById('logoFile').click()}>
                        <input
                          type="file"
                          id="logoFile"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleLogoChange}
                        />
                        {logoData ? (
                          <div>
                            <img src={logoData} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto .5rem' }} alt="Logo" />
                            <span style={{ fontSize: '.76rem', color: 'var(--text-muted)' }}>Cliquer pour changer</span>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '2.2rem', marginBottom: '.5rem' }}>📷</div>
                            <div style={{ fontSize: '.88rem', color: 'var(--text-secondary)', marginBottom: '.2rem' }}>Cliquer pour ajouter votre logo</div>
                            <div style={{ fontSize: '.76rem', color: 'var(--text-muted)' }}>PNG, JPG — Max 2 MB</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button type="button" className="btn btn-primary btn-lg" onClick={() => goStep(2)}>Suivant →</button>
                  </div>
                </div>
              )}

              {/* STEP 2: Account */}
              {step === 2 && (
                <div className="step-panel active">
                  <div className="form-grid" style={{ gap: '1.2rem' }}>
                    <div className="form-grid g2">
                      <div className="form-group">
                        <label className="form-label">Prénom <span className="req">*</span></label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Votre prénom"
                          value={fname}
                          onChange={(e) => setFname(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Nom <span className="req">*</span></label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Votre nom"
                          value={lname}
                          onChange={(e) => setLname(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email <span className="req">*</span></label>
                      <input
                        className="form-input"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Téléphone personnel</label>
                      <input
                        className="form-input"
                        type="tel"
                        placeholder="+237 6XX XXX XXX"
                        value={ophone}
                        onChange={(e) => setOphone(e.target.value)}
                      />
                    </div>

                    <div className="form-grid g2">
                      <div className="form-group">
                        <label className="form-label">Mot de passe <span className="req">*</span></label>
                        <input
                          className="form-input"
                          type="password"
                          placeholder="Min. 8 caractères"
                          value={password}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                        />
                        <div className="pw-strength">
                          <div className="pw-strength-bar" style={getStrengthBarStyles()}></div>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Confirmer <span className="req">*</span></label>
                        <input
                          className="form-input"
                          type="password"
                          placeholder="Répétez"
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => goStep(1)}>← Retour</button>
                    <button type="button" className="btn btn-primary btn-lg" onClick={() => goStep(3)}>Suivant →</button>
                  </div>
                </div>
              )}

              {/* STEP 3: Motivation */}
              {step === 3 && (
                <div className="step-panel active">
                  <div className="form-grid" style={{ gap: '1.2rem' }}>
                    <div className="form-group">
                      <label className="form-label">Pourquoi choisissez-vous Apeiron Buvette ? <span className="req">*</span></label>
                      <textarea
                        className="form-textarea"
                        rows="4"
                        placeholder="Parlez-nous de votre projet et de vos besoins…"
                        value={motivation}
                        onChange={(e) => setMotivation(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Vos ambitions pour votre établissement</label>
                      <textarea
                        className="form-textarea"
                        rows="3"
                        placeholder="Où voulez-vous amener votre buvette dans les prochains mois ?"
                        value={ambitions}
                        onChange={(e) => setAmbitions(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Comment avez-vous connu Apeiron ?</label>
                      <select className="form-select" value={howFound} onChange={(e) => setHowFound(e.target.value)}>
                        <option value="">Sélectionner…</option>
                        <option value="ami">Un ami / collègue</option>
                        <option value="reseaux">Réseaux sociaux</option>
                        <option value="recherche">Moteur de recherche</option>
                        <option value="pub">Publicité</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    {/* CGU */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', cursor: 'pointer' }} onClick={() => setCguChecked(!cguChecked)}>
                      <div className={`cgu-checkbox ${cguChecked ? 'checked' : ''}`}>
                        {cguChecked && (
                          <svg width="11" height="9" viewBox="0 0 11 9">
                            <polyline points="1,4.5 3.5,7 10,1" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: '.84rem', color: 'var(--text-secondary)' }}>
                        J'accepte les <a href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} style={{ color: 'var(--gold)' }}>conditions générales d'utilisation</a> d'Apeiron Buvette.
                      </span>
                    </div>
                  </div>

                  {regError && <div className="form-error show" style={{ marginTop: '1rem', fontSize: '.88rem' }}>{regError}</div>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => goStep(2)}>← Retour</button>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                      {loading ? 'Création en cours…' : '🚀 Créer ma buvette'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </main>
      </div>

      {/* Toast Box */}
      <div className="toast-box">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type} show`}>
            <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span className="toast-msg">{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
