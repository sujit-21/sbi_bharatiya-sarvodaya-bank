import React, { useState, useEffect } from 'react';

export default function KYCVerification({ apiCall, showToast }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/api/kyc/queue');
      setQueue(res.queue || []);
    } catch (e) {
      showToast(e.message || 'Failed to load KYC queue', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleVerify = async (userId, action) => {
    const remarks = prompt(`Enter verification remarks for ${action.toUpperCase()}:`, `Manual verification ${action}d by staff.`);
    try {
      await apiCall('/api/kyc/verify', 'POST', { userId, action, remarks });
      showToast(`User KYC status updated to ${action === 'approve' ? 'Verified' : 'Rejected'}.`, 'success');
      loadQueue();
    } catch (e) {
      showToast(e.message || 'Verification update failed', 'danger');
    }
  };

  const filteredQueue = queue.filter(item => {
    if (filter === 'pending') return item.kycStatus === 'pending';
    if (filter === 'verified') return item.kycStatus === 'verified';
    if (filter === 'rejected') return item.kycStatus === 'rejected';
    return true;
  });

  if (loading) return <div style={{ padding: '20px' }}>Loading KYC Queue...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Panel: Summary & Filter */}
      <div className="card" style={{ width: '100%' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>🪪 KYC Compliance & Verification Queue</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pending', 'verified', 'rejected'].map(f => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Queue Table */}
      <div className="card" style={{ width: '100%' }}>
        <div className="table-wrapper" style={{ maxHeight: '550px', overflowX: 'auto', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Customer / User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Doc Type</th>
                <th>Doc Number</th>
                <th>Status</th>
                <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.map(item => (
                <tr key={item.userId}>
                  <td><b>{item.fullName}</b></td>
                  <td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.email}</span></td>
                  <td><span className="status-badge active">{item.role}</span></td>
                  <td><b>{item.docType}</b></td>
                  <td><code>{item.docNumber}</code></td>
                  <td>
                    <span className={`status-badge ${item.kycStatus === 'verified' ? 'active' : item.kycStatus === 'rejected' ? 'frozen' : 'pending'}`}>
                      {item.kycStatus.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap' }}>
                      <button
                        className="btn btn-outline-success btn-xs"
                        onClick={() => handleVerify(item.userId, 'approve')}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className="btn btn-outline-danger btn-xs"
                        onClick={() => handleVerify(item.userId, 'reject')}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
