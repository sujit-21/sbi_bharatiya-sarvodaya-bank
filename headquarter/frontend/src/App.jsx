import React, { useState, useEffect } from 'react';
import HQLogin from './HQLogin';

import UserRegistry from '../../../frontend/src/components/admin/UserRegistry';
import BranchCustomers from '../../../frontend/src/components/manager/BranchCustomers';
import BranchRegistry from '../../../frontend/src/components/admin/BranchRegistry';
import RoleManager from '../../../frontend/src/components/admin/RoleManager';
import GeneralLedger from '../../../frontend/src/components/admin/GeneralLedger';
import KYCVerification from '../../../frontend/src/components/admin/KYCVerification';
import SummaryDashboard from '../../../frontend/src/components/system/SummaryDashboard';
import DeveloperPortal from '../../../frontend/src/components/system/DeveloperPortal';
import DisasterRecovery from '../../../frontend/src/components/system/DisasterRecovery';
import InterestEngine from '../../../frontend/src/components/banking/InterestEngine';
import Toast from '../../../frontend/src/components/common/Toast';
import Header from '../../../frontend/src/components/common/Header';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hq_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('hq_token') || '');
  const [activeTab, setActiveTab] = useState('summary');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLoginSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('hq_user', JSON.stringify(userData));
    localStorage.setItem('hq_token', authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('hq_user');
    localStorage.removeItem('hq_token');
    showToast('Logged out of HQ Console.', 'info');
  };

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(endpoint, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'HQ API Call failed');
    return data;
  };

  if (!user || !token) {
    return (
      <div id="app">
        <Toast toast={toast} />
        <HQLogin onLoginSuccess={handleLoginSuccess} showToast={showToast} />
      </div>
    );
  }

  const hqTabs = [
    { id: 'summary', name: 'Core Summary', icon: '🏦' },
    { id: 'users', name: 'User Registry', icon: '👥' },
    { id: 'branch-customers', name: 'Branch Customers', icon: '🏢' },
    { id: 'branches', name: 'Branch Registry', icon: '🏢' },
    { id: 'role-manager', name: 'Role Manager', icon: '🛡️' },
    { id: 'ledger', name: 'General Ledger', icon: '📈' },
    { id: 'interest', name: 'Interest Engine', icon: '⚙️' },
    { id: 'disaster', name: 'Backup & Recovery', icon: '💾' },
    { id: 'developers', name: 'Developer Portal', icon: '💻' }
  ];

  const userName = user?.fullName || user?.name || 'Root Administrator';
  const userRole = user?.role || 'Super Admin';
  const initials = userName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SA';

  const renderContent = () => {
    switch (activeTab) {
      case 'users': return <UserRegistry apiCall={apiCall} showToast={showToast} />;
      case 'branch-customers': return <BranchCustomers apiCall={apiCall} showToast={showToast} user={user} />;
      case 'branches': return <BranchRegistry apiCall={apiCall} showToast={showToast} />;
      case 'role-manager': return <RoleManager apiCall={apiCall} showToast={showToast} />;
      case 'ledger': return <GeneralLedger apiCall={apiCall} showToast={showToast} />;
      case 'interest': return <InterestEngine apiCall={apiCall} showToast={showToast} />;
      case 'disaster': return <DisasterRecovery apiCall={apiCall} showToast={showToast} />;
      case 'developers': return <DeveloperPortal showToast={showToast} />;
      case 'summary':
      default: return <SummaryDashboard user={user} apiCall={apiCall} showToast={showToast} />;
    }
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
                <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#ffffff', color: '#ea580c', border: '1px solid #ffedd5', letterSpacing: '0.5px', boxShadow: '0 1px 3px rgba(234,88,12,0.1)' }}>HQ</span>
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#7c2d12', whiteSpace: 'nowrap' }}>BHARATIYA SARVODAYA BANK</span>
            </div>
          </div>

          <nav className="sidebar-menu" id="sidebar-menu-list">
            {hqTabs.map(link => (
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
              Sign Out HQ
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
              <span>Headquarter Core Console</span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>🛡️ RBI Regulated & ISO 27001 Certified</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#2563eb', fontWeight: 700 }}>🔒 256-Bit SSL Encrypted</span>
              <span style={{ color: '#475569' }}>HQ Status: <strong style={{ color: '#059669' }}>Operational 🟢</strong></span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
