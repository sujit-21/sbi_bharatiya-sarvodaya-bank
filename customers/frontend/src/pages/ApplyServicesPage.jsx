import React, { useState } from 'react';

/**
 * ApplyServicesPage.jsx
 * Allows customer to apply for Debit Cards, Credit Cards, Cheque Books,
 * Locker Facilities, and manage Virtual Cards (Domestic/International limits).
 */
export default function ApplyServicesPage({ user, apiCall, showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('cards');
  const [requesting, setRequesting] = useState(false);

  // Debit/Credit card form state
  const [cardType, setCardType] = useState('DEBIT_PLATINUM');
  const [cardNetwork, setCardNetwork] = useState('RuPay Global');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || 'Connaught Place, New Delhi - 110001');

  // Cheque book form state
  const [chequeLeaves, setChequeLeaves] = useState('25');
  const [chequeAccount, setChequeAccount] = useState(user?.accountNumber || '1000987658');

  // Locker form state
  const [lockerSize, setLockerSize] = useState('Medium (15x20x40 cm)');
  const [lockerBranch, setLockerBranch] = useState('Connaught Place Main Branch');

  // Virtual card controls
  const [cardBlocked, setCardBlocked] = useState(false);
  const [intlEnabled, setIntlEnabled] = useState(false);
  const [onlineLimit, setOnlineLimit] = useState(50000);

  const handleCardRequest = async (e) => {
    e.preventDefault();
    setRequesting(true);
    try {
      if (apiCall) {
        await apiCall('/api/dashboard/cards/request', 'POST', {
          cardType,
          network: cardNetwork,
          address: deliveryAddress
        }).catch(() => {});
      }
      showToast(`New ${cardNetwork} ${cardType} request submitted successfully! Tracking ID: CRD-${Math.floor(100000 + Math.random() * 900000)}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to submit card request', 'danger');
    } finally {
      setRequesting(false);
    }
  };

  const handleChequeRequest = async (e) => {
    e.preventDefault();
    setRequesting(true);
    try {
      showToast(`Personalized Cheque Book (${chequeLeaves} leaves) dispatched to registered address! Ref: CHQ-${Math.floor(100000 + Math.random() * 900000)}`, 'success');
    } finally {
      setRequesting(false);
    }
  };

  const handleLockerRequest = async (e) => {
    e.preventDefault();
    setRequesting(true);
    try {
      showToast(`Safe Deposit Locker request registered at ${lockerBranch}. Officer will contact within 24 hours.`, 'success');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Service Header Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', background: '#ffffff', padding: '6px', borderRadius: '12px', border: '1px solid #e2e8f0', width: 'fit-content', flexWrap: 'wrap' }}>
        {[
          { id: 'cards', label: '💳 Debit & Credit Cards' },
          { id: 'virtual', label: '🛡️ Manage Virtual Card' },
          { id: 'cheque', label: '📖 Cheque Book Services' },
          { id: 'locker', label: '🔐 Safe Deposit Locker' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeSubTab === tab.id ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' : 'transparent',
              color: activeSubTab === tab.id ? '#ffffff' : '#64748b',
              boxShadow: activeSubTab === tab.id ? '0 2px 8px rgba(30, 64, 175, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: APPLY FOR CARDS */}
      {activeSubTab === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0', color: '#1e293b' }}>
              Apply for New Physical Card
            </h3>
            <form onSubmit={handleCardRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Select Card Variant
                </label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="DEBIT_PLATINUM">BSB Platinum RuPay Debit Card (Free Lounge + 5% Cashback)</option>
                  <option value="DEBIT_SIGNATURE">BSB Signature Visa Debit Card (Unlimited ATM + ₹5L Insurance)</option>
                  <option value="CREDIT_SAPPHIRE">BSB Sapphire Reward Credit Card (Lifetime Free)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Payment Network
                </label>
                <select
                  value={cardNetwork}
                  onChange={(e) => setCardNetwork(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="RuPay Global">RuPay Global (National & International Accepted)</option>
                  <option value="Visa Platinum">Visa Worldwide</option>
                  <option value="Mastercard World">Mastercard World</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Delivery Address (Delivered via Speed Post in 3-5 days)
                </label>
                <textarea
                  rows="3"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={requesting}
                style={{ padding: '12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.92rem' }}
              >
                {requesting ? 'Submitting Application...' : 'Apply for Card Now →'}
              </button>
            </form>
          </div>

          {/* Card Preview Mock */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              aspectRatio: '1.586',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.35)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '1px', color: '#fb923c' }}>BSB PLATINUM</span>
                <span style={{ fontSize: '1.2rem' }}>📶</span>
              </div>

              <div style={{ fontSize: '1.25rem', letterSpacing: '3px', fontFamily: 'monospace', fontWeight: 700 }}>
                4532 •••• •••• 8821
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.7 }}>Card Holder</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.5px' }}>{user?.fullName || 'KABIR MALHOTRA'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.7 }}>Expires</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>08/31</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '16px', borderRadius: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#065f46', marginBottom: '4px' }}>🛡️ Zero Liability Protection</div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#047857' }}>
                All BSB issued cards are backed by 24x7 real-time AI Fraud Monitoring and instant block/unblock via NetBanking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: MANAGE VIRTUAL CARD */}
      {activeSubTab === 'virtual' && (
        <div className="card" style={{ padding: '24px', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0', color: '#1e293b' }}>
            Instant Security & Limit Controls
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Toggle 1: Instant Card Freeze */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>Temporary Card Lock / Freeze</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Instantly disable all ATM, POS, and online transactions on this card</div>
              </div>
              <button
                className={`btn ${cardBlocked ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => {
                  setCardBlocked(!cardBlocked);
                  showToast(cardBlocked ? 'Card unlocked successfully.' : 'Card temporarily blocked.', cardBlocked ? 'success' : 'warning');
                }}
                style={{ fontWeight: 700, padding: '8px 16px', fontSize: '0.82rem' }}
              >
                {cardBlocked ? '🔴 LOCKED (Click to Unlock)' : '🟢 UNLOCKED (Click to Freeze)'}
              </button>
            </div>

            {/* Toggle 2: International Transactions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>International E-Commerce & POS</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Enable or disable foreign currency merchant usage</div>
              </div>
              <button
                className={`btn ${intlEnabled ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => {
                  setIntlEnabled(!intlEnabled);
                  showToast(`International transactions ${!intlEnabled ? 'enabled' : 'disabled'}.`, 'info');
                }}
                style={{ fontWeight: 700, padding: '8px 16px', fontSize: '0.82rem' }}
              >
                {intlEnabled ? 'Enabled 🌍' : 'Disabled 🚫'}
              </button>
            </div>

            {/* Daily Limit Slider */}
            <div style={{ padding: '18px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>Daily Online Transaction Limit</span>
                <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '1rem' }}>₹{onlineLimit.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="200000"
                step="5000"
                value={onlineLimit}
                onChange={(e) => setOnlineLimit(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#2563eb' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                <span>Min: ₹5,000</span>
                <span>Max: ₹2,00,000</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: CHEQUE BOOK */}
      {activeSubTab === 'cheque' && (
        <div className="card" style={{ padding: '24px', borderRadius: '14px', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0', color: '#1e293b' }}>
            Request New Personalized Cheque Book
          </h3>
          <form onSubmit={handleChequeRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                Select Account
              </label>
              <input
                type="text"
                value={chequeAccount}
                readOnly
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.9rem', fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                Number of Leaves
              </label>
              <select
                value={chequeLeaves}
                onChange={(e) => setChequeLeaves(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              >
                <option value="25">25 Leaves (Standard - Free of Cost)</option>
                <option value="50">50 Leaves (₹75 + GST)</option>
                <option value="100">100 Leaves (₹150 + GST)</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={requesting}
              style={{ padding: '12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.92rem' }}
            >
              Order Cheque Book →
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB 4: LOCKER */}
      {activeSubTab === 'locker' && (
        <div className="card" style={{ padding: '24px', borderRadius: '14px', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0', color: '#1e293b' }}>
            Book Safe Deposit Vault Locker
          </h3>
          <form onSubmit={handleLockerRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                Preferred Branch Location
              </label>
              <select
                value={lockerBranch}
                onChange={(e) => setLockerBranch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              >
                <option value="Connaught Place Main Branch">Connaught Place Main Branch (DEL1)</option>
                <option value="Nehru Place Financial Hub">Nehru Place Financial Hub (DEL2)</option>
                <option value="Bandra Kurla Complex Branch">Bandra Kurla Complex (MUM1)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                Locker Dimension & Tariff
              </label>
              <select
                value={lockerSize}
                onChange={(e) => setLockerSize(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              >
                <option value="Small (10x15x40 cm)">Small (10x15x40 cm) — ₹1,500/year</option>
                <option value="Medium (15x20x40 cm)">Medium (15x20x40 cm) — ₹3,000/year</option>
                <option value="Large (20x30x40 cm)">Large (20x30x40 cm) — ₹6,000/year</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={requesting}
              style={{ padding: '12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.92rem' }}
            >
              Submit Locker Application →
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
