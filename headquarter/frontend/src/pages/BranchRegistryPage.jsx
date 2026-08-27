import React, { useState, useEffect } from 'react';

/**
 * BranchRegistryPage.jsx
 * Branch Network Registry & Infrastructure Management for Headquarter.
 * Configure branch codes, IFSC codes, vault limits, and geographic locations.
 */
export default function BranchRegistryPage({ user, apiCall, showToast }) {
  const [branches, setBranches] = useState([
    { id: 'DEL1', name: 'New Delhi Main Connaught Place', ifsc: 'BSB0000DEL1', city: 'New Delhi', state: 'Delhi', vaultLimit: 20000000, activeTellers: 4, manager: 'Alok Nath', status: 'OPERATIONAL' },
    { id: 'MUM1', name: 'Mumbai Bandra Kurla Complex', ifsc: 'BSB0000MUM1', city: 'Mumbai', state: 'Maharashtra', vaultLimit: 35000000, activeTellers: 6, manager: 'Sunita Rao', status: 'OPERATIONAL' },
    { id: 'BLR1', name: 'Bengaluru MG Road Financial Hub', ifsc: 'BSB0000BLR1', city: 'Bengaluru', state: 'Karnataka', vaultLimit: 25000000, activeTellers: 5, manager: 'Karthik Raja', status: 'OPERATIONAL' },
    { id: 'HYD1', name: 'Hyderabad Hitec City Branch', ifsc: 'BSB0000HYD1', city: 'Hyderabad', state: 'Telangana', vaultLimit: 18000000, activeTellers: 3, manager: 'Venkatesh P', status: 'OPERATIONAL' }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newBranch, setNewBranch] = useState({
    code: '',
    name: '',
    city: '',
    state: '',
    vaultLimit: '20000000',
    manager: ''
  });

  const handleAddBranch = (e) => {
    e.preventDefault();
    const created = {
      id: newBranch.code.toUpperCase(),
      name: newBranch.name,
      ifsc: `BSB0000${newBranch.code.toUpperCase()}`,
      city: newBranch.city,
      state: newBranch.state,
      vaultLimit: Number(newBranch.vaultLimit),
      activeTellers: 2,
      manager: newBranch.manager || 'Designated Manager',
      status: 'OPERATIONAL'
    };

    setBranches(prev => [created, ...prev]);
    showToast(`Branch ${created.name} (${created.ifsc}) created and provisioned into national core banking!`, 'success');
    setShowAddModal(false);
    setNewBranch({ code: '', name: '', city: '', state: '', vaultLimit: '20000000', manager: '' });
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Card */}
      <div className="card" style={{ padding: '22px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
            🏢 National Branch Registry & Clearing IFSCs ({branches.length})
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            Configure branch codes, strongroom cash holding limits, and regional banking clusters.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ fontWeight: 700, padding: '9px 18px', fontSize: '0.88rem' }}
        >
          ➕ Provision New Branch
        </button>
      </div>

      {/* Provision Branch Modal */}
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
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Provision New Bank Branch</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleAddBranch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CHE1"
                    maxLength="4"
                    value={newBranch.code}
                    onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai Anna Salai"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai"
                    value={newBranch.city}
                    onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tamil Nadu"
                    value={newBranch.state}
                    onChange={(e) => setNewBranch({ ...newBranch, state: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Vault Cash Limit (₹)</label>
                <input
                  type="number"
                  value={newBranch.vaultLimit}
                  onChange={(e) => setNewBranch({ ...newBranch, vaultLimit: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>Provision Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branches Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {branches.map(b => (
          <div
            key={b.id}
            className="card"
            style={{ padding: '22px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8' }}>
                  {b.id}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#dcfce7', color: '#15803d' }}>
                  ● {b.status}
                </span>
              </div>

              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 2px 0', color: '#0f172a' }}>{b.name}</h4>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '12px' }}>{b.city}, {b.state}</div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>IFSC Code:</span>
                  <strong style={{ fontFamily: 'monospace' }}>{b.ifsc}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Vault Cash Limit:</span>
                  <strong style={{ color: '#059669' }}>₹{(b.vaultLimit / 100000).toFixed(1)} Lakh</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Branch Manager:</span>
                  <strong>{b.manager}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
