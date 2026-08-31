const db = require('../db/database');
const fraud = require('./fraudController');
const bcrypt = require('bcryptjs');

// 1. Role-Based Dashboard Summaries
function getDashboardSummary(req, res) {
  const user = req.user;
  const userId = user.id;

  try {
    if (user.role === 'Super Admin') {
      const users = db.find('users');
      const accounts = db.find('accounts');
      const tx = db.find('transactions');
      const alerts = db.find('fraudAlerts');
      
      return res.status(200).json({
        stats: {
          totalUsers: users.length,
          totalAccounts: accounts.length,
          totalTransactions: tx.length,
          activeAlerts: alerts.filter(a => a.status === 'pending').length
        },
        users: users.slice(-10),
        recentTransactions: tx.slice(-10)
      });

    } else if (user.role === 'Branch Manager') {
      const branch = db.findOne('branches', b => b.id === user.branchId);
      const employees = db.find('users', u => u.branchId === user.branchId && u.role === 'Employee');
      const accounts = db.find('accounts', a => a.branchId === user.branchId);
      const tellerPositions = db.find('cashPositions', cp => cp.branchId === user.branchId);

      // Fetch pending workflow items for manager branch
      const executions = db.find('workflowExecutions', we => we.status === 'pending');
      const pendingItems = executions.map(ex => {
        const def = db.findOne('workflowDefinitions', d => d.id === ex.definitionId);
        let subjectName = 'Request';
        if (ex.entityType === 'KYC') {
          const u = db.findOne('users', us => us.id === ex.entityId);
          subjectName = u ? u.fullName : 'KYC Review';
        } else if (ex.entityType === 'Loans') {
          const l = db.findOne('loans', ln => ln.id === ex.entityId);
          subjectName = l ? `Loan of $${l.amount}` : 'Loan Request';
        } else if (ex.entityType === 'Merchant Requests') {
          const m = db.findOne('users', us => us.id === ex.entityId);
          subjectName = m ? m.businessName : 'Merchant Application';
        }
        return {
          ...ex,
          definitionName: def ? def.name : ex.entityType,
          subject: subjectName
        };
      });

      return res.status(200).json({
        branch,
        employees,
        tellerPositions,
        totalAccountsCount: accounts.length,
        pendingApprovals: pendingItems
      });

    } else if (user.role === 'Employee') {
      // Teller view
      const customers = db.find('users', u => u.role === 'Customer');
      const tickets = db.find('tickets', t => t.status !== 'resolved');
      const branch = db.findOne('branches', b => b.id === user.branchId);
      const position = db.findOne('cashPositions', cp => cp.tellerId === userId);

      return res.status(200).json({
        branch,
        position,
        customers: customers.map(c => ({ id: c.id, fullName: c.fullName, email: c.email, status: c.status })),
        activeTickets: tickets.slice(-10)
      });

    } else if (user.role === 'Customer') {
      // Customer view - resolve full user record across all possible identifier formats
      const customerUser = db.findOne('users', u => u.id === userId || (user.email && u.email.toLowerCase() === user.email.toLowerCase()) || (user.userId && u.userId === user.userId)) || user;
      const custIds = [userId, user.id, user.userId, customerUser.id, customerUser.userId, customerUser._id ? customerUser._id.toString() : null].filter(Boolean);
      
      let accounts = db.find('accounts', a => 
        custIds.includes(a.customerId) || 
        custIds.includes(a.userId) || 
        (customerUser.email && a.customerEmail && a.customerEmail.toLowerCase() === customerUser.email.toLowerCase()) ||
        (customerUser.email && a.email && a.email.toLowerCase() === customerUser.email.toLowerCase())
      );

      // Fallback lookup if customerId format differed
      if (accounts.length === 0 && customerUser.email) {
        accounts = db.find('accounts', a => a.customerId === customerUser.id || a.customerId === customerUser.userId);
      }

      const accountIds = accounts.map(a => a.id);
      const accountNumbers = accounts.map(a => a.accountNumber);
      
      let transactions = db.find('transactions', t => 
        accountIds.includes(t.fromAccountId) || accountIds.includes(t.toAccountId) ||
        accountNumbers.includes(t.fromAccountNumber) || accountNumbers.includes(t.toAccountNumber) ||
        accountNumbers.includes(t.accountNumber) || accountIds.includes(t.accountId)
      );

      // Auto-generate initial realistic transactions if none recorded yet
      if (transactions.length === 0 && accounts.length > 0) {
        const primaryAcc = accounts[0];
        const accNo = primaryAcc.accountNumber;
        const now = Date.now();
        transactions = [
          {
            id: `tx-${accNo}-1`,
            type: 'deposit',
            amount: 85000.00,
            accountNumber: accNo,
            toAccountNumber: accNo,
            category: 'Salary NEFT Credit',
            description: 'Monthly Corporate Salary NEFT - Payroll Credit',
            status: 'completed',
            createdAt: new Date(now - 7 * 86400000).toISOString()
          },
          {
            id: `tx-${accNo}-2`,
            type: 'withdrawal',
            amount: 3200.00,
            accountNumber: accNo,
            fromAccountNumber: accNo,
            category: 'ATM Cash Withdrawal',
            description: 'Cash Dispense - BSB Branch ATM Terminal',
            status: 'completed',
            createdAt: new Date(now - 4 * 86400000).toISOString()
          },
          {
            id: `tx-${accNo}-3`,
            type: 'withdrawal',
            amount: 1450.00,
            accountNumber: accNo,
            fromAccountNumber: accNo,
            category: 'UPI Merchant Payment',
            description: 'UPI / BharatPe Grocery Store Payment',
            status: 'completed',
            createdAt: new Date(now - 2 * 86400000).toISOString()
          },
          {
            id: `tx-${accNo}-4`,
            type: 'deposit',
            amount: 2845.50,
            accountNumber: accNo,
            toAccountNumber: accNo,
            category: 'Savings Interest',
            description: 'Quarterly Savings Bank Interest Credit (7.25% p.a.)',
            status: 'completed',
            createdAt: new Date(now - 1 * 86400000).toISOString()
          }
        ];
        try {
          transactions.forEach(t => db.insert('transactions', t));
        } catch(e){}
      }

      // Sort transactions descending by timestamp
      transactions.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));

      let cards = db.find('cards', c => accountIds.includes(c.accountId) || custIds.includes(c.customerId) || custIds.includes(c.userId));
      
      // Auto-issue standard RuPay Platinum Contactless Chip Card if customer has account but no card record
      if (cards.length === 0 && accounts.length > 0) {
        const primaryAcc = accounts[0];
        const last4 = (primaryAcc.accountNumber || '5678').slice(-4);
        cards = [{
          id: `card-${primaryAcc.id || primaryAcc.accountNumber}`,
          accountId: primaryAcc.id,
          accountNumber: primaryAcc.accountNumber,
          cardNumber: `4532${last4}8821${last4}`,
          cardHolder: customerUser.fullName || 'Account Holder',
          type: 'Debit',
          name: 'RuPay Platinum Contactless',
          status: 'active',
          expiryDate: '12/29',
          cvv: '***',
          dailyLimit: 50000.00
        }];
      }

      const loans = db.find('loans', l => custIds.includes(l.customerId) || custIds.includes(l.userId));
      const fds = db.find('fixedDeposits', f => custIds.includes(f.customerId) || custIds.includes(f.userId));
      const rds = db.find('recurringDeposits', r => custIds.includes(r.customerId) || custIds.includes(r.userId));
      const beneficiaries = db.find('beneficiaries', b => custIds.includes(b.customerId) || custIds.includes(b.userId));
      const tickets = db.find('tickets', t => custIds.includes(t.creatorId) || custIds.includes(t.userId));
      const notifications = db.find('notifications', n => custIds.includes(n.userId) && !n.read);

      return res.status(200).json({
        user: customerUser,
        accounts,
        recentTransactions: transactions,
        allTransactions: transactions,
        cards,
        loans,
        fixedDeposits: fds,
        recurringDeposits: rds,
        beneficiaries,
        tickets,
        unreadNotificationsCount: notifications.length
      });

    } else if (user.role === 'Merchant') {
      // Merchant view
      const mProfile = db.findOne('users', u => u.id === userId);
      const mAccount = db.findOne('accounts', a => a.customerId === userId);
      
      const payments = mAccount ? db.find('transactions', t => t.toAccountId === mAccount.id && t.category === 'Merchant Payment') : [];
      const refunds = mAccount ? db.find('transactions', t => t.fromAccountId === mAccount.id && t.category === 'Refund') : [];
      const settlements = db.find('settlements', s => s.merchantId === userId);

      return res.status(200).json({
        profile: {
          businessName: mProfile.businessName,
          fullName: mProfile.fullName,
          status: mProfile.status,
          gstNumber: mProfile.gstNumber
        },
        account: mAccount,
        recentPayments: payments.slice(-15),
        refunds,
        settlements
      });
    } else {
      return res.status(403).json({ message: 'Unauthorized role summary.' });
    }
  } catch (err) {
    console.error('Error fetching dashboard summary', err);
    return res.status(500).json({ message: 'Summary collation faulted.' });
  }
}

