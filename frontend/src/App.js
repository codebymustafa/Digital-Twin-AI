import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import GlobalLoader from './components/GlobalLoader';
import GlobalChatbot from './components/GlobalChatbot';

import Landing from './pages/LandingV2';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import About from './pages/About';

import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import RealitySimulation from './pages/RealitySimulation';
import Premium from './pages/Premium';
import AdminHub from './components/AdminHub';

function AdminRoute() {
  try {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return <Navigate to="/login" />;
    if (user.role !== 'admin') return <Navigate to="/dashboard" />;
    return <div className="min-h-screen bg-[#050308]"><AdminHub /></div>;
  } catch {
    return <Navigate to="/login" />;
  }
}

const FULL_PAGE_ROUTES = ['/dashboard', '/onboard', '/simulation', '/admin', '/premium'];

function AppInner() {
  const location = useLocation();
  const isFullPage = FULL_PAGE_ROUTES.includes(location.pathname);

  return (
    <>
      <CustomCursor />
      {!isFullPage && <GlobalChatbot />}
      <div className="min-h-screen bg-cyberBg text-cyberText selection:bg-cyberNeon selection:text-cyberBg overflow-hidden flex flex-col">
        {!isFullPage && <Navbar />}

        <div className="fixed inset-0 pointer-events-none z-0 opacity-10"
             style={{
                 backgroundImage: 'radial-gradient(circle at 50% 50%, #45a29e 0%, transparent 60%), linear-gradient(rgba(102, 252, 241, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(102, 252, 241, 0.05) 1px, transparent 1px)',
                 backgroundSize: '150% 150%, 40px 40px, 40px 40px',
                 backgroundPosition: 'center',
             }}
        />
        
        <div className="relative z-10 w-full h-full min-h-screen flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/onboard" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/simulation" element={<RealitySimulation />} />
            <Route path="/premium" element={<Premium />} />
            
            <Route path="/admin" element={<AdminRoute />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>

        {!isFullPage && <Footer />}
        
      </div>
    </>
  );
}

function App() {
  return (
    <GlobalLoader>
      <Router>
        <AppInner />
      </Router>
    </GlobalLoader>
  );
}

export default App;
