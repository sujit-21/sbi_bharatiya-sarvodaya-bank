import React, { useState, useEffect } from 'react';

export default function BranchCustomers({ user, apiCall, showToast }) {
  const [loading, setLoading] = useState(true);
  const [branchesList, setBranchesList] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branchData, setBranchData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Form States
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [viewAccountsCustomer, setViewAccountsCustomer] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
  const [addAccCustomer, setAddAccCustomer] = useState(null);

  // Onboard Form Inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [dob, setDob] = useState('1995-01-01');
  const [sdhwo, setSdhwo] = useState('');
  const [mopType, setMopType] = useState('Self');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [accountType, setAccountType] = useState('savings');
  const [initialDeposit, setInitialDeposit] = useState('1000');
  const [regResult, setRegResult] = useState(null);
  const [showOnboardForm, setShowOnboardForm] = useState(true);

  // Add Account Inputs
  const [newAccType, setNewAccType] = useState('savings');
  const [newAccDeposit, setNewAccDeposit] = useState('500');

  const isSuperAdmin = (user?.role || '').toLowerCase().includes('super') || (user?.role || '').toLowerCase().includes('admin');

  const loadData = async () => {
    try {
      setLoading(true);
      if (isSuperAdmin) {
        const bList = await apiCall('/api/branches').catch(() => []);
        setBranchesList(bList || []);

        const activeBranch = selectedBranchId || user?.branchId || (bList.length > 0 ? bList[0].id : 'b-main');
        if (!selectedBranchId && activeBranch) setSelectedBranchId(activeBranch);

        const data = await apiCall(`/api/branches/${activeBranch}/customers`).catch(() => null);
        if (data) {
          setBranchData(data.branch || null);
          setCustomers(data.customers || []);
        }
      } else {
        const data = await apiCall('/api/branch-customers').catch(() => null);
        if (data) {
          setBranchData(data.branch || null);
          setCustomers(data.customers || []);
        }
      }
    } catch (e) {
      showToast(e.message || 'Failed to load branch customer database', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBranchId]);

  // CRUD Handlers
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const activeBranchId = branchData?.id || user?.branchId || 'b-main';
    try {
      const result = await apiCall('/api/customers/register', 'POST', {
        fullName,
        email,
        mobileNumber,
        accountNumber,
        panNumber,
        aadhaarNumber,
        nomineeName,
        dob,
        sdhwo,
        mopType,
        gender,
        address,
        branchId: activeBranchId,
        accountType,
        initialDeposit
      });
      setRegResult(result);
      showToast('Customer registered & onboarded successfully.', 'success');
      setFullName('');
      setEmail('');
      setMobileNumber('');
      setAccountNumber('');
      setPanNumber('');
      setAadhaarNumber('');
      setNomineeName('');
      setSdhwo('');
      setAddress('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to onboard customer', 'danger');
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
      showToast('Branch Customer updated successfully.', 'success');
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
    } catch (e) {
      showToast(e.message || 'Action failed', 'danger');
    }
  };

  const deleteCustomer = async (customerId, custName) => {
    if (!window.confirm(`Are you sure you want to delete customer '${custName}' from this branch?`)) return;
    try {
      await apiCall(`/api/customers/${customerId}`, 'DELETE');
      showToast(`Customer ${custName} deleted successfully.`, 'info');
      loadData();
    } catch (e) {
      showToast(e.message || 'Failed to delete customer', 'danger');
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
    const panMatch = c.panNumber && c.panNumber.toLowerCase().includes(q);
    return nameMatch || emailMatch || idMatch || phoneMatch || accMatch || panMatch;
  });

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading Branch Customer Database...</div>;
  }

  const currentBranchName = branchData ? `${branchData.name} (${branchData.code})` : 'Branch HQ';
  const totalBranchDeposits = customers.reduce((sum, c) => sum + (c.totalBalance || 0), 0);

  return (
    <div className="card" style={{ width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Integrated Header Bar: Title + Branch Selector / Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
            Branch Customer Database
          </h2>
          <p style={{ margin: '3px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
            Scoped Customer Registry & Accounts for <strong>{currentBranchName}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowOnboardForm(!showOnboardForm)} style={{ padding: '8px 16px', fontWeight: 700, borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', color: '#ffffff', boxShadow: '0 4px 12px rgba(37,99,235,0.25)', border: 'none', cursor: 'pointer' }}>
            {showOnboardForm ? 'Hide Form' : '+ Create Account / Onboard Customer'}
          </button>

          {/* Branch Switcher ONLY for Super Admin */}
          {isSuperAdmin && branchesList.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>Branch:</label>
              <select
                value={selectedBranchId}
                onChange={e => setSelectedBranchId(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontWeight: 700, fontSize: '0.85rem', background: 'var(--bg-main)', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                {branchesList.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
          )}

          <input
            type="text"
            placeholder="Search name, email, ID, PAN..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem', width: '220px', background: 'var(--bg-main)' }}
          />
        </div>
      </div>

      {/* Branch Summary Metrics (4 compact cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ background: 'rgba(37, 99, 235, 0.04)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.12)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Branch Location</span>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px' }}>{branchData?.name || 'Branch HQ'}</div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>IFSC: {branchData?.ifscCode || 'BSB0000MUM1'} | MICR: {branchData?.micrCode || '400240001'}</span>
        </div>

        <div style={{ background: 'rgba(99, 102, 241, 0.04)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.12)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Total Branch Customers</span>
          <div style={{ fontSize: '0.98rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>{customers.length} Registered</div>
        </div>

        {/* Card 3: Total Branch Accounts (with Filter) */}
        <div style={{ background: 'rgba(14, 165, 233, 0.04)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.12)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Total Branch Accounts</span>
            <select
              value={accountTypeFilter || 'ALL'}
              onChange={e => setAccountTypeFilter(e.target.value)}
              style={{ padding: '2px 6px', fontSize: '0.68rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontWeight: 700, background: 'var(--bg-main)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <option value="ALL">All Types</option>
              <option value="savings">Savings</option>
              <option value="current">Current</option>
              <option value="fixed_deposit">Fixed Deposit</option>
              <option value="loan">Loan</option>
            </select>
          </div>
          <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
            {filteredAccountCount} Accounts
          </div>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.04)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Branch Customer Deposits</span>
          <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
            ₹{totalBranchDeposits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Customer Table Container */}
      <div style={{ marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Customers Managed by Branch
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Showing {filteredCustomers.length} of {customers.length} records</span>
        </div>

        <div className="table-wrapper" style={{ maxHeight: '520px', overflowX: 'auto', overflowY: 'auto', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Customer Name</th>
                <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Email & Customer ID</th>
                <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Mobile / Phone</th>
                <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '25px', color: '#64748b', fontSize: '0.85rem' }}>
                    No customer records found in this branch database.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }} onClick={() => setViewCustomer(c)}>
                        {c.fullName}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500 }}>
                          {c.email}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#0284c7', fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>
                          ID: {c.userId || c.id}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{c.mobileNumber || 'N/A'}</span>
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', cursor: 'pointer' }} onClick={() => setViewCustomer(c)}>Profile</button>
                        <button style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', background: '#e0f2fe', color: '#0284c7', border: '1px solid #7dd3fc', cursor: 'pointer' }} onClick={() => setViewAccountsCustomer(c)}>Accounts</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merged Section 1: Register & Onboard New Customer Form */}
      {showOnboardForm && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Register & Onboard New Customer
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>Provide personal details, KYC identifiers & primary account settings</p>
            </div>
            <button type="button" onClick={() => setShowOnboardForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
          </div>

          <form onSubmit={handleRegisterSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Full Name *</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="e.g. Sarah Connor" style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Email Address *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="e.g. sarah.connor@gmail.com" style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Mobile Number *</label>
                <input type="text" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required placeholder="e.g. +1555987654" style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Account Number (Custom / Auto)</label>
                <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Auto-generated if left empty" style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Customer PAN Number *</label>
                <input type="text" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} required placeholder="E.G. ABCDE1234F" style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', textTransform: 'uppercase' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Aadhaar Card Number *</label>
                <input type="text" value={aadhaarNumber} onChange={e => setAadhaarNumber(e.target.value)} required placeholder="e.g. 3829 4820 1938" style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Date of Birth (DOB) *</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} required style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>S/D/H/W/o (Father/Spouse) *</label>
                <input type="text" value={sdhwo} onChange={e => setSdhwo(e.target.value)} required placeholder="e.g. S/o John Connor" style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Nominee Name *</label>
                <input type="text" value={nomineeName} onChange={e => setNomineeName(e.target.value)} required placeholder="e.g. Ramesh Connor" style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Mode of Operation (MOP) *</label>
                <select value={mopType} onChange={e => setMopType(e.target.value)} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="Self">Self (Single Account)</option>
                  <option value="Either or Survivor">Either or Survivor</option>
                  <option value="Former or Survivor">Former or Survivor</option>
                  <option value="Jointly Operated">Jointly Operated</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Primary Account Type *</label>
                <select value={accountType} onChange={e => setAccountType(e.target.value)} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="savings">Savings Account</option>
                  <option value="current">Current Account</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>Initial Deposit (₹) *</label>
                <input type="number" value={initialDeposit} onChange={e => setInitialDeposit(e.target.value)} required style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="submit" style={{ padding: '8px 22px', fontSize: '0.82rem', fontWeight: 700, borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
                Register Customer & Open Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editCustomer && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Edit Customer Profile</h2>
              <button className="btn-close" onClick={() => setEditCustomer(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name</label>
                  <input type="text" value={editCustomer.fullName || ''} onChange={e => setEditCustomer({ ...editCustomer, fullName: e.target.value })} required style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
                  <input type="email" value={editCustomer.email || ''} onChange={e => setEditCustomer({ ...editCustomer, email: e.target.value })} required style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Mobile Number</label>
                  <input type="text" value={editCustomer.mobileNumber || ''} onChange={e => setEditCustomer({ ...editCustomer, mobileNumber: e.target.value })} required style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Address</label>
                  <input type="text" value={editCustomer.address || ''} onChange={e => setEditCustomer({ ...editCustomer, address: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditCustomer(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {addAccCustomer && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Open Additional Account</h2>
              <button className="btn-close" onClick={() => setAddAccCustomer(null)}>✕</button>
            </div>
            <form onSubmit={handleAddAccountSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p>Opening additional account for <strong>{addAccCustomer.fullName}</strong></p>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Account Type</label>
                  <select value={newAccType} onChange={e => setNewAccType(e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <option value="savings">Savings Account</option>
                    <option value="current">Current Account</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Initial Deposit Amount (₹)</label>
                  <input type="number" value={newAccDeposit} onChange={e => setNewAccDeposit(e.target.value)} required style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAddAccCustomer(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Open Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Profile Modal */}
      {viewCustomer && (
        <div className="modal-overlay" onClick={e => { if(e.target === e.currentTarget) setViewCustomer(null); }}>
          <div className="modal-card" style={{ maxWidth: '650px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Customer Profile - {viewCustomer.fullName}</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', cursor: 'pointer' }}
                  onClick={() => { setEditCustomer({ ...viewCustomer }); setViewCustomer(null); }}
                >
                  Edit Profile
                </button>
                <button type="button" className="btn-close" onClick={() => setViewCustomer(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}>✕</button>
              </div>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(0,0,0,0.03)', padding: '14px', borderRadius: '8px', fontSize: '0.82rem' }}>
                <div><strong>Full Name:</strong> {viewCustomer.fullName}</div>
                <div><strong>Customer ID:</strong> <span style={{ fontFamily: 'monospace', color: '#0284c7', fontWeight: 'bold' }}>{viewCustomer.userId || viewCustomer.id}</span></div>
                <div><strong>Email Address:</strong> {viewCustomer.email}</div>
                <div><strong>Mobile Phone:</strong> {viewCustomer.mobileNumber || 'N/A'}</div>
                <div><strong>Aadhaar Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#0369a1' }}>{viewCustomer.aadhaarNumber || '3829 4820 1938'}</span></div>
                <div><strong>Nominee Name:</strong> <span style={{ fontWeight: 'bold', color: '#4338ca' }}>{viewCustomer.nomineeName || 'N/A'}</span></div>
                <div><strong>Address:</strong> {viewCustomer.address || 'Mumbai, Maharashtra, India'}</div>
                <div><strong>KYC Status:</strong> <span style={{ color: viewCustomer.kycStatus === 'verified' ? '#0284c7' : '#d97706', fontWeight: 'bold' }}>{viewCustomer.kycStatus === 'verified' ? 'Verified ✓' : 'KYC Pending'}</span></div>
                <div><strong>PAN Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{viewCustomer.panNumber || 'ABCDE1234F'}</span></div>
                <div><strong>DOB:</strong> {viewCustomer.dob || '1995-01-01'}</div>
                <div><strong>S/D/H/W/o:</strong> {viewCustomer.sdhwo || 'N/A'}</div>
                <div><strong>Status:</strong> <span style={{ color: viewCustomer.status === 'active' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{(viewCustomer.status || 'active').toUpperCase()}</span></div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setViewCustomer(null)} style={{ padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Accounts Modal */}
      {viewAccountsCustomer && (
        <div className="modal-overlay" onClick={e => { if(e.target === e.currentTarget) setViewAccountsCustomer(null); }}>
          <div className="modal-card" style={{ maxWidth: '820px', width: '92%', padding: '20px 24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '8px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>Branch Accounts & Balance - {viewAccountsCustomer.fullName}</h2>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Customer ID: <b style={{ fontFamily: 'monospace', color: '#0284c7' }}>{viewAccountsCustomer.userId || viewAccountsCustomer.id}</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button type="button" onClick={() => { setAddAccCustomer(viewAccountsCustomer); setViewAccountsCustomer(null); }} style={{ padding: '5px 12px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '6px', background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', color: '#ffffff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Create Account</button>
                <button type="button" className="btn-close" onClick={() => setViewAccountsCustomer(null)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b', fontWeight: 'bold', lineHeight: 1 }}>✕</button>
              </div>
            </div>

            <div className="modal-body" style={{ marginBottom: '16px', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>ACCOUNT TYPE</th>
                    <th style={{ padding: '8px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>ACCOUNT NUMBER</th>
                    <th style={{ padding: '8px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>MOP</th>
                    <th style={{ padding: '8px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>BALANCE</th>
                    <th style={{ padding: '8px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>ACCOUNT ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {viewAccountsCustomer.accounts && viewAccountsCustomer.accounts.length > 0 ? (
                    viewAccountsCustomer.accounts.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}><span style={{ fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', fontSize: '0.78rem' }}>{a.type}</span></td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}><b style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{a.accountNumber}</b></td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}><span style={{ background: '#e0e7ff', color: '#4338ca', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '0.72rem', display: 'inline-block', whiteSpace: 'nowrap' }}>{a.mopType || 'Self'}</span></td>
                        <td style={{ padding: '8px 10px', color: '#059669', fontWeight: 800, fontSize: '0.85rem', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>₹{parseFloat(a.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap' }}>
                            {viewAccountsCustomer.status === 'frozen' ? (
                              <button type="button" style={{ padding: '4px 8px', fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => { toggleFreeze(viewAccountsCustomer.id, 'frozen'); setViewAccountsCustomer(null); }}>Unfreeze</button>
                            ) : (
                              <button type="button" style={{ padding: '4px 8px', fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => { toggleFreeze(viewAccountsCustomer.id, 'active'); setViewAccountsCustomer(null); }}>Freeze</button>
                            )}
                            <button type="button" style={{ padding: '4px 8px', fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => { deleteCustomer(viewAccountsCustomer.id, `Account ${a.accountNumber} (${viewAccountsCustomer.fullName})`); setViewAccountsCustomer(null); }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '18px', color: '#64748b', fontSize: '0.78rem' }}>No branch accounts linked to this customer.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569' }}>
                Account Status: <span style={{ color: viewAccountsCustomer.status === 'active' ? '#15803d' : '#b91c1c', fontWeight: 700 }}>● {(viewAccountsCustomer.status || 'active').toUpperCase()}</span>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => setViewAccountsCustomer(null)} style={{ padding: '5px 16px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
