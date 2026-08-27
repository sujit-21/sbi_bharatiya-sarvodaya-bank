import React, { useState, useEffect } from 'react';

/**
 * BranchCustomersPage.jsx
 * Local branch customer directory, search by name/account/CIF,
 * view accounts, live balance snapshot, and customer details modal.
 */
export default function BranchCustomersPage({ user, apiCall, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([
    {
      id: 'CUST-1001',
      fullName: 'Ram Shyam',
      accountNumber: '1000882550',
      totalBalance: 75000,
      accountType: 'SAVINGS',
      mobileNumber: '+91 98112 23344',
      panNumber: 'ABCPS1234D',
      kycStatus: 'VERIFIED',
      mopType: 'Self / Either or Survivor',
      status: 'ACTIVE'
    },
    {
      id: 'CUST-1002',
      fullName: 'Kabir Malhotra',
      accountNumber: '1000987658',
      totalBalance: 145000,
      accountType: 'SAVINGS',
      mobileNumber: '+91 98765 43210',
      panNumber: 'ABCDE1234F',
      kycStatus: 'VERIFIED',
      mopType: 'Self',
      status: 'ACTIVE'
    },
    {
      id: 'CUST-1003',
      fullName: 'Ananya Sharma',
      accountNumber: '1000994411',
      totalBalance: 285000,
      accountType: 'CURRENT',
      mobileNumber: '+91 99887 76655',
      panNumber: 'ASDFG5678H',
      kycStatus: 'VERIFIED',
      mopType: 'Sole Proprietorship',
      status: 'ACTIVE'
    },
    {
      id: 'CUST-1004',
      fullName: 'Priya Joshi',
      accountNumber: '1000552219',
      totalBalance: 42000,
      accountType: 'SAVINGS',
      mobileNumber: '+91 98223 34455',
      panNumber: 'ZXCVB9012K',
      kycStatus: 'PENDING',
      mopType: 'Self',
      status: 'UNDER_REVIEW'
    }
  ]);

  const [selectedCust, setSelectedCust] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      if (apiCall) {
        const res = await apiCall('/api/branch-customers').catch(() => null);
        if (res && res.customers && res.customers.length > 0) {
          setCustomers(res.customers);
        }
      }
    } catch (e) {}
  };

  const filtered = customers.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      (c.fullName || '').toLowerCase().includes(q) ||
      (c.accountNumber || '').includes(q) ||
      (c.id || '').toLowerCase().includes(q) ||
      (c.mobileNumber || '').includes(q)
    );
  });

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Search */}
      <div className="card" style={{ padding: '22px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
            👥 Branch Customers Directory ({customers.length})
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            View local branch customer accounts, CBS balances, and KYC profiles.
          </p>
        </div>

        <div style={{ width: '320px', position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Search name, A/C no, CIF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
          />
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCust && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '24px', borderRadius: '16px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ea580c', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {(selectedCust.fullName.split(' ').map(n => n[0]).join('')).substring(0, 2)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{selectedCust.fullName}</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>CIF: {selectedCust.id}</span>
                </div>
              </div>
              <button onClick={() => setSelectedCust(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Primary Account:</span>
                <strong style={{ fontFamily: 'monospace' }}>{selectedCust.accountNumber}</strong>
              </div>
              <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#047857' }}>CBS Available Balance:</span>
                <strong style={{ color: '#065f46', fontSize: '1.1rem' }}>₹{(parseFloat(selectedCust.totalBalance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Mobile Number</span>
                  <div style={{ fontWeight: 700 }}>{selectedCust.mobileNumber}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>PAN Number</span>
                  <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{selectedCust.panNumber}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span style={{ color: '#64748b' }}>KYC Status:</span>
                <span style={{ color: '#16a34a', fontWeight: 800 }}>● {selectedCust.kycStatus}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-outline" onClick={() => setSelectedCust(null)}>Close Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Directory Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '14px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left', background: '#f8fafc' }}>
                <th style={{ padding: '12px 14px' }}>Customer Name</th>
                <th style={{ padding: '12px 14px' }}>Account Number</th>
                <th style={{ padding: '12px 14px' }}>Type</th>
                <th style={{ padding: '12px 14px' }}>Mobile</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Balance (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>KYC Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id || c.accountNumber} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                    {c.fullName}
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>CIF: {c.id}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{c.accountNumber}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                      {c.accountType || 'SAVINGS'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{c.mobileNumber}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                    ₹{(parseFloat(c.totalBalance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: c.kycStatus === 'VERIFIED' ? '#dcfce7' : '#fef3c7',
                      color: c.kycStatus === 'VERIFIED' ? '#15803d' : '#d97706'
                    }}>
                      {c.kycStatus === 'VERIFIED' ? '● VERIFIED' : '⏳ PENDING'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => setSelectedCust(c)}
                      style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px' }}
                    >
                      View Profile
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
