import React, { useState } from 'react';

/**
 * BeneficiariesPage.jsx
 * Allows customer to view, add, and manage registered payees/beneficiaries
 * across Intra-Bank (BSB) and Inter-Bank (Other Banks with IFSC).
 */
export default function BeneficiariesPage({ user, apiCall, showToast }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [payees, setPayees] = useState([
    { id: 'BEN-101', name: 'Amit Sharma', accountNumber: '1000882550', bankName: 'Bharatiya Sarvodaya Bank', ifsc: 'BSB0000DEL1', type: 'Intra-Bank', status: 'ACTIVE', maxLimit: '₹2,00,000' },
    { id: 'BEN-102', name: 'Pooja Malhotra', accountNumber: '5010048821', bankName: 'HDFC Bank', ifsc: 'HDFC0001234', type: 'Inter-Bank', status: 'ACTIVE', maxLimit: '₹5,00,000' },
    { id: 'BEN-103', name: 'Rohit Verma', accountNumber: '3004891120', bankName: 'State Bank of India', ifsc: 'SBIN0000691', type: 'Inter-Bank', status: 'ACTIVE', maxLimit: '₹1,00,000' },
    { id: 'BEN-104', name: 'Kavita Singh', accountNumber: '1000998822', bankName: 'Bharatiya Sarvodaya Bank', ifsc: 'BSB0000MUM1', type: 'Intra-Bank', status: 'COOLING_PERIOD', maxLimit: '₹50,000' }
  ]);

  const [newPayee, setNewPayee] = useState({
    name: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: 'BSB0000DEL1',
    bankName: 'Bharatiya Sarvodaya Bank',
    maxLimit: '100000'
  });

  const handleAddPayee = (e) => {
    e.preventDefault();
    if (newPayee.accountNumber !== newPayee.confirmAccountNumber) {
      showToast('Account numbers do not match!', 'danger');
      return;
    }

    const created = {
      id: `BEN-${Math.floor(100 + Math.random() * 900)}`,
      name: newPayee.name,
      accountNumber: newPayee.accountNumber,
      bankName: newPayee.bankName,
      ifsc: newPayee.ifsc,
      type: newPayee.ifsc.startsWith('BSB') ? 'Intra-Bank' : 'Inter-Bank',
      status: 'COOLING_PERIOD',
      maxLimit: `₹${Number(newPayee.maxLimit).toLocaleString('en-IN')}`
    };

    setPayees(prev => [created, ...prev]);
    showToast(`Beneficiary ${created.name} added successfully! 30-minute security cooling period active.`, 'success');
    setShowAddModal(false);
    setNewPayee({ name: '', accountNumber: '', confirmAccountNumber: '', ifsc: 'BSB0000DEL1', bankName: 'Bharatiya Sarvodaya Bank', maxLimit: '100000' });
  };

  const handleDeletePayee = (id, name) => {
    setPayees(prev => prev.filter(p => p.id !== id));
    showToast(`Beneficiary ${name} removed from registry.`, 'info');
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Card */}
      <div className="card" style={{ padding: '22px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
            👥 Registered Beneficiaries & Payees
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            Manage approved payees for fast 1-click fund transfers across India.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ fontWeight: 700, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ➕ Add New Beneficiary
        </button>
      </div>

      {/* Add Beneficiary Modal */}
      {showAddModal && (
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
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Add New Payee</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleAddPayee} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Beneficiary Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newPayee.name}
                  onChange={(e) => setNewPayee({ ...newPayee, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Account Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1000882550"
                  value={newPayee.accountNumber}
                  onChange={(e) => setNewPayee({ ...newPayee, accountNumber: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Re-Enter Account Number *</label>
                <input
                  type="text"
                  required
                  placeholder="Re-enter to verify"
                  value={newPayee.confirmAccountNumber}
                  onChange={(e) => setNewPayee({ ...newPayee, confirmAccountNumber: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={newPayee.ifsc}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase();
                      setNewPayee({
                        ...newPayee,
                        ifsc: code,
                        bankName: code.startsWith('BSB') ? 'Bharatiya Sarvodaya Bank' : (code.startsWith('SBIN') ? 'State Bank of India' : 'National Bank')
                      });
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Max Daily Limit (₹)</label>
                  <input
                    type="number"
                    value={newPayee.maxLimit}
                    onChange={(e) => setNewPayee({ ...newPayee, maxLimit: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.76rem', color: '#64748b', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                Bank Identified: <strong>{newPayee.bankName}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>Confirm & Add Payee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Beneficiaries Grid List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {payees.map(p => {
          const isCooling = p.status === 'COOLING_PERIOD';
          return (
            <div
              key={p.id}
              className="card"
              style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: isCooling ? '#fef3c7' : '#ecfdf5',
                    color: isCooling ? '#d97706' : '#059669'
                  }}>
                    {isCooling ? '⏳ 30m Cooling Period' : '● Approved Payee'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{p.type}</span>
                </div>

                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>{p.name}</h4>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '10px' }}>{p.bankName}</div>

                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Account No:</span>
                    <strong style={{ fontFamily: 'monospace' }}>{p.accountNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>IFSC Code:</span>
                    <strong style={{ fontFamily: 'monospace' }}>{p.ifsc}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Transfer Limit:</span>
                    <strong style={{ color: '#2563eb' }}>{p.maxLimit}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <button
                  className="btn btn-outline-danger"
                  onClick={() => handleDeletePayee(p.id, p.name)}
                  style={{ fontSize: '0.76rem', padding: '5px 10px', borderRadius: '6px' }}
                >
                  Delete Payee
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
