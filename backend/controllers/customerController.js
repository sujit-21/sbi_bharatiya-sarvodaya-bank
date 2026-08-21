const db = require('../db/database');
const bcrypt = require('bcryptjs');

function generate10DigitUserId() {
  const prefix = "NX@";
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let random = "";
  for (let i = 0; i < 7; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + random;
}

function generateAccountNumber() {
  return '1000' + Math.floor(100050 + Math.random() * 899949);
}

// 1. Get all customers registry list with linked accounts and branch data
function getCustomersRegistry(req, res) {
  try {
    const allUsers = db.find('users');
    const customerUsers = allUsers.filter(u => u.role === 'Customer');
    const allAccounts = db.find('accounts');
    const allBranches = db.find('branches');
    const allKyc = db.find('workflowExecutions', we => we.entityType === 'KYC') || [];

    const result = customerUsers.map(u => {
      const { passwordHash, transactionPinHash, ...clean } = u;
      const userAccounts = allAccounts.filter(a => a.customerId === u.id || a.customerId === u.userId);
      const branch = allBranches.find(b => b.id === u.branchId) || allBranches[0];
      const kycRec = allKyc.find(k => k.entityId === u.id);
      
      const totalBalance = userAccounts.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);

      return {
        ...clean,
        userId: u.userId || u.id,
        branchName: branch ? `${branch.name} (${branch.code})` : 'Global HQ',
        accounts: userAccounts,
        totalBalance,
        kycStatus: kycRec ? kycRec.status : 'verified'
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Failed to get customer registry', err);
    return res.status(500).json({ message: 'Error retrieving customer registry.', error: err.message });
  }
}

// 2. Onboard / Register New Customer & Open Primary Bank Account
function registerCustomer(req, res) {
  try {
    const {
      fullName,
      email,
      mobileNumber,
      dob,
      gender,
      address,
      branchId,
      accountType,
      initialDeposit,
      accountNumber,
      customAccountNumber,
      panNumber,
      aadhaarNumber,
      nomineeName,
      sdhwo,
      mopType
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: 'Full Name and Email Address are required.' });
    }

    const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ message: 'A user with this email address already exists.' });
    }

    const tempPassword = 'Cust' + Math.floor(1000 + Math.random() * 9000) + '!';
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(tempPassword, salt);
    const userId = generate10DigitUserId();

    const selectedBranch = (branchId && branchId !== 'undefined') ? branchId : (req.user?.branchId || 'b-main');

    // Insert Customer User Record
    const newCustomer = db.insert('users', {
      id: userId,
      userId: userId,
      email: email.toLowerCase(),
      passwordHash,
      role: 'Customer',
      fullName,
      mobileNumber: mobileNumber || '+1555' + Math.floor(100000 + Math.random() * 899999),
      dob: dob || '1995-01-01',
      gender: gender || 'Other',
      address: address || '100 Financial District, NY',
      panNumber: (panNumber || 'ABCDE1234F').toUpperCase(),
      aadhaarNumber: aadhaarNumber || '3829 4820 1938',
      nomineeName: nomineeName || 'N/A',
      sdhwo: sdhwo || 'S/o John Doe',
      branchId: selectedBranch,
      status: 'active',
      forcePasswordChange: true,
      tempPassword,
      failedLogins: 0,
      lockedUntil: null,
      transactionPinHash: bcrypt.hashSync('123456', salt)
    });

    // Create Primary Bank Account
    const targetAccNumber = accountNumber || customAccountNumber || generateAccountNumber();
    const depositAmount = Math.max(0, parseFloat(initialDeposit) || 0);

    const newAccount = db.insert('accounts', {
      customerId: newCustomer.id,
      accountNumber: targetAccNumber,
      branchId: selectedBranch,
      type: (accountType || 'savings').toLowerCase(),
      mopType: mopType || 'Self',
      balance: depositAmount,
      status: 'active'
    });

    // If initial deposit provided, record transaction & ledger update
    if (depositAmount > 0) {
      db.insert('transactions', {
        fromAccountId: 'SYSTEM_VAULT',
        toAccountId: newAccount.id,
        toAccountNumber: newAccount.accountNumber,
        amount: depositAmount,
        type: 'deposit',
        category: 'Initial Account Opening Deposit',
        description: `Initial Deposit for Customer ${newCustomer.fullName}`,
        status: 'completed',
        postedAt: new Date().toISOString()
      });

      // Update General Ledger Cash Account (1020)
      db.update('generalLedger', g => g.code === '1020', g => {
        g.balance += depositAmount;
        return g;
      });
    }

    db.logAudit(req.user ? req.user.id : 'SYSTEM', 'CUSTOMER_REGISTERED', {
      customerId: newCustomer.id,
      email: newCustomer.email,
      accountNumber: newAccount.accountNumber,
      initialDeposit: depositAmount
    });

    return res.status(201).json({
      message: 'Customer registered & primary account opened successfully.',
      customer: newCustomer,
      account: newAccount,
      userId: newCustomer.userId || newCustomer.id,
      tempPassword
    });

  } catch (err) {
    console.error('Failed to register customer', err);
    return res.status(500).json({ message: 'Customer registration faulted.', error: err.message });
  }
}

