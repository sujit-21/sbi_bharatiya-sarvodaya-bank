import React, { useState } from 'react';

export default function InterestEngine({ apiCall, showToast }) {
  const [running, setRunning] = useState(false);
  const [lastLog, setLastLog] = useState(null);

  const triggerInterestCalculation = async () => {
    try {
      setRunning(true);
      const res = await apiCall('/api/interest/calculate', 'POST');
      setLastLog(res);
      showToast(`Interest calculation batch completed. Postings: ${res.postings || res.processedCount || 1}`, 'success');
    } catch (e) {
      showToast(e.message || 'Interest calculation batch failed', 'danger');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div className="card" style={{ width: '100%' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>⚙️ Automated Interest Calculation Engine</h2>
          <button className="btn btn-primary" onClick={triggerInterestCalculation} disabled={running}>
            {running ? 'Calculating...' : '⚡ Trigger Batch Accrual'}
          </button>
        </div>
        <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
          Runs automated savings & fixed deposit interest postings across all accounts based on configured APY rates.
        </p>

        {lastLog && (
          <div className="alert alert-success" style={{ marginTop: '20px', fontSize: '0.85rem', border: '1px dashed var(--color-success)' }}>
            <h4>Batch Execution Report</h4>
            <div style={{ background: 'rgba(0,0,0,0.05)', padding: '8px', borderRadius: '4px', marginTop: '8px', fontFamily: 'monospace' }}>
              <strong>Status:</strong> COMPLETED<br />
              <strong>Timestamp:</strong> {new Date().toISOString()}<br />
              <strong>Postings Processed:</strong> {lastLog.postings || lastLog.processedCount || 1}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
