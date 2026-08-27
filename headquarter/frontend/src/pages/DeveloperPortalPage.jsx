import React, { useState } from 'react';

/**
 * DeveloperPortalPage.jsx
 * Open Banking & Fintech API Gateway Sandbox for Headquarter.
 * Manage developer API keys, OpenAPI/Swagger 3.0 documentation, and webhook subscriptions.
 */
export default function DeveloperPortalPage({ user, apiCall, showToast }) {
  const [apiKeys, setApiKeys] = useState([
    { id: 'KEY-LIVE-001', name: 'UPI Switch Gateway', key: 'bsb_live_89a1f2c90e11894a', env: 'PRODUCTION', created: '2026-01-15', status: 'ACTIVE' },
    { id: 'KEY-TEST-002', name: 'Merchant POS Sandbox', key: 'bsb_test_33d88a109fe22001', env: 'SANDBOX', created: '2026-06-10', status: 'ACTIVE' },
    { id: 'KEY-LIVE-003', name: 'BBPS Utility Bill Aggregator', key: 'bsb_live_9901efbbcc771122', env: 'PRODUCTION', created: '2026-03-22', status: 'ACTIVE' }
  ]);

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState('SANDBOX');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateKey = (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      const generated = {
        id: `KEY-${newKeyEnv}-${Math.floor(100 + Math.random() * 900)}`,
        name: newKeyName,
        key: `bsb_${newKeyEnv.toLowerCase()}_${Math.random().toString(16).substr(2, 16)}`,
        env: newKeyEnv,
        created: new Date().toISOString().split('T')[0],
        status: 'ACTIVE'
      };

      setApiKeys(prev => [generated, ...prev]);
      showToast(`API Key "${generated.name}" provisioned successfully!`, 'success');
      setNewKeyName('');
      setIsGenerating(false);
    }, 600);
  };

  const handleRevoke = (id, name) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    showToast(`API Key "${name}" revoked immediately.`, 'warning');
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Card */}
      <div className="card" style={{ padding: '22px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
            💻 Open Banking API Gateway & Developer Hub
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            OpenAPI 3.0 Sandbox, OAuth2 Token Providers, and Fintech Integration Keys.
          </p>
        </div>

        <a
          href="/api/developer/swagger"
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline"
          style={{ fontWeight: 700, padding: '8px 16px', fontSize: '0.84rem', textDecoration: 'none' }}
        >
          📖 Open Swagger 3.0 Interactive Docs ↗
        </a>
      </div>

      {/* Generate API Key Card */}
      <div className="card" style={{ padding: '22px', borderRadius: '14px' }}>
        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 14px 0', color: '#0f172a' }}>
          Provision Developer & Partner API Key
        </h4>

        <form onSubmit={handleGenerateKey} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Integration / Application Name</label>
            <input
              type="text"
              required
              placeholder="e.g. ERP Salary Disburser System"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Environment Tier</label>
            <select
              value={newKeyEnv}
              onChange={(e) => setNewKeyEnv(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            >
              <option value="SANDBOX">Sandbox (Test Mock)</option>
              <option value="PRODUCTION">Production (Live CBS)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isGenerating}
            style={{ padding: '10px 18px', fontWeight: 700, fontSize: '0.88rem', height: '40px' }}
          >
            {isGenerating ? 'Generating...' : 'Generate API Key →'}
          </button>
        </form>
      </div>

      {/* Active API Keys List */}
      <div className="card" style={{ padding: '20px', borderRadius: '14px' }}>
        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 14px 0', color: '#0f172a' }}>
          Active API Access Tokens ({apiKeys.length})
        </h4>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left', background: '#f8fafc' }}>
                <th style={{ padding: '10px 12px' }}>Key ID</th>
                <th style={{ padding: '10px 12px' }}>Application Title</th>
                <th style={{ padding: '10px 12px' }}>API Secret Key</th>
                <th style={{ padding: '10px 12px' }}>Environment</th>
                <th style={{ padding: '10px 12px' }}>Created</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map(k => (
                <tr key={k.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600 }}>{k.id}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{k.name}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#2563eb' }}>{k.key}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: k.env === 'PRODUCTION' ? '#fee2e2' : '#f1f5f9',
                      color: k.env === 'PRODUCTION' ? '#b91c1c' : '#475569'
                    }}>
                      {k.env}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{k.created}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => handleRevoke(k.id, k.name)}
                      style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '6px' }}
                    >
                      Revoke Key
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
