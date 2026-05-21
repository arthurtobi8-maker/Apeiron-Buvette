import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AUTH } from '../services/auth';

export default function Landing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const buvetteId = searchParams.get('buvette');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si un QR Code est scanné, on redirige instantanément vers le menu client
    if (buvetteId) {
      navigate(`/menu?buvette=${buvetteId}`);
      return;
    }

    // Sinon on vérifie si l'utilisateur (gérant/serveur) a déjà une session
    AUTH.checkAuth().then((sess) => {
      setSession(sess);
      setLoading(false);
    });
  }, [buvetteId, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', background: '#030305' }}>
        <div className="loader-spin"></div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* HEADER / NAV */}
      <header className="ld-header">
        <div className="ld-logo">
          <div className="ld-logo-icon">A</div>
          <span>Apeiron Buvette</span>
        </div>
        <div className="ld-nav">
          {session ? (
            <button className="btn btn-primary" onClick={() => navigate(session.role === 'admin' ? '/dashboard' : '/serveur')}>
              Aller au Tableau de Bord
            </button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => navigate('/login')}>Connexion</button>
              <button className="btn btn-primary" onClick={() => navigate('/register')}>Créer ma Buvette</button>
            </>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="ld-hero">
        <div className="ld-hero-content">
          <h1 className="ld-title">La gestion nouvelle génération pour votre <span>Bar & Restaurant</span></h1>
          <p className="ld-subtitle">
            Oubliez les carnets et les temps d'attente. Apeiron Buvette vous offre un écosystème en temps réel complet : Commandes par QR Code, interface serveur instantanée et tableau de bord gérant ultra-puissant.
          </p>
          <div className="ld-hero-actions">
            {!session && (
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
                Démarrer gratuitement
              </button>
            )}
            <button className="btn btn-outline btn-lg" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              Découvrir les fonctionnalités
            </button>
          </div>
        </div>
        <div className="ld-hero-visual">
          <div className="ld-glass-panel">
            <div className="ld-fake-header">
              <div className="ld-fake-dot" style={{background: '#ff5f56'}}></div>
              <div className="ld-fake-dot" style={{background: '#ffbd2e'}}></div>
              <div className="ld-fake-dot" style={{background: '#27c93f'}}></div>
            </div>
            <div className="ld-fake-body">
              <div className="ld-stat-row">
                <div className="ld-stat-card">
                  <span>Chiffre d'Affaires</span>
                  <strong>1 250 FCFA</strong>
                </div>
                <div className="ld-stat-card">
                  <span>Commandes</span>
                  <strong>34</strong>
                </div>
              </div>
              <div className="ld-fake-chart"></div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="ld-features">
        <div className="ld-section-title">
          <h2>Tout ce dont vous avez besoin. <span>En un seul endroit.</span></h2>
        </div>
        <div className="ld-grid">
          <div className="ld-feat-card">
            <div className="ld-icon">📱</div>
            <h3>Menu QR Code</h3>
            <p>Vos clients scannent un QR Code sur leur table, parcourent votre menu dynamique et commandent instantanément depuis leur smartphone.</p>
          </div>
          <div className="ld-feat-card">
            <div className="ld-icon">⚡</div>
            <h3>Temps Réel Firebase</h3>
            <p>Une commande est passée ? Elle apparaît en moins d'une seconde sur l'écran du serveur et du gérant. Zéro rafraîchissement nécessaire.</p>
          </div>
          <div className="ld-feat-card">
            <div className="ld-icon">📈</div>
            <h3>Tableau de Bord Gérant</h3>
            <p>Gérez vos produits, suivez vos statistiques, contrôlez vos employés (serveurs) et analysez votre rentabilité en temps réel.</p>
          </div>
          <div className="ld-feat-card">
            <div className="ld-icon">🖨️</div>
            <h3>Tickets & Factures PDF</h3>
            <p>Générez des tickets de caisse professionnels en un clic pour vos clients, avec un design propre et votre propre logo.</p>
          </div>
          <div className="ld-feat-card">
            <div className="ld-icon">🎨</div>
            <h3>100% Personnalisable</h3>
            <p>Ajustez les couleurs (thème) à votre image de marque, ajoutez votre propre logo et rendez votre buvette unique.</p>
          </div>
          <div className="ld-feat-card">
            <div className="ld-icon">🚀</div>
            <h3>Zéro Matériel Requis</h3>
            <p>L'application fonctionne sur n'importe quel appareil. Utilisez vos propres tablettes, téléphones ou ordinateurs existants.</p>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="ld-cta">
        <div className="ld-cta-box">
          <h2>Prêt à révolutionner votre établissement ?</h2>
          <p>Rejoignez l'écosystème Apeiron Studio aujourd'hui et prenez une longueur d'avance.</p>
          {!session && (
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>Créer ma Buvette Maintenant</button>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ld-footer">
        <div className="ld-footer-brand">
          <strong>Apeiron Studio</strong>
          <p>L'écosystème de création web avancé.</p>
        </div>
        <div className="ld-footer-links">
          <span>© {new Date().getFullYear()} Apeiron Buvette. Tous droits réservés.</span>
        </div>
      </footer>
    </div>
  );
}
