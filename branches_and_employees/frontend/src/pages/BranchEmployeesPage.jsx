import React, { useState } from 'react';

/**
 * BranchEmployeesPage.jsx
 * Branch Staff & Teller Allocation Directory.
 * Shows active staff, teller desk assignments, shift schedules, and operational roles.
 */
export default function BranchEmployeesPage({ user, apiCall, showToast }) {
  const [employees, setEmployees] = useState([
    { id: 'EMP-DEL1-01', name: 'Sujit Kumar', role: 'Head Teller', desk: 'Counter 1 (Cash Deposit/Withdrawal)', status: 'ACTIVE', phone: '+91 98765 11001', shift: 'Morning (09:00 - 17:00)' },
    { id: 'EMP-DEL1-02', name: 'Neha Sharma', role: 'Senior Teller', desk: 'Counter 2 (Cash & Cheque Clearing)', status: 'ACTIVE', phone: '+91 98765 11002', shift: 'Morning (09:00 - 17:00)' },
    { id: 'EMP-DEL1-03', name: 'Vikram Mehta', role: 'Junior Officer', desk: 'Counter 3 (Account Opening & KYC)', status: 'ACTIVE', phone: '+91 98765 11003', shift: 'Morning (09:00 - 17:00)' },
    { id: 'EMP-DEL1-04', name: 'Priya Joshi', role: 'Customer Relationship Manager', desk: 'Desk 4 (Loans & Wealth)', status: 'ACTIVE', phone: '+91 98765 11004', shift: 'Morning (09:00 - 17:00)' }
  ]);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Card */}
      <div className="card" style={{ padding: '22px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
            👥 Branch Staff & Teller Counter Allocation ({employees.length})
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            Manage branch employee shifts, desk assignments, and role permissions.
          </p>
        </div>
      </div>

      {/* Employees Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {employees.map(emp => (
          <div
            key={emp.id}
            className="card"
            style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: 700, color: '#64748b' }}>{emp.id}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#dcfce7', color: '#15803d' }}>● {emp.status}</span>
              </div>

              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 2px 0', color: '#0f172a' }}>{emp.name}</h4>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ea580c', marginBottom: '8px' }}>{emp.role}</div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Desk Assignment:</span> <strong>{emp.desk}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Shift Hours:</span> <strong>{emp.shift}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Direct Line:</span> <strong>{emp.phone}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
