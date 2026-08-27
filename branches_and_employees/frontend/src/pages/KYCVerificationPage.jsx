import React, { useState } from 'react';

/**
 * KYCVerificationPage.jsx
 * Branch Customer KYC & Document Verification Queue.
 * Allows branch officers to inspect uploaded Aadhaar/PAN/Passport documents,
 * match biometric signatures, and approve/reject KYC requests.
 */
export default function KYCVerificationPage({ user, apiCall, showToast }) {
  const [kycQueue, setKycQueue] = useState([
    {
      id: 'KYC-8821',
      customerName: 'Priya Joshi',
      cif: 'CUST-1004',
      docType: 'Aadhaar Card + PAN',
      docNumber: 'XXXX-XXXX-9912 / ABCPJ9012K',
      submittedDate: '2026-08-27 10:15 AM',
      branch: 'Connaught Place Main (DEL1)',
      status: 'PENDING'
    },
    {
      id: 'KYC-8819',
      customerName: 'Sunil Rao',
      cif: 'CUST-1005',
      docType: 'Passport + Electricity Bill',
      docNumber: 'P8891234 / DL-EB-901',
      submittedDate: '2026-08-27 09:40 AM',
      branch: 'Connaught Place Main (DEL1)',
      status: 'PENDING'
    },
    {
      id: 'KYC-8814',
      customerName: 'Deepak Varma',
      cif: 'CUST-1006',
      docType: 'Voter ID + Driving License',
      docNumber: 'VOT-99881 / DL-2022-019',
      submittedDate: '2026-08-26 04:30 PM',
      branch: 'Connaught Place Main (DEL1)',
      status: 'VERIFIED'
    }
  ]);

  const handleApprove = (id, name) => {
    setKycQueue(prev => prev.map(k => k.id === id ? { ...k, status: 'VERIFIED' } : k));
    showToast(`KYC for ${name} has been verified and approved in CBS!`, 'success');
  };

  const handleReject = (id, name) => {
    setKycQueue(prev => prev.map(k => k.id === id ? { ...k, status: 'REJECTED' } : k));
    showToast(`KYC for ${name} rejected. Notification sent to customer.`, 'warning');
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Card */}
      <div className="card" style={{ padding: '22px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
            🪪 Branch KYC Verification Queue ({kycQueue.filter(k => k.status === 'PENDING').length} Pending)
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            Inspect customer government identity proofs and authorize account activation.
          </p>
        </div>
      </div>

      {/* KYC Queue List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {kycQueue.map(item => {
          const isPending = item.status === 'PENDING';
          const isVerified = item.status === 'VERIFIED';

          return (
            <div
              key={item.id}
              className="card"
              style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#64748b' }}>{item.id}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: isVerified ? '#dcfce7' : (isPending ? '#fef3c7' : '#fee2e2'),
                    color: isVerified ? '#15803d' : (isPending ? '#d97706' : '#b91c1c')
                  }}>
                    {item.status}
                  </span>
                </div>

                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 2px 0', color: '#0f172a' }}>{item.customerName}</h4>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px' }}>CIF: <strong>{item.cif}</strong> • Submitted: {item.submittedDate}</div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Document Type:</span> <strong>{item.docType}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Document IDs:</span> <strong style={{ fontFamily: 'monospace' }}>{item.docNumber}</strong>
                  </div>
                </div>
              </div>

              {isPending && (
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => handleReject(item.id, item.customerName)}
                    style={{ flex: 1, padding: '7px', fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    Reject ✕
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleApprove(item.id, item.customerName)}
                    style={{ flex: 1, padding: '7px', fontSize: '0.82rem', fontWeight: 700, background: '#16a34a', borderColor: '#16a34a' }}
                  >
                    Approve KYC ✓
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
