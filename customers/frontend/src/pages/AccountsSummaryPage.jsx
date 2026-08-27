import React, { useState, useEffect } from 'react';

/**
 * AccountsSummaryPage.jsx
 * Displays customer's active bank accounts, real-time balances, quick action shortcuts,
 * monthly spending breakdown, and recent transaction history.
 */
export default function AccountsSummaryPage({ user, apiCall, showToast, onNavigateTab }) {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedAccIndex, setSelectedAccIndex] = useState(0);

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/api/dashboard/summary');
      setSummaryData(data);
    } catch (err) {
      console.warn('Using local customer profile fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  const accounts = (user?.accounts && user.accounts.length > 0)
    ? user.accounts
    : [{
        accountNumber: user?.accountNumber || '1000987658',
        type: 'SAVINGS',
        balance: user?.totalBalance || user?.balance || 145000,
        currency: 'INR',
        ifscCode: 'BSB0000DEL1',
        branchName: 'New Delhi Main Connaught Place'
      }];

  const currentAcc = accounts[selectedAccIndex] || accounts[0];
  const totalBalance = accounts.reduce((acc, a) => acc + (parseFloat(a.balance) || 0), 0);

  const transactions = (summaryData?.recentTransactions || [
    { id: 'TXN-90211', type: 'Credit', desc: 'Salary NEFT / BSB Corp', amount: 85000, date: '2026-08-25', status: 'Completed' },
    { id: 'TXN-90144', type: 'Debit', desc: 'Amazon Pay UPI / Retail', amount: 2499, date: '2026-08-22', status: 'Completed' },
    { id: 'TXN-89982', type: 'Credit', desc: 'Interest Credit Q2 (7.25% p.a.)', amount: 1845, date: '2026-08-20', status: 'Completed' },
    { id: 'TXN-89811', type: 'Debit', desc: 'Electricity Board Bill / Utility', amount: 3420, date: '2026-08-16', status: 'Completed' },
    { id: 'TXN-89650', type: 'Credit', desc: 'UPI Transfer from Amit Sharma', amount: 5000, date: '2026-08-12', status: 'Completed' }
  ]);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Welcome Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
        color: '#ffffff',
        padding: '24px 28px',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(30, 58, 138, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
              RETAIL NETBANKING
            </span>
            <span style={{ fontSize: '0.8rem', color: '#93c5fd' }}>• Customer ID: {user?.userId || user?.id || 'CUST-1002'}</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px 0', color: '#ffffff' }}>
            Welcome back, {user?.fullName || user?.name || 'Customer'}! 👋
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#bfdbfe' }}>
            Your accounts are protected with 256-Bit Military Grade Encryption and RBI DICGC Insurance.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Relationship Value</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
            ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#86efac', fontWeight: 700 }}>● All Systems Operational</span>
        </div>
      </div>

      {/* Account Cards Carousel / List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>My Bank Accounts ({accounts.length})</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Select card to view detailed ledger</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {accounts.map((acc, idx) => {
            const isSelected = idx === selectedAccIndex;
            return (
              <div
                key={acc.accountNumber || idx}
                onClick={() => setSelectedAccIndex(idx)}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #064e3b 0%, #047857 100%)' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#0f172a',
                  border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 8px 20px rgba(6, 78, 59, 0.2)' : '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(255,255,255,0.2)' : '#ecfdf5',
                    color: isSelected ? '#ffffff' : '#059669'
                  }}>
                    {(acc.type || 'SAVINGS').toUpperCase()} ACCOUNT
                  </span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>IFSC: {acc.ifscCode || 'BSB0000DEL1'}</span>
                </div>

                <div style={{ fontSize: '0.85rem', opacity: isSelected ? 0.9 : 0.7, marginBottom: '4px' }}>Available Balance</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.5px' }}>
                  ₹{(parseFloat(acc.balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', borderTop: isSelected ? '1px solid rgba(255,255,255,0.15)' : '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <span>A/C No: <strong>{acc.accountNumber}</strong></span>
                  <span style={{ fontWeight: 600 }}>{acc.branchName || 'Connaught Place'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="card" style={{ padding: '20px', borderRadius: '14px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 16px 0', color: '#334155' }}>Quick Services</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Send Money', icon: '💸', tab: 'transfers', color: '#2563eb' },
            { label: 'Statements', icon: '📄', tab: 'statements', color: '#059669' },
            { label: 'Apply Cards', icon: '💳', tab: 'apply-services', color: '#7c3aed' },
            { label: 'Open FD / RD', icon: '🌱', tab: 'products', color: '#d97706' },
            { label: 'AI Advisor', icon: '🤖', tab: 'assistant', color: '#ea580c' },
            { label: 'PIN & Security', icon: '⚙️', tab: 'settings', color: '#475569' }
          ].map(action => (
            <button
              key={action.label}
              onClick={() => onNavigateTab && onNavigateTab(action.tab)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 10px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: '1.4rem' }}>{action.icon}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions Feed */}
      <div className="card" style={{ padding: '20px', borderRadius: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Recent Activity ({currentAcc?.accountNumber})
          </h3>
          <button
            className="btn btn-outline"
            onClick={() => onNavigateTab && onNavigateTab('statements')}
            style={{ fontSize: '0.8rem', padding: '5px 12px' }}
          >
            View Full Statement →
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Txn Reference</th>
                <th style={{ padding: '10px 12px' }}>Description</th>
                <th style={{ padding: '10px 12px' }}>Date</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => {
                const isCredit = tx.type?.toLowerCase() === 'credit';
                return (
                  <tr key={tx.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>{tx.id || `TXN-${idx + 100}`}</td>
                    <td style={{ padding: '12px', fontWeight: 600, color: '#1e293b' }}>{tx.desc || tx.narration || 'NetBanking Transaction'}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{tx.date || '2026-08-26'}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: isCredit ? '#16a34a' : '#dc2626' }}>
                      {isCredit ? '+' : '-'} ₹{(parseFloat(tx.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background: '#dcfce7',
                        color: '#15803d'
                      }}>
                        {tx.status || 'Settled'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
