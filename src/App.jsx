import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AUTH } from './services/auth';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ServeurSpace from './pages/ServeurSpace';
import ClientMenu from './pages/ClientMenu';
import LicensingGenerator from './pages/LicensingGenerator';

function RootRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const buvetteId = searchParams.get('buvette');

  useEffect(() => {
    if (buvetteId) {
      navigate(`/menu?buvette=${buvetteId}`);
      return;
    }

    AUTH.checkAuth().then((session) => {
      if (session) {
        if (session.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/serveur');
        }
      } else {
        navigate('/login');
      }
    });
  }, [buvetteId, navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
      <div className="loader-spin"></div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Chargement d'Apeiron Buvette...</div>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/serveur" element={<ServeurSpace />} />
        <Route path="/menu" element={<ClientMenu />} />
        <Route path="/keygen" element={<LicensingGenerator />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