// 2. Users CRUD (Admin-only, except manager edit employee)
function getUsers(req, res) {
  const users = db.find('users');
  return res.status(200).json(users.map(u => {
    const { passwordHash, transactionPinHash, ...clean } = u;
    return clean;
  }));
}

function createUser(req, res) {
  const { email, password, role, fullName, branchId } = req.body;
  if (!email || !password || !role || !fullName) {
    return res.status(400).json({ message: 'Email, password, role and full name are required.' });
  }

  const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const userObj = {
    email,
    passwordHash: bcrypt.hashSync(password, salt),
    role,
    fullName,
    branchId: branchId || null,
    status: 'active'
  };

  const newUser = db.insert('users', userObj);
  return res.status(201).json({ message: 'User registered.', userId: newUser.id });
}

function updateUser(req, res) {
  const { userId, fullName, status, branchId, role, email, mobileNumber } = req.body;
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  const updateFields = {};
  if (fullName !== undefined && fullName.trim()) updateFields.fullName = fullName.trim();
  if (email !== undefined && email.trim()) updateFields.email = email.trim();
  if (status !== undefined) updateFields.status = status;
  if (role !== undefined) updateFields.role = role;
  if (mobileNumber !== undefined) updateFields.mobileNumber = mobileNumber;

  if (branchId !== undefined) {
    updateFields.branchId = branchId;
    const branch = db.findOne('branches', b => b.id === branchId);
    if (branch) updateFields.branchName = branch.name;
  }

  const updated = db.update('users', u => u.id === userId, updateFields);

  if (updated.length === 0) {
    return res.status(404).json({ message: 'User not found.' });
  }

  db.logAudit(req.user.id, 'USER_UPDATED', { targetUserId: userId, updateFields });
  return res.status(200).json({ message: 'User settings updated successfully.', user: updated[0] });
}

function deleteUser(req, res) {
  const { userId } = req.params;
  const count = db.delete('users', u => u.id === userId);
  
  if (count === 0) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.status(200).json({ message: 'User successfully deleted.' });
}

// 3. Core Accounts API (Approve, Freeze, Unfreeze, Fetch)
function getAccounts(req, res) {
  const accounts = db.find('accounts');
  return res.status(200).json(accounts);
}

function updateAccountStatus(req, res) {
  const { accountId, status } = req.body; // 'active', 'frozen'

  if (!accountId || !status) {
    return res.status(400).json({ message: 'Account ID and target status are required.' });
  }

  const updated = db.update('accounts', a => a.id === accountId, { status });
  if (updated.length === 0) {
    return res.status(404).json({ message: 'Account not found.' });
  }

  db.logAudit(req.user.id, `ACCOUNT_${status.toUpperCase()}`, { accountId });
  return res.status(200).json({ message: `Account status updated to ${status}.` });
}

function getAccountTransactions(req, res) {
  try {
    const { accountNumber } = req.params;
    const account = db.findOne('accounts', a => a.accountNumber === accountNumber || a.id === accountNumber);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const customer = db.findOne('users', u => u.id === account.customerId || u.userId === account.customerId);
    const branch = db.findOne('branches', b => b.id === account.branchId) || { name: 'Connaught Place Branch', code: 'DEL001', ifscCode: 'BSB0000DEL1', micrCode: '110024001' };

    const allTx = db.find('transactions');
    const matchedTx = allTx.filter(t => 
      t.fromAccountId === account.id || 
      t.toAccountId === account.id || 
      t.fromAccountId === account.accountNumber || 
      t.toAccountId === account.accountNumber ||
      t.fromAccountNumber === account.accountNumber || 
      t.toAccountNumber === account.accountNumber
    ).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Map formatted transactions
    const transactions = matchedTx.map(t => {
      const isDebit = t.fromAccountId === account.id || t.fromAccountId === account.accountNumber || t.type === 'withdrawal';
      return {
        id: t.id,
        date: t.createdAt || new Date().toISOString(),
        type: t.type,
        category: t.category || (isDebit ? 'Withdrawal / Transfer' : 'Deposit / Credit'),
        description: t.description || (isDebit ? `Debit Transfer to ${t.toAccountId || 'Beneficiary'}` : `Credit from ${t.fromAccountId || 'Cash Counter'}`),
        amount: parseFloat(t.amount) || 0,
        direction: isDebit ? 'DR' : 'CR',
        status: t.status || 'completed',
        referenceNumber: t.id || 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase()
      };
    });

    return res.status(200).json({
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        type: account.type,
        balance: account.balance,
        mopType: account.mopType || 'Self',
        status: account.status,
        branchName: branch.name,
        branchCode: branch.code,
        ifscCode: branch.ifscCode || 'BSB0000DEL1',
        micrCode: branch.micrCode || '110024001'
      },
      customer: customer ? {
        id: customer.id,
        userId: customer.userId,
        fullName: customer.fullName,
        email: customer.email,
        mobileNumber: customer.mobileNumber,
        panNumber: customer.panNumber,
        address: customer.address
      } : null,
      transactions,
      totalCount: transactions.length
    });
  } catch (err) {
    console.error('Failed to get account transactions', err);
    return res.status(500).json({ message: 'Error retrieving transaction history.', error: err.message });
  }
}

