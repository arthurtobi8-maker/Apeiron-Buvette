import React, { useState } from 'react';

export default function LicensingGenerator() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [buvetteId, setBuvetteId] = useState('');
  const [plan, setPlan] = useState('Pro');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const correctPassword = 'APEIRON-ADMIN-2026';

  const handleUnlock = (e) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthorized(true);
    } else {
      alert('Mot de passe incorrect ❌');
    }
  };

  const handleGenerate = () => {
    if (!buvetteId.trim()) {
      alert('Veuillez renseigner l\'ID de l\'établissement.');
      return;
    }

    const secretSalt = "ApeironBuvetteSecret2026";
    const input = `${buvetteId.trim()}-${plan}-${secretSalt}`;
    
    // Checksum hash logic
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    const positiveHash = Math.abs(hash);
    const base36 = positiveHash.toString(36).toUpperCase().padStart(8, '0');
    const key = `${plan.toUpperCase()}-${base36.slice(0, 4)}-${base36.slice(4, 8)}`;

    setGeneratedKey(key);
    setCopySuccess(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Voici votre clé d'activation Apeiron Buvette pour la formule ${plan.toUpperCase()} :\n\n👉 *${generatedKey}*\n\nCollez ce code dans votre onglet "Abonnement" pour l'activer ! 🍺`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (!isAuthorized) {
    return (
      <div className="gradient-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem' }}>
        <div className="mesh-bg"></div>
        <div style={{ textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '3rem 2rem', maxWidth: '400px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔑</div>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', color: '#fff' }}>Générateur Administrateur</div>
          <form onSubmit={handleUnlock}>
            <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ color: 'var(--theme)' }}>Mot de passe d'accès</label>
              <input
                className="form-input"
                type="password"
                placeholder="Entrez le mot de passe"
                style={{ textAlign: 'center', fontSize: '1.1rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} type="submit">
              Déverrouiller
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-bg" style={{ minHeight: '100vh', padding: '2rem 1.5rem', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="mesh-bg"></div>
      
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '2rem', maxWidth: '450px', width: '100%', boxSizing: 'border-box', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem' }}>🎫</div>
          <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '.5rem 0 0 0' }}>Générateur de Licence</h1>
          <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', margin: '.25rem 0 0 0' }}>Apeiron Buvette Central</p>
        </div>

        <div className="form-grid" style={{ gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">ID Établissement (Buvette)</label>
            <input
              className="form-input"
              type="text"
              placeholder="Collez l'ID ici"
              value={buvetteId}
              onChange={(e) => setBuvetteId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Formule d'abonnement</label>
            <select 
              className="form-input"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              style={{ background: '#111', color: '#fff' }}
            >
              <option value="Pro">Pro (10 000 FCFA)</option>
              <option value="Ultimate">Ultimate (25 000 FCFA)</option>
            </select>
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}
          onClick={handleGenerate}
        >
          ⚡ Générer la Clé
        </button>

        {generatedKey && (
          <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(0,0,0,0.3)', border: '1px dashed var(--theme)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '.5rem' }}>Clé Générée</div>
            <div style={{ fontFamily: 'monospace', fontSize: '1.35rem', fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>
              {generatedKey}
            </div>

            <div style={{ display: 'flex', gap: '.5rem', marginTop: '1.25rem' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleCopy}
              >
                {copySuccess ? 'Copié ! ✓' : '📋 Copier'}
              </button>
              <button 
                className="btn btn-primary btn-sm" 
                style={{ flex: 1, justifyContent: 'center', background: '#25D366', borderColor: '#25D366', color: '#fff' }}
                onClick={handleShareWhatsApp}
              >
                💬 Partager WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
