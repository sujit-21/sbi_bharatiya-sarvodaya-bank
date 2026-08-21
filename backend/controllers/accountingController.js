const db = require('../db/database');

// Get all GL accounts
function getGeneralLedger(req, res) {
  const ledger = db.find('generalLedger');
  return res.status(200).json(ledger);
}

// Post a new Journal Entry
function postJournalEntry(req, res) {
  const { description, lines } = req.body; // lines: Array of { glCode, type: 'debit'|'credit', amount }

  if (!description || !lines || !Array.isArray(lines) || lines.length < 2) {
    return res.status(400).json({ message: 'Journal description and at least two lines are required.' });
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of lines) {
    const amount = parseFloat(line.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: `Invalid amount on line for GL ${line.glCode}.` });
    }
    
    // Check if GL exists
    const gl = db.findOne('generalLedger', g => g.code === line.glCode);
    if (!gl) {
      return res.status(404).json({ message: `General Ledger code ${line.glCode} not found.` });
    }

    if (line.type === 'debit') {
      totalDebit += amount;
    } else if (line.type === 'credit') {
      totalCredit += amount;
    } else {
      return res.status(400).json({ message: `Invalid entry type: must be 'debit' or 'credit'.` });
    }
  }

  // Double entry matching verification
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return res.status(400).json({
      message: `Imbalanced journal entry. Debits ($${totalDebit.toFixed(2)}) must equal Credits ($${totalCredit.toFixed(2)}).`
    });
  }

  // 1. Create Entry
  const entry = db.insert('journalEntries', {
    date: new Date().toISOString().split('T')[0],
    description,
    status: 'posted',
    createdBy: req.user.id
  });

  // 2. Insert Lines (GL balances updated automatically via database insert hook)
  lines.forEach(line => {
    const amount = parseFloat(line.amount);
    db.insert('journalLines', {
      journalEntryId: entry.id,
      glCode: line.glCode,
      type: line.type,
      amount
    });
  });

  return res.status(201).json({
    message: 'Journal entry posted successfully. GL accounts updated.',
    entryId: entry.id
  });
}

// Generate Trial Balance Report
function getTrialBalance(req, res) {
  const ledger = db.find('generalLedger');
  let debitSum = 0;
  let creditSum = 0;

  const rows = ledger.map(acc => {
    let debit = 0;
    let credit = 0;
    
    // assets & expenses hold normal debit balances
    if (acc.type === 'asset' || acc.type === 'expense') {
      if (acc.balance >= 0) {
        debit = acc.balance;
      } else {
        credit = Math.abs(acc.balance);
      }
    } else {
      // liabilities, equity, revenue hold normal credit balances
      if (acc.balance >= 0) {
        credit = acc.balance;
      } else {
        debit = Math.abs(acc.balance);
      }
    }

    debitSum += debit;
    creditSum += credit;

    return {
      code: acc.code,
      name: acc.name,
      type: acc.type,
      debit: parseFloat(debit.toFixed(2)),
      credit: parseFloat(credit.toFixed(2))
    };
  });

  return res.status(200).json({
    rows,
    totals: {
      debit: parseFloat(debitSum.toFixed(2)),
      credit: parseFloat(creditSum.toFixed(2)),
      matched: Math.abs(debitSum - creditSum) < 0.01
    }
  });
}

// Generate Balance Sheet Report
function getBalanceSheet(req, res) {
  const ledger = db.find('generalLedger');
  
  const assets = ledger.filter(a => a.type === 'asset');
  const liabilities = ledger.filter(a => a.type === 'liability');
  const equity = ledger.filter(a => a.type === 'equity');

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

  return res.status(200).json({
    assets: assets.map(a => ({ name: a.name, code: a.code, balance: parseFloat(a.balance.toFixed(2)) })),
    liabilities: liabilities.map(l => ({ name: l.name, code: l.code, balance: parseFloat(l.balance.toFixed(2)) })),
    equity: equity.map(e => ({ name: e.name, code: e.code, balance: parseFloat(e.balance.toFixed(2)) })),
    totals: {
      assets: parseFloat(totalAssets.toFixed(2)),
      liabilities: parseFloat(totalLiabilities.toFixed(2)),
      equity: parseFloat(totalEquity.toFixed(2)),
      liabilitiesAndEquity: parseFloat((totalLiabilities + totalEquity).toFixed(2)),
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    }
  });
}

// Generate Profit & Loss (P&L) Statement
function getProfitAndLoss(req, res) {
  const ledger = db.find('generalLedger');

  const revenues = ledger.filter(r => r.type === 'revenue');
  const expenses = ledger.filter(e => e.type === 'expense');

  const totalRevenue = revenues.reduce((sum, r) => sum + r.balance, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.balance, 0);
  const netIncome = totalRevenue - totalExpense;

  return res.status(200).json({
    revenue: revenues.map(r => ({ name: r.name, code: r.code, balance: parseFloat(r.balance.toFixed(2)) })),
    expenses: expenses.map(e => ({ name: e.name, code: e.code, balance: parseFloat(e.balance.toFixed(2)) })),
    totals: {
      revenue: parseFloat(totalRevenue.toFixed(2)),
      expense: parseFloat(totalExpense.toFixed(2)),
      netIncome: parseFloat(netIncome.toFixed(2))
    }
  });
}

// Financial Statement Export logs
function getJournalHistory(req, res) {
  const entries = db.find('journalEntries');
  const lines = db.find('journalLines');

  const entriesWithLines = entries.map(entry => {
    return {
      ...entry,
      lines: lines.filter(l => l.journalEntryId === entry.id)
    };
  });

  return res.status(200).json(entriesWithLines);
}

module.exports = {
  getGeneralLedger,
  postJournalEntry,
  getTrialBalance,
  getBalanceSheet,
  getProfitAndLoss,
  getJournalHistory
};