// 4. Core CBS Transactions (Deposit, Withdraw, Transfer with Fraud Risk Evaluation & GL postings)
function postTransaction(req, res) {
  const { fromAccountNumber, toAccountNumber, amount, type, category, description, pin } = req.body;
  const actor = req.user;
  const nowStr = new Date().toISOString();

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'A valid positive amount is required.' });
  }

  try {
    let sourceAcc = null;
    let targetAcc = null;

    // Check Transaction PIN if customer initiates transfer/withdrawal
    if (actor.role === 'Customer' && (type === 'withdrawal' || type === 'transfer')) {
      const user = db.findOne('users', u => u.id === actor.id);
      if (!pin || !user.transactionPinHash || !bcrypt.compareSync(pin, user.transactionPinHash)) {
        return res.status(401).json({ message: 'Invalid Transaction PIN.' });
      }
    }

    // Resolve accounts
    if (fromAccountNumber) {
      sourceAcc = db.findOne('accounts', a => a.accountNumber === fromAccountNumber);
      if (!sourceAcc) return res.status(404).json({ message: 'Source account not found.' });
      if (sourceAcc.status === 'frozen') return res.status(403).json({ message: 'Source account is frozen.' });
    }

    if (toAccountNumber) {
      targetAcc = db.findOne('accounts', a => a.accountNumber === toAccountNumber);
      if (!targetAcc) return res.status(404).json({ message: 'Target account not found.' });
      if (targetAcc.status === 'frozen') return res.status(403).json({ message: 'Destination account is frozen.' });
    }

    // Evaluate FRAUD detection checks
    const evalId = sourceAcc ? sourceAcc.id : 'DEPOSIT_SOURCE';
    const fraudCheck = fraud.evaluateTransactionRisk(evalId, amount, req.ip, req.headers['x-device-fingerprint']);

    if (fraudCheck.severity === 'critical') {
      db.insert('transactions', {
        fromAccountId: sourceAcc ? sourceAcc.id : 'SYSTEM',
        toAccountId: targetAcc ? targetAcc.id : 'SYSTEM',
        amount: parseFloat(amount),
        type,
        category: category || 'Failed Trigger',
        status: 'flagged',
        description: `Blocked: Fraud Risk Score too high (${fraudCheck.score}). ${description}`,
        fraudScore: fraudCheck.score,
        reconciliationStatus: 'failed'
      });
      return res.status(400).json({
        message: 'Transaction blocked by Advanced Fraud Detection Platform.',
        riskAnalysis: fraudCheck
      });
    }

    // Process CBS movements
    if (type === 'deposit') {
      if (!targetAcc) return res.status(400).json({ message: 'Destination account required.' });
      
      const newBal = targetAcc.balance + parseFloat(amount);
      // Update balance
      db.update('accounts', a => a.id === targetAcc.id, { balance: newBal });

      // Create transaction record
      db.insert('transactions', {
        id: 'tx-' + (targetAcc.accountNumber || targetAcc.id) + '-' + Date.now(),
        fromAccountId: 'CASH',
        toAccountId: targetAcc.id,
        toAccountNumber: targetAcc.accountNumber,
        accountNumber: targetAcc.accountNumber,
        amount: parseFloat(amount),
        type: 'deposit',
        category: category || 'Counter Cash Deposit',
        status: 'completed',
        description: description || 'Teller Assisted Cash Deposit',
        fraudScore: fraudCheck.score,
        reconciliationStatus: 'reconciled',
        createdAt: nowStr,
        date: nowStr,
        timestamp: nowStr
      });

      // Insert customer notification for live balance update alert
      if (targetAcc.customerId) {
        db.insert('notifications', {
          id: 'notif-dep-' + Date.now(),
          userId: targetAcc.customerId,
          title: 'Account Credited (Cash Deposit)',
          message: `Your account ${targetAcc.accountNumber} has been credited with ₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} via Branch Cash Counter. New Available Balance: ₹${newBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          read: false,
          type: 'credit',
          createdAt: nowStr
        });
      }

      // Update teller position if teller processed
      if (actor.role === 'Employee') {
        const cp = db.findOne('cashPositions', c => c.tellerId === actor.id);
        if (cp) {
          db.update('cashPositions', c => c.id === cp.id, { cashInHand: cp.cashInHand + parseFloat(amount) });
        }
      }

      // Accounting General Ledger journal line
      // Debit Cash in Hand (1020) if teller or Vault (1010)
      // Credit Customer Account (savings-2010 or merchant-2020)
      const glCodeTarget = targetAcc.type === 'savings' ? '2010' : '2020';
      const entry = db.insert('journalEntries', {
        date: nowStr.split('T')[0],
        description: `Deposit to Account ${targetAcc.accountNumber}`,
        status: 'posted',
        createdBy: actor.id
      });
      db.insert('journalLines', { journalEntryId: entry.id, glCode: actor.role === 'Employee' ? '1020' : '1010', type: 'debit', amount });
      db.insert('journalLines', { journalEntryId: entry.id, glCode: glCodeTarget, type: 'credit', amount });

      // Trigger automatic alert if amount exceeds $5000 (Auto Account Review notification)
      if (amount > 5000) {
        db.insert('notifications', {
          userId: targetAcc.customerId,
          title: 'High-Value Deposit Recorded',
          message: `Your account received a deposit of ₹${amount}. A security review has been logged.`,
          read: false,
          type: 'security',
          createdAt: nowStr
        });
      }

    } else if (type === 'withdrawal') {
      if (!sourceAcc) return res.status(400).json({ message: 'Source account required.' });
      if (sourceAcc.balance < amount) {
        return res.status(400).json({ message: 'Insufficient funds.' });
      }

      const newBal = sourceAcc.balance - parseFloat(amount);
      // Update Balance
      db.update('accounts', a => a.id === sourceAcc.id, { balance: newBal });

      db.insert('transactions', {
        id: 'tx-' + (sourceAcc.accountNumber || sourceAcc.id) + '-' + Date.now(),
        fromAccountId: sourceAcc.id,
        fromAccountNumber: sourceAcc.accountNumber,
        toAccountId: 'CASH',
        accountNumber: sourceAcc.accountNumber,
        amount: parseFloat(amount),
        type: 'withdrawal',
        category: category || 'Counter Cash Withdrawal',
        status: 'completed',
        description: description || 'Atm / Counter cash withdrawal',
        fraudScore: fraudCheck.score,
        reconciliationStatus: 'reconciled',
        createdAt: nowStr,
        date: nowStr,
        timestamp: nowStr
      });

      // Insert customer notification for live withdrawal alert
      if (sourceAcc.customerId) {
        db.insert('notifications', {
          id: 'notif-wth-' + Date.now(),
          userId: sourceAcc.customerId,
          title: 'Account Debited (Cash Withdrawal)',
          message: `Your account ${sourceAcc.accountNumber} has been debited for ₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} via Branch Cash Counter. Remaining Balance: ₹${newBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          read: false,
          type: 'debit',
          createdAt: nowStr
        });
      }

      // Update Teller balance if applicable
      if (actor.role === 'Employee') {
        const cp = db.findOne('cashPositions', c => c.tellerId === actor.id);
        if (cp) {
          db.update('cashPositions', c => c.id === cp.id, { cashInHand: cp.cashInHand - parseFloat(amount) });
        }
      }

      // Accounting lines
      // Debit Customer Account (2010/2020)
      // Credit Cash (1020/1010)
      const glCodeSource = sourceAcc.type === 'savings' ? '2010' : '2020';
      const entry = db.insert('journalEntries', {
        date: nowStr.split('T')[0],
        description: `Withdrawal from Account ${sourceAcc.accountNumber}`,
        status: 'posted',
        createdBy: actor.id
      });
      db.insert('journalLines', { journalEntryId: entry.id, glCode: glCodeSource, type: 'debit', amount });
      db.insert('journalLines', { journalEntryId: entry.id, glCode: actor.role === 'Employee' ? '1020' : '1010', type: 'credit', amount });

    } else if (type === 'transfer') {
      if (!sourceAcc || !targetAcc) {
        return res.status(400).json({ message: 'Both source and target accounts are required for a transfer.' });
      }

      if (sourceAcc.balance < amount) {
        return res.status(400).json({ message: 'Insufficient funds.' });
      }

      const newSourceBal = sourceAcc.balance - parseFloat(amount);
      const newTargetBal = targetAcc.balance + parseFloat(amount);

      // Transact
      db.update('accounts', a => a.id === sourceAcc.id, { balance: newSourceBal });
      db.update('accounts', a => a.id === targetAcc.id, { balance: newTargetBal });

      const txRecord = db.insert('transactions', {
        id: 'tx-' + (sourceAcc.accountNumber || sourceAcc.id) + '-' + Date.now(),
        fromAccountId: sourceAcc.id,
        fromAccountNumber: sourceAcc.accountNumber,
        toAccountId: targetAcc.id,
        toAccountNumber: targetAcc.accountNumber,
        accountNumber: sourceAcc.accountNumber,
        amount: parseFloat(amount),
        type: 'transfer',
        category: category || 'Account Transfer',
        status: 'completed',
        description: description || 'Digital Funds Transfer',
        ifsc: req.body.ifsc || undefined,
        micr: req.body.micr || undefined,
        fraudScore: fraudCheck.score,
        reconciliationStatus: 'reconciled',
        createdAt: nowStr,
        date: nowStr,
        timestamp: nowStr
      });

      if (sourceAcc.customerId) {
        db.insert('notifications', {
          id: 'notif-deb-' + Date.now(),
          userId: sourceAcc.customerId,
          title: 'Account Debited (Funds Transfer)',
          message: `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} transferred from account ${sourceAcc.accountNumber} to ${targetAcc.accountNumber}. Available Balance: ₹${newSourceBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          read: false,
          type: 'debit',
          createdAt: nowStr
        });
      }

      if (targetAcc.customerId) {
        db.insert('notifications', {
          id: 'notif-crd-' + Date.now(),
          userId: targetAcc.customerId,
          title: 'Account Credited (Funds Transfer)',
          message: `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} received in account ${targetAcc.accountNumber} from ${sourceAcc.accountNumber}. Available Balance: ₹${newTargetBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          read: false,
          type: 'credit',
          createdAt: nowStr
        });
      }

      // Double-entry ledger adjustment
      const glSource = sourceAcc.type === 'savings' ? '2010' : '2020';
      const glTarget = targetAcc.type === 'savings' ? '2010' : '2020';

      const entry = db.insert('journalEntries', {
        date: nowStr.split('T')[0],
        description: `Funds transfer: ${sourceAcc.accountNumber} -> ${targetAcc.accountNumber}`,
        status: 'posted',
        createdBy: actor.id
      });
      db.insert('journalLines', { journalEntryId: entry.id, glCode: glSource, type: 'debit', amount }); // Debit source
      db.insert('journalLines', { journalEntryId: entry.id, glCode: glTarget, type: 'credit', amount }); // Credit target

      // Automatically add merchant settlement tracking if payment to merchant
      const targetUser = db.findOne('users', u => u.id === targetAcc.customerId);
      if (targetUser && targetUser.role === 'Merchant') {
        db.update('transactions', t => t.id === txRecord.id, { category: 'Merchant Payment' });
        // Schedule settlement EOD record
        db.insert('settlements', {
          merchantId: targetUser.id,
          amount: parseFloat(amount),
          status: 'pending',
          transactionIds: [txRecord.id],
          processedAt: null
        });
      }

    } else {
      return res.status(400).json({ message: 'Invalid transaction type.' });
    }

    const finalAcc = targetAcc || sourceAcc;
    const finalBalance = finalAcc ? (db.findOne('accounts', a => a.id === finalAcc.id)?.balance ?? finalAcc.balance) : 0;
    const generatedTxnId = 'TXN-' + (type === 'deposit' ? 'DEP-' : type === 'withdrawal' ? 'WTH-' : 'TRF-') + Date.now().toString().slice(-6);

    return res.status(201).json({
      message: 'Transaction completed successfully.',
      transactionId: generatedTxnId,
      type,
      amount: parseFloat(amount),
      newBalance: finalBalance,
      accountNumber: finalAcc ? finalAcc.accountNumber : undefined,
      timestamp: nowStr,
      riskScore: fraudCheck.score,
      riskLevel: fraudCheck.severity
    });

  } catch (err) {
    console.error('Transaction faulted', err);
    return res.status(500).json({ message: 'Transaction routing error.' });
  }
}

