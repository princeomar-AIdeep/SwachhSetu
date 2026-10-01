import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { RequireAuth, useAuth, homeFor } from './auth.jsx';
import Home from './pages/Home.jsx'; import Login from './pages/Login.jsx'; import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx'; import Report from './pages/Report.jsx'; import Pickup from './pages/Pickup.jsx'; import Tracking from './pages/Tracking.jsx';
import WasteWise from './pages/WasteWise.jsx'; import Awareness from './pages/Awareness.jsx'; import Leaderboard from './pages/Leaderboard.jsx';
import Collector from './pages/Collector.jsx'; import Admin from './pages/Admin.jsx'; import Profile from './pages/Profile.jsx'; import NotFound from './pages/NotFound.jsx';

function ScrollToHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView(), 50); else window.scrollTo(0, 0); }, [pathname, hash]);
  return null;
}
// Logged-in users skip the login/register screens.
const Guest = ({ children }) => { const { user } = useAuth(); return user ? <Navigate to={homeFor(user.role)} replace /> : children; };
const P = (roles, el) => <RequireAuth roles={roles}>{el}</RequireAuth>;

export default function App() {
  return (
    <>
      <ScrollToHash />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} /><Route path="/awareness" element={<Awareness />} /><Route path="/wastewise" element={<WasteWise />} />
        <Route path="/login" element={<Guest><Login /></Guest>} /><Route path="/register" element={<Guest><Register /></Guest>} />
        {/* Protected - also enforced by the API */}
        <Route path="/dashboard" element={P(['citizen'], <Dashboard />)} /><Route path="/report" element={P(['citizen'], <Report />)} />
        <Route path="/pickup" element={P(['citizen'], <Pickup />)} /><Route path="/tracking" element={P(['citizen'], <Tracking />)} />
        <Route path="/leaderboard" element={P(null, <Leaderboard />)} /><Route path="/profile" element={P(null, <Profile />)} />
        <Route path="/collector" element={P(['collector'], <Collector />)} /><Route path="/admin" element={P(['admin'], <Admin />)} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
