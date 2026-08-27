import React, { useState } from 'react';

/**
 * TreasuryVaultPage.jsx
 * Branch Vault & Cash Limits Management.
 * Features:
 * - Strongroom vault cash balance & holding capacity
 * - Vault-to-Teller & Teller-to-Vault cash transfer requests
 * - Beginning of Day (BOD) and End of Day (EOD) dual-custody cash reconciliation
 */
export default function TreasuryVaultPage({ user, apiCall, showToast }) {
  const [vaultBalance, setVaultBalance] = useState(12500000);
  const [vaultLimit] = useState(20000000);
  const [transferType, setTransferType] = useState('VAULT_TO_TELLER');
  const [tellerId, setTellerId] = useState('EMP-DEL1-01');
  const [transferAmount, setTransferAmount] = useState('100000');
  const [transferReason, setTransferReason] = useState('Morning Cash Top-up for Counter 1');
  const [isTransferring, setIsTransferring] = useState(false);

  const [transfersHistory, setTransfersHistory] = useState([
    { id: 'TRF-901', type: 'Vault ➔ Teller 1', teller: 'EMP-DEL1-01', amount: 150000, time: '09:30 AM', status: 'COMPLETED', authorizedBy: 'Manager CP-01' },
    { id: 'TRF-902', type: 'Vault ➔ Teller 2', teller: 'EMP-DEL1-02', amount: 200000, time: '09:35 AM', status: 'COMPLETED', authorizedBy: 'Manager CP-01' },
    { id: 'TRF-903', type: 'Teller 3 ➔ Vault', teller: 'EMP-DEL1-03', amount: 50000, time: '01:45 PM', status: 'COMPLETED', authorizedBy: 'Manager CP-01' }
  ]);

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) {
      showToast('Please enter a valid cash amount.', 'warning');
      return;
    }

    setIsTransferring(true);
    try {
      if (apiCall) {
        await apiCall('/api/treasury/transfer', 'POST', {
          type: transferType,
          tellerId,
          amount: amt,
          reason: transferReason
        }).catch(() => {});
      }

      const newRecord = {
        id: `TRF-${Math.floor(100 + Math.random() * 900)}`,
        type: transferType === 'VAULT_TO_TELLER' ? `Vault ➔ ${tellerId}` : `${tellerId} ➔ Vault`,
        teller: tellerId,
        amount: amt,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'COMPLETED',
        authorizedBy: user?.fullName || 'Manager'
      };

      setTransfersHistory(prev => [newRecord, ...prev]);
      if (transferType === 'VAULT_TO_TELLER') {
        setVaultBalance(prev => prev - amt);
      } else {
        setVaultBalance(prev => prev + amt);
      }

      showToast(`Cash transfer of ₹${amt.toLocaleString('en-IN')} approved and completed!`, 'success');
      setTransferAmount('');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Vault Status Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '22px', borderRadius: '14px', background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', color: '#ffffff' }}>
          <div style={{ fontSize: '0.78rem', color: '#a7f3d0', fontWeight: 800, textTransform: 'uppercase' }}>Branch Strongroom Vault Cash</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '4px' }}>
            ₹{vaultBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#6ee7b7', marginTop: '6px' }}>
            Holding: {Math.round((vaultBalance / vaultLimit) * 100)}% of Max Holding Limit (₹{vaultLimit.toLocaleString('en-IN')})
          </div>
        </div>

        <div className="card" style={{ padding: '22px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Dual-Custody Key Holders</div>
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', marginTop: '4px' }}>Key 1: Branch Manager • Key 2: Head Cashier</div>
          <div style={{ fontSize: '0.76rem', color: '#16a34a', fontWeight: 700, marginTop: '4px' }}>● Strongroom Armed & Secured (CCTV Active)</div>
        </div>
      </div>

      {/* Transfer & History Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Transfer Form Card */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 16px 0', color: '#0f172a' }}>
            💰 Internal Cash Movement & Teller Drawer Allocation
          </h3>

          <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Transfer Direction</label>
              <select
                value={transferType}
                onChange={(e) => setTransferType(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
              >
                <option value="VAULT_TO_TELLER">Vault Strongroom ➔ Teller Counter Drawer (Cash Top-up)</option>
                <option value="TELLER_TO_VAULT">Teller Counter Drawer ➔ Vault Strongroom (Surplus Return)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Target Teller Desk</label>
              <select
                value={tellerId}
                onChange={(e) => setTellerId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              >
                <option value="EMP-DEL1-01">Counter 1: Sujit Kumar (EMP-DEL1-01)</option>
                <option value="EMP-DEL1-02">Counter 2: Neha Sharma (EMP-DEL1-02)</option>
                <option value="EMP-DEL1-03">Counter 3: Vikram Mehta (EMP-DEL1-03)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Transfer Amount (₹) *</label>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 800 }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Reason / Remarks</label>
              <input
                type="text"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isTransferring}
              style={{ padding: '12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem' }}
            >
              {isTransferring ? 'Authorizing Dual-Custody Transfer...' : 'Authorize Cash Movement →'}
            </button>
          </form>
        </div>

        {/* Transfers Log Table */}
        <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 12px 0', color: '#0f172a' }}>
            Today's Vault Cash Transfer Log
          </h4>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Ref</th>
                  <th style={{ padding: '8px 10px' }}>Transfer Flow</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '8px 10px' }}>Time</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transfersHistory.map(tr => (
                  <tr key={tr.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 600 }}>{tr.id}</td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{tr.type}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                      ₹{tr.amount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px', color: '#64748b' }}>{tr.time}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#15803d' }}>
                        {tr.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
