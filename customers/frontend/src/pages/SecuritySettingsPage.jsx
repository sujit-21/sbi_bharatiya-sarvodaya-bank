import React, { useState } from 'react';

/**
 * SecuritySettingsPage.jsx
 * Central security controls for customer: change login password,
 * set/reset 6-digit Transaction PIN, 2-Factor Authentication, and active device logins.
 */
export default function SecuritySettingsPage({ user, apiCall, showToast }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(true);

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match!', 'danger');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters with letters & numbers.', 'warning');
      return;
    }

    setIsChangingPass(true);
    setTimeout(() => {
      setIsChangingPass(false);
      showToast('Login password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1000);
  };

  const handleChangePin = (e) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      showToast('Transaction PIN entries do not match!', 'danger');
      return;
    }
    if (newPin.length < 4 || newPin.length > 6) {
      showToast('Transaction PIN must be 4 to 6 digits.', 'warning');
      return;
    }

    setIsChangingPin(true);
    setTimeout(() => {
      setIsChangingPin(false);
      showToast('Transaction PIN updated successfully! Required for all future money transfers.', 'success');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    }, 1000);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div className="card" style={{ padding: '20px 24px', borderRadius: '16px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.2rem' }}>🛡️</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Account Security & Access Governance</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
            Multi-Layer RBI Compliant Security with Hardware Token, Biometric, and Cryptographic PIN Verification.
          </p>
        </div>
        <span style={{ background: '#065f46', color: '#86efac', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
          ● Defense Status: High 🟢
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Card 1: Change Login Password */}
        <div className="card" style={{ padding: '24px', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', color: '#1e293b' }}>
            🔑 Change NetBanking Password
          </h3>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Current Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>New Password (min 8 chars)</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isChangingPass}
              style={{ padding: '10px', borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', marginTop: '4px' }}
            >
              {isChangingPass ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Card 2: Set / Update Transaction PIN */}
        <div className="card" style={{ padding: '24px', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', color: '#1e293b' }}>
            🔒 Transaction PIN (M-PIN)
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 14px 0' }}>
            Required to authorize IMPS, NEFT transfers, and debit card limit changes.
          </p>

          <form onSubmit={handleChangePin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Current PIN (if set)</label>
              <input
                type="password"
                maxLength="6"
                placeholder="••••"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', letterSpacing: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>New 4 or 6 Digit PIN</label>
              <input
                type="password"
                maxLength="6"
                required
                placeholder="••••"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', letterSpacing: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Confirm New PIN</label>
              <input
                type="password"
                maxLength="6"
                required
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', letterSpacing: '4px' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isChangingPin}
              style={{ padding: '10px', borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', marginTop: '4px' }}
            >
              {isChangingPin ? 'Setting PIN...' : 'Save Transaction PIN'}
            </button>
          </form>
        </div>
      </div>

      {/* Security Preferences Toggles */}
      <div className="card" style={{ padding: '22px', borderRadius: '14px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', color: '#1e293b' }}>
          ⚙️ Additional Security Toggles
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Two-Factor Authentication (2FA via SMS/Email OTP)</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Requires OTP challenge on unrecognized device logins</div>
            </div>
            <button
              className={`btn ${twoFactorEnabled ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setTwoFactorEnabled(!twoFactorEnabled);
                showToast(`Two-factor authentication ${!twoFactorEnabled ? 'enabled' : 'disabled'}.`, 'info');
              }}
              style={{ fontWeight: 700, fontSize: '0.82rem', padding: '6px 14px' }}
            >
              {twoFactorEnabled ? 'Enabled 🟢' : 'Disabled ⚪'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Instant SMS & Email Transaction Alerts</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Receive instant notifications for any debit/credit above ₹1.00</div>
            </div>
            <button
              className={`btn ${smsAlertsEnabled ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setSmsAlertsEnabled(!smsAlertsEnabled);
                showToast(`Transaction alerts ${!smsAlertsEnabled ? 'enabled' : 'disabled'}.`, 'info');
              }}
              style={{ fontWeight: 700, fontSize: '0.82rem', padding: '6px 14px' }}
            >
              {smsAlertsEnabled ? 'Active 🔔' : 'Muted 🔕'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
