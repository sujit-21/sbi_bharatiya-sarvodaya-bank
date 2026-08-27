import React, { useState } from 'react';
import BranchLogin from './BranchLogin';

import BranchCustomers from '../../../frontend/src/components/manager/BranchCustomers';
import CustomerOnboarding from '../../../frontend/src/components/employee/CustomerOnboarding';
import CounterOperations from '../../../frontend/src/components/banking/CounterOperations';
import TreasuryVault from '../../../frontend/src/components/banking/TreasuryVault';
import KYCVerification from '../../../frontend/src/components/admin/KYCVerification';
import SummaryDashboard from '../../../frontend/src/components/system/SummaryDashboard';
import Toast from '../../../frontend/src/components/common/Toast';
import Header from '../../../frontend/src/components/common/Header';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('branch_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('branch_token') || '');
  const [activeTab, setActiveTab] = useState('branch-customers');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLoginSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('branch_user', JSON.stringify(userData));
    localStorage.setItem('branch_token', authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('branch_user');
    localStorage.removeItem('branch_token');
    showToast('Logged out of Branch Terminal.', 'info');
  };

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(endpoint, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Branch API Call failed');
    return data;
  };

  if (!user || !token) {
    return (
      <div id="app">
        <Toast toast={toast} />
        <BranchLogin onLoginSuccess={handleLoginSuccess} showToast={showToast} />
      </div>
    );
  }

  const branchTabs = [
    { id: 'summary', name: 'Branch Overview', icon: '🏦' },
    { id: 'deposit-withdraw', name: 'Deposits & Withdrawals', icon: '💳' },
    { id: 'branch-customers', name: 'Branch Customers', icon: '👥' },
    { id: 'customer-onboarding', name: 'Onboard Customer', icon: '👤' },
    { id: 'treasury', name: 'Vault & Cash Limits', icon: '💰' },
    { id: 'kyc', name: 'KYC Verification', icon: '🪪' }
  ];

  const userName = user?.fullName || user?.name || 'Branch Staff';
  const userRole = user?.role || 'Branch Staff';
  const initials = userName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'BS';

  const renderContent = () => {
    switch (activeTab) {
      case 'deposit-withdraw':
      case 'transactions': return <CounterOperations apiCall={apiCall} showToast={showToast} />;
      case 'branch-customers': return <BranchCustomers user={user} apiCall={apiCall} showToast={showToast} />;
      case 'customer-onboarding': return <CustomerOnboarding user={user} apiCall={apiCall} showToast={showToast} />;
      case 'treasury': return <TreasuryVault apiCall={apiCall} showToast={showToast} />;
      case 'kyc': return <KYCVerification apiCall={apiCall} showToast={showToast} />;
      case 'summary':
      default: return <SummaryDashboard user={user} apiCall={apiCall} showToast={showToast} />;
    }
  };

  return (
    <div id="app">
      <Toast toast={toast} />
      <div className="dashboard-wrapper">
        <aside className="sidebar">
          <div className="sidebar-header" style={{ height: '60px', minHeight: '60px', padding: '0 8px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
            <div className="sidebar-brand" style={{ padding: '5px 8px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', borderRadius: '8px', border: '1px solid #fed7aa', display: 'flex', flexDirection: 'column', gap: '1px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, letterSpacing: '2px', color: '#ea580c' }}>BSB</span>
                <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: '#ffffff', color: '#ea580c', border: '1px solid #ffedd5', letterSpacing: '0.5px', boxShadow: '0 1px 3px rgba(234,88,12,0.1)' }}>BRANCH</span>
              </div>
              <span style={{ fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#7c2d12', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>BHARATIYA SARVODAYA BANK</span>
            </div>
          </div>

          <nav className="sidebar-menu" id="sidebar-menu-list">
            {branchTabs.map(link => (
              <button
                key={link.id}
                className={`menu-item ${activeTab === link.id ? 'active' : ''}`}
                onClick={() => setActiveTab(link.id)}
              >
                <span className="icon">{link.icon}</span> {link.name}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer" style={{ padding: '8px 10px', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-outline-danger btn-block" onClick={handleLogout} style={{ fontSize: '0.78rem', padding: '7px 10px', borderRadius: '6px', fontWeight: 700 }}>
              Sign Out Terminal
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
              <span>Branch CBS Staff Terminal</span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>🛡️ RBI Regulated & ISO 27001 Certified</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#2563eb', fontWeight: 700 }}>🔒 256-Bit SSL Encrypted</span>
              <span style={{ color: '#475569' }}>CBS Status: <strong style={{ color: '#059669' }}>Operational 🟢</strong></span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
