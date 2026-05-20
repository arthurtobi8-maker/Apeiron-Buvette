import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AUTH } from '../services/auth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [pwVisible, setPwVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const b = await AUTH.login(email.trim(), password);
      AUTH.setSession(b.id, b.role, remember, b.waiterName);
      if (b.role === 'waiter') {
        navigate('/serveur');
      } else {
        navigate('/dashboard');
      }
    } catch (ex) {
      setError(ex.message || 'Une erreur est survenue lors de la connexion.');
      setLoading(false);
    }
  };

  return (
    <div className="gradient-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <style>{`
        .login-box {
          width: 100%; max-width: 420px;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--r-xl); padding: 2.5rem 2rem;
          animation: slideUp .4s var(--ease) forwards;
        }
        .login-logo { text-align: center; margin-bottom: 2rem; }
        .login-icon { font-size: 2.5rem; display: block; margin-bottom: .5rem; }
        .login-brand { font-family: var(--font-d); font-size: 1.4rem; font-weight: 800; color: var(--gold); }
        .login-sub { font-size: .85rem; color: var(--text-muted); margin-top: .25rem; }
      `}</style>

      <div className="login-box">
        <div className="login-logo">
          <span className="login-icon">🍺</span>
          <div className="login-brand">Apeiron Buvette</div>
          <div className="login-sub">Connectez-vous à votre espace</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="votre@email.com"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe / Code</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={pwVisible ? 'text' : 'password'}
                placeholder="••••••••"
                style={{ paddingRight: '2.8rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                style={{
                  position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.1rem',
                  cursor: 'pointer', padding: '.2rem'
                }}
                onClick={() => setPwVisible(!pwVisible)}
              >
                {pwVisible ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.83rem', color: 'var(--text-secondary)' }}>
              <div className="toggle" style={{ width: '40px', height: '22px' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <div className="toggle-sl" style={{ fontSize: '.6rem' }}></div>
              </div>
              Se souvenir de moi (30 jours)
            </label>
          </div>

          {error && <div className="form-error show" style={{ fontSize: '.87rem' }}>{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', marginTop: '.4rem' }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="divider"></div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '.83rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>Pas encore de compte ?</p>
          <Link to="/register" className="btn btn-secondary btn-sm">Créer ma buvette →</Link>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Une création de <strong style={{ color: 'var(--theme)' }}>Apeiron Studio</strong><br />
          Conçu par <strong style={{ color: '#fff' }}>Arthur Tobi TCHABI</strong>
        </div>
      </div>
    </div>
  );
}
