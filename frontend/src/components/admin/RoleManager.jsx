import React, { useState, useEffect } from 'react';

export default function RoleManager({ apiCall, showToast }) {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editRoleId, setEditRoleId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedPerms, setSelectedPerms] = useState({});

  const modulesList = [
    'summary', 'branch-customers', 'users', 'customer-registry', 'role-manager', 'branches', 'ledger', 'developers',
    'interest', 'disaster', 'approvals', 'employees', 'treasury',
    'customers', 'transactions', 'crm', 'tickets', 'dms', 'transfers',
    'beneficiaries', 'products', 'assistant', 'settings', 'qr', 'settlements'
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/roles');
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
      setRolePermissions(data.rolePermissions || []);
    } catch (e) {
      showToast(e.message || 'Failed to load role configuration', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditRoleId('');
    setRoleName('');
    setSelectedModules([]);
    setSelectedPerms({});
  };

  const handleModuleToggle = (m) => {
    if (selectedModules.includes(m)) {
      setSelectedModules(selectedModules.filter(x => x !== m));
    } else {
      setSelectedModules([...selectedModules, m]);
    }
  };

  const handlePermToggle = (permId) => {
    const curr = selectedPerms[permId];
    if (curr) {
      const next = { ...selectedPerms };
      delete next[permId];
      setSelectedPerms(next);
    } else {
      setSelectedPerms({ ...selectedPerms, [permId]: 'Global' });
    }
  };

  const handleScopeChange = (permId, scope) => {
    if (selectedPerms[permId]) {
      setSelectedPerms({ ...selectedPerms, [permId]: scope });
    }
  };

  const handleEditRole = (r) => {
    setEditRoleId(r.id);
    setRoleName(r.name || '');
    setSelectedModules(r.modules || []);

    const currentRPs = rolePermissions.filter(rp => rp.roleId === r.id);
    const pMap = {};
    currentRPs.forEach(rp => {
      pMap[rp.permissionId] = rp.scope || 'Global';
    });
    setSelectedPerms(pMap);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const permPayload = Object.keys(selectedPerms).map(pId => ({
      permissionId: pId,
      scope: selectedPerms[pId]
    }));

    const endpoint = editRoleId ? `/api/roles/${editRoleId}` : '/api/roles';
    const method = editRoleId ? 'PUT' : 'POST';

    try {
      await apiCall(endpoint, method, {
        name: roleName,
        modules: selectedModules,
        permissions: permPayload
      });
      showToast(`Role ${editRoleId ? 'updated' : 'configured'} successfully.`, 'success');
      resetForm();
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to save role configuration', 'danger');
    }
  };

  const handleDelete = async (rId) => {
    if (confirm('Are you sure you want to delete this custom role?')) {
      try {
        await apiCall(`/api/roles/${rId}`, 'DELETE');
        showToast('Custom role deleted.', 'success');
        loadData();
      } catch (e) {}
    }
  };

  const getPermissionsString = (rId) => {
    const rpList = rolePermissions.filter(rp => rp.roleId === rId);
    if (rpList.length === 0) return <span className="text-secondary">None</span>;
    return rpList.map(rp => {
      const perm = permissions.find(p => p.id === rp.permissionId);
      const act = perm ? perm.action : rp.permissionId;
      return (
        <span key={rp.permissionId} className="status-badge active" style={{ margin: '2px', display: 'inline-block', fontSize: '0.7rem', padding: '2px 6px' }}>
          {act} ({rp.scope})
        </span>
      );
    });
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading Role Matrix...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Panel: Horizontal Configure Custom Role Form */}
      <div className="card" style={{ width: '100%' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>🛡️ Configure Custom Role</h2>
          <button className="btn btn-outline-secondary btn-sm" onClick={resetForm}>Clear Form</button>
        </div>
        <form onSubmit={handleSubmit} style={{ marginTop: '15px' }}>
          {/* Role Name */}
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label>Role Name</label>
            <input
              type="text"
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              required
              placeholder="e.g. Risk Manager"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', marginTop: '4px' }}
            />
          </div>

          {/* Authorized Workspace Modules Grid */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Authorized Workspace Modules</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', background: 'var(--bg-main)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
              {modulesList.map(m => (
                <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(m)}
                    onChange={() => handleModuleToggle(m)}
                  />
                  {m.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Granular Permission & Scopes Matrix Grid */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Granular Permission & Scopes Matrix</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', maxHeight: '300px', overflowY: 'auto', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
              {permissions.map(p => {
                const isSelected = !!selectedPerms[p.id];
                const currentScope = selectedPerms[p.id] || 'Global';
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePermToggle(p.id)}
                      />
                      <b>{p.action}</b>
                    </label>
                    <select
                      value={currentScope}
                      onChange={e => handleScopeChange(p.id, e.target.value)}
                      disabled={!isSelected}
                      style={{ padding: '3px 8px', fontSize: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                    >
                      <option value="Global">Global</option>
                      <option value="Branch">Branch</option>
                      <option value="Department">Department</option>
                      <option value="Own Records">Own Records</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ height: '38px', fontWeight: 700, minWidth: '220px' }}>
              {editRoleId ? 'Update Role Configuration' : 'Commit Role Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Panel: Full Width Active Role Registry Table */}
      <div className="card" style={{ width: '100%' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Active Role Registry</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{roles.length} Active System Roles</span>
        </div>
        <div className="table-wrapper" style={{ maxHeight: '550px', overflowX: 'auto', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Authorized Modules</th>
                <th>Permissions & Scopes</th>
                <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <b>{r.name}</b><br />
                    {r.custom ? (
                      <span className="status-badge active" style={{ marginTop: '4px', display: 'inline-block' }}>Custom</span>
                    ) : (
                      <span className="status-badge pending" style={{ marginTop: '4px', display: 'inline-block' }}>System</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {(r.modules || []).join(', ')}
                    </div>
                  </td>
                  <td>
                    <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                      {getPermissionsString(r.id)}
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-outline-primary btn-xs" onClick={() => handleEditRole(r)}>✏️ Edit</button>
                      <button className="btn btn-outline-danger btn-xs" onClick={() => handleDelete(r.id)}>🗑️ Delete</button>
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
