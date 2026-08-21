import React, { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import Toast from './components/common/Toast';

import UserRegistry from './components/admin/UserRegistry';
import CustomerRegistry from './components/admin/CustomerRegistry';
import BranchRegistry from './components/admin/BranchRegistry';
import RoleManager from './components/admin/RoleManager';
import GeneralLedger from './components/admin/GeneralLedger';
import KYCVerification from './components/admin/KYCVerification';
import BranchCustomers from './components/manager/BranchCustomers';
import CustomerOnboarding from './components/employee/CustomerOnboarding';

import SummaryDashboard from './components/system/SummaryDashboard';
import CounterOperations from './components/banking/CounterOperations';
import TreasuryVault from './components/banking/TreasuryVault';
import InterestEngine from './components/banking/InterestEngine';
import DeveloperPortal from './components/system/DeveloperPortal';
import DisasterRecovery from './components/system/DisasterRecovery';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bsb_user') || localStorage.getItem('nexus_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('bsb_token') || localStorage.getItem('nexus_token') || '');
  const [csrfToken, setCsrfToken] = useState(() => localStorage.getItem('bsb_csrf') || localStorage.getItem('nexus_csrf') || '');
  
  // Option B: Initialize activeTab from URL Hash (e.g. #users -> 'users')
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'summary';
  });

  const [toast, setToast] = useState(null);

  // Tab select handler syncing URL Hash
  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = `#${tabId}`;
  };

  // Sync state if user manually changes URL hash or clicks browser Back/Forward
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHashChange);

    // Validate stored token with backend
    if (token) {
      apiCall('/api/auth/me').then(data => {
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem('bsb_user', JSON.stringify(data.user));
        }
      }).catch(() => {
        handleLogout();
      });
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLoginSuccess = (userData, authToken, csrf) => {
    setUser(userData);
    setToken(authToken);
    setCsrfToken(csrf || '');
    localStorage.setItem('bsb_user', JSON.stringify(userData));
    localStorage.setItem('bsb_token', authToken);
    if (csrf) localStorage.setItem('bsb_csrf', csrf);

    const role = (userData?.role || '').toLowerCase();
    let defaultTab = 'summary';
    if (role.includes('manager')) {
      defaultTab = 'branch-customers';
    }

    const hash = window.location.hash.replace('#', '');
    const initialTab = (hash && hash !== 'customer-registry') ? hash : defaultTab;
    setActiveTab(initialTab);
    window.location.hash = `#${initialTab}`;
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    setCsrfToken('');
    localStorage.removeItem('bsb_user');
    localStorage.removeItem('bsb_token');
    localStorage.removeItem('bsb_csrf');
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_csrf');
    window.location.hash = '';
    showToast('Logged out of session.', 'info');
  };

  const getApiUrl = (endpoint) => {
    if (!endpoint) return '';
    if (endpoint.startsWith('http')) return endpoint;
    const port = window.location.port;
    const apiBase = (port === '5000') ? '' : 'http://localhost:5000';
    return `${apiBase}${endpoint}`;
  };

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (csrfToken) headers['x-csrf-token'] = csrfToken;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const fullUrl = getApiUrl(endpoint);
    const res = await fetch(fullUrl, opts);

    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      throw new Error(`Server returned invalid response format (${res.status}): ${text.substring(0, 80)}`);
    }

    if (res.status === 401) {
      handleLogout();
      throw new Error('Session expired. Please sign in again.');
    }

    if (!res.ok) {
      throw new Error(data.message || 'API Call failed');
    }
    return data;
  };

  if (!user || !token) {
    return (
      <div id="app">
        <Toast toast={toast} />
        <Login onLoginSuccess={handleLoginSuccess} showToast={showToast} />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserRegistry apiCall={apiCall} showToast={showToast} />;
      case 'branch-customers':
        return <BranchCustomers user={user} apiCall={apiCall} showToast={showToast} />;
      case 'customer-onboarding':
        return <CustomerOnboarding user={user} apiCall={apiCall} showToast={showToast} />;
      case 'customer-registry':
        return <CustomerRegistry apiCall={apiCall} showToast={showToast} />;
      case 'kyc':
        return <KYCVerification apiCall={apiCall} showToast={showToast} />;
      case 'branches':
        return <BranchRegistry apiCall={apiCall} showToast={showToast} />;
      case 'role-manager':
        return <RoleManager apiCall={apiCall} showToast={showToast} />;
      case 'ledger':
        return <GeneralLedger apiCall={apiCall} showToast={showToast} />;
      case 'employees':
      case 'customers':
      case 'transactions':
        return <CounterOperations apiCall={apiCall} showToast={showToast} />;
      case 'treasury':
        return <TreasuryVault apiCall={apiCall} showToast={showToast} />;
      case 'interest':
        return <InterestEngine apiCall={apiCall} showToast={showToast} />;
      case 'developers':
        return <DeveloperPortal showToast={showToast} />;
      case 'disaster':
        return <DisasterRecovery apiCall={apiCall} showToast={showToast} />;
      case 'summary':
      default:
        return <SummaryDashboard user={user} apiCall={apiCall} showToast={showToast} />;
    }
  };

  return (
    <div id="app">
      <Toast toast={toast} />
      <div className="dashboard-container">
        <Sidebar user={user} activeTab={activeTab} onTabSelect={handleTabSelect} onLogout={handleLogout} />
        <main className="main-content">
          <Header user={user} activeTab={activeTab} />
          <div className="content-body" style={{ padding: '20px' }}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
