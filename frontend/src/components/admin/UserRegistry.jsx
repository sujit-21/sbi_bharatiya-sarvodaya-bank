import React, { useState, useEffect } from 'react';

export default function UserRegistry({ apiCall, showToast }) {
  const [users, setUsers] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [provFullName, setProvFullName] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provRole, setProvRole] = useState('');
  const [provBranch, setProvBranch] = useState('');
  const [provResult, setProvResult] = useState(null);

  // Modal states
  const [editUser, setEditUser] = useState(null);
  const [transferUser, setTransferUser] = useState(null);
  const [targetTransferBranch, setTargetTransferBranch] = useState('');

  // Table view states
  const [emailColMode, setEmailColMode] = useState('email'); // 'email' | 'id'
  const [roleStatusFilter, setRoleStatusFilter] = useState('ALL');

  const filteredUsers = users.filter(u => {
    if (roleStatusFilter === 'ALL') return true;
    if (roleStatusFilter.startsWith('ROLE_')) {
      return u.role === roleStatusFilter.replace('ROLE_', '');
    }
    if (roleStatusFilter.startsWith('STATUS_')) {
      return u.status === roleStatusFilter.replace('STATUS_', '');
    }
    return true;
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const uData = await apiCall('/api/dashboard/users');
      const rData = await apiCall('/api/roles');
      const bData = await apiCall('/api/branches') || [];

      setUsers(uData || []);
      const filteredRoles = (rData.roles || []).filter(r => r.name !== 'Customer' && r.name !== 'Merchant');
      setRolesList(filteredRoles);
      if (filteredRoles.length > 0) setProvRole(filteredRoles[0].name);

      setBranchesList(bData);
      if (bData.length > 0) setProvBranch(bData[0].id);
    } catch (e) {
      showToast(e.message || 'Failed to load user registry data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await apiCall('/api/users/provision', 'POST', {
        fullName: provFullName,
        email: provEmail,
        role: provRole,
        branchId: provBranch
      });
      setProvResult(result);
      showToast('Staff user provisioned successfully.', 'success');
      setProvFullName('');
      setProvEmail('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to provision user', 'danger');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      await apiCall('/api/dashboard/users', 'PUT', {
        userId: editUser.id,
        fullName: editUser.fullName,
        email: editUser.email,
        role: editUser.role,
        branchId: editUser.branchId,
        status: editUser.status
      });
      showToast('User details updated successfully.', 'success');
      setEditUser(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update user', 'danger');
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferUser) return;
    try {
      await apiCall('/api/users/reassign-branch', 'POST', {
        userId: transferUser.id,
        branchId: targetTransferBranch
      });
      showToast('User transferred to destination branch successfully.', 'success');
      setTransferUser(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to transfer user', 'danger');
    }
  };

  const toggleSuspension = async (userId, action) => {
    const endpoint = action === 'suspend' ? '/api/users/suspend' : '/api/users/activate';
    try {
      await apiCall(endpoint, 'POST', { userId });
      showToast(`User status updated to ${action === 'suspend' ? 'suspended' : 'active'}.`, 'success');
      loadData();
    } catch (e) {}
  };

  const resetPassword = async (userId) => {
    const newPassword = prompt('Enter a new temporary password (or leave empty to generate automatically):');
    try {
      const data = await apiCall('/api/users/reset-password', 'POST', { userId, newPassword });
      alert(`Temporary password generated for user: ${data.tempPassword}\nThey will be forced to change it on next login.`);
      loadData();
    } catch (e) {}
  };

  const deleteUser = async (userId) => {
    const u = users.find(x => x.id === userId);
    const name = u ? u.fullName : userId;
    if (confirm(`Are you sure you want to delete user "${name}" permanently?`)) {
      try {
        await apiCall(`/api/dashboard/users/${userId}`, 'DELETE');
        showToast('User removed from bank registry.', 'success');
        loadData();
      } catch (e) {}
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading User Registry...</div>;
  }

  return (
    <div className="card" style={{ width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Section 1: Horizontal Provisioning Form */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '18px' }}>
        <h2 style={{ margin: '0 0 14px 0', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
          👤 Provision Staff Account
        </h2>
        <form onSubmit={handleProvisionSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Full Name</label>
              <input
                type="text"
                value={provFullName}
                onChange={e => setProvFullName(e.target.value)}
                required
                placeholder="e.g. John Doe"
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Email Address</label>
              <input
                type="email"
                value={provEmail}
                onChange={e => setProvEmail(e.target.value)}
                required
                placeholder="e.g. john.doe@bank.com"
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Assign Banking Role</label>
              <select
                value={provRole}
                onChange={e => setProvRole(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
              >
                {rolesList.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Assign Branch</label>
              <select
                value={provBranch}
                onChange={e => setProvBranch(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
              >
                {branchesList.length > 0 ? (
                  branchesList.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)
                ) : (
                  <option value="">No Branches Configured</option>
                )}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <button type="submit" className="btn btn-success btn-block" style={{ height: '38px', fontWeight: 700, borderRadius: '6px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                Provision User & Generate Key
              </button>
            </div>
          </div>
        </form>

        {provResult && (
          <div className="alert alert-success" style={{ marginTop: '14px', fontSize: '0.85rem', border: '1px dashed var(--color-success)' }}>
            <h4>Account Provisioned Successfully!</h4>
            <p>Please share the temporary credentials below with the user:</p>
            <div style={{ background: 'rgba(0,0,0,0.05)', padding: '8px', borderRadius: '4px', marginTop: '6px', fontFamily: 'monospace' }}>
              <strong>User ID / ID:</strong> <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{provResult.userId || provResult.id}</span><br />
              <strong>Email:</strong> {provResult.email}<br />
              <strong>Temporary Password:</strong> <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{provResult.tempPassword}</span>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: User Registry Table Container */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>User Registry</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{filteredUsers.length} Total Users</span>
        </div>
        <div className="table-wrapper" style={{ maxHeight: '520px', overflowX: 'auto', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>EMAIL & USER ID</th>
                <th style={{ minWidth: '180px' }}>
                  <select
                    value={roleStatusFilter}
                    onChange={e => setRoleStatusFilter(e.target.value)}
                    style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 4px', fontWeight: 'bold', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                  >
                    <option value="ALL">ROLE & STATUS (ALL)</option>
                    <optgroup label="Filter by Role">
                      {rolesList.map(r => (
                        <option key={r.name} value={`ROLE_${r.name}`}>{r.name}</option>
                      ))}
                      <option value="ROLE_Customer">Customer</option>
                      <option value="ROLE_Merchant">Merchant</option>
                    </optgroup>
                    <optgroup label="Filter by Status">
                      <option value="STATUS_active">Active</option>
                      <option value="STATUS_suspended">Suspended</option>
                    </optgroup>
                  </select>
                </th>
                <th>Branch</th>
                <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td><b>{u.fullName}</b></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {u.email}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#0284c7', fontFamily: 'monospace', fontWeight: 700 }}>
                        ID: {u.userId || u.id}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: u.role === 'Super Admin' ? '#6366f1' : u.role === 'Branch Manager' ? '#0284c7' : u.role === 'Auditor' ? '#d97706' : u.role === 'Compliance Officer' ? '#059669' : u.role === 'Loan Officer' ? '#8b5cf6' : '#2563eb' }}>
                        {u.role}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 600, color: u.status === 'active' ? '#16a34a' : '#dc2626' }}>
                          ● {(u.status || 'active').toUpperCase()}
                        </span>
                        {u.forcePasswordChange && <span style={{ color: '#d97706', fontWeight: 600, fontSize: '0.7rem' }}>(Temp PW)</span>}
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{u.branchName || u.branchId || 'Global HQ'}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-outline-primary btn-xs" onClick={() => setEditUser({ ...u })}>✏️ Edit</button>
                      <button className="btn btn-outline-info btn-xs" onClick={() => { setTransferUser(u); setTargetTransferBranch(u.branchId || branchesList[0]?.id || ''); }}>🔁 Transfer</button>
                      {u.status === 'active' ? (
                        <button className="btn btn-outline-warning btn-xs" onClick={() => toggleSuspension(u.id, 'suspend')}>Suspend</button>
                      ) : (
                        <button className="btn btn-outline-success btn-xs" onClick={() => toggleSuspension(u.id, 'activate')}>Activate</button>
                      )}
                      <button className="btn btn-outline-danger btn-xs" onClick={() => resetPassword(u.id)}>Reset PW</button>
                      <button className="btn btn-outline-danger btn-xs" onClick={() => deleteUser(u.id)}>🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>✏️ Edit User Details</h2>
              <button className="btn-close" onClick={() => setEditUser(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editUser.fullName}
                    onChange={e => setEditUser({ ...editUser, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={editUser.email}
                    onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={editUser.role}
                    onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    {rolesList.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assigned Branch</label>
                  <select
                    value={editUser.branchId || ''}
                    onChange={e => setEditUser({ ...editUser, branchId: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    {branchesList.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Account Status</label>
                  <select
                    value={editUser.status}
                    onChange={e => setEditUser({ ...editUser, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setEditUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Transfer Modal */}
      {transferUser && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>🔁 Transfer Staff/Manager Branch</h2>
              <button className="btn-close" onClick={() => setTransferUser(null)}>✕</button>
            </div>
            <form onSubmit={handleTransferSubmit}>
              <div className="modal-body">
                <div style={{ background: 'rgba(0,0,0,0.04)', padding: '10px 14px', borderRadius: '6px', marginBottom: '15px' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{transferUser.fullName}</strong> ({transferUser.email})<br />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Role: {transferUser.role} | Current Branch: {transferUser.branchName || transferUser.branchId || 'Global HQ'}
                  </span>
                </div>
                <div className="form-group">
                  <label>Select Destination Branch</label>
                  <select
                    value={targetTransferBranch}
                    onChange={e => setTargetTransferBranch(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    {branchesList.map(b => (
                      <option key={b.id} value={b.id}>🏢 {b.name} - {b.code} ({b.address || 'Central Scope'})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setTransferUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-info">Confirm Branch Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
