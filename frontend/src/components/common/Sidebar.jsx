import React from 'react';

export default function Sidebar({ user, activeTab, onTabSelect, onLogout }) {
  const getRoleLinks = () => {
    const allAvailableLinks = [
      { id: 'summary', name: 'Core Summary', icon: '🏦' },
      { id: 'deposit-withdraw', name: 'Deposits & Withdrawals', icon: '💳' },
      { id: 'branch-customers', name: 'Branch Customers', icon: '👥' },
      { id: 'customer-onboarding', name: 'Onboard Customer', icon: '👤' },
      { id: 'users', name: 'User Registry', icon: '👥' },
      { id: 'kyc', name: 'KYC Compliance', icon: '🪪' },
      { id: 'role-manager', name: 'Role Manager', icon: '🛡️' },
      { id: 'branches', name: 'Branch Registry', icon: '🏢' },
      { id: 'ledger', name: 'General Ledger', icon: '📈' },
      { id: 'developers', name: 'API Developer Portal', icon: '💻' },
      { id: 'interest', name: 'Interest Engine', icon: '⚙️' },
      { id: 'disaster', name: 'Backup & Recovery', icon: '💾' },
      { id: 'approvals', name: 'Pending Approvals', icon: '🗳️' },
      { id: 'employees', name: 'Branch Tellers', icon: '👥' },
      { id: 'treasury', name: 'Vault & Cash', icon: '💰' },
      { id: 'customers', name: 'Accounts Assistance', icon: '👥' },
      { id: 'transactions', name: 'Deposits & Withdrawals', icon: '💵' },
      { id: 'crm', name: 'Leads & Sales', icon: '🎯' },
      { id: 'tickets', name: 'Customer Tickets', icon: '🎫' },
      { id: 'dms', name: 'Document Vault', icon: '📁' },
      { id: 'transfers', name: 'Send Money', icon: '💸' },
      { id: 'beneficiaries', name: 'Contacts / Nominees', icon: '👥' },
      { id: 'products', name: 'Apply Loans/FD', icon: '🌱' },
      { id: 'assistant', name: 'AI Financial Agent', icon: '🤖' },
      { id: 'settings', name: 'Security Controls', icon: '⚙️' },
      { id: 'qr', name: 'Merchant QR Payments', icon: '📱' },
      { id: 'settlements', name: 'Settlements', icon: '🏦' }
    ];

    const role = (user.role || 'Super Admin').toString().toLowerCase();

    if (user.modules && Array.isArray(user.modules) && user.modules.length > 0) {
      const userMods = user.modules.map(m => m.toLowerCase());
      if (role.includes('super') || role.includes('admin')) {
        if (!userMods.includes('branch-customers')) userMods.push('branch-customers');
        if (!userMods.includes('customer-registry')) userMods.push('customer-registry');
      }
      if (role.includes('manager')) {
        if (!userMods.includes('deposit-withdraw')) userMods.splice(1, 0, 'deposit-withdraw');
        if (!userMods.includes('branch-customers')) userMods.push('branch-customers');
        const custIdx = userMods.indexOf('customer-registry');
        if (custIdx !== -1) userMods.splice(custIdx, 1);
      }
      if (role.includes('employee') || role.includes('teller')) {
        if (!userMods.includes('deposit-withdraw')) userMods.splice(1, 0, 'deposit-withdraw');
        if (!userMods.includes('customer-onboarding')) userMods.push('customer-onboarding');
        if (!userMods.includes('branch-customers')) userMods.push('branch-customers');
        const custIdx = userMods.indexOf('customer-registry');
        if (custIdx !== -1) userMods.splice(custIdx, 1);
        const accAssistIdx = userMods.indexOf('customers');
        if (accAssistIdx !== -1) userMods.splice(accAssistIdx, 1);
      }
      const matched = allAvailableLinks.filter(l => userMods.includes(l.id.toLowerCase()));
      if (matched.length > 0) return matched;
    }

    if (role.includes('super') || role.includes('admin')) {
      return allAvailableLinks; // Super Admin sees all features
    } else if (role.includes('manager')) {
      // Branch Manager sees Branch Customers, Deposits & Withdrawals, etc.
      return allAvailableLinks.filter(l => ['summary', 'deposit-withdraw', 'branch-customers', 'users', 'kyc', 'approvals', 'employees', 'treasury', 'ledger'].includes(l.id));
    } else if (role.includes('employee') || role.includes('teller')) {
      // Employee performs Deposits & Withdrawals, Customer Onboarding, CRM, etc.
      return allAvailableLinks.filter(l => ['summary', 'deposit-withdraw', 'branch-customers', 'customer-onboarding', 'crm', 'tickets', 'dms'].includes(l.id));
    } else if (role.includes('customer')) {
      return allAvailableLinks.filter(l => ['summary', 'transfers', 'beneficiaries', 'products', 'assistant', 'settings'].includes(l.id));
    } else if (role.includes('merchant')) {
      return allAvailableLinks.filter(l => ['summary', 'qr', 'settlements', 'developers'].includes(l.id));
    }

    return allAvailableLinks.slice(0, 5);
  };

  const links = getRoleLinks();
  const userName = user?.fullName || user?.name || user?.email || 'Root Administrator';
  const userRole = user?.role || 'Super Admin';
  const initials = userName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SA';

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ height: '60px', minHeight: '60px', padding: '0 8px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
        <div className="sidebar-brand" style={{ padding: '5px 8px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', borderRadius: '8px', border: '1px solid #fed7aa', display: 'flex', flexDirection: 'column', gap: '1px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 900, letterSpacing: '2px', color: '#ea580c' }}>BSB</span>
            <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: '#ffffff', color: '#ea580c', border: '1px solid #ffedd5', letterSpacing: '0.5px', boxShadow: '0 1px 3px rgba(234,88,12,0.1)' }}>BANK</span>
          </div>
          <span style={{ fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#7c2d12', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>BHARATIYA SARVODAYA BANK</span>
        </div>
      </div>

      <nav className="sidebar-menu" id="sidebar-menu-list">
        {links.map(link => (
          <button
            key={link.id}
            className={`menu-item ${activeTab === link.id ? 'active' : ''}`}
            onClick={() => onTabSelect(link.id)}
          >
            <span className="icon">{link.icon}</span> {link.name}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ padding: '8px 10px', borderTop: '1px solid var(--border-color)' }}>
        <button className="btn btn-outline-danger btn-block" onClick={onLogout} style={{ fontSize: '0.78rem', padding: '7px 10px', borderRadius: '6px', fontWeight: 700 }}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