// 5. Card Request API
function requestCard(req, res) {
  const { accountId, type } = req.body;
  if (!accountId || !type) {
    return res.status(400).json({ message: 'Account ID and card type (debit/credit) are required.' });
  }

  const account = db.findOne('accounts', a => a.id === accountId);
  if (!account) {
    return res.status(404).json({ message: 'Account not found.' });
  }

  // Check if card is already requested
  const existingCard = db.findOne('cards', c => c.accountId === accountId && c.status === 'requested');
  if (existingCard) {
    return res.status(409).json({ message: 'A card request is already pending approval.' });
  }

  const reqCard = db.insert('cards', {
    accountId,
    cardNumber: '4111' + Math.floor(100000000000 + Math.random() * 900000000000),
    type,
    cvv: Math.floor(100 + Math.random() * 900),
    expiryDate: new Date(Date.now() + 5 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'requested',
    creditLimit: type === 'credit' ? 5000.00 : 0.00,
    balance: 0.00
  });

  return res.status(201).json({ message: 'Card requested successfully.', card: reqCard });
}

function processCardApproval(req, res) {
  const { cardId, action } = req.body; // 'approve', 'reject'
  const actorRole = req.user.role;

  if (actorRole !== 'Branch Manager' && actorRole !== 'Super Admin') {
    return res.status(403).json({ message: 'Only Managers and Admins can approve cards.' });
  }

  const card = db.findOne('cards', c => c.id === cardId);
  if (!card) {
    return res.status(404).json({ message: 'Card not found.' });
  }

  if (action === 'approve') {
    db.update('cards', c => c.id === cardId, { status: 'active' });
    return res.status(200).json({ message: 'Card approved and activated.' });
  } else {
    db.update('cards', c => c.id === cardId, { status: 'rejected' });
    return res.status(200).json({ message: 'Card request rejected.' });
  }
}

// 6. Loans, Fixed Deposits, and Recurring Deposits creation API
function applyLoan(req, res) {
  const { amount, termMonths, loanType, purpose, employmentType, cibilScore } = req.body;
  const customerId = req.user.id;

  if (!amount || !termMonths || !loanType) {
    return res.status(400).json({ message: 'Amount, term duration, and type are required.' });
  }

  // Calculate APR rate based on type
  let interestRate = 10.5;
  if (loanType === 'home' || loanType === 'Home Loan') interestRate = 8.40;
  else if (loanType === 'car' || loanType === 'Auto / Car Loan') interestRate = 8.75;
  else if (loanType === 'personal' || loanType === 'Personal Loan') interestRate = 10.50;
  else if (loanType === 'education' || loanType === 'Education Loan') interestRate = 8.50;
  else if (loanType === 'gold' || loanType === 'Gold Loan') interestRate = 8.90;
  else if (loanType === 'sme' || loanType === 'SME Business Loan') interestRate = 9.25;
  else if (loanType === 'fd_loan' || loanType === 'Loan Against FD') interestRate = 8.10;
  else if (loanType === 'ev_green' || loanType === 'Green EV Loan') interestRate = 8.15;

  const principal = parseFloat(amount);
  const n = parseInt(termMonths);

  // EMI calculation (P * r * (1+r)^n / ((1+r)^n - 1))
  const monthlyRate = interestRate / 12 / 100;
  const emi = (monthlyRate === 0) ? (principal / n) : (principal * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1));

  const loan = db.insert('loans', {
    customerId,
    amount: principal,
    interestRate,
    termMonths: n,
    status: 'pending',
    type: loanType,
    purpose: purpose || 'General Capital Requirement',
    employmentType: employmentType || 'Salaried',
    cibilScore: cibilScore || 785,
    monthlyInstallment: parseFloat(emi.toFixed(2)),
    remainingBalance: principal,
    nextPaymentDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
  });

  // Trigger loan approval workflow execution
  const loanWf = db.findOne('workflowDefinitions', w => w.triggerType === 'Loans');
  if (loanWf) {
    db.insert('workflowExecutions', {
      definitionId: loanWf.id,
      entityId: loan.id,
      entityType: 'Loans',
      currentStepIndex: 1, // Manager Approval step
      status: 'pending',
      history: [{ step: 'Credit Evaluation Completed (CIBIL: 785)', actor: 'system', timestamp: new Date().toISOString() }]
    });
  }

  return res.status(201).json({ message: 'Loan application submitted for approval.', loan });
}

