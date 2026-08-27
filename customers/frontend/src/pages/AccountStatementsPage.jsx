import React, { useState } from 'react';

/**
 * AccountStatementsPage.jsx
 * Allows customer to filter account statements by date range, transaction type,
 * download PDF/Excel statements, and view detailed mini-statements.
 */
export default function AccountStatementsPage({ user, apiCall, showToast }) {
  const [fromDate, setFromDate] = useState('2026-08-01');
  const [toDate, setToDate] = useState('2026-08-27');
  const [txnType, setTxnType] = useState('ALL');
  const [selectedAcc, setSelectedAcc] = useState(user?.accountNumber || '1000987658');
  const [isGenerating, setIsGenerating] = useState(false);

  const [statementRows, setStatementRows] = useState([
    { id: 'TXN-90211', date: '2026-08-25', desc: 'Salary NEFT / BSB Corp Direct Deposit', type: 'Credit', amount: 85000, balance: 145000, ref: 'UTR9982312' },
    { id: 'TXN-90144', date: '2026-08-22', desc: 'Amazon Pay UPI / Online Merchant Store', type: 'Debit', amount: 2499, balance: 60000, ref: 'UPI9012398' },
    { id: 'TXN-89982', date: '2026-08-20', desc: 'Interest Credit Q2 (7.25% p.a.)', type: 'Credit', amount: 1845, balance: 62499, ref: 'INT7765123' },
    { id: 'TXN-89811', date: '2026-08-16', desc: 'Electricity Board Bill Payment via BBPS', type: 'Debit', amount: 3420, balance: 60654, ref: 'BBP4451098' },
    { id: 'TXN-89650', date: '2026-08-12', desc: 'UPI Transfer from Amit Sharma', type: 'Credit', amount: 5000, balance: 64074, ref: 'UPI8891276' },
    { id: 'TXN-89410', date: '2026-08-05', desc: 'ATM Cash Withdrawal / CP Branch ATM', type: 'Debit', amount: 10000, balance: 59074, ref: 'ATM1100234' }
  ]);

  const handleDownload = (format) => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      showToast(`Account statement e-${format.toUpperCase()} generated and downloaded successfully!`, 'success');
    }, 1200);
  };

  const filteredRows = statementRows.filter(r => {
    if (txnType === 'CREDIT' && r.type !== 'Credit') return false;
    if (txnType === 'DEBIT' && r.type !== 'Debit') return false;
    return true;
  });

  const totalCredits = filteredRows.filter(r => r.type === 'Credit').reduce((sum, r) => sum + r.amount, 0);
  const totalDebits = filteredRows.filter(r => r.type === 'Debit').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Filter Card */}
      <div className="card" style={{ padding: '22px', borderRadius: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
              📄 Account E-Statement & Ledger
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Download official signed bank statements for visa, tax, and accounting purposes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-outline"
              disabled={isGenerating}
              onClick={() => handleDownload('pdf')}
              style={{ fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📥 Download PDF
            </button>
            <button
              className="btn btn-primary"
              disabled={isGenerating}
              onClick={() => handleDownload('excel')}
              style={{ fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📊 Export Excel
            </button>
          </div>
        </div>

        {/* Filters Form Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Account</label>
            <select
              value={selectedAcc}
              onChange={(e) => setSelectedAcc(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
            >
              <option value={user?.accountNumber || '1000987658'}>{user?.accountNumber || '1000987658'} (Savings A/C)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Transaction Type</label>
            <select
              value={txnType}
              onChange={(e) => setTxnType(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
            >
              <option value="ALL">All Transactions</option>
              <option value="CREDIT">Credits Only (Deposits/Income)</option>
              <option value="DEBIT">Debits Only (Withdrawals/Expenses)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stat Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>Total Credits Received</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
            +₹{totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '0.78rem', color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase' }}>Total Debits Spent</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
            -₹{totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.78rem', color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase' }}>Closing Balance</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
            ₹{(user?.totalBalance || user?.balance || 145000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Statement Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '14px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left', background: '#f8fafc' }}>
                <th style={{ padding: '12px 14px' }}>Date</th>
                <th style={{ padding: '12px 14px' }}>Txn Reference</th>
                <th style={{ padding: '12px 14px' }}>Particulars / Description</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Credit (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Debit (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Running Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((tx) => {
                const isCredit = tx.type === 'Credit';
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{tx.date}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{tx.id}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                      {tx.desc}
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Ref: {tx.ref}</div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                      {isCredit ? `+${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                      {!isCredit ? `-${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      ₹{tx.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
