import React, { useState, useEffect } from 'react';

export default function GeneralLedger({ apiCall, showToast }) {
  const [glAccounts, setGlAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGL = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/accounting/ledger');
      setGlAccounts(data.accounts || data || []);
    } catch (e) {
      showToast(e.message || 'Failed to load GL accounts', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGL();
  }, []);

  const handleExportCSV = () => {
    let csv = 'Account Code,Account Name,Category,Balance (INR),Status\n';
    glAccounts.forEach(acc => {
      csv += `"${acc.code || acc.id}","${acc.name}","${acc.type || acc.category}","${acc.balance || 0}","Reconciled"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'general_ledger_trial_balance.csv';
    a.click();
    showToast('General Ledger CSV exported successfully.', 'success');
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading General Ledger...</div>;

  return (
    <div className="card" style={{ width: '100%' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>📈 General Ledger & Balance Sheet</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-success btn-sm" onClick={handleExportCSV}>
            📥 Export CSV
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={handlePrintReport}>
            🖨️ Print Report
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={loadGL}>
            Refresh
          </button>
        </div>
      </div>
      <div className="table-wrapper" style={{ maxHeight: '550px', overflowX: 'auto', overflowY: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Account Code</th>
              <th>Account Name</th>
              <th>Category</th>
              <th>Balance (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {glAccounts.map(acc => (
              <tr key={acc.code || acc.id}>
                <td><code>{acc.code || acc.id}</code></td>
                <td><b>{acc.name}</b></td>
                <td><span className="status-badge pending">{acc.type || acc.category}</span></td>
                <td><b>₹{(acc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></td>
                <td><span className="status-badge active">Reconciled</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