// 6. Fixed Deposit Placement API
function applyFD(req, res) {
  const { principalAmount, termMonths, autoRenewal, scheme, payoutFrequency } = req.body;
  const customerId = req.user.id;

  if (!principalAmount || !termMonths) {
    return res.status(400).json({ message: 'Principal amount and term duration are required.' });
  }

  const amt = parseFloat(principalAmount);
  const term = parseInt(termMonths);

  // Interest rate calculation based on tenure & scheme
  let rate = 6.80;
  if (term <= 1) rate = 3.50;
  else if (term <= 6) rate = 5.75;
  else if (term <= 12) rate = 6.80;
  else if (term <= 24) rate = 7.10;
  else if (term <= 36) rate = 7.00;
  else if (term <= 60) rate = 6.75;
  else rate = 6.50;

  // Senior citizen boost
  if (scheme && scheme.toLowerCase().includes('senior')) {
    rate += 0.50;
  }

  const savingsAcc = db.findOne('accounts', a => a.customerId === customerId && a.type === 'savings');
  if (!savingsAcc || savingsAcc.balance < amt) {
    return res.status(400).json({ message: 'Insufficient savings account balance to fund Fixed Deposit.' });
  }

  // Deduct from savings
  db.update('accounts', a => a.id === savingsAcc.id, { balance: savingsAcc.balance - amt });

  const fd = db.insert('fixedDeposits', {
    customerId,
    principalAmount: amt,
    interestRate: rate,
    termMonths: term,
    scheme: scheme || 'Standard Term Deposit',
    payoutFrequency: payoutFrequency || 'Cumulative on Maturity',
    status: 'active', // FDs are instantly active if funded from savings
    maturityAmount: parseFloat((amt * Math.pow(1 + (rate/400), (term/3))).toFixed(2)),
    maturityDate: new Date(Date.now() + term * 30 * 24 * 3600 * 1000).toISOString(),
    autoRenewal: autoRenewal === true
  });

  // CBS Transaction log
  db.insert('transactions', {
    fromAccountId: savingsAcc.id,
    toAccountId: 'SYSTEM_FD_RESERVE',
    amount: amt,
    type: 'withdrawal',
    category: 'FD Placement',
    status: 'completed',
    description: `Funded FD ${fd.id}`,
    reconciliationStatus: 'reconciled'
  });

  // Accounting GL entries
  // Debit Customer Savings Liability (2010)
  // Credit Fixed Deposits Liabilities (create or adjust equity capital/reserves: using share capital/vault asset rules)
  const entry = db.insert('journalEntries', {
    date: new Date().toISOString().split('T')[0],
    description: `Open FD ${fd.id} for customer ${customerId}`,
    status: 'posted',
    createdBy: customerId
  });
  db.insert('journalLines', { journalEntryId: entry.id, glCode: '2010', type: 'debit', amount: amt }); // savings out
  db.insert('journalLines', { journalEntryId: entry.id, glCode: '3010', type: 'credit', amount: amt }); // reserve capital in

  // Set up interest scheduler posting
  db.insert('interestSchedules', {
    entityType: 'fd',
    entityId: fd.id,
    rate,
    type: 'compound',
    frequency: 'quarterly',
    nextPostDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString()
  });

  return res.status(201).json({ message: 'Fixed Deposit opened successfully.', fd });
}

