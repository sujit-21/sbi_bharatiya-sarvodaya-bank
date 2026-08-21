import React, { useState } from 'react';

export default function BranchLogin({ onLoginSuccess, showToast }) {
  const [email, setEmail] = useState('manager@bank.com');
  const [password, setPassword] = useState('Manager123!');
  const [branchCode, setBranchCode] = useState('DEL001');
  const [loading, setLoading] = useState(false);

  const demoStaffAccounts = [
    { label: 'Branch Manager', email: 'manager@bank.com', pass: 'Manager123!', code: 'DEL001' },
    { label: 'Branch Teller', email: 'teller@bank.com', pass: 'Teller123!', code: 'CHE001' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/branch/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          branchCode: branchCode.trim(),
          portal: 'BRANCH_AND_EMPLOYEES'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Branch Authentication failed.', 'danger');
        setLoading(false);
        return;
      }

      if (data.token && data.user) {
        showToast(`Signed into Branch Terminal: ${data.user.fullName || 'Staff'}`, 'success');
        onLoginSuccess(data.user, data.token, data.csrfToken);
      }
    } catch (err) {
      showToast('Branch Server Connection Error: ' + err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-card" style={{ maxWidth: '440px', width: '100%', padding: '32px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.96)', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', border: '2px solid #10b981' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-block', padding: '10px 16px', background: '#ecfdf5', borderRadius: '30px', border: '1px solid #a7f3d0', color: '#047857', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '12px' }}>
            🏦 BRANCH CBS STAFF TERMINAL (PORT 3002)
          </div>
          <div className="logo-branding-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: '10px 18px', borderRadius: '12px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '3px', color: '#ea580c' }}>BSB</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#ffffff', color: '#ea580c', border: '1px solid #ffedd5', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(234,88,12,0.1)' }}>BRANCH</span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#7c2d12' }}>BHARATIYA SARVODAYA BANK</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Authorized Branch Managers & Tellers Access</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', marginBottom: '8px' }}>
            Staff Quick Credentials
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {demoStaffAccounts.map(acc => (
              <button
                key={acc.label}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword(acc.pass); setBranchCode(acc.code); }}
                style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #cbd5e1', background: email === acc.email ? '#d1fae5' : '#f8fafc', color: '#047857', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Branch SOL / Location Code</label>
            <input
              type="text"
              value={branchCode}
              onChange={e => setBranchCode(e.target.value)}
              required
              placeholder="e.g. DEL001 or MUM001"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, color: '#047857' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Employee Staff Email / ID</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Domain Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)', color: '#fff', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(4,120,87,0.3)' }}
          >
            {loading ? 'Authenticating Staff...' : 'Sign In to Branch Terminal →'}
          </button>
        </form>
      </div>
    </div>
  );
}