// 3. Update Customer Profile
function updateCustomer(req, res) {
  try {
    const { id } = req.params;
    const { fullName, email, mobileNumber, address, status, panNumber, dob, sdhwo, mopType } = req.body;

    const customer = db.findOne('users', u => u.id === id || u.userId === id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    const updated = db.update('users', u => u.id === customer.id, u => ({
      ...u,
      fullName: fullName !== undefined ? fullName : u.fullName,
      email: email !== undefined ? email.toLowerCase() : u.email,
      mobileNumber: mobileNumber !== undefined ? mobileNumber : u.mobileNumber,
      address: address !== undefined ? address : u.address,
      status: status !== undefined ? status : u.status,
      panNumber: panNumber !== undefined ? panNumber.toUpperCase() : u.panNumber,
      dob: dob !== undefined ? dob : u.dob,
      sdhwo: sdhwo !== undefined ? sdhwo : u.sdhwo
    }));

    if (mopType) {
      db.update('accounts', a => a.customerId === customer.id || a.customerId === customer.userId, a => ({ ...a, mopType }));
    }

    return res.status(200).json({ message: 'Customer profile updated successfully.', customer: updated[0] });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating customer profile.', error: err.message });
  }
}

// 4. Toggle Customer Freeze / Active Status
function toggleCustomerFreeze(req, res) {
  try {
    const { customerId, action } = req.body;
    const customer = db.findOne('users', u => u.id === customerId || u.userId === customerId);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    const targetStatus = action === 'freeze' ? 'frozen' : 'active';

    // Update user status
    db.update('users', u => u.id === customer.id, u => ({ ...u, status: targetStatus }));

    // Update linked bank accounts status
    db.update('accounts', a => a.customerId === customer.id || a.customerId === customer.userId, a => ({ ...a, status: targetStatus }));

    db.logAudit(req.user ? req.user.id : 'SYSTEM', `CUSTOMER_${action.toUpperCase()}`, { customerId: customer.id, status: targetStatus });

    return res.status(200).json({ message: `Customer account updated to ${targetStatus}.`, status: targetStatus });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update customer freeze status.', error: err.message });
  }
}

// 5. Open Additional Bank Account for Existing Customer
function createCustomerAccount(req, res) {
  try {
    const { customerId, accountType, initialDeposit } = req.body;
    const customer = db.findOne('users', u => u.id === customerId || u.userId === customerId);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    const accountNumber = generateAccountNumber();
    const depositAmount = Math.max(0, parseFloat(initialDeposit) || 0);

    const newAccount = db.insert('accounts', {
      customerId: customer.id,
      accountNumber,
      branchId: customer.branchId || 'b-main',
      type: (accountType || 'savings').toLowerCase(),
      balance: depositAmount,
      status: 'active'
    });

    if (depositAmount > 0) {
      db.insert('transactions', {
        fromAccountId: 'SYSTEM_VAULT',
        toAccountId: newAccount.id,
        toAccountNumber: newAccount.accountNumber,
        amount: depositAmount,
        type: 'deposit',
        category: 'Account Opening Deposit',
        description: `Deposit for Sub-Account ${newAccount.accountNumber}`,
        status: 'completed',
        postedAt: new Date().toISOString()
      });
    }

    return res.status(201).json({ message: 'Additional account opened successfully.', account: newAccount });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to open additional account.', error: err.message });
  }
}

// 6. Delete Customer
function deleteCustomer(req, res) {
  try {
    const { id } = req.params;
    const customer = db.findOne('users', u => u.id === id || u.userId === id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer record not found.' });
    }

    db.delete('users', u => u.id === customer.id);
    db.delete('accounts', a => a.customerId === customer.id || a.customerId === customer.userId);

    return res.status(200).json({ message: 'Customer record and linked accounts removed successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete customer.', error: err.message });
  }
}

// 7. Get Branch Specific Customers Database
function getBranchCustomers(req, res) {
  try {
    const { branchId } = req.params;
    const targetBranch = branchId || (req.user ? req.user.branchId : null) || 'b-main';

    const allUsers = db.find('users');
    const branchCustomers = allUsers.filter(u => u.role === 'Customer' && (u.branchId === targetBranch || (!u.branchId && targetBranch === 'b-main')));
    const allAccounts = db.find('accounts');
    const allBranches = db.find('branches');
    const currentBranchObj = allBranches.find(b => b.id === targetBranch) || allBranches[0];

    const result = branchCustomers.map(u => {
      const { passwordHash, transactionPinHash, ...clean } = u;
      const userAccounts = allAccounts.filter(a => a.customerId === u.id || a.customerId === u.userId);
      const totalBalance = userAccounts.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);

      return {
        ...clean,
        userId: u.userId || u.id,
        branchName: currentBranchObj ? `${currentBranchObj.name} (${currentBranchObj.code})` : 'Branch HQ',
        accounts: userAccounts,
        totalBalance,
        kycStatus: 'verified'
      };
    });

    return res.status(200).json({
      branch: currentBranchObj,
      customers: result,
      totalCustomers: result.length,
      totalDeposits: result.reduce((sum, c) => sum + c.totalBalance, 0)
    });
  } catch (err) {
    console.error('Failed to get branch customers', err);
    return res.status(500).json({ message: 'Error retrieving branch customer database.', error: err.message });
  }
}

module.exports = {
  getCustomersRegistry,
  registerCustomer,
  updateCustomer,
  toggleCustomerFreeze,
  createCustomerAccount,
  deleteCustomer,
  getBranchCustomers
};
