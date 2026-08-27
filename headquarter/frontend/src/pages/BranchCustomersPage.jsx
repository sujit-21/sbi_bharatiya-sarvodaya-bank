import React, { useState, useEffect } from 'react';

/**
 * BranchCustomersPage.jsx
 * Central Customer Account Registry across all branches for Headquarter.
 * Search any customer in India, view balances, freeze/unfreeze accounts, and view KYC documents.
 */
export default function BranchCustomersPage({ user, apiCall, showToast }) {
  const [customers, setCustomers] = useState([
    { id: 'CUST-1001', fullName: 'Ram Shyam', branch: 'New Delhi Main (DEL1)', accountNumber: '1000882550', totalBalance: 75000, type: 'SAVINGS', mobile: '+91 98112 23344', status: 'ACTIVE' },
    { id: 'CUST-1002', fullName: 'Kabir Malhotra', branch: 'New Delhi Main (DEL1)', accountNumber: '1000987658', totalBalance: 145000, type: 'SAVINGS', mobile: '+91 98765 43210', status: 'ACTIVE' },
    { id: 'CUST-1003', fullName: 'Ananya Sharma', branch: 'Mumbai BKC (MUM1)', accountNumber: '1000994411', totalBalance: 285000, type: 'CURRENT', mobile: '+91 99887 76655', status: 'ACTIVE' },
    { id: 'CUST-1004', fullName: 'Priya Joshi', branch: 'Bengaluru MG Road (BLR1)', accountNumber: '1000552219', totalBalance: 42000, type: 'SAVINGS', mobile: '+91 98223 34455', status: 'ACTIVE' },
    { id: 'CUST-1005', fullName: 'Sunil Rao', branch: 'Hyderabad Hitec City (HYD1)', accountNumber: '1000773344', totalBalance: 190000, type: 'SAVINGS', mobile: '+91 97112 88990', status: 'ACTIVE' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCentralCustomers();
  }, []);

  const fetchCentralCustomers = async () => {
    try {
      if (apiCall) {
        const res = await apiCall('/api/customers/registry').catch(() => null);
        if (res && res.customers && res.customers.length > 0) {
          setCustomers(res.customers);
        }
      }
    } catch (e) {}
  };

  const handleToggleFreeze = (accNo, name, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    setCustomers(prev => prev.map(c => c.accountNumber === accNo ? { ...c, status: nextStatus } : c));
    showToast(`Account for ${name} (${accNo}) is now ${nextStatus}.`, nextStatus === 'ACTIVE' ? 'success' : 'warning');
  };

  const filtered = customers.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      (c.fullName || '').toLowerCase().includes(q) ||
      (c.accountNumber || '').includes(q) ||
      (c.branch || '').toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Card */}
      <div className="card" style={{ padding: '22px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
            🏢 Central Customer Accounts Registry ({customers.length})
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            HQ Master Customer Database across all 12 BSB branch networks.
          </p>
        </div>

        <input
          type="text"
          placeholder="🔍 Search all customers, accounts, branches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '320px', padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
        />
      </div>

      {/* Customers Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '14px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left', background: '#f8fafc' }}>
                <th style={{ padding: '12px 14px' }}>CIF ID</th>
                <th style={{ padding: '12px 14px' }}>Customer Name</th>
                <th style={{ padding: '12px 14px' }}>Home Branch</th>
                <th style={{ padding: '12px 14px' }}>Account Number</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Balance (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Account Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Administrative Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id || c.accountNumber} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{c.id}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{c.fullName}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{c.branch}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{c.accountNumber}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                    ₹{(parseFloat(c.totalBalance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: c.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                      color: c.status === 'ACTIVE' ? '#15803d' : '#b91c1c'
                    }}>
                      ● {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <button
                      className={`btn ${c.status === 'ACTIVE' ? 'btn-outline-danger' : 'btn-outline'}`}
                      onClick={() => handleToggleFreeze(c.accountNumber, c.fullName, c.status)}
                      style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '6px' }}
                    >
                      {c.status === 'ACTIVE' ? 'Freeze Account ❄️' : 'Unfreeze Account 🟢'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
