const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// Get all KYC submissions queue
exports.getKycQueue = async (req, res) => {
  try {
    const users = db.find('users', () => true);
    const kycDocs = db.find('kycDocuments', () => true) || [];
    
    // Map users with their KYC status & document details
    const queue = users.map(u => {
      const doc = kycDocs.find(d => d.userId === u.id) || {};
      return {
        userId: u.id,
        fullName: u.fullName || u.name,
        email: u.email,
        role: u.role,
        kycStatus: u.kycStatus || doc.status || 'pending',
        docType: doc.docType || 'Passport / Govt ID',
        docNumber: doc.docNumber || `ID-${u.id.substring(0,6).toUpperCase()}`,
        submittedAt: doc.submittedAt || u.createdAt || new Date().toISOString()
      };
    });

    res.json({ success: true, queue });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch KYC queue', error: error.message });
  }
};

// Customer KYC Document Submission
exports.submitKycDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { docType, docNumber } = req.body;

    if (!docType || !docNumber) {
      return res.status(400).json({ message: 'Document type and document number are required.' });
    }

    const docId = `kyc-${uuidv4().substring(0,8)}`;
    const kycRecord = {
      id: docId,
      userId,
      docType,
      docNumber,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    db.insert('kycDocuments', kycRecord);
    db.update('users', u => u.id === userId, u => ({ ...u, kycStatus: 'pending' }));
    db.logAudit(userId, 'KYC_SUBMITTED', `Document ${docType} (${docNumber}) submitted for verification.`);

    res.json({ success: true, message: 'KYC documents submitted successfully for verification.', record: kycRecord });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit KYC document', error: error.message });
  }
};

// Verify/Approve or Reject KYC Status by Staff/Admin
exports.verifyKycStatus = async (req, res) => {
  try {
    const { userId, action, remarks } = req.body; // action: 'approve' | 'reject'
    if (!userId || !action) {
      return res.status(400).json({ message: 'User ID and action are required.' });
    }

    const targetStatus = action === 'approve' ? 'verified' : 'rejected';
    db.update('users', u => u.id === userId, u => ({ ...u, kycStatus: targetStatus }));
    db.update('kycDocuments', d => d.userId === userId, d => ({ ...d, status: targetStatus, verifiedAt: new Date().toISOString(), verifiedBy: req.user.id, remarks }));
    
    db.logAudit(req.user.id, `KYC_${action.toUpperCase()}D`, `Updated user ${userId} KYC status to ${targetStatus}. Remarks: ${remarks || 'None'}`);

    res.json({ success: true, message: `User KYC status updated to ${targetStatus}.` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify KYC status', error: error.message });
  }
};
