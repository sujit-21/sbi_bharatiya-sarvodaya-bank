import React, { useState } from 'react';

export default function CustomerLogin({ onLoginSuccess, showToast }) {
  const [email, setEmail] = useState('customer@bank.com');
  const [password, setPassword] = useState('Customer123!');
  const [otp, setOtp] = useState('889900');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const demoCustomerAccounts = [
    { label: 'Retail Customer', email: 'customer@bank.com', pass: 'Customer123!' },
    { label: 'Merchant Account', email: 'merchant@bank.com', pass: 'Merchant123!' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!showOtp) {
      setShowOtp(true);
      showToast('2FA Security OTP sent to your registered mobile number (+91 98*** **456).', 'info');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          otp: otp.trim(),
          portal: 'CUSTOMERS'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'NetBanking Authentication failed.', 'danger');
        setLoading(false);
        return;
      }

      if (data.token && data.user) {
        showToast(`Welcome to NetBanking, ${data.user.fullName || 'Valued Customer'}!`, 'success');
        onLoginSuccess(data.user, data.token, data.csrfToken);
      }
    } catch (err) {
      showToast('NetBanking Server Connection Error: ' + err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-card" style={{ maxWidth: '440px', width: '100%', padding: '32px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.96)', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', border: '2px solid #6366f1' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-block', padding: '10px 16px', background: '#e0e7ff', borderRadius: '30px', border: '1px solid #c7d2fe', color: '#3730a3', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '12px' }}>
            👤 RETAIL NETBANKING PORTAL (PORT 3003)
          </div>
          <div className="logo-branding-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: '10px 18px', borderRadius: '12px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '3px', color: '#ea580c' }}>BSB</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#ffffff', color: '#ea580c', border: '1px solid #ffedd5', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(234,88,12,0.1)' }}>NETBANKING</span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#7c2d12' }}>BHARATIYA SARVODAYA BANK</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Safe & Encrypted Personal Banking Access</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', marginBottom: '8px' }}>
            Customer Quick Credentials
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {demoCustomerAccounts.map(acc => (
              <button
                key={acc.label}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword(acc.pass); }}
                style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #cbd5e1', background: email === acc.email ? '#e0e7ff' : '#f8fafc', color: '#3730a3', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>User ID / Registered Email</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>NetBanking Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            />
          </div>

          {showOtp && (
            <div className="form-group" style={{ marginBottom: '22px', background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1d4ed8', display: 'block', marginBottom: '6px' }}>🔑 Enter 2FA SMS Security OTP</label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                placeholder="6-digit OTP"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #93c5fd', fontSize: '1rem', fontWeight: 700, textAlign: 'center', letterSpacing: '4px' }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', color: '#fff', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}
          >
            {loading ? 'Logging into NetBanking...' : showOtp ? 'Verify OTP & Enter NetBanking →' : 'Proceed to OTP Verification →'}
          </button>
        </form>
      </div>
    </div>
  );
}
