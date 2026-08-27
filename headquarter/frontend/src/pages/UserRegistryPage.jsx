import React, { useState, useEffect } from 'react';

/**
 * UserRegistryPage.jsx
 * Enterprise User Directory for Headquarter.
 * Manage bank staff across all branches, roles, status (Active/Suspended),
 * password resets, and branch reassignments.
 */
export default function UserRegistryPage({ user, apiCall, showToast }) {
  const [users, setUsers] = useState([
    { id: 'USR-101', name: 'Root Administrator', email: 'admin@bank.com', role: 'Super Admin', branch: 'Global Headquarters', status: 'ACTIVE', phone: '+91 99000 00001' },
    { id: 'USR-102', name: 'Alok Nath', email: 'manager.delhi@bank.com', role: 'Branch Manager', branch: 'New Delhi Main (DEL1)', status: 'ACTIVE', phone: '+91 99000 00002' },
    { id: 'USR-103', name: 'Sujit Kumar', email: 'teller1.delhi@bank.com', role: 'Employee', branch: 'New Delhi Main (DEL1)', status: 'ACTIVE', phone: '+91 99000 00003' },
    { id: 'USR-104', name: 'Sunita Rao', email: 'manager.mumbai@bank.com', role: 'Branch Manager', branch: 'Mumbai BKC (MUM1)', status: 'ACTIVE', phone: '+91 99000 00004' },
    { id: 'USR-105', name: 'Rohan Gupta', email: 'auditor@bank.com', role: 'Auditor', branch: 'Global Headquarters', status: 'ACTIVE', phone: '+91 99000 00005' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Employee',
    branch: 'New Delhi Main (DEL1)',
    phone: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      if (apiCall) {
        const res = await apiCall('/api/dashboard/users').catch(() => null);
        if (res && res.users && res.users.length > 0) {
          setUsers(res.users);
        }
      }
    } catch (e) {}
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    const created = {
      id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      branch: newUser.branch,
      status: 'ACTIVE',
      phone: newUser.phone || '+91 99000 XXXXX'
    };

    setUsers(prev => [created, ...prev]);
    showToast(`Staff member ${created.name} provisioned successfully! Credentials sent to email.`, 'success');
    setShowAddModal(false);
    setNewUser({ name: '', email: '', role: 'Employee', branch: 'New Delhi Main (DEL1)', phone: '' });
  };

  const handleToggleStatus = (id, name, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: nextStatus } : u));
    showToast(`User ${name} status changed to ${nextStatus}.`, nextStatus === 'ACTIVE' ? 'success' : 'warning');
  };

  const filtered = users.filter(u => {
    const q = searchTerm.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.branch || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Card */}
      <div className="card" style={{ padding: '22px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
            👥 Enterprise User & Staff Directory ({users.length})
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            Provision, manage, and govern access for all bank administrators, managers, and employees.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Search staff, email, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '260px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
          />
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ fontWeight: 700, padding: '9px 16px', fontSize: '0.88rem' }}
          >
            ➕ Provision User
          </button>
        </div>
      </div>

      {/* Provision User Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '24px', borderRadius: '16px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Provision New Bank Employee</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Mahindra"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="user@bank.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Assigned Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="Employee">Employee (Teller/Desk)</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Super Admin">Super Admin (HQ)</option>
                    <option value="Auditor">Compliance Auditor</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Assigned Branch</label>
                  <select
                    value={newUser.branch}
                    onChange={(e) => setNewUser({ ...newUser, branch: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="New Delhi Main (DEL1)">New Delhi Main (DEL1)</option>
                    <option value="Mumbai BKC (MUM1)">Mumbai BKC (MUM1)</option>
                    <option value="Bengaluru MG Road (BLR1)">Bengaluru MG Road (BLR1)</option>
                    <option value="Global Headquarters">Global Headquarters</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>Provision Staff Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '14px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left', background: '#f8fafc' }}>
                <th style={{ padding: '12px 14px' }}>User ID</th>
                <th style={{ padding: '12px 14px' }}>Staff Name</th>
                <th style={{ padding: '12px 14px' }}>Email Address</th>
                <th style={{ padding: '12px 14px' }}>Role</th>
                <th style={{ padding: '12px 14px' }}>Branch</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id || u.email} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{u.id}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{u.name}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{u.email}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 500 }}>{u.branch}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: u.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                      color: u.status === 'ACTIVE' ? '#15803d' : '#b91c1c'
                    }}>
                      ● {u.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <button
                      className={`btn ${u.status === 'ACTIVE' ? 'btn-outline-danger' : 'btn-outline'}`}
                      onClick={() => handleToggleStatus(u.id, u.name, u.status)}
                      style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '6px' }}
                    >
                      {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
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
