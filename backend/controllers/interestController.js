const db = require('../db/database');

// Core Calculation Formulas
function calculateSimpleInterest(principal, rate, termMonths) {
  const timeYears = termMonths / 12;
  return principal * (rate / 100) * timeYears;
}

function calculateCompoundInterest(principal, rate, termMonths, compoundingFreq = 4) {
  // compoundingFreq: 4 = quarterly, 12 = monthly, 1 = annually
  const timeYears = termMonths / 12;
  const r = rate / 100;
  const n = compoundingFreq;
  const amount = principal * Math.pow(1 + r / n, n * timeYears);
  return amount - principal;
}

// Get interest logs & schedule list
function getInterestStatus(req, res) {
  const schedules = db.find('interestSchedules');
  const postings = db.find('interestPostings');
  return res.status(200).json({ schedules, postings });
}

// Calculate and Post interest for all accounts (Savings, FD, RD, Loans)
function runInterestPosting(req, res) {
  const accounts = db.find('accounts', a => a.status === 'active');
  const fds = db.find('fixedDeposits', f => f.status === 'active');
  const rds = db.find('recurringDeposits', r => r.status === 'active');
  const loans = db.find('loans', l => l.status === 'active');
  
  const postings = [];
  const nowStr = new Date().toISOString();
  
  // 1. Process Savings Account Interest (Monthly posting simulation, 3% APY simple interest)
  accounts.forEach(acc => {
    if (acc.type === 'savings') {
      const rate = 3.0; // 3% per annum
      const monthlyRate = rate / 12 / 100;
      const interestEarned = acc.balance * monthlyRate;

      if (interestEarned > 0.01) {
        // Credit customer account
        db.update('accounts', a => a.id === acc.id, { balance: acc.balance + interestEarned });
        
        // Add transaction
        db.insert('transactions', {
          fromAccountId: 'SYSTEM',
          toAccountId: acc.id,
          amount: parseFloat(interestEarned.toFixed(2)),
          type: 'deposit',
          category: 'Interest Credited',
          status: 'completed',
          description: 'Monthly Savings Interest Credited',
          reconciliationStatus: 'reconciled'
        });

        // Add interest posting record
        const post = db.insert('interestPostings', {
          accountId: acc.id,
          amount: parseFloat(interestEarned.toFixed(2)),
          type: 'savings',
          period: 'Monthly Accrual',
          postedAt: nowStr
        });
        postings.push(post);

        // Accounting entry
        const entry = db.insert('journalEntries', {
          date: nowStr.split('T')[0],
          description: `Savings Interest Posting for ${acc.accountNumber}`,
          status: 'posted',
          createdBy: req.user ? req.user.id : 'system'
        });
        db.insert('journalLines', { journalEntryId: entry.id, glCode: '5010', type: 'debit', amount: interestEarned }); // Interest Expense
        db.insert('journalLines', { journalEntryId: entry.id, glCode: '2010', type: 'credit', amount: interestEarned }); // Customer savings
      }
    }
  });

  // 2. Process Fixed Deposits (Simulate maturity or quarterly interest)
  fds.forEach(fd => {
    const isMatured = new Date(fd.maturityDate) <= new Date();
    if (isMatured) {
      // Calculate simple/compound interest
      const interest = fd.interestRate > 5.0 
        ? calculateCompoundInterest(fd.principalAmount, fd.interestRate, fd.termMonths, 4) 
        : calculateSimpleInterest(fd.principalAmount, fd.interestRate, fd.termMonths);

      const totalPayout = fd.principalAmount + interest;

      // Update FD state
      db.update('fixedDeposits', f => f.id === fd.id, {
        status: 'matured',
        maturityAmount: parseFloat(totalPayout.toFixed(2))
      });

      // Transfer money to customer primary savings account
      const customerAcc = db.findOne('accounts', a => a.customerId === fd.customerId && a.type === 'savings');
      if (customerAcc) {
        db.update('accounts', a => a.id === customerAcc.id, { balance: customerAcc.balance + totalPayout });
        
        db.insert('transactions', {
          fromAccountId: 'SYSTEM',
          toAccountId: customerAcc.id,
          amount: parseFloat(totalPayout.toFixed(2)),
          type: 'deposit',
          category: 'FD Maturity Transfer',
          status: 'completed',
          description: `Fixed Deposit Maturity payout for FD ${fd.id}`,
          reconciliationStatus: 'reconciled'
        });
      }

      const post = db.insert('interestPostings', {
        accountId: customerAcc ? customerAcc.id : 'unknown',
        amount: parseFloat(interest.toFixed(2)),
        type: 'fd',
        period: 'Maturity Close',
        postedAt: nowStr
      });
      postings.push(post);

      // Auto Renewal Simulation
      if (fd.autoRenewal) {
        db.insert('fixedDeposits', {
          customerId: fd.customerId,
          principalAmount: fd.principalAmount,
          interestRate: fd.interestRate,
          termMonths: fd.termMonths,
          status: 'active',
          maturityAmount: 0,
          maturityDate: new Date(Date.now() + fd.termMonths * 30 * 24 * 3600 * 1000).toISOString(),
          autoRenewal: true
        });
      }
    }
  });

  // 3. Process Loans (Monthly interest accrual - e.g. 8% APY)
  loans.forEach(loan => {
    // Generate monthly loan installment and interest
    const monthlyRate = loan.interestRate / 12 / 100;
    const interestCharge = loan.remainingBalance * monthlyRate;
    
    // Penal Interest (Simulate 2% extra if term has exceeded schedule, mock check)
    let penalCharge = 0;
    const isOverdue = new Date(loan.nextPaymentDate || nowStr) < new Date();
    if (isOverdue) {
      penalCharge = loan.remainingBalance * (2 / 12 / 100);
    }

    const totalCharge = interestCharge + penalCharge;

    if (totalCharge > 0) {
      // Increase loan outstanding balance
      db.update('loans', l => l.id === loan.id, {
        remainingBalance: loan.remainingBalance + totalCharge,
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
      });

      const post = db.insert('interestPostings', {
        accountId: loan.id,
        amount: parseFloat(totalCharge.toFixed(2)),
        type: 'loan',
        period: `Monthly Accrual (Penal: ${penalCharge.toFixed(2)})`,
        postedAt: nowStr
      });
      postings.push(post);

      // Accounting
      const entry = db.insert('journalEntries', {
        date: nowStr.split('T')[0],
        description: `Loan Interest Accrued: ${loan.id}`,
        status: 'posted',
        createdBy: req.user ? req.user.id : 'system'
      });
      // Debit Loan Assets (outstanding increases)
      // Credit Interest Revenue (gl-4010)
      db.insert('journalLines', { journalEntryId: entry.id, glCode: '4010', type: 'credit', amount: totalCharge });
    }
  });

  return res.status(200).json({
    message: 'Interest posting batch executed successfully.',
    totalAccountsProcessed: accounts.length + fds.length + loans.length,
    postingsGenerated: postings
  });
}

module.exports = {
  getInterestStatus,
  runInterestPosting
};
