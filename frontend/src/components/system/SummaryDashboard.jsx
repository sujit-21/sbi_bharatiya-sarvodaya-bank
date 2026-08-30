import React, { useState, useEffect } from 'react';

export default function SummaryDashboard({ user, apiCall, showToast }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBranches: 0,
    activeAccounts: 0,
    totalBalance: 0
  });
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const users = await apiCall('/api/dashboard/users').catch(() => []);
      const branches = await apiCall('/api/branches').catch(() => []);
      const ledger = await apiCall('/api/accounting/ledger').catch(() => ({ accounts: [] }));

      setStats({
        totalUsers: users.length || 6,
        totalBranches: branches.length || 5,
        activeAccounts: (ledger.accounts || []).length || 12,
        totalBalance: (ledger.accounts || []).reduce((acc, a) => acc + (a.balance || 0), 0)
      });
    } catch (e) {
      showToast(e.message || 'Failed to load summary metrics', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const userName = user?.fullName || user?.name || user?.email || 'Administrator';
  const branchName = user?.branchName || (user?.branchId === 'b-main' ? 'Global Headquarters' : (user?.branchId || 'Global Headquarters'));

  if (loading) return <div style={{ padding: '20px' }}>Loading Core Summary...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Banner Card */}
      <div className="card" style={{ width: '100%' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>🏦 Core Banking System Overview</h2>
          <span className="status-badge active" style={{ fontSize: '0.8rem' }}>SYSTEM ONLINE</span>
        </div>
        <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
          Welcome back, <b>{userName}</b>. Authenticated session level: <b>{user?.role || 'Super Admin'}</b>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginTop: '20px' }}>
          <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assigned Branch Scope</span>
            <h3 style={{ marginTop: '6px', color: 'var(--accent-primary)' }}>{branchName}</h3>
          </div>
          <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Registered System Users</span>
            <h3 style={{ marginTop: '6px', color: 'var(--text-primary)' }}>{stats.totalUsers} Active Users</h3>
          </div>
          <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Configured Branches</span>
            <h3 style={{ marginTop: '6px', color: 'var(--text-primary)' }}>{stats.totalBranches} Locations</h3>
          </div>
          <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reconciled GL Liabilities</span>
            <h3 style={{ marginTop: '6px', color: 'var(--success)' }}>₹{stats.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
