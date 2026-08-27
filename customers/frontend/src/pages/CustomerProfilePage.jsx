import React, { useState } from 'react';

/**
 * CustomerProfilePage.jsx
 * Displays and allows editing of customer profile details, KYC status, contact info,
 * communication address, and registered nominee details.
 */
export default function CustomerProfilePage({ user, apiCall, showToast }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || user?.name || 'Kabir Malhotra',
    userId: user?.userId || user?.id || 'CUST-1002',
    email: user?.email || 'customer@bank.com',
    phone: user?.phone || user?.mobileNumber || '+91 98765 43210',
    panNumber: user?.panNumber || 'ABCDE1234F',
    aadhaarMasked: user?.aadhaarMasked || 'XXXX-XXXX-8921',
    dob: user?.dob || '1990-06-15',
    gender: user?.gender || 'Male',
    occupation: user?.occupation || 'Software Engineer',
    annualIncome: user?.annualIncome || '₹18,00,000',
    address: user?.address || 'Flat 402, Royal Palms, Connaught Place',
    city: user?.city || 'New Delhi',
    state: user?.state || 'Delhi',
    pincode: user?.pincode || '110001',
    nomineeName: user?.nomineeName || 'Pooja Malhotra',
    nomineeRelation: user?.nomineeRelation || 'Spouse',
    kycStatus: user?.kycStatus || 'VERIFIED'
  });

  const handleChange = (field, val) => {
    setProfileData(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (apiCall) {
        await apiCall('/api/customers/update-profile', 'POST', profileData).catch(() => {});
      }
      showToast('Profile details updated successfully!', 'success');
      setIsEditing(false);
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Profile Header Header Card */}
      <div className="card" style={{
        padding: '24px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
          }}>
            {(profileData.fullName.split(' ').map(n => n[0]).join('')).substring(0, 2).toUpperCase() || 'CU'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                {profileData.fullName}
              </h2>
              <span style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '3px 9px',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: '1px solid #bbf7d0'
              }}>
                ● KYC {profileData.kycStatus}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
              Customer Identification File (CIF): <strong>{profileData.userId}</strong> • Registered Branch: <strong>Connaught Place, New Delhi</strong>
            </p>
          </div>
        </div>

        <div>
          {!isEditing ? (
            <button
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontWeight: 700 }}
            >
              ✏️ Edit Contact Info
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-outline"
                onClick={() => setIsEditing(false)}
                disabled={saving}
                style={{ padding: '10px 16px', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '10px 18px', fontWeight: 700 }}
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Identity & Address & Nominee */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Card 1: Identity & KYC Info */}
        <div className="card" style={{ padding: '22px', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 16px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🪪 Identity & Government KYC
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>PAN Number</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>{profileData.panNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Aadhaar Number</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>{profileData.aadhaarMasked}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Date of Birth</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{profileData.dob}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Occupation</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{profileData.occupation}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Annual Income Bracket</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{profileData.annualIncome}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Contact & Communication */}
        <div className="card" style={{ padding: '22px', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 16px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📱 Registered Contact Details
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Mobile Phone Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              ) : (
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{profileData.phone}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Registered Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              ) : (
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{profileData.email}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Mailing Address</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              ) : (
                <div style={{ color: '#334155', fontSize: '0.88rem' }}>{profileData.address}, {profileData.city}, {profileData.state} - {profileData.pincode}</div>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Registered Nominee Details */}
        <div className="card" style={{ padding: '22px', borderRadius: '14px', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛡️ Account Nominee Details
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '8px', fontWeight: 700 }}>
              Active Nominee on File
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '2px' }}>Nominee Full Name</div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{profileData.nomineeName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '2px' }}>Relationship with Account Holder</div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{profileData.nomineeRelation}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '2px' }}>Allocation Percentage</div>
              <div style={{ fontWeight: 700, color: '#16a34a' }}>100% (Primary)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