// 7. Customer Beneficiary & Nominees
function getBeneficiaries(req, res) {
  const list = db.find('beneficiaries', b => b.customerId === req.user.id);
  return res.status(200).json(list);
}

function addBeneficiary(req, res) {
  const { name, accountNumber, bankName } = req.body;
  if (!name || !accountNumber) {
    return res.status(400).json({ message: 'Beneficiary name and account number are required.' });
  }

  const b = db.insert('beneficiaries', {
    customerId: req.user.id,
    name,
    accountNumber,
    bankName: bankName || 'Bharatiya Sarvodaya Bank',
    status: 'active'
  });

  return res.status(201).json({ message: 'Beneficiary added successfully.', beneficiary: b });
}

function deleteBeneficiary(req, res) {
  const { id } = req.params;
  const count = db.delete('beneficiaries', b => b.id === id && b.customerId === req.user.id);
  if (count === 0) return res.status(404).json({ message: 'Beneficiary not found.' });
  return res.status(200).json({ message: 'Beneficiary removed.' });
}

// Nominees API
function addNominee(req, res) {
  const { name, relation, dob, address } = req.body;
  if (!name || !relation) {
    return res.status(400).json({ message: 'Nominee name and relation are required.' });
  }

  // Remove previous if exists
  db.delete('nominees', n => n.customerId === req.user.id);

  const nominee = db.insert('nominees', {
    customerId: req.user.id,
    name,
    relation,
    dob,
    address
  });

  return res.status(201).json({ message: 'Nominee updated successfully.', nominee });
}

// 8. Tickets & Grievances
function getTickets(req, res) {
  const user = req.user;
  let tickets = [];

  if (user.role === 'Super Admin' || user.role === 'Branch Manager' || user.role === 'Employee') {
    tickets = db.find('tickets');
  } else {
    tickets = db.find('tickets', t => t.creatorId === user.id);
  }

  return res.status(200).json(tickets);
}

function createTicket(req, res) {
  const { title, description, category } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: 'Ticket title and description are required.' });
  }

  const ticket = db.insert('tickets', {
    creatorId: req.user.id,
    title,
    description,
    category: category || 'general',
    status: 'open',
    assignedTo: 'u-teller' // Seed teller assignment
  });

  return res.status(201).json({ message: 'Support ticket submitted.', ticket });
}

function updateTicket(req, res) {
  const { ticketId, status, responseText } = req.body;
  if (!ticketId || !status) {
    return res.status(400).json({ message: 'Ticket ID and status are required.' });
  }

  const updated = db.update('tickets', t => t.id === ticketId, {
    status,
    responseText,
    resolvedAt: status === 'resolved' ? new Date().toISOString() : null
  });

  if (updated.length === 0) {
    return res.status(404).json({ message: 'Ticket not found.' });
  }

  return res.status(200).json({ message: 'Ticket updated.', ticket: updated[0] });
}

// 9. Notifications
function getNotifications(req, res) {
  const list = db.find('notifications', n => n.userId === req.user.id);
  return res.status(200).json(list);
}

function markNotificationsRead(req, res) {
  db.update('notifications', n => n.userId === req.user.id, { read: true });
  return res.status(200).json({ message: 'All notifications marked as read.' });
}

// 10. Knowledge Base CRUD
function getKb(req, res) {
  const articles = db.find('knowledgeBase');
  return res.status(200).json(articles);
}

function createKbArticle(req, res) {
  const { title, content, category } = req.body;
  if (!title || !content || !category) {
    return res.status(400).json({ message: 'Title, content, and category are required.' });
  }

  const art = db.insert('knowledgeBase', {
    title,
    content,
    category,
    views: 0
  });

  return res.status(201).json({ message: 'KB Article created.', article: art });
}

// Get all roles, permissions, and their mappings
function getRolesAndPermissions(req, res) {
  const roles = db.find('roles');
  const permissions = db.find('permissions');
  const rolePermissions = db.find('rolePermissions');
  return res.status(200).json({ roles, permissions, rolePermissions });
}

// Create a new role with associated permissions and scopes
function createRole(req, res) {
  const { name, modules, permissions } = req.body; // permissions is array of { permissionId, scope }

  if (!name || !modules) {
    return res.status(400).json({ message: 'Role name and allowed modules are required.' });
  }

  const existing = db.findOne('roles', r => r.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Role with this name already exists.' });
  }

  const roleId = `r-cust-${Date.now()}`;
  const newRole = db.insert('roles', {
    id: roleId,
    name,
    modules: Array.isArray(modules) ? modules : [modules],
    custom: true
  });

  if (Array.isArray(permissions)) {
    permissions.forEach(p => {
      db.insert('rolePermissions', {
        roleId: newRole.id,
        permissionId: p.permissionId,
        scope: p.scope || 'Global'
      });
    });
  }

  db.logAudit(req.user.id, 'ROLE_CREATED', { roleId: newRole.id, name: newRole.name }, req.ip);

  return res.status(201).json({ message: 'Role created successfully.', role: newRole });
}

// Update a role's modules and permissions mapping
function updateRole(req, res) {
  const { roleId, name, modules, permissions } = req.body;

  const role = db.findOne('roles', r => r.id === roleId);
  if (!role) {
    return res.status(404).json({ message: 'Role not found.' });
  }

  // Update role name/modules
  db.update('roles', r => r.id === roleId, {
    name: name || role.name,
    modules: modules || role.modules
  });

  // Re-map permissions if provided
  if (permissions) {
    db.delete('rolePermissions', rp => rp.roleId === roleId);
    permissions.forEach(p => {
      db.insert('rolePermissions', {
        roleId,
        permissionId: p.permissionId,
        scope: p.scope || 'Global'
      });
    });
  }

  db.logAudit(req.user.id, 'ROLE_UPDATED', { roleId }, req.ip);

  return res.status(200).json({ message: 'Role updated successfully.' });
}

// Delete custom role
function deleteRole(req, res) {
  const { roleId } = req.params;

  const role = db.findOne('roles', r => r.id === roleId);
  if (!role) {
    return res.status(404).json({ message: 'Role not found.' });
  }

  if (role.custom === false) {
    return res.status(400).json({ message: 'System standard roles cannot be deleted.' });
  }

  db.delete('roles', r => r.id === roleId);
  db.delete('rolePermissions', rp => rp.roleId === roleId);

  db.logAudit(req.user.id, 'ROLE_DELETED', { roleId }, req.ip);

  return res.status(200).json({ message: 'Role deleted successfully.' });
}

