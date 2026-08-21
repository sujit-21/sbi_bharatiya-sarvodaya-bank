import React, { useState } from 'react';

export default function Login({ onLoginSuccess, showToast }) {
  const [email, setEmail] = useState('admin@bank.com');
  const [password, setPassword] = useState('Admin123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { label: 'Admin', email: 'admin@bank.com', pass: 'Admin123!' },
    { label: 'Manager', email: 'manager@bank.com', pass: 'Manager123!' },
    { label: 'Teller', email: 'teller@bank.com', pass: 'Teller123!' },
    { label: 'Customer', email: 'customer@bank.com', pass: 'Customer123!' },
    { label: 'Merchant', email: 'merchant@bank.com', pass: 'Merchant123!' }
  ];

  const handleQuickFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          deviceId: 'dev-sim-01',
          deviceName: 'Browser Station',
          fingerprint: 'fp-10029384'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || 'Authentication failed.', 'danger');
        setLoading(false);
        return;
      }

      if (data.token && data.user) {
        showToast(`Welcome back, ${data.user.fullName || 'User'}!`, 'success');
        onLoginSuccess(data.user, data.token, data.csrfToken);
      }
    } catch (err) {
      showToast(err.message || 'Connection failed.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="auth-wrapper">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="logo-branding-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: '10px 18px', borderRadius: '12px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '3px', color: '#ea580c' }}>BSB</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#ffffff', color: '#ea580c', border: '1px solid #ffedd5', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(234,88,12,0.1)' }}>BANK</span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#7c2d12' }}>BHARATIYA SARVODAYA BANK</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>Secure Single Sign-On Access</p>
        </div>

        {/* Quick Demo Profile Selector Pills */}
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', textAlign: 'center' }}>
            Quick Demo Credentials
          </div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {demoAccounts.map((acc) => (
              <button
                key={acc.label}
                type="button"
                className={`quick-pill ${email === acc.email ? 'active' : ''}`}
                onClick={() => handleQuickFill(acc)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: email === acc.email ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: email === acc.email ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card)',
                  color: email === acc.email ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{acc.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
              Email Address or User ID
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                👤
              </span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email Address or User ID (e.g. NX@PATEL002)"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 38px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                🔒
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 38px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  padding: 0
                }}
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
            style={{
              padding: '13px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '0.5px',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              border: 'none',
              color: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal →'}
          </button>
        </form>
      </div>
    </div>
  );
}

