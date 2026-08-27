import React, { useState } from 'react';

/**
 * EmployeeApprovalsPage.jsx
 * Branch Manager Dual-Control Authorization Queue.
 * Authorizes high-value cash transactions (>₹50,000), overdraft approvals,
 * and teller drawer override requests.
 */
export default function EmployeeApprovalsPage({ user, apiCall, showToast }) {
  const [approvals, setApprovals] = useState([
    {
      id: 'APR-7712',
      type: 'High-Value Cash Withdrawal (>₹2L)',
      initiator: 'Sujit Kumar (Teller 1)',
      accountNumber: '1000987658',
      customerName: 'Kabir Malhotra',
      amount: 250000,
      reason: 'Emergency Business Cash Payment',
      time: '11:20 AM',
      status: 'PENDING'
    },
    {
      id: 'APR-7708',
      type: 'Overdraft Limit Enhancement',
      initiator: 'Neha Sharma (Credit Desk)',
      accountNumber: '1000994411',
      customerName: 'Ananya Sharma (Current A/C)',
      amount: 100000,
      reason: 'Vendor Working Capital Buffer',
      time: '10:45 AM',
      status: 'PENDING'
    }
  ]);

  const handleAction = (id, action) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: action } : a));
    showToast(`Request ${id} ${action.toLowerCase()} by Branch Manager.`, action === 'APPROVED' ? 'success' : 'warning');
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Card */}
      <div className="card" style={{ padding: '22px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
            🗳️ Manager Dual-Control Authorization Queue
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            Authorizations required by branch manager for transactions exceeding employee maker limits.
          </p>
        </div>
      </div>

      {/* Approvals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {approvals.map(req => {
          const isPending = req.status === 'PENDING';
          return (
            <div
              key={req.id}
              className="card"
              style={{ padding: '20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 700, color: '#64748b' }}>{req.id}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: isPending ? '#fef3c7' : (req.status === 'APPROVED' ? '#dcfce7' : '#fee2e2'),
                    color: isPending ? '#d97706' : (req.status === 'APPROVED' ? '#15803d' : '#b91c1c')
                  }}>
                    {req.status}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Submitted at {req.time} by <strong>{req.initiator}</strong></span>
                </div>

                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>{req.type}</h4>
                <div style={{ fontSize: '0.84rem', color: '#334155' }}>
                  Customer: <strong>{req.customerName}</strong> ({req.accountNumber}) • Amount: <strong style={{ color: '#2563eb' }}>₹{req.amount.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Reason: {req.reason}</div>
              </div>

              {isPending && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => handleAction(req.id, 'REJECTED')}
                    style={{ fontSize: '0.82rem', fontWeight: 700, padding: '8px 14px' }}
                  >
                    Reject ✕
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAction(req.id, 'APPROVED')}
                    style={{ fontSize: '0.82rem', fontWeight: 700, padding: '8px 18px', background: '#16a34a', borderColor: '#16a34a' }}
                  >
                    Authorize & Approve ✓
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
