const db = require('../db/database');

// Retrieve all fraud alerts
function getFraudAlerts(req, res) {
  const alerts = db.find('fraudAlerts');
  return res.status(200).json(alerts);
}

// Evaluate Transaction and generate Fraud Score
function evaluateTransactionRisk(accountId, amount, ipAddress, deviceFingerprint) {
  let score = 5; // Base score
  const reasons = [];

  const systemAccounts = ['CASH', 'SYSTEM', 'DEPOSIT_SOURCE', 'SYSTEM_LOANS', 'SYSTEM_FD_RESERVE'];
  const isSystem = systemAccounts.includes(accountId);

  let account = null;
  if (!isSystem) {
    account = db.findOne('accounts', a => a.id === accountId);
    if (!account) return { score: 100, severity: 'critical', reasons: ['Account not found'] };
  }

  // 1. Transaction Size Check (e.g. > $10,000)
  if (amount > 10000 && amount <= 50000) {
    score += 25;
    reasons.push('High value transaction');
  } else if (amount > 50000) {
    score += 75;
    reasons.push('Extremely large amount');
  }

  // 2. Velocity Check (transactions in last hour)
  const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
  const recentTx = !isSystem 
    ? db.find('transactions', t => t.fromAccountId === accountId && t.createdAt > oneHourAgo)
    : [];
  
  if (recentTx.length >= 3 && recentTx.length < 6) {
    score += 20;
    reasons.push('High transaction velocity');
  } else if (recentTx.length >= 6) {
    score += 45;
    reasons.push('Velocity attack pattern detected');
  }

  // 3. User Risk Level Checks
  if (account) {
    const user = db.findOne('users', u => u.id === account.customerId);
    if (user) {
      // Check if user has other failed logins in history
      const failedLogins = user.failedLogins || 0;
      if (failedLogins > 2) {
        score += 15;
        reasons.push('Linked user has failed login attempts');
      }
    }
  }

  // Cap score
  score = Math.min(score, 100);

  // Determine severity level
  let severity = 'low';
  if (score >= 80) severity = 'critical';
  else if (score >= 50) severity = 'high';
  else if (score >= 25) severity = 'medium';

  // If critical/high risk, auto-generate Fraud Alert
  if (score >= 50 && account) {
    db.insert('fraudAlerts', {
      id: `frd-${Date.now()}`,
      userId: account.customerId,
      type: 'Suspicious Transaction Activity',
      severity,
      description: `Transaction of $${amount} from Account ${account.accountNumber} flagged. Reasons: ${reasons.join(', ')}`,
      status: 'pending',
      timestamp: new Date().toISOString()
    });
  }

  return {
    score,
    severity,
    reasons
  };
}

// Resolve fraud alert (Admin/Manager only)
function resolveFraudAlert(req, res) {
  const { alertId, action } = req.body; // action: 'dismiss' or 'freeze_account'
  const actorRole = req.user.role;

  if (actorRole !== 'Branch Manager' && actorRole !== 'Super Admin') {
    return res.status(403).json({ message: 'Only Managers and Admins can process fraud alerts.' });
  }

  const alert = db.findOne('fraudAlerts', a => a.id === alertId);
  if (!alert) {
    return res.status(404).json({ message: 'Fraud alert not found.' });
  }

  if (action === 'freeze_account') {
    // Freeze all accounts of the alert user
    const accounts = db.find('accounts', a => a.customerId === alert.userId);
    accounts.forEach(acc => {
      db.update('accounts', a => a.id === acc.id, { status: 'frozen' });
    });
    
    db.update('fraudAlerts', a => a.id === alertId, { status: 'resolved_frozen' });
    db.logAudit(req.user.id, 'USER_ACCOUNT_FROZEN', `User ${alert.userId} frozen due to fraud alert ${alertId}`);
    return res.status(200).json({ message: 'Fraud alert resolved. Linked accounts have been frozen.' });
  } else {
    db.update('fraudAlerts', a => a.id === alertId, { status: 'dismissed' });
    return res.status(200).json({ message: 'Fraud alert dismissed.' });
  }
}

module.exports = {
  getFraudAlerts,
  evaluateTransactionRisk,
  resolveFraudAlert
};
