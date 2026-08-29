import React, { useState, useEffect } from 'react';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import CandidateJobsPage from './components/CandidateJobsPage';
import { ToastProvider } from './context/ToastContext';
import { API_URL } from './config.js';

function AppContent() {
  const [candidates, setCandidates] = useState([]);
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const isCandidatePortal = window.location.pathname.startsWith('/jobs');

  useEffect(() => {
    let isMounted = true;
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!token || !storedUser) {
        if (isMounted) setIsVerifying(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
        });

        if (res.ok && isMounted) {
          const data = await res.json();
          setUser(data.user);
        } else if (isMounted) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (err) {
        console.warn('Backend unreachable, using cached session:', err.message);
        if (isMounted) setUser(JSON.parse(storedUser));
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    };

    verifyToken();
    return () => { isMounted = false; };
  }, []);

  if (isCandidatePortal) {
    return <CandidateJobsPage />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (isVerifying) {
    return (
      <div className="app-root">
        <div className="auth-page">
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div className="spinner-border mb-3" style={{ width: '28px', height: '28px' }}></div>
            <p className="font-medium text-slate-700">กำลังตรวจสอบสิทธิ์การเข้าใช้งานองค์กร...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      {!user ? (
        showRegister ? (
          <Register
            onSwitchToLogin={() => setShowRegister(false)}
            onLogin={(userData) => setUser(userData)}
          />
        ) : (
          <Login
            onSwitchToRegister={() => setShowRegister(true)}
            onLogin={(userData) => setUser(userData)}
          />
        )
      ) : (
        <Dashboard
          candidates={candidates}
          setCandidates={setCandidates}
          user={user}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
