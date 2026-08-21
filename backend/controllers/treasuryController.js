const db = require('../db/database');

// Get Treasury and Vault Summary
function getTreasurySummary(req, res) {
  const user = req.user;
  
  if (user.role === 'Super Admin') {
    const branches = db.find('branches');
    const vaults = db.find('cashVaults');
    const transfers = db.find('treasuryTransfers');
    
    return res.status(200).json({
      branches,
      vaults,
      transfers,
      totalTreasuryCash: vaults.reduce((sum, v) => sum + v.balance, 0)
    });
  } else if (user.role === 'Branch Manager' || user.role === 'Employee') {
    // Return specific branch details
    const branch = db.findOne('branches', b => b.id === user.branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found.' });
    }
    const vault = db.findOne('cashVaults', v => v.branchId === user.branchId);
    const tellers = db.find('cashPositions', cp => cp.branchId === user.branchId);
    const transfers = db.find('treasuryTransfers', t => t.fromBranchId === user.branchId || t.toBranchId === user.branchId);

    return res.status(200).json({
      branch,
      vault,
      tellers,
      transfers
    });
  } else {
    return res.status(403).json({ message: 'Access Denied.' });
  }
}

// Request cash transfer between branches
function transferCash(req, res) {
  const { fromBranchId, toBranchId, amount } = req.body;

  if (!fromBranchId || !toBranchId || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Origin branch, target branch, and valid amount are required.' });
  }

  const fromVault = db.findOne('cashVaults', v => v.branchId === fromBranchId);
  const toBranch = db.findOne('branches', b => b.id === toBranchId);

  if (!fromVault || !toBranch) {
    return res.status(404).json({ message: 'Origin vault or target branch not found.' });
  }

  if (fromVault.balance < amount) {
    return res.status(400).json({ message: 'Insufficient cash balance in source vault.' });
  }

  const transfer = db.insert('treasuryTransfers', {
    fromBranchId,
    toBranchId,
    amount: parseFloat(amount),
    status: 'pending',
    requestedBy: req.user.id,
    approvedBy: null,
    timestamp: new Date().toISOString()
  });

  return res.status(201).json({
    message: 'Cash transfer request generated successfully.',
    transfer
  });
}

// Approve cash transfer
function approveTransfer(req, res) {
  const { transferId, action } = req.body; // 'approve' or 'reject'

  const transfer = db.findOne('treasuryTransfers', t => t.id === transferId);
  if (!transfer) {
    return res.status(404).json({ message: 'Transfer request not found.' });
  }

  if (transfer.status !== 'pending') {
    return res.status(400).json({ message: 'Transfer is already processed.' });
  }

  if (action === 'approve') {
    const fromVault = db.findOne('cashVaults', v => v.branchId === transfer.fromBranchId);
    const toVault = db.findOne('cashVaults', v => v.branchId === transfer.toBranchId);

    if (fromVault.balance < transfer.amount) {
      return res.status(400).json({ message: 'Source vault balance has depleted. Cannot approve.' });
    }

    // Update balances
    db.update('cashVaults', v => v.id === fromVault.id, { balance: fromVault.balance - transfer.amount });
    db.update('cashVaults', v => v.id === toVault.id, { balance: toVault.balance + transfer.amount });
    
    // Update branch levels
    const fromBranch = db.findOne('branches', b => b.id === transfer.fromBranchId);
    const toBranch = db.findOne('branches', b => b.id === transfer.toBranchId);
    db.update('branches', b => b.id === fromBranch.id, { vaultBalance: fromBranch.vaultBalance - transfer.amount });
    db.update('branches', b => b.id === toBranch.id, { vaultBalance: toBranch.vaultBalance + transfer.amount });

    // Update transfer status
    db.update('treasuryTransfers', t => t.id === transferId, {
      status: 'approved',
      approvedBy: req.user.id
    });

    // Accounting General Ledger entries
    // Debit cash in vault (toBranch)
    // Credit cash in vault (fromBranch)
    const journalEntry = db.insert('journalEntries', {
      date: new Date().toISOString().split('T')[0],
      description: `Treasury Branch Cash Transfer: ${fromBranch.name} to ${toBranch.name}`,
      status: 'posted',
      createdBy: req.user.id
    });

    db.insert('journalLines', { journalEntryId: journalEntry.id, glCode: '1010', type: 'credit', amount: transfer.amount }); // HQ Vault credit
    db.insert('journalLines', { journalEntryId: journalEntry.id, glCode: '1010', type: 'debit', amount: transfer.amount }); // Receiving Vault debit

    return res.status(200).json({ message: 'Transfer request approved. Vaults reconciled.' });
  } else {
    db.update('treasuryTransfers', t => t.id === transferId, {
      status: 'rejected',
      approvedBy: req.user.id
    });
    return res.status(200).json({ message: 'Transfer request rejected.' });
  }
}

