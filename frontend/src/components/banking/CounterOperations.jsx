import React, { useState } from 'react';

export default function CounterOperations({ apiCall, showToast }) {
  const [accountNumber, setAccountNumber] = useState('ACC-1001');
  const [amount, setAmount] = useState('500.00');
  const [type, setType] = useState('deposit'); // deposit | withdraw
  const [description, setDescription] = useState('Counter Teller cash deposit');
  const [loading, setLoading] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const endpoint = type === 'deposit' ? '/api/transactions/deposit' : '/api/transactions/withdraw';
      const res = await apiCall(endpoint, 'POST', {
        accountNumber,
        amount: parseFloat(amount),
        description
      });
      setLastReceipt(res);
      showToast(`Counter ${type} of ₹${amount} completed successfully.`, 'success');
    } catch (err) {
      showToast(err.message || `Counter ${type} failed`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Panel: Horizontal Counter Transaction Form */}
      <div className="card" style={{ width: '100%' }}>
        <div className="card-header">
          <h2>💵 Counter Deposit & Cash Withdrawal</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ marginTop: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Transaction Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              >
                <option value="deposit">📥 Counter Cash Deposit</option>
                <option value="withdraw">📤 Counter Cash Withdrawal</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                required
                placeholder="e.g. ACC-1001"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Remark / Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Transaction remarks"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <button type="submit" className={`btn ${type === 'deposit' ? 'btn-success' : 'btn-warning'} btn-block`} style={{ height: '38px', fontWeight: 700 }} disabled={loading}>
                {loading ? 'Processing...' : `Execute ${type.toUpperCase()}`}
              </button>
            </div>
          </div>
        </form>

        {lastReceipt && (
          <div className="alert alert-success" style={{ marginTop: '20px', fontSize: '0.85rem', border: '1px dashed var(--color-success)' }}>
            <h4>Receipt Generated Successfully!</h4>
            <div style={{ background: 'rgba(0,0,0,0.05)', padding: '8px', borderRadius: '4px', marginTop: '8px', fontFamily: 'monospace' }}>
              <strong>Transaction ID:</strong> {lastReceipt.transactionId || lastReceipt.id || 'TXN-100238'}<br />
              <strong>Account:</strong> {accountNumber}<br />
              <strong>New Balance:</strong> ₹{(lastReceipt.newBalance || lastReceipt.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