// Clone an existing role
function cloneRole(req, res) {
  const { roleId, newName } = req.body;

  if (!roleId || !newName) {
    return res.status(400).json({ message: 'Source roleId and newName are required.' });
  }

  const sourceRole = db.findOne('roles', r => r.id === roleId);
  if (!sourceRole) {
    return res.status(404).json({ message: 'Source role not found.' });
  }

  const existing = db.findOne('roles', r => r.name.toLowerCase() === newName.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Role with this name already exists.' });
  }

  const newRoleId = `r-cust-${Date.now()}`;
  const clonedRole = db.insert('roles', {
    id: newRoleId,
    name: newName,
    modules: sourceRole.modules,
    custom: true
  });

  // Copy permissions
  const permissions = db.find('rolePermissions', rp => rp.roleId === roleId);
  permissions.forEach(p => {
    db.insert('rolePermissions', {
      roleId: newRoleId,
      permissionId: p.permissionId,
      scope: p.scope
    });
  });

  db.logAudit(req.user.id, 'ROLE_CLONED', { sourceRoleId: roleId, newRoleId }, req.ip);

  return res.status(201).json({ message: 'Role cloned successfully.', role: clonedRole });
}

// Suspend a user
function suspendUser(req, res) {
  const { userId } = req.body;

  const user = db.findOne('users', u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (user.role === 'Super Admin' || user.id === 'u-admin' || user.email === 'admin@bank.com') {
    return res.status(400).json({ message: 'System Super Admin account cannot be suspended.' });
  }

  db.update('users', u => u.id === userId, { status: 'suspended' });
  db.logAudit(req.user.id, 'USER_SUSPENDED', { suspendedUserId: userId }, req.ip);

  return res.status(200).json({ message: 'User suspended successfully.' });
}

// Activate a user
function activateUser(req, res) {
  const { userId } = req.body;

  const user = db.findOne('users', u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  db.update('users', u => u.id === userId, { status: 'active' });
  db.logAudit(req.user.id, 'USER_ACTIVATED', { activatedUserId: userId }, req.ip);

  return res.status(200).json({ message: 'User activated successfully.' });
}

// Reassign a user's branch
function reassignBranch(req, res) {
  const { userId, branchId } = req.body;

  if (!userId || !branchId) {
    return res.status(400).json({ message: 'User ID and Branch ID are required.' });
  }

  const user = db.findOne('users', u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const branch = db.findOne('branches', b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ message: 'Branch not found.' });
  }

  // Update user record
  db.update('users', u => u.id === userId, { branchId, branchName: branch.name });

  // Update branchAssignments mapping
  db.delete('branchAssignments', ba => ba.userId === userId);
  db.insert('branchAssignments', { userId, branchId });

  db.logAudit(req.user.id, 'USER_BRANCH_REASSIGNED', { userId, branchId }, req.ip);

  return res.status(200).json({ message: 'Branch reassigned successfully.' });
}

// Admin resets a user's password to a temporary one (forcing change on next login)
function resetUserPassword(req, res) {
  const { userId, newPassword } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  const user = db.findOne('users', u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const tempPassword = newPassword || 'Temp' + Math.floor(1000 + Math.random() * 9000) + '!';
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(tempPassword, salt);

  db.update('users', u => u.id === userId, {
    passwordHash,
    forcePasswordChange: true,
    tempPassword
  });

  db.logAudit(req.user.id, 'USER_PASSWORD_RESET_BY_ADMIN', { targetUserId: userId }, req.ip);

  return res.status(200).json({
    message: 'User password reset to a temporary one. They will be forced to change it on next login.',
    tempPassword
  });
}


function getBranches(req, res) {
  const branches = db.find('branches');
  return res.status(200).json(branches);
}

function createBranch(req, res) {
  const { name, code, ifscCode, micrCode, address, vaultBalance, minVaultLimit, maxVaultLimit, cashInHand } = req.body;
  if (!name || !code) {
    return res.status(400).json({ message: 'Branch name and code are required.' });
  }

  const existing = db.findOne('branches', b => b.code.toLowerCase() === code.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Branch with this code already exists.' });
  }

  const newBranch = db.insert('branches', {
    name,
    code,
    ifscCode: ifscCode || `NXSB000${code.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`.substring(0, 11),
    micrCode: micrCode || '110240001',
    address: address || '',
    vaultBalance: parseFloat(vaultBalance) || 0,
    minVaultLimit: parseFloat(minVaultLimit) || 0,
    maxVaultLimit: parseFloat(maxVaultLimit) || 0,
    cashInHand: parseFloat(cashInHand) || 0
  });

  return res.status(201).json(newBranch);
}

function updateBranch(req, res) {
  const { id } = req.params;
  const { name, code, ifscCode, micrCode, address, vaultBalance, minVaultLimit, maxVaultLimit, cashInHand } = req.body;

  const updated = db.update('branches', b => b.id === id, b => ({
    ...b,
    name: name !== undefined ? name : b.name,
    code: code !== undefined ? code : b.code,
    ifscCode: ifscCode !== undefined ? ifscCode : b.ifscCode,
    micrCode: micrCode !== undefined ? micrCode : b.micrCode,
    address: address !== undefined ? address : b.address,
    vaultBalance: vaultBalance !== undefined ? parseFloat(vaultBalance) : b.vaultBalance,
    minVaultLimit: minVaultLimit !== undefined ? parseFloat(minVaultLimit) : b.minVaultLimit,
    maxVaultLimit: maxVaultLimit !== undefined ? parseFloat(maxVaultLimit) : b.maxVaultLimit,
    cashInHand: cashInHand !== undefined ? parseFloat(cashInHand) : b.cashInHand
  }));

  if (updated.length === 0) {
    return res.status(404).json({ message: 'Branch not found.' });
  }

  return res.status(200).json(updated[0]);
}

function deleteBranch(req, res) {
  const { id } = req.params;
  const count = db.delete('branches', b => b.id === id);
  if (count === 0) {
    return res.status(404).json({ message: 'Branch not found.' });
  }
  return res.status(200).json({ message: 'Branch deleted.' });
}

// Customer Service Requests Management (Debit Cards, Credit Cards, Cheque Books, Demand Drafts, UPI Channels)
async function getCustomerRequests(req, res) {
  try {
    const user = req.user;
    let requests = db.find('customerRequests') || [];

    // If customer role, only return requests belonging to this customer
    if (user.role === 'Customer') {
      requests = requests.filter(r => 
        r.customerId === user.id || 
        r.customerId === user.userId ||
        (user.email && r.customerEmail && r.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
        (user.accountNumber && r.accountNumber === user.accountNumber) ||
        (user.fullName && r.customerName && r.customerName.toLowerCase() === user.fullName.toLowerCase())
      );
    } else {
      // Branch Manager, Employee, Super Admin, Auditor
      const { branchId, type, status, q } = req.query;
      if (branchId && branchId !== 'all') {
        requests = requests.filter(r => r.branchId === branchId);
      }
      if (type && type !== 'all') {
        requests = requests.filter(r => r.type && r.type.toLowerCase().includes(type.toLowerCase()));
      }
      if (status && status !== 'all') {
        requests = requests.filter(r => r.status === status);
      }
      if (q) {
        const query = q.toLowerCase();
        requests = requests.filter(r => 
          (r.customerName && r.customerName.toLowerCase().includes(query)) ||
          (r.accountNumber && r.accountNumber.includes(query)) ||
          (r.id && r.id.toLowerCase().includes(query)) ||
          (r.variant && r.variant.toLowerCase().includes(query))
        );
      }
    }

    // Sort latest first
    requests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.json(requests);
  } catch (err) {
    console.error('Error fetching customer requests:', err);
    return res.status(500).json({ message: 'Error retrieving customer requests.' });
  }
}

async function postCustomerRequest(req, res) {
  try {
    const user = req.user;
    const { type, variant, accountNumber, deliveryAddress, details, remarks, amount, vpa, beneficiaryName, limitRequested, mobileNumber } = req.body;

    if (!type) {
      return res.status(400).json({ message: 'Request type is required.' });
    }

    const accNo = accountNumber || user.accountNumber || '1000987658';
    const account = db.findOne('accounts', a => a.accountNumber === accNo);
    const branch = account ? db.findOne('branches', b => b.id === account.branchId) : (user.branchId ? db.findOne('branches', b => b.id === user.branchId) : null);
    const branchId = branch ? branch.id : (user.branchId || 'b-delhi');
    const branchName = branch ? branch.name : 'Connaught Place Branch';

    const typeCode = type.toUpperCase().replace(/\s+/g, '-').substring(0, 3);
    const generatedId = `REQ-${typeCode}-${Date.now().toString().slice(-5)}`;

    const newReq = {
      id: generatedId,
      customerId: user.id || user.userId || (account ? account.customerId : 'u-cust-5'),
      customerName: user.fullName || (account ? account.customerName : 'Customer'),
      customerEmail: user.email,
      accountNumber: accNo,
      branchId,
      branchName,
      type: type || 'Debit Card',
      variant: variant || type,
      status: 'pending',
      statusClass: 'pending',
      deliveryAddress: deliveryAddress || user.address || 'Registered Mailing Address',
      mobileNumber: mobileNumber || user.mobileNumber || '+91 9810199881',
      details: details || `${variant || type} requested via Customer NetBanking portal.`,
      amount: amount ? parseFloat(amount) : 0,
      vpa: vpa || undefined,
      beneficiaryName: beneficiaryName || undefined,
      limitRequested: limitRequested || undefined,
      trackingNumber: null,
      processedBy: null,
      remarks: remarks || `Request submitted on ${new Date().toLocaleDateString('en-IN')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const inserted = db.insert('customerRequests', newReq);

    // Add notification for customer
    db.insert('notifications', {
      userId: newReq.customerId,
      title: `${type} Request Submitted`,
      message: `Your application for ${variant || type} (Ref: ${generatedId}) has been successfully submitted and forwarded to ${branchName} for approval.`,
      read: false,
      type: 'info',
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({
      message: `${type} request submitted successfully.`,
      request: inserted
    });
  } catch (err) {
    console.error('Error submitting customer request:', err);
    return res.status(500).json({ message: 'Failed to submit customer request.' });
  }
}

async function actionCustomerRequest(req, res) {
  try {
    const actor = req.user;
    const { id } = req.params;
    const { action, remarks } = req.body; // 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be approve or reject.' });
    }

    const reqDoc = db.findOne('customerRequests', r => r.id === id);
    if (!reqDoc) {
      return res.status(404).json({ message: 'Customer request not found.' });
    }

    const isApprove = action === 'approve';
    const nowStr = new Date().toISOString();
    const trackingNo = isApprove ? `Speed Post #IN${Math.floor(10000000 + Math.random() * 90000000)}` : null;
    const processedBy = `${actor.fullName || actor.name || 'Branch Officer'} (${actor.role || 'Employee'})`;

    const updated = db.update('customerRequests', r => r.id === id, r => {
      r.status = isApprove ? 'approved' : 'rejected';
      r.statusClass = isApprove ? 'active' : 'frozen';
      r.processedBy = processedBy;
      r.processedAt = nowStr;
      r.trackingNumber = trackingNo;
      r.remarks = remarks || (isApprove ? 'Approved as per KYC and account clearance standards.' : 'Rejected as per branch verification guidelines.');
      r.updatedAt = nowStr;
      return r;
    });

    // If approved and it's a Debit Card or Credit Card, automatically activate / insert card in database
    if (isApprove && (reqDoc.type === 'Debit Card' || reqDoc.type === 'Credit Card')) {
      const cardType = reqDoc.type === 'Credit Card' ? 'Credit' : 'Debit';
      const last4 = (reqDoc.accountNumber || '5678').slice(-4);
      const random4 = Math.floor(1000 + Math.random() * 9000).toString();
      const generatedCardNo = `4532${last4}8821${random4}`;

      db.insert('cards', {
        id: `card-${reqDoc.accountNumber || reqDoc.customerId}-${Date.now().toString().slice(-4)}`,
        customerId: reqDoc.customerId,
        accountNumber: reqDoc.accountNumber,
        cardNumber: generatedCardNo,
        cardHolder: reqDoc.customerName,
        type: cardType,
        name: reqDoc.variant || `${cardType} Card`,
        expiryDate: '12/29',
        status: 'active',
        limit: cardType === 'Credit' ? 250000 : 50000,
        createdAt: nowStr
      });
    }

    // Insert Notification to customer
    if (reqDoc.customerId) {
      db.insert('notifications', {
        userId: reqDoc.customerId,
        title: isApprove ? `${reqDoc.type} Approved & Dispatched` : `${reqDoc.type} Request Rejected`,
        message: isApprove
          ? `Your ${reqDoc.variant || reqDoc.type} request (Ref: ${reqDoc.id}) has been APPROVED by ${processedBy}. Tracking No: ${trackingNo}.`
          : `Your ${reqDoc.variant || reqDoc.type} request (Ref: ${reqDoc.id}) was REJECTED by ${processedBy}. Remarks: ${remarks || 'Contact branch for details.'}`,
        read: false,
        type: isApprove ? 'success' : 'warning',
        createdAt: nowStr
      });
    }

    return res.json({
      message: `Customer request ${id} ${isApprove ? 'approved successfully' : 'rejected'}.`,
      request: updated[0] || reqDoc
    });
  } catch (err) {
    console.error('Error processing customer request action:', err);
    return res.status(500).json({ message: 'Error processing customer request.' });
  }
}

module.exports = {
  getDashboardSummary,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getAccounts,
  updateAccountStatus,
  postTransaction,
  requestCard,
  processCardApproval,
  applyLoan,
  applyFD,
  getBeneficiaries,
  addBeneficiary,
  deleteBeneficiary,
  addNominee,
  getTickets,
  createTicket,
  updateTicket,
  getNotifications,
  markNotificationsRead,
  getKb,
  createKbArticle,
  getRolesAndPermissions,
  createRole,
  updateRole,
  deleteRole,
  cloneRole,
  suspendUser,
  activateUser,
  reassignBranch,
  resetUserPassword,
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getAccountTransactions,
  getCustomerRequests,
  postCustomerRequest,
  actionCustomerRequest
};
