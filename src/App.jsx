import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ServeurSpace from './pages/ServeurSpace';
import ClientMenu from './pages/ClientMenu';
import LicensingGenerator from './pages/LicensingGenerator';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
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
