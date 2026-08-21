const db = require('../db/database');

// Retrieve all workflow executions and definitions
function getWorkflows(req, res) {
  const executions = db.find('workflowExecutions');
  const definitions = db.find('workflowDefinitions');
  return res.status(200).json({ executions, definitions });
}

// Submit a request to a workflow trigger
function triggerWorkflow(entityType, entityId, userId, details = {}) {
  const definition = db.findOne('workflowDefinitions', d => d.triggerType === entityType);
  if (!definition) return null;

  return db.insert('workflowExecutions', {
    definitionId: definition.id,
    entityId,
    entityType,
    currentStepIndex: 0,
    status: 'pending',
    history: [{
      step: 'Request Initiated',
      actor: userId,
      status: 'pending',
      details: JSON.stringify(details),
      timestamp: new Date().toISOString()
    }]
  });
}

// Approve or Reject a workflow step
function processWorkflowStep(req, res) {
  const { executionId, action, comment } = req.body; // action: 'approve' or 'reject'
  const actorId = req.user.id;
  const actorRole = req.user.role;

  if (!executionId || !action) {
    return res.status(400).json({ message: 'Execution ID and action are required.' });
  }

  const execution = db.findOne('workflowExecutions', we => we.id === executionId);
  if (!execution) {
    return res.status(404).json({ message: 'Workflow execution record not found.' });
  }

  if (execution.status !== 'pending') {
    return res.status(400).json({ message: 'Workflow execution is already complete.' });
  }

  const definition = db.findOne('workflowDefinitions', wd => wd.id === execution.definitionId);
  const currentStepName = definition.steps[execution.currentStepIndex];

  // Role validation for approvals: Manager/Admin only
  if (actorRole !== 'Branch Manager' && actorRole !== 'Super Admin') {
    return res.status(403).json({ message: 'Unauthorized. Workflow steps require Manager or Admin privilege.' });
  }

  const nowStr = new Date().toISOString();
  
  if (action === 'reject') {
    // 1. Process Rejection
    db.update('workflowExecutions', we => we.id === executionId, we => {
      we.status = 'rejected';
      we.history.push({
        step: currentStepName,
        actor: actorId,
        status: 'rejected',
        comment: comment || 'Rejected',
        timestamp: nowStr
      });
      return we;
    });

    // 2. Perform rejection actions on entity
    if (execution.entityType === 'KYC') {
      db.update('users', u => u.id === execution.entityId, { status: 'kyc_rejected' });
    } else if (execution.entityType === 'Loans') {
      db.update('loans', l => l.id === execution.entityId, { status: 'rejected' });
    } else if (execution.entityType === 'Merchant Requests') {
      db.update('users', u => u.id === execution.entityId, { status: 'rejected' });
    }

    return res.status(200).json({ message: 'Workflow execution rejected. Entity status updated.' });
  }

  // 3. Process Approval Step
  const nextStepIndex = execution.currentStepIndex + 1;
  const isFinalStep = nextStepIndex >= definition.steps.length;

  db.update('workflowExecutions', we => we.id === executionId, we => {
    we.history.push({
      step: currentStepName,
      actor: actorId,
      status: 'approved',
      comment: comment || 'Approved',
      timestamp: nowStr
    });

    if (isFinalStep) {
      we.status = 'approved';
      we.currentStepIndex = definition.steps.length;
    } else {
      we.currentStepIndex = nextStepIndex;
    }
    return we;
  });

  // 4. If Final Step Approved, trigger Core Banking effects
  if (isFinalStep) {
    if (execution.entityType === 'KYC') {
      // Activate Customer
      db.update('users', u => u.id === execution.entityId, { status: 'active' });
      
      // Auto-create standard Savings Account for Customer if not already exists
      const existingAccount = db.findOne('accounts', a => a.customerId === execution.entityId);
      if (!existingAccount) {
        db.insert('accounts', {
          customerId: execution.entityId,
          accountNumber: '1000' + Math.floor(100000 + Math.random() * 900000),
          branchId: req.user.branchId || 'b-main',
          type: 'savings',
          balance: 100.00, // Seed active account with small welcoming balance
          status: 'active'
        });
      }

      // Approve submitted documents
      db.update('documents', d => d.userId === execution.entityId && d.status === 'pending', { status: 'approved' });

    } else if (execution.entityType === 'Loans') {
      // Disburse Loan Amount
      const loan = db.findOne('loans', l => l.id === execution.entityId);
      db.update('loans', l => l.id === execution.entityId, { status: 'active' });

      // Add funds to Customer's Savings Account
      const custAcc = db.findOne('accounts', a => a.customerId === loan.customerId && a.type === 'savings');
      if (custAcc) {
        db.update('accounts', a => a.id === custAcc.id, { balance: custAcc.balance + loan.amount });

        db.insert('transactions', {
          fromAccountId: 'SYSTEM_LOANS',
          toAccountId: custAcc.id,
          amount: loan.amount,
          type: 'deposit',
          category: 'Loan Disbursement',
          status: 'completed',
          description: `Disbursement of Loan ${loan.id}`,
          reconciliationStatus: 'reconciled'
        });

        // Accounting GL Ledger disbursement entries
        const entry = db.insert('journalEntries', {
          date: nowStr.split('T')[0],
          description: `Disbursement of Loan ${loan.id} to Acc ${custAcc.accountNumber}`,
          status: 'posted',
          createdBy: actorId
        });
        db.insert('journalLines', { journalEntryId: entry.id, glCode: '2010', type: 'credit', amount: loan.amount }); // Credit Customer Account
        db.insert('journalLines', { journalEntryId: entry.id, glCode: '1010', type: 'credit', amount: loan.amount }); // Credit Vault (assuming cash/transfer asset payout)
        // Set up interest schedule
        db.insert('interestSchedules', {
          entityType: 'loan',
          entityId: loan.id,
          rate: loan.interestRate,
          type: 'simple',
          frequency: 'monthly',
          nextPostDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
        });
      }

    } else if (execution.entityType === 'Merchant Requests') {
      // Activate Merchant
      db.update('users', u => u.id === execution.entityId, { status: 'active' });

      // Create current account for merchant
      const existingAccount = db.findOne('accounts', a => a.customerId === execution.entityId);
      if (!existingAccount) {
        db.insert('accounts', {
          customerId: execution.entityId,
          accountNumber: '2000' + Math.floor(100000 + Math.random() * 900000),
          branchId: req.user.branchId || 'b-main',
          type: 'current',
          balance: 0.00,
          status: 'active'
        });
      }

      // Approve Merchant Dossier doc
      db.update('documents', d => d.userId === execution.entityId && d.status === 'pending', { status: 'approved' });
    }
  }

  return res.status(200).json({
    message: isFinalStep ? 'Workflow completed successfully. Action triggered.' : 'Workflow step approved.',
    isFinalStep
  });
}

module.exports = {
  getWorkflows,
  triggerWorkflow,
  processWorkflowStep
};
