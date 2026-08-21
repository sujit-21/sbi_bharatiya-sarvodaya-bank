import React, { useState, useEffect } from 'react';

export default function TreasuryVault({ apiCall, showToast }) {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadVaults = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/branches');
      setVaults(data || []);
    } catch (e) {
      showToast(e.message || 'Failed to load treasury positions', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVaults();
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading Vault Positions...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div className="card" style={{ width: '100%' }}>
        <div className="card-header" style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center' }}>
          <h2>💰 Branch Vault & Cash Positions</h2>
          <button className="btn btn-outline-secondary btn-sm" onClick={loadVaults}>Refresh Vaults</button>
        </div>
        <div className="table-wrapper" style={{ maxHeight: '550px', overflowX: 'auto', overflowY: 'auto', marginTop: '15px' }}>
          <table>
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Branch Code</th>
                <th>Vault Balance (₹)</th>
                <th>Cash In Hand (₹)</th>
                <th>Min Limit (₹)</th>
                <th>Max Limit (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vaults.map(v => (
                <tr key={v.id}>
                  <td><b>{v.name}</b></td>
                  <td><code>{v.code}</code></td>
                  <td><b>₹{(v.vaultBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></td>
                  <td><b>₹{(v.cashInHand || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></td>
                  <td><span style={{ color: 'var(--text-secondary)' }}>₹{(v.minVaultLimit || 100000).toLocaleString('en-IN')}</span></td>
                  <td><span style={{ color: 'var(--text-secondary)' }}>₹{(v.maxVaultLimit || 10000000).toLocaleString('en-IN')}</span></td>
                  <td><span className="status-badge active">NORMAL</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
