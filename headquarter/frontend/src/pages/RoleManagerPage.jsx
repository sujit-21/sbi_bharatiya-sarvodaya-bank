import React, { useState } from 'react';

/**
 * RoleManagerPage.jsx
 * Role-Based Access Control (RBAC) & Permissions Governance for Headquarter.
 * Configure fine-grained CRUD and dual-control approval policies for all system roles.
 */
export default function RoleManagerPage({ user, apiCall, showToast }) {
  const [roles, setRoles] = useState([
    {
      id: 'SUPER_ADMIN',
      name: 'Super Administrator',
      description: 'Full root access to all CBS ledger, security, and infrastructure settings',
      usersCount: 2,
      permissions: ['Read', 'Create', 'Update', 'Delete', 'Approve', 'Disaster Recovery', 'Audit']
    },
    {
      id: 'BRANCH_MANAGER',
      name: 'Branch Manager',
      description: 'Dual-control counter authorizations, vault limits, customer approvals, and branch P&L',
      usersCount: 12,
      permissions: ['Read', 'Create', 'Update', 'Approve', 'Vault Management', 'Customer Override']
    },
    {
      id: 'EMPLOYEE',
      name: 'Branch Employee (Teller / Desk)',
      description: 'Teller counter cash credit/debit operations, customer onboarding, and account assistance',
      usersCount: 48,
      permissions: ['Read', 'Create', 'Execute Transactions', 'Customer Onboarding']
    },
    {
      id: 'AUDITOR',
      name: 'Compliance & RBI Auditor',
      description: 'Read-only access to double-entry general ledger, audit trails, and risk reports',
      usersCount: 4,
      permissions: ['Read', 'Audit Trails', 'Export Statements', 'Fraud Alerts']
    }
  ]);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Card */}
      <div className="card" style={{ padding: '22px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
            🛡️ Role-Based Access Control (RBAC) Matrix
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            Manage core banking permission levels and dual-control approval mandates.
          </p>
        </div>
      </div>

      {/* Roles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {roles.map(role => (
          <div
            key={role.id}
            className="card"
            style={{ padding: '22px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: 700, color: '#64748b' }}>{role.id}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8' }}>
                  {role.usersCount} Active Users
                </span>
              </div>

              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>{role.name}</h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.4 }}>{role.description}</p>

              <div>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Granted Permissions</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {role.permissions.map((p, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      ✓ {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