// Beginning Of Day (BOD) Teller Allocation
function processBOD(req, res) {
  const { tellerId, amount } = req.body;
  const managerBranchId = req.user.branchId;

  if (!tellerId || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Teller ID and valid funding amount required.' });
  }

  const vault = db.findOne('cashVaults', v => v.branchId === managerBranchId);
  if (!vault || vault.balance < amount) {
    return res.status(400).json({ message: 'Insufficient cash in branch vault.' });
  }

  const tellerPos = db.findOne('cashPositions', cp => cp.tellerId === tellerId && cp.branchId === managerBranchId);
  if (!tellerPos) {
    return res.status(404).json({ message: 'Teller cash position configuration not found.' });
  }

  // Deduct from vault and add to teller drawer
  db.update('cashVaults', v => v.id === vault.id, { balance: vault.balance - amount });
  db.update('cashPositions', cp => cp.id === tellerPos.id, {
    cashInHand: tellerPos.cashInHand + parseFloat(amount),
    status: 'active'
  });
  
  // Re-adjust branch levels
  const branch = db.findOne('branches', b => b.id === managerBranchId);
  db.update('branches', b => b.id === managerBranchId, {
    vaultBalance: branch.vaultBalance - amount,
    cashInHand: branch.cashInHand + amount
  });

  // Accounting lines
  const journalEntry = db.insert('journalEntries', {
    date: new Date().toISOString().split('T')[0],
    description: `BOD Drawer Allocation for Teller ${tellerId}`,
    status: 'posted',
    createdBy: req.user.id
  });
  db.insert('journalLines', { journalEntryId: journalEntry.id, glCode: '1010', type: 'credit', amount }); // Credit vault
  db.insert('journalLines', { journalEntryId: journalEntry.id, glCode: '1020', type: 'debit', amount }); // Debit teller cash

  return res.status(200).json({ message: `BOD Completed. Drawer funded with $${amount}.` });
}

// End Of Day (EOD) Teller Reconciliation
function processEOD(req, res) {
  const { tellerId, actualCash } = req.body;
  const managerBranchId = req.user.branchId;

  if (!tellerId || actualCash === undefined) {
    return res.status(400).json({ message: 'Teller ID and actual cash amount are required.' });
  }

  const tellerPos = db.findOne('cashPositions', cp => cp.tellerId === tellerId && cp.branchId === managerBranchId);
  if (!tellerPos) {
    return res.status(404).json({ message: 'Teller cash position not found.' });
  }

  const expectedCash = tellerPos.cashInHand;
  const difference = parseFloat(actualCash) - expectedCash;
  let status = 'reconciled';
  let logMsg = `EOD completed. Balance matched.`;

  if (difference < 0) {
    status = 'shortage';
    logMsg = `EOD completed with cash shortage: $${Math.abs(difference)}`;
    // Log fraud/risk alert
    db.insert('fraudAlerts', {
      id: `frd-${Date.now()}`,
      userId: tellerId,
      type: 'Cash Drawer Shortage',
      severity: Math.abs(difference) > 1000 ? 'high' : 'medium',
      description: `Teller ${tellerId} closed session with shortage of $${Math.abs(difference)}.`,
      status: 'pending',
      timestamp: new Date().toISOString()
    });
  } else if (difference > 0) {
    status = 'excess';
    logMsg = `EOD completed with cash excess: $${difference}`;
  }

  // Transfer remaining actual cash back to vault
  const vault = db.findOne('cashVaults', v => v.branchId === managerBranchId);
  db.update('cashVaults', v => v.id === vault.id, { balance: vault.balance + parseFloat(actualCash) });
  db.update('cashPositions', cp => cp.id === tellerPos.id, {
    cashInHand: 0,
    status: 'closed'
  });

  // Re-adjust branch levels
  const branch = db.findOne('branches', b => b.id === managerBranchId);
  db.update('branches', b => b.id === managerBranchId, {
    vaultBalance: branch.vaultBalance + parseFloat(actualCash),
    cashInHand: branch.cashInHand - expectedCash
  });

  // Log EOD Report
  db.insert('reconciliationLogs', {
    date: new Date().toISOString().split('T')[0],
    transactionsChecked: 1, // Single EOD session
    mismatchesFound: difference !== 0 ? 1 : 0,
    details: JSON.stringify({
      tellerId,
      expected: expectedCash,
      actual: parseFloat(actualCash),
      variance: difference,
      status
    }),
    status: status === 'reconciled' ? 'success' : 'failed'
  });

  // Accounting entries
  const journalEntry = db.insert('journalEntries', {
    date: new Date().toISOString().split('T')[0],
    description: `EOD Teller ${tellerId} Closing drawer`,
    status: 'posted',
    createdBy: req.user.id
  });
  db.insert('journalLines', { journalEntryId: journalEntry.id, glCode: '1020', type: 'credit', amount: expectedCash }); // Teller cash out
  db.insert('journalLines', { journalEntryId: journalEntry.id, glCode: '1010', type: 'debit', amount: parseFloat(actualCash) }); // Vault cash in

  // Handle variance
  if (difference !== 0) {
    const expenseOrRevenueGl = difference < 0 ? '5010' : '4010'; // Expense or revenue
    const isDebit = difference < 0 ? 'debit' : 'credit';
    db.insert('journalLines', {
      journalEntryId: journalEntry.id,
      glCode: expenseOrRevenueGl,
      type: isDebit,
      amount: Math.abs(difference)
    });
  }

  return res.status(200).json({
    message: logMsg,
    expected: expectedCash,
    actual: actualCash,
    variance: difference,
    status
  });
}

module.exports = {
  getTreasurySummary,
  transferCash,
  approveTransfer,
  processBOD,
  processEOD
};
