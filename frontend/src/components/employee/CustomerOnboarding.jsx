import React, { useState } from 'react';

export default function CustomerOnboarding({ user, apiCall, showToast }) {
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
  const [accountType, setAccountType] = useState('savings');
  const [initialDeposit, setInitialDeposit] = useState('2000');
  
  const [submitting, setSubmitting] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
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
        branchId: user?.branchId || 'b-delhi',
        accountType,
        initialDeposit
      });

      setCreatedReceipt(result);
      showToast('Customer account opened successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to open customer account', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCreatedReceipt(null);
    setFullName('');
    setEmail('');
    setMobileNumber('');
    setAccountNumber('');
    setPanNumber('');
    setSdhwo('');
    setAddress('');
    setInitialDeposit('2000');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '850px', margin: '0 auto' }}>
      {/* Header Card */}
      <div className="card" style={{ width: '100%', background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(99,102,241,0.06) 100%)', border: '1px solid var(--border-color)' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          👤 Walk-in Customer Account Opening
        </h2>
        <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Branch Staff Onboarding Portal — Register walk-in branch customers and issue primary bank accounts.
        </p>
      </div>

      {/* Confirmation Receipt View if account was created */}
      {createdReceipt ? (
        <div className="card" style={{ width: '100%', border: '2px solid #16a34a', background: 'var(--card-bg)' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '3rem' }}>🎉</span>
            <h2 style={{ color: '#16a34a', margin: '8px 0 4px 0' }}>Customer Account Opened Successfully!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              The account details have been recorded in the central core banking database.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', background: 'rgba(22, 163, 74, 0.05)', padding: '20px', borderRadius: '10px', border: '1px dashed #16a34a' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Customer Name</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>{createdReceipt.customer?.fullName || fullName}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Customer ID</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0284c7', fontFamily: 'monospace', marginTop: '2px' }}>
                {createdReceipt.customer?.userId || createdReceipt.customer?.id}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Primary Account Number</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '2px' }}>
                {createdReceipt.account?.accountNumber}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Temporary Login Password</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#d97706', fontFamily: 'monospace', marginTop: '2px' }}>
                {createdReceipt.customer?.tempPassword || 'Cust1234!'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Initial Balance</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', marginTop: '2px' }}>
                ₹{parseFloat(createdReceipt.account?.balance || initialDeposit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Mode of Operation</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-primary)', marginTop: '2px' }}>
                {createdReceipt.account?.mopType || mopType}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(37,99,235,0.05)', borderRadius: '8px', border: '1px solid rgba(37,99,235,0.2)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            ℹ️ <strong>System Scoping Notice:</strong> As a branch staff member, this account has been assigned to your branch. The Branch Manager can view this account under their <strong>Branch Customers</strong> registry, and Global HQ can monitor it under the central <strong>Customer Registry</strong>.
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
            <button className="btn btn-primary" onClick={resetForm} style={{ padding: '12px 24px', fontWeight: 700 }}>
              ➕ Onboard Another Customer
            </button>
          </div>
        </div>
      ) : (
        /* Form Card */
        <div className="card" style={{ width: '100%' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  placeholder="e.g. Anish Malhotra"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="anish@gmail.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Mobile Number *</label>
                <input
                  type="text"
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  required
                  placeholder="+91 9820011223"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Account Number (Custom/Auto)</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="Auto-generated if left blank"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Customer's PAN Number *</label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={e => setPanNumber(e.target.value.toUpperCase())}
                  required
                  placeholder="ABCDE1234F"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem', textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Date of Birth (DOB) *</label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>S/D/H/W/o *</label>
                <input
                  type="text"
                  value={sdhwo}
                  onChange={e => setSdhwo(e.target.value)}
                  required
                  placeholder="S/o Ramesh Malhotra"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Mode of Operation (MOP) *</label>
                <select
                  value={mopType}
                  onChange={e => setMopType(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                >
                  <option value="Self">Self</option>
                  <option value="Either or Survivor">Either or Survivor</option>
                  <option value="Former or Survivor">Former or Survivor</option>
                  <option value="Jointly Operated">Jointly Operated</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Account Type *</label>
                <select
                  value={accountType}
                  onChange={e => setAccountType(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                >
                  <option value="savings">Savings Account</option>
                  <option value="current">Current Account</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Initial Deposit Amount (₹) *</label>
                <input
                  type="number"
                  value={initialDeposit}
                  onChange={e => setInitialDeposit(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Full street address"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ padding: '12px 24px', fontWeight: 700, fontSize: '1rem', background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' }}
              >
                {submitting ? 'Opening Account...' : '➕ Open Customer Account & Issue Credentials'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
