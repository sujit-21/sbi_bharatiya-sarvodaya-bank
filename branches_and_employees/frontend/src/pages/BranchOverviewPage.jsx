import React, { useState, useEffect } from 'react';

/**
 * BranchOverviewPage.jsx
 * Operational overview for branch managers and tellers.
 * Shows daily branch deposits, withdrawals, active teller drawers, vault balance,
 * customer queue status, and recent counter journal logs.
 */
export default function BranchOverviewPage({ user, apiCall, showToast, onNavigateTab }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    branchName: user?.branchName || 'New Delhi Main Connaught Place (DEL1)',
    ifsc: user?.ifsc || 'BSB0000DEL1',
    vaultCash: 12500000,
    vaultLimit: 20000000,
    todayDeposits: 485000,
    todayWithdrawals: 210000,
    activeTellers: 4,
    customersServedToday: 42,
    pendingKYC: 3
  });

  useEffect(() => {
    fetchBranchMetrics();
  }, []);

  const fetchBranchMetrics = async () => {
    setLoading(true);
    try {
      if (apiCall) {
        const data = await apiCall('/api/dashboard/summary').catch(() => null);
        if (data) {
          setMetrics(prev => ({
            ...prev,
            todayDeposits: data.todayDeposits || prev.todayDeposits,
            todayWithdrawals: data.todayWithdrawals || prev.todayWithdrawals
          }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const tellerDrawers = [
    { tellerId: 'EMP-DEL1-01', name: 'Sujit Kumar (Teller 1)', drawerCash: '₹1,45,000', limit: '₹5,00,000', status: 'ACTIVE' },
    { tellerId: 'EMP-DEL1-02', name: 'Neha Sharma (Teller 2)', drawerCash: '₹2,10,000', limit: '₹5,00,000', status: 'ACTIVE' },
    { tellerId: 'EMP-DEL1-03', name: 'Vikram Mehta (Teller 3)', drawerCash: '₹95,000', limit: '₹5,00,000', status: 'ACTIVE' },
    { tellerId: 'EMP-DEL1-04', name: 'Priya Joshi (Forex Desk)', drawerCash: '₹3,20,000', limit: '₹8,00,000', status: 'ACTIVE' }
  ];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Branch Header Banner */}
      <div className="card" style={{
        padding: '24px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%)',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 24px rgba(124, 45, 18, 0.25)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
              BRANCH OPERATIONAL TERMINAL
            </span>
            <span style={{ fontSize: '0.8rem', color: '#fed7aa' }}>IFSC: {metrics.ifsc}</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 4px 0' }}>
            {metrics.branchName}
          </h2>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#ffedd5' }}>
            Logged in as: <strong>{user?.fullName || user?.name || 'Branch Staff'}</strong> ({user?.role || 'Staff'})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn"
            onClick={() => onNavigateTab && onNavigateTab('deposit-withdraw')}
            style={{ background: '#ffffff', color: '#9a3412', fontWeight: 800, padding: '10px 18px', borderRadius: '8px', fontSize: '0.88rem', border: 'none' }}
          >
            💵 Open Counter Terminal →
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '18px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Today's Cash Deposits (CR)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', marginTop: '6px' }}>
            +₹{metrics.todayDeposits.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', marginTop: '4px' }}>● 18 counter transactions</div>
        </div>

        <div className="card" style={{ padding: '18px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '0.76rem', color: '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>Today's Cash Withdrawals (DR)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
            -₹{metrics.todayWithdrawals.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '4px' }}>● 9 counter disbursements</div>
        </div>

        <div className="card" style={{ padding: '18px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.76rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Branch Strongroom Vault Cash</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', marginTop: '6px' }}>
            ₹{metrics.vaultCash.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#3b82f6', marginTop: '4px' }}>Limit: ₹{metrics.vaultLimit.toLocaleString('en-IN')}</div>
        </div>

        <div className="card" style={{ padding: '18px', borderRadius: '12px', background: '#fdf4ff', border: '1px solid #f5d0fe' }}>
          <div style={{ fontSize: '0.76rem', color: '#86198f', fontWeight: 700, textTransform: 'uppercase' }}>Active Tellers & Desks</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a21caf', marginTop: '6px' }}>
            {metrics.activeTellers} Active
          </div>
          <div style={{ fontSize: '0.74rem', color: '#c026d3', marginTop: '4px' }}>{metrics.customersServedToday} customers assisted today</div>
        </div>
      </div>

      {/* Teller Drawers Status Grid */}
      <div className="card" style={{ padding: '22px', borderRadius: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 2px 0', color: '#0f172a' }}>
              🏦 Branch Teller Drawers Cash Position
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Live teller cash holdings & drawer limits under dual-custody</p>
          </div>

          <button
            className="btn btn-outline"
            onClick={() => onNavigateTab && onNavigateTab('treasury')}
            style={{ fontSize: '0.8rem', padding: '6px 14px', fontWeight: 700 }}
          >
            Manage Vault & Transfers →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {tellerDrawers.map(t => (
            <div
              key={t.tellerId}
              style={{
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, color: '#64748b' }}>{t.tellerId}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>● {t.status}</span>
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{t.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontSize: '0.82rem' }}>
                <span style={{ color: '#64748b' }}>Drawer Cash:</span>
                <strong style={{ color: '#059669' }}>{t.drawerCash}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
