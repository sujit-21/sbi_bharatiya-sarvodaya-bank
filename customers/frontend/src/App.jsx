import React, { useState } from 'react';
import CustomerLogin from './CustomerLogin';

import SummaryDashboard from '../../../frontend/src/components/system/SummaryDashboard';
import Toast from '../../../frontend/src/components/common/Toast';
import Header from '../../../frontend/src/components/common/Header';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('customer_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('customer_token') || '');
  const [activeTab, setActiveTab] = useState('summary');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLoginSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('customer_user', JSON.stringify(userData));
    localStorage.setItem('customer_token', authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('customer_user');
    localStorage.removeItem('customer_token');
    showToast('Logged out of NetBanking.', 'info');
  };

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(endpoint, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'NetBanking API Call failed');
    return data;
  };

  if (!user || !token) {
    return (
      <div id="app">
        <Toast toast={toast} />
        <CustomerLogin onLoginSuccess={handleLoginSuccess} showToast={showToast} />
      </div>
    );
  }

  const customerTabs = [
    { id: 'summary', name: 'My Accounts & Balance', icon: '🏦' },
    { id: 'profile', name: 'My Profile', icon: '👤' },
    { id: 'apply-services', name: 'Apply (Cards & Cheques)', icon: '💳' },
    { id: 'statements', name: 'Account Statements', icon: '📄' },
    { id: 'transfers', name: 'Send Money / Transfers', icon: '💸' },
    { id: 'beneficiaries', name: 'Contacts / Nominees', icon: '👥' },
    { id: 'products', name: 'Apply Loans / FD / RD', icon: '🌱' },
    { id: 'assistant', name: 'AI Financial Assistant', icon: '🤖' },
    { id: 'settings', name: 'Security & Transaction PIN', icon: '⚙️' }
  ];

  const userName = user?.fullName || user?.name || 'Valued Customer';
  const userRole = user?.role || 'Customer';
  const initials = userName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CU';

  const renderContent = () => {
    return (
      <div>
        <SummaryDashboard user={user} apiCall={apiCall} showToast={showToast} />
      </div>
    );
  };

  return (
    <div id="app">
      <Toast toast={toast} />
      <div className="dashboard-wrapper">
        <aside className="sidebar">
          <div className="sidebar-header" style={{ height: '68px', minHeight: '68px', padding: '0 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
            <div className="sidebar-brand" style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', borderRadius: '10px', border: '1px solid #fed7aa', display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '2.5px', color: '#ea580c' }}>BSB</span>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#ffffff', color: '#ea580c', border: '1px solid #ffedd5', letterSpacing: '0.5px', boxShadow: '0 1px 3px rgba(234,88,12,0.1)' }}>NETBANKING</span>
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#7c2d12', whiteSpace: 'nowrap' }}>BHARATIYA SARVODAYA BANK</span>
            </div>
          </div>

          <nav className="sidebar-menu" id="sidebar-menu-list">
            {customerTabs.map(link => (
              <button
                key={link.id}
                className={`menu-item ${activeTab === link.id ? 'active' : ''}`}
                onClick={() => setActiveTab(link.id)}
              >
                <span className="icon">{link.icon}</span> {link.name}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-outline-danger btn-block" onClick={handleLogout}>
              Sign Out NetBanking
            </button>
          </div>
        </aside>

        <main className="main-content">
          <Header user={user} activeTab={activeTab} />
          <div className="content-body" style={{ padding: '24px' }}>
            {renderContent()}
          </div>
          <footer className="app-system-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ color: '#0f172a', fontWeight: 800 }}>© 2026 Bharatiya Sarvodaya Bank (BSB)</span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span>Retail NetBanking Portal</span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>🛡️ RBI Regulated & ISO 27001 Certified</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#2563eb', fontWeight: 700 }}>🔒 256-Bit SSL Encrypted</span>
              <span style={{ color: '#475569' }}>Security Status: <strong style={{ color: '#059669' }}>Protected 🟢</strong></span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
