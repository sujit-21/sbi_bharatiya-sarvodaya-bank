const db = require('../db/database');

// Generate CSV or JSON Account Statement
exports.generateAccountStatement = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const format = req.query.format || 'json';

    const account = db.find('accounts', a => a.accountNumber === accountNumber || a.id === accountNumber)[0];
    const accId = account ? account.id : accountNumber;
    const accNo = account ? account.accountNumber : accountNumber;
    const transactions = db.find('transactions', t => 
      t.accountNumber === accNo || t.fromAccount === accNo || t.toAccount === accNo ||
      t.toAccountNumber === accNo || t.fromAccountNumber === accNo ||
      t.toAccountId === accId || t.fromAccountId === accId
    ) || [];

    if (format === 'csv') {
      let csv = 'Transaction ID,Date,Type,Amount (INR),Description,Status\n';
      transactions.forEach(t => {
        csv += `"${t.id}","${t.postedAt || t.createdAt || ''}","${t.type}","${t.amount}","${t.description || ''}","${t.status || 'COMPLETED'}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="statement_${accountNumber}.csv"`);
      return res.status(200).send(csv);
    }

    res.json({
      success: true,
      account: account || { accountNumber, balance: 0 },
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate account statement', error: error.message });
  }
};

// Export General Ledger Trial Balance Sheet (CSV or JSON)
exports.generateGlLedgerReport = async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const accounts = db.find('accounts', () => true) || [];
    const cashVaults = db.find('cashVaults', () => true) || [];
    const auditLogs = db.find('auditLogs', () => true) || [];

    if (format === 'csv') {
      let csv = 'Account Code / Vault,Name,Category,Balance (INR),Status\n';
      cashVaults.forEach(v => {
        csv += `"VAULT-${v.branchId}","Cash Vault ${v.branchId}","Asset","${v.vaultBalance}","Reconciled"\n`;
      });
      accounts.forEach(a => {
        csv += `"${a.accountNumber}","${a.accountType} Liability","Liability","${a.balance}","Active"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="general_ledger_trial_balance.csv"');
      return res.status(200).send(csv);
    }

    res.json({
      success: true,
      vaults: cashVaults,
      accounts: accounts.map(a => ({ code: a.accountNumber, name: `${a.accountType} Account`, category: 'Liability', balance: a.balance })),
      auditLogsCount: auditLogs.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate GL report', error: error.message });
  }
};
