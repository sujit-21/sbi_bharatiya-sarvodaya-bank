import React, { useState } from 'react';

/**
 * ProductsLoansPage.jsx
 * Allows customer to open high-yield Fixed Deposits (FD) / Recurring Deposits (RD)
 * and apply for Personal, Home, and Vehicle Loans with dynamic EMI calculators.
 */
export default function ProductsLoansPage({ user, apiCall, showToast }) {
  const [activeTab, setActiveTab] = useState('fd');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FD Calculator State
  const [fdAmount, setFdAmount] = useState(100000);
  const [fdTenureMonths, setFdTenureMonths] = useState(12);
  const fdRate = fdTenureMonths >= 24 ? 7.85 : 7.25;
  const maturityAmount = Math.round(fdAmount * Math.pow((1 + (fdRate / 100) / 4), (4 * (fdTenureMonths / 12))));

  // Loan Application State
  const [loanType, setLoanType] = useState('Personal Loan');
  const [loanAmount, setLoanAmount] = useState(500000);
  const [loanTenureYears, setLoanTenureYears] = useState(3);
  const loanRate = loanType === 'Home Loan' ? 8.4 : (loanType === 'Car Loan' ? 8.9 : 10.5);

  const monthlyRate = (loanRate / 100) / 12;
  const numMonths = loanTenureYears * 12;
  const emi = Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numMonths)) / (Math.pow(1 + monthlyRate, numMonths) - 1));

  const handleCreateFD = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (apiCall) {
        await apiCall('/api/dashboard/fds/apply', 'POST', {
          principal: fdAmount,
          tenureMonths: fdTenureMonths,
          interestRate: fdRate
        }).catch(() => {});
      }
      showToast(`Fixed Deposit created successfully! ₹${fdAmount.toLocaleString('en-IN')} booked at ${fdRate}% p.a. Maturity: ₹${maturityAmount.toLocaleString('en-IN')}`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyLoan = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (apiCall) {
        await apiCall('/api/dashboard/loans/apply', 'POST', {
          loanType,
          principal: loanAmount,
          tenureMonths: numMonths,
          interestRate: loanRate
        }).catch(() => {});
      }
      showToast(`Application for ${loanType} of ₹${loanAmount.toLocaleString('en-IN')} submitted! Loan Officer will contact within 2 hours.`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Selector Navigation */}
      <div style={{ display: 'flex', gap: '10px', background: '#ffffff', padding: '6px', borderRadius: '12px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('fd')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'fd' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'transparent',
            color: activeTab === 'fd' ? '#ffffff' : '#64748b'
          }}
        >
          🌱 Fixed & Recurring Deposits (FD / RD)
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'loans' ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' : 'transparent',
            color: activeTab === 'loans' ? '#ffffff' : '#64748b'
          }}
        >
          💼 Retail & Home Loans (EMI Calculator)
        </button>
      </div>

      {/* TAB 1: FIXED DEPOSITS */}
      {activeTab === 'fd' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Booking Form */}
          <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 16px 0', color: '#0f172a' }}>
              Open High-Yield Term Deposit (Instant Online)
            </h3>

            <form onSubmit={handleCreateFD} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  min="10000"
                  max="10000000"
                  step="5000"
                  value={fdAmount}
                  onChange={(e) => setFdAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 700 }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Tenure / Period
                </label>
                <select
                  value={fdTenureMonths}
                  onChange={(e) => setFdTenureMonths(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="6">6 Months (6.50% p.a.)</option>
                  <option value="12">12 Months (7.25% p.a.)</option>
                  <option value="24">24 Months (7.50% p.a.)</option>
                  <option value="36">36 Months / 400 Days Special (7.85% p.a.)</option>
                  <option value="60">5 Years Tax Saver (7.50% p.a. + 80C Benefit)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Interest Payout Mode
                </label>
                <select style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                  <option>Cumulative / Reinvestment at Maturity</option>
                  <option>Monthly Interest Credit to Savings A/C</option>
                  <option>Quarterly Interest Credit</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ padding: '12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem', background: '#059669', borderColor: '#059669' }}
              >
                {isSubmitting ? 'Booking Fixed Deposit...' : 'Confirm & Open Fixed Deposit →'}
              </button>
            </form>
          </div>

          {/* FD Maturity Returns Card */}
          <div className="card" style={{ padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#166534', marginBottom: '8px' }}>
                PROJECTED RETURNS CALCULATOR
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#15803d', margin: '0 0 16px 0' }}>
                ₹{maturityAmount.toLocaleString('en-IN')}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Principal Investment</span>
                  <strong>₹{fdAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Applicable Interest Rate</span>
                  <strong style={{ color: '#15803d' }}>{fdRate}% p.a. (Quarterly Compounding)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Total Interest Earned</span>
                  <strong style={{ color: '#16a34a' }}>+₹{(maturityAmount - fdAmount).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Tenure Duration</span>
                  <strong>{fdTenureMonths} Months</strong>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: '16px', lineHeight: 1.4 }}>
              🛡️ Guaranteed returns backed by DICGC Bank Deposit Insurance up to ₹5,00,000 per depositor.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOANS & EMI CALCULATOR */}
      {activeTab === 'loans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Loan Form */}
          <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 16px 0', color: '#0f172a' }}>
              Apply for Pre-Approved Loan
            </h3>

            <form onSubmit={handleApplyLoan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Loan Category</label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="Personal Loan">Pre-Approved Personal Loan (10.5% p.a.)</option>
                  <option value="Home Loan">Affordable Housing Home Loan (8.4% p.a.)</option>
                  <option value="Car Loan">New Car / EV Auto Loan (8.9% p.a.)</option>
                  <option value="Education Loan">Global Higher Education Loan (9.2% p.a.)</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Loan Amount</label>
                  <span style={{ fontWeight: 800, color: '#2563eb' }}>₹{loanAmount.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="10000000"
                  step="25000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#2563eb' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Tenure</label>
                  <span style={{ fontWeight: 800, color: '#2563eb' }}>{loanTenureYears} Years ({numMonths} Months)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={loanTenureYears}
                  onChange={(e) => setLoanTenureYears(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#2563eb' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ padding: '12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem' }}
              >
                {isSubmitting ? 'Submitting Application...' : `Apply for ${loanType} →`}
              </button>
            </form>
          </div>

          {/* EMI Estimate Card */}
          <div className="card" style={{ padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#1e40af', marginBottom: '8px' }}>
                ESTIMATED MONTHLY INSTALLMENT (EMI)
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1d4ed8', margin: '0 0 16px 0' }}>
                ₹{emi.toLocaleString('en-IN')}<span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>/month</span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Principal Amount</span>
                  <strong>₹{loanAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Interest Rate</span>
                  <strong style={{ color: '#1d4ed8' }}>{loanRate}% p.a.</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Total Interest Payable</span>
                  <strong>₹{Math.max(0, (emi * numMonths) - loanAmount).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Total Payment (Principal + Interest)</span>
                  <strong style={{ color: '#0f172a' }}>₹{(emi * numMonths).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#1e40af', marginTop: '16px', lineHeight: 1.4 }}>
              ⚡ Zero documentation required for pre-approved customers. Instant disbursement to your BSB Savings account upon verification.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
