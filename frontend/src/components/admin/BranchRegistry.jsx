import React, { useState, useEffect } from 'react';

export default function BranchRegistry({ apiCall, showToast }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editBranchId, setEditBranchId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [ifscCode, setIfscCode] = useState('NXSB0000001');
  const [micrCode, setMicrCode] = useState('110240001');
  const [address, setAddress] = useState('');
  const [vaultBalance, setVaultBalance] = useState('0.00');
  const [cashInHand, setCashInHand] = useState('0.00');
  const [minVaultLimit, setMinVaultLimit] = useState('100000.00');
  const [maxVaultLimit, setMaxVaultLimit] = useState('10000000.00');

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/branches');
      setBranches(data || []);
    } catch (e) {
      showToast(e.message || 'Failed to load branches', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const resetForm = () => {
    setEditBranchId('');
    setName('');
    setCode('');
    setIfscCode('NXSB0000001');
    setMicrCode('110240001');
    setAddress('');
    setVaultBalance('0.00');
    setCashInHand('0.00');
    setMinVaultLimit('100000.00');
    setMaxVaultLimit('10000000.00');
  };

  const handleEdit = (b) => {
    setEditBranchId(b.id);
    setName(b.name || '');
    setCode(b.code || '');
    setIfscCode(b.ifscCode || 'NXSB0000001');
    setMicrCode(b.micrCode || '110240001');
    setAddress(b.address || '');
    setVaultBalance(b.vaultBalance || '0.00');
    setCashInHand(b.cashInHand || '0.00');
    setMinVaultLimit(b.minVaultLimit || '100000.00');
    setMaxVaultLimit(b.maxVaultLimit || '10000000.00');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = editBranchId ? `/api/branches/${editBranchId}` : '/api/branches';
    const method = editBranchId ? 'PUT' : 'POST';

    try {
      await apiCall(endpoint, method, {
        name,
        code,
        ifscCode,
        micrCode,
        address,
        vaultBalance: parseFloat(vaultBalance) || 0,
        cashInHand: parseFloat(cashInHand) || 0,
        minVaultLimit: parseFloat(minVaultLimit) || 0,
        maxVaultLimit: parseFloat(maxVaultLimit) || 0
      });
      showToast(`Branch ${editBranchId ? 'updated' : 'configured'} successfully.`, 'success');
      resetForm();
      loadBranches();
    } catch (err) {
      showToast(err.message || 'Failed to save branch configuration', 'danger');
    }
  };

  const handleDelete = async (bId) => {
    if (confirm('Are you sure you want to delete this branch configuration?')) {
      try {
        await apiCall(`/api/branches/${bId}`, 'DELETE');
        showToast('Branch configuration removed.', 'success');
        loadBranches();
      } catch (e) {}
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading Branch Registry...</div>;
  }

  return (
    <div className="card" style={{ width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Configure Branch Section */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏢 Configure Branch
          </h2>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetForm} style={{ padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 }}>Clear Form</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Branch Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Downtown Branch"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Branch Code *</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                placeholder="e.g. DT001"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>IFSC Code *</label>
              <input
                type="text"
                value={ifscCode}
                onChange={e => setIfscCode(e.target.value)}
                required
                placeholder="e.g. NXSB0000001"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>MICR Code *</label>
              <input
                type="text"
                value={micrCode}
                onChange={e => setMicrCode(e.target.value)}
                required
                placeholder="e.g. 110240001"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 123 Main St, New York, NY"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Vault Balance (₹)</label>
              <input
                type="number"
                step="0.01"
                value={vaultBalance}
                onChange={e => setVaultBalance(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Cash In Hand (₹)</label>
              <input
                type="number"
                step="0.01"
                value={cashInHand}
                onChange={e => setCashInHand(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Min Vault Limit (₹)</label>
              <input
                type="number"
                step="0.01"
                value={minVaultLimit}
                onChange={e => setMinVaultLimit(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Max Vault Limit (₹)</label>
              <input
                type="number"
                step="0.01"
                value={maxVaultLimit}
                onChange={e => setMaxVaultLimit(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '7px 20px', fontSize: '0.82rem', fontWeight: 700, borderRadius: '6px', background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', color: '#fff', border: 'none', cursor: 'pointer' }}>
              {editBranchId ? 'Update Branch' : 'Save Branch'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Branch Registry Table Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏢 Active Branch Registry
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{branches.length} Configured Locations</span>
        </div>
        <div className="table-wrapper" style={{ maxHeight: '550px', overflowX: 'auto', overflowY: 'auto', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Branch</th>
                <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Code & Routing</th>
                <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Address</th>
                <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Vault / Cash</th>
                <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Limits</th>
                <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px' }}><b style={{ fontSize: '0.85rem', color: '#0f172a' }}>{b.name}</b></td>
                  <td style={{ padding: '10px 12px' }}>
                    <code style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 'bold' }}>{b.code}</code><br />
                    <span style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 600 }}>IFSC: {b.ifscCode || 'NXSB0000001'}</span><br />
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>MICR: {b.micrCode || '110240001'}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}><span style={{ fontSize: '0.8rem', color: '#475569' }}>{b.address || '-'}</span></td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 500 }}>Vault: ₹{(b.vaultBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span><br />
                    <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 500 }}>Cash: ₹{(b.cashInHand || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Min: ₹{(b.minVaultLimit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span><br />
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Max: ₹{(b.maxVaultLimit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button className="btn btn-sm btn-outline-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleEdit(b)}>✏️ Edit</button>
                      <button className="btn btn-sm btn-outline-danger" style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleDelete(b.id)}>🗑️ Delete</button>
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
