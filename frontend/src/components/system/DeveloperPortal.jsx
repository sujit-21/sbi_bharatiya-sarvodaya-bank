import React, { useState } from 'react';

export default function DeveloperPortal({ showToast }) {
  const [apiKey, setApiKey] = useState('nx_live_99a8123bf01827c81a');
  const [webhookUrl, setWebhookUrl] = useState('https://api.partnerbank.com/v1/webhook');

  const generateNewKey = () => {
    const key = `nx_live_${Math.random().toString(36).substring(2, 18)}`;
    setApiKey(key);
    showToast('New Developer API Key generated successfully.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div className="card" style={{ width: '100%' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>💻 API Developer Portal & Webhooks</h2>
          <button className="btn btn-primary btn-sm" onClick={generateNewKey}>🔑 Generate New API Key</button>
        </div>

        <div style={{ marginTop: '15px' }}>
          <div className="form-group">
            <label>Active API Secret Key</label>
            <input type="text" value={apiKey} readOnly style={{ fontFamily: 'monospace', fontWeight: 'bold' }} />
          </div>

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label>Webhook Event Notification URL</label>
            <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
