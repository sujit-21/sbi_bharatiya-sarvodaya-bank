import React from 'react';

export default function Header({ user, activeTab }) {
  const branchName = user?.branchName || (user?.branchId === 'b-main' ? 'Global Headquarters' : (user?.branchId || 'Global Headquarters'));
  
  const roleStr = (user?.role || '').toLowerCase();
  let trackLabel = 'Personal Banking';
  let trackBadgeBg = 'linear-gradient(135deg, #10b981, #059669)';
  
  if (roleStr.includes('merchant')) {
    trackLabel = 'Corporate Banking';
    trackBadgeBg = 'linear-gradient(135deg, #8b5cf6, #6d28d9)';
  } else if (roleStr.includes('admin') || roleStr.includes('manager') || roleStr.includes('employee') || roleStr.includes('teller') || roleStr.includes('auditor') || roleStr.includes('compliance')) {
    trackLabel = 'Staff Banking';
    trackBadgeBg = 'linear-gradient(135deg, #2563eb, #4f46e5)';
  }

  let scopeLabel = 'Branch-wide';
  if (roleStr.includes('super admin') || roleStr.includes('auditor') || roleStr.includes('compliance')) {
    scopeLabel = 'Head Office (Bank-wide)';
  } else if (roleStr.includes('manager')) {
    scopeLabel = 'Branch / Regional';
  }

  return (
    <header className="top-bar" style={{
      background: 'rgba(255, 255, 255, 0.88)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #e2e8f0',
      height: '68px',
      minHeight: '68px',
      padding: '0 28px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      boxSizing: 'border-box',
      width: '100%'
    }}>
      <div className="top-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <h1 id="page-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.3px', color: '#0f172a' }}>
          BSB {(activeTab || 'summary').toUpperCase()}
        </h1>
        <span style={{
          background: trackBadgeBg,
          color: '#fff',
          fontSize: '0.72rem',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: '14px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          boxShadow: '0 2px 6px rgba(37,99,235,0.2)'
        }}>
          {trackLabel}
        </span>
      </div>

      <div className="top-right" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{
          fontSize: '0.8rem',
          background: 'rgba(37, 99, 235, 0.08)',
          color: '#1d4ed8',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(37, 99, 235, 0.18)',
          fontWeight: 700
        }}>
          Scope: {scopeLabel}
        </div>

        <div className="branch-indicator" id="manager-branch-indicator" style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(99,102,241,0.08) 100%)',
          color: '#1e40af',
          fontWeight: 700,
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(37,99,235,0.2)',
          fontSize: '0.85rem'
        }}>
          Branch: {branchName}
        </div>
      </div>
    </header>
  );
}
