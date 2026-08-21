import React, { useState, useEffect } from 'react';

export default function CustomerRegistry({ apiCall, showToast }) {
  const [customers, setCustomers] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Toggle states
  const [searchQuery, setSearchQuery] = useState('');
  const [emailColMode, setEmailColMode] = useState('email'); // 'email' | 'id'

  // Onboarding Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [dob, setDob] = useState('1995-01-01');
  const [sdhwo, setSdhwo] = useState('');
  const [mopType, setMopType] = useState('Self');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [branchId, setBranchId] = useState('');
  const [accountType, setAccountType] = useState('savings');
  const [initialDeposit, setInitialDeposit] = useState('1000');
  const [regResult, setRegResult] = useState(null);

  // Modals
  const [viewCustomer, setViewCustomer] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
  const [addAccCustomer, setAddAccCustomer] = useState(null);
  const [newAccType, setNewAccType] = useState('savings');
  const [newAccDeposit, setNewAccDeposit] = useState('500');

  const loadData = async () => {
    try {
      setLoading(true);
      const cData = await apiCall('/api/customers/registry').catch(() => []);
      const bData = await apiCall('/api/branches').catch(() => []);

      setCustomers(cData || []);
      setBranchesList(bData || []);
      if (bData && bData.length > 0 && !branchId) setBranchId(bData[0].id);
    } catch (e) {
      showToast(e.message || 'Failed to load customer registry data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await apiCall('/api/customers/register', 'POST', {
        fullName,
        email,
        mobileNumber,
        accountNumber,
        panNumber,
        dob,
        sdhwo,
        mopType,
        gender,
        address,
        branchId,
        accountType,
        initialDeposit
      });
      setRegResult(result);
      showToast('Customer registered & account opened successfully.', 'success');
      setFullName('');
      setEmail('');
      setMobileNumber('');
      setAccountNumber('');
      setPanNumber('');
      setSdhwo('');
      setAddress('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to register customer', 'danger');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editCustomer) return;
    try {
      await apiCall(`/api/customers/${editCustomer.id}`, 'PUT', {
        fullName: editCustomer.fullName,
        email: editCustomer.email,
        mobileNumber: editCustomer.mobileNumber,
        address: editCustomer.address,
        status: editCustomer.status
      });
      showToast('Customer details updated successfully.', 'success');
      setEditCustomer(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update customer', 'danger');
    }
  };

  const handleAddAccountSubmit = async (e) => {
    e.preventDefault();
    if (!addAccCustomer) return;
    try {
      await apiCall('/api/customers/add-account', 'POST', {
        customerId: addAccCustomer.id,
        accountType: newAccType,
        initialDeposit: newAccDeposit
      });
      showToast('Additional account opened successfully.', 'success');
      setAddAccCustomer(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to open account', 'danger');
    }
  };

  const toggleFreeze = async (customerId, currentStatus) => {
    const action = currentStatus === 'frozen' ? 'unfreeze' : 'freeze';
    try {
      await apiCall('/api/customers/freeze', 'POST', { customerId, action });
      showToast(`Customer account ${action === 'freeze' ? 'frozen' : 'unfrozen'} successfully.`, 'success');
      loadData();
    } catch (e) {}
  };

  const deleteCustomer = async (customerId, name) => {
    if (confirm(`Are you sure you want to delete customer "${name}" and all linked accounts permanently?`)) {
      try {
        await apiCall(`/api/customers/${customerId}`, 'DELETE');
        showToast('Customer record removed from registry.', 'success');
        loadData();
      } catch (e) {}
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = c.fullName && c.fullName.toLowerCase().includes(q);
    const emailMatch = c.email && c.email.toLowerCase().includes(q);
    const idMatch = (c.userId || c.id || '').toLowerCase().includes(q);
    const phoneMatch = c.mobileNumber && c.mobileNumber.toLowerCase().includes(q);
    const accMatch = c.accounts && c.accounts.some(a => a.accountNumber.includes(q));
    return nameMatch || emailMatch || idMatch || phoneMatch || accMatch;
  });

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading Customer Registry...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Panel: Customer Onboarding & Account Creation */}
      <div className="card" style={{ width: '100%' }}>
        <div className="card-header">
          <h2>👤 Register & Onboard New Customer</h2>
        </div>
        <form onSubmit={handleRegisterSubmit} style={{ marginTop: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="e.g. Sarah Connor"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="e.g. sarah.connor@gmail.com"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Mobile Number</label>
              <input
                type="text"
                value={mobileNumber}
                onChange={e => setMobileNumber(e.target.value)}
                placeholder="e.g. +1555987654"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Account Number (Custom / Auto)</label>
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                placeholder="Auto-generated if left empty"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Customer PAN Number</label>
              <input
                type="text"
                value={panNumber}
                onChange={e => setPanNumber(e.target.value.toUpperCase())}
                placeholder="e.g. ABCDE1234F"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Date of Birth (DOB)</label>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>S/D/H/W/o (Father/Spouse Name)</label>
              <input
                type="text"
                value={sdhwo}
                onChange={e => setSdhwo(e.target.value)}
                placeholder="e.g. S/o John Connor"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Mode of Operation (MOP)</label>
              <select
                value={mopType}
                onChange={e => setMopType(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              >
                <option value="Self">Self (Single Account)</option>
                <option value="Either or Survivor">Either or Survivor (Joint)</option>
                <option value="Former or Survivor">Former or Survivor (Joint)</option>
                <option value="Jointly Operated">Jointly Operated</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Assign Branch</label>
              <select
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              >
                {branchesList.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Primary Account Type</label>
              <select
                value={accountType}
                onChange={e => setAccountType(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              >
                <option value="savings">Savings Account</option>
                <option value="current">Current Checking Account</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Initial Deposit (₹)</label>
              <input
                type="number"
                value={initialDeposit}
                onChange={e => setInitialDeposit(e.target.value)}
                placeholder="1000"
                min="0"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <button type="submit" className="btn btn-success btn-block" style={{ height: '38px', fontWeight: 700 }}>
                Register Customer & Open Account
              </button>
            </div>
          </div>
        </form>

        {regResult && (
          <div className="alert alert-success" style={{ marginTop: '20px', fontSize: '0.85rem', border: '1px dashed var(--color-success)' }}>
            <h4>Customer Account Generated Successfully!</h4>
            <div style={{ background: 'rgba(0,0,0,0.05)', padding: '10px', borderRadius: '4px', marginTop: '8px', fontFamily: 'monospace' }}>
              <strong>Customer ID (ID):</strong> <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{regResult.userId}</span><br />
              <strong>Account Number:</strong> <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{regResult.account?.accountNumber}</span><br />
              <strong>Email:</strong> {regResult.customer?.email}<br />
              <strong>Temporary Password:</strong> <span style={{ fontWeight: 'bold' }}>{regResult.tempPassword}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel: Full Width Customer Registry Table */}
      <div className="card" style={{ width: '100%' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ display: 'inline', marginRight: '10px' }}>Customer Registry</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{filteredCustomers.length} Customers Found</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 Search name, ID, email, account..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', width: '260px' }}
            />
          </div>
        </div>

        <div className="table-wrapper" style={{ maxHeight: '550px', overflowX: 'auto', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>EMAIL & CUSTOMER ID</th>
                <th>Mobile / Phone</th>
                <th>Linked Accounts & Balance</th>
                <th>Branch</th>
                <th>Status & KYC</th>
                <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    No customer records matched your query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <b style={{ cursor: 'pointer', color: 'var(--accent-primary)' }} onClick={() => setViewCustomer(c)}>
                        {c.fullName}
                      </b>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {c.email}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#0284c7', fontFamily: 'monospace', fontWeight: 700 }}>
                          ID: {c.userId || c.id}
                        </span>
                      </div>
                    </td>
                    <td><span style={{ fontSize: '0.8rem' }}>{c.mobileNumber || 'N/A'}</span></td>
                    <td>
                      {c.accounts && c.accounts.length > 0 ? (
                        <div style={{ fontSize: '0.8rem' }}>
                          <strong>{c.accounts[0].accountNumber}</strong> ({c.accounts[0].type.toUpperCase()})<br />
                          <span style={{ color: 'var(--success)', fontWeight: 700 }}>₹{parseFloat(c.totalBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          {c.accounts.length > 1 && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>({c.accounts.length} accs)</span>}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No Active Accounts</span>
                      )}
                    </td>
                    <td><span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.branchName}</span></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: c.status === 'active' ? '#16a34a' : '#dc2626' }}>
                          ● {(c.status || 'active').toUpperCase()}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.75rem', color: c.kycStatus === 'verified' ? '#0284c7' : '#d97706' }}>
                          {c.kycStatus === 'verified' ? 'KYC ✓' : 'KYC Pending'}
                        </span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'nowrap' }}>
                        <button className="btn btn-outline-info btn-xs" onClick={() => setViewCustomer(c)}>👁️ Profile</button>
                        <button className="btn btn-outline-primary btn-xs" onClick={() => setEditCustomer({ ...c })}>✏️ Edit</button>
                        <button className="btn btn-outline-secondary btn-xs" onClick={() => setAddAccCustomer(c)}>➕ Acc</button>
                        {c.status === 'frozen' ? (
                          <button className="btn btn-outline-success btn-xs" onClick={() => toggleFreeze(c.id, 'frozen')}>🔓 Unfreeze</button>
                        ) : (
                          <button className="btn btn-outline-warning btn-xs" onClick={() => toggleFreeze(c.id, 'active')}>🔒 Freeze</button>
                        )}
                        <button className="btn btn-outline-danger btn-xs" onClick={() => deleteCustomer(c.id, c.fullName)}>🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Profile Modal */}
      {viewCustomer && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2>👤 Customer Profile Details</h2>
              <button className="btn-close" onClick={() => setViewCustomer(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '6px' }}>
                <div><strong>Full Name:</strong> {viewCustomer.fullName}</div>
                <div><strong>Customer ID:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{viewCustomer.userId || viewCustomer.id}</span></div>
                <div><strong>Email Address:</strong> {viewCustomer.email}</div>
                <div><strong>Mobile Phone:</strong> {viewCustomer.mobileNumber || 'N/A'}</div>
                <div><strong>PAN Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{viewCustomer.panNumber || 'ABCDE1234F'}</span></div>
                <div><strong>DOB:</strong> {viewCustomer.dob || '1995-01-01'}</div>
                <div><strong>S/D/H/W/o:</strong> {viewCustomer.sdhwo || 'N/A'}</div>
                <div><strong>Gender:</strong> {viewCustomer.gender || 'Other'}</div>
                <div><strong>Branch:</strong> {viewCustomer.branchName}</div>
                <div><strong>KYC Verification:</strong> <span className={`status-badge ${viewCustomer.kycStatus === 'verified' ? 'active' : 'pending'}`}>{viewCustomer.kycStatus}</span></div>
              </div>

              <div>
                <h4 style={{ marginBottom: '8px' }}>🏦 Linked Bank Accounts</h4>
                <table style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Account Number</th>
                      <th>Type</th>
                      <th>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewCustomer.accounts && viewCustomer.accounts.length > 0 ? (
                      viewCustomer.accounts.map(a => (
                        <tr key={a.id}>
                          <td><b>{a.accountNumber}</b></td>
                          <td>{a.type.toUpperCase()}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{parseFloat(a.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td><span className={`status-badge ${a.status}`}>{a.status}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4">No accounts linked.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewCustomer(null)}>Close Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Profile Modal */}
      {editCustomer && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>✏️ Edit Customer Profile</h2>
              <button className="btn-close" onClick={() => setEditCustomer(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editCustomer.fullName}
                    onChange={e => setEditCustomer({ ...editCustomer, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={editCustomer.email}
                    onChange={e => setEditCustomer({ ...editCustomer, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input
                    type="text"
                    value={editCustomer.mobileNumber || ''}
                    onChange={e => setEditCustomer({ ...editCustomer, mobileNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Residential Address</label>
                  <input
                    type="text"
                    value={editCustomer.address || ''}
                    onChange={e => setEditCustomer({ ...editCustomer, address: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editCustomer.status}
                    onChange={e => setEditCustomer({ ...editCustomer, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="active">Active</option>
                    <option value="frozen">Frozen</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setEditCustomer(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Additional Account Modal */}
      {addAccCustomer && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>➕ Open Sub-Account for {addAccCustomer.fullName}</h2>
              <button className="btn-close" onClick={() => setAddAccCustomer(null)}>✕</button>
            </div>
            <form onSubmit={handleAddAccountSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Account Type</label>
                  <select
                    value={newAccType}
                    onChange={e => setNewAccType(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="savings">Savings Account</option>
                    <option value="current">Current Checking Account</option>
                    <option value="fd">Fixed Deposit (FD)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Initial Opening Deposit (₹)</label>
                  <input
                    type="number"
                    value={newAccDeposit}
                    onChange={e => setNewAccDeposit(e.target.value)}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setAddAccCustomer(null)}>Cancel</button>
                <button type="submit" className="btn btn-success">Confirm & Open Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
