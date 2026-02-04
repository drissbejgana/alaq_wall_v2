import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import QuoteWizard from './pages/QuoteWizard';
import QuoteDetails from './pages/QuoteDetails';
import Profile from './pages/Profile';
import Simulator from './pages/Simulator';
import Auth from './pages/Auth';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // Convert backend user to your User type format
  const userForComponents = user ? {
    id: user.id,
    email: user.email,
    name: `${user.first_name} ${user.last_name}`.trim() || user.username,
  } : null;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      <Sidebar 
        user={userForComponents} 
        isOpen={sidebarOpen} 
        onLogout={handleLogout} 
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header user={userForComponents} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-[1400px] mx-auto p-6 md:p-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};

const PublicRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to dashboard if already logged in
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Public routes - redirect to dashboard if logged in */}
      <Route element={<PublicRoute />}>
        <Route path="/auth" element={<Auth />} />
      </Route>
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard onNewQuote={() => navigate('/wizard')} activeSection="overview" />} />
          <Route path="/quotes" element={<Dashboard onNewQuote={() => navigate('/wizard')} activeSection="quotes" />} />
          <Route path="/quotes/:id" element={<QuoteDetails />} />
          <Route path="/orders" element={<Dashboard onNewQuote={() => navigate('/wizard')} activeSection="orders" />} />
          <Route path="/invoices" element={<Dashboard onNewQuote={() => navigate('/wizard')} activeSection="invoices" />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wizard" element={<QuoteWizard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;