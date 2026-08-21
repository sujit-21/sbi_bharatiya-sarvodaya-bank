const db = require('../db/database');

// Upload a document (Simulated file upload, saving metadata)
function uploadDocument(req, res) {
  const { title, category, userId, fileName } = req.body;
  const currentUserId = req.user.id;
  const targetUserId = userId || currentUserId; // Teller can upload for Customer

  if (!title || !category || !fileName) {
    return res.status(400).json({ message: 'Title, category, and file name are required.' });
  }

  // Check if document already exists to handle versioning
  const existingDoc = db.findOne('documents', d => d.userId === targetUserId && d.category === category);
  
  if (existingDoc) {
    const nextVersion = existingDoc.version + 1;
    // Update main document version
    db.update('documents', d => d.id === existingDoc.id, {
      title,
      fileName,
      version: nextVersion,
      status: 'pending' // Resets to pending review on new version
    });

    // Add to versions log
    db.insert('documentVersions', {
      documentId: existingDoc.id,
      fileName,
      version: nextVersion,
      uploadedBy: currentUserId
    });

    return res.status(200).json({
      message: 'New document version uploaded successfully.',
      documentId: existingDoc.id,
      version: nextVersion
    });
  } else {
    // Create new document
    const doc = db.insert('documents', {
      userId: targetUserId,
      title,
      category,
      fileName,
      status: 'pending',
      version: 1
    });

    db.insert('documentVersions', {
      documentId: doc.id,
      fileName,
      version: 1,
      uploadedBy: currentUserId
    });

    return res.status(201).json({
      message: 'Document registered successfully.',
      document: doc
    });
  }
}

// Get documents list with Role-Based filtering
function getDocuments(req, res) {
  const user = req.user;
  let docs = [];

  if (user.role === 'Super Admin' || user.role === 'Branch Manager' || user.role === 'Employee') {
    docs = db.find('documents');
  } else {
    // Customer/Merchant can only see their own documents
    docs = db.find('documents', d => d.userId === user.id);
  }

  const versions = db.find('documentVersions');

  // Map versions into document objects
  const docsWithVersions = docs.map(doc => {
    return {
      ...doc,
      versions: versions.filter(v => v.documentId === doc.id)
    };
  });

  return res.status(200).json(docsWithVersions);
}

// Approve/Reject Document (Manager / Admin only)
function processDocumentApproval(req, res) {
  const { docId, status } = req.body; // 'approved' or 'rejected'
  const actorRole = req.user.role;

  if (actorRole !== 'Branch Manager' && actorRole !== 'Super Admin') {
    return res.status(403).json({ message: 'Only Managers and Admins can approve documents.' });
  }

  if (!docId || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Document ID and valid status (approved/rejected) are required.' });
  }

  const updated = db.update('documents', d => d.id === docId, { status });
  if (updated.length === 0) {
    return res.status(404).json({ message: 'Document not found.' });
  }

  return res.status(200).json({ message: `Document has been ${status}.` });
}

module.exports = {
  uploadDocument,
  getDocuments,
  processDocumentApproval
};
