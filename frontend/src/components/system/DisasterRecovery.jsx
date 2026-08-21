import React, { useState } from 'react';

export default function DisasterRecovery({ apiCall, showToast }) {
  const [creating, setCreating] = useState(false);
  const [snapshotLog, setSnapshotLog] = useState(null);

  const createSnapshot = async () => {
    try {
      setCreating(true);
      const res = await apiCall('/api/system/backup', 'POST');
      setSnapshotLog(res);
      showToast('Disaster recovery database snapshot created.', 'success');
    } catch (e) {
      showToast(e.message || 'Backup snapshot failed', 'danger');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div className="card" style={{ width: '100%' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>💾 Disaster Recovery & Database Backup Snapshots</h2>
          <button className="btn btn-primary" onClick={createSnapshot} disabled={creating}>
            {creating ? 'Creating Snapshot...' : '📸 Create Database Snapshot'}
          </button>
        </div>
        <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
          Creates timestamped disaster recovery JSON/MongoDB snapshots for instant system restore.
        </p>

        {snapshotLog && (
          <div className="alert alert-success" style={{ marginTop: '20px', fontSize: '0.85rem', border: '1px dashed var(--color-success)' }}>
            <h4>Snapshot Created Successfully!</h4>
            <div style={{ background: 'rgba(0,0,0,0.05)', padding: '8px', borderRadius: '4px', marginTop: '8px', fontFamily: 'monospace' }}>
              <strong>Snapshot File:</strong> {snapshotLog.backupFile || snapshotLog.filename || 'db_backup.json'}<br />
              <strong>Timestamp:</strong> {new Date().toISOString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
