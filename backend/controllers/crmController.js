const db = require('../db/database');

// 1. Lead & Campaign CRM CRUD operations
function getCrmData(req, res) {
  const leads = db.find('crmLeads');
  const campaigns = db.find('crmCampaigns');
  return res.status(200).json({ leads, campaigns });
}

function createLead(req, res) {
  const { name, email, mobile, source, productInterest } = req.body;
  if (!name || !email || !mobile) {
    return res.status(400).json({ message: 'Lead name, email, and mobile are required.' });
  }

  const newLead = db.insert('crmLeads', {
    name,
    email,
    mobile,
    status: 'new',
    source: source || 'Web Search',
    assignedTo: req.user.id,
    productInterest: productInterest || 'General Inquiry'
  });

  return res.status(201).json({ message: 'CRM Lead created successfully.', lead: newLead });
}

function updateLead(req, res) {
  const { leadId, status, productInterest } = req.body;
  if (!leadId) {
    return res.status(400).json({ message: 'Lead ID is required.' });
  }

  const updated = db.update('crmLeads', l => l.id === leadId, {
    status,
    productInterest
  });

  if (updated.length === 0) {
    return res.status(404).json({ message: 'Lead not found.' });
  }

  return res.status(200).json({ message: 'Lead updated successfully.', lead: updated[0] });
}

function createCampaign(req, res) {
  const { name, type, budget } = req.body;
  if (!name || !type || !budget) {
    return res.status(400).json({ message: 'Campaign name, type, and budget are required.' });
  }

  const newCampaign = db.insert('crmCampaigns', {
    name,
    type,
    budget: parseFloat(budget),
    revenue: 0.00,
    leadsGenerated: 0,
    status: 'active',
    startDate: new Date().toISOString().split('T')[0]
  });

  return res.status(201).json({ message: 'Marketing Campaign registered.', campaign: newCampaign });
}

// 2. AI Platform Simulation
// Computes and returns AI insights for a specific customer
function getCustomerAiAnalytics(req, res) {
  const { customerId } = req.params;
  const user = db.findOne('users', u => u.id === customerId);

  if (!user || user.role !== 'Customer') {
    return res.status(404).json({ message: 'Customer user not found.' });
  }

  const account = db.findOne('accounts', a => a.customerId === customerId);
  const transactions = db.find('transactions', t => t.fromAccountId === (account ? account.id : '') || t.toAccountId === (account ? account.id : ''));
  const tickets = db.find('tickets', t => t.creatorId === customerId);

  // Dynamic Churn Estimation Model (AI Rule-based simulation)
  // Factors: declining balance, tickets count (complaints), failed transactions
  let churnScore = 0.05; // 5% base
  
  if (account) {
    if (account.balance < 500) churnScore += 0.35; // Lower balance, high churn
    else if (account.balance < 5000) churnScore += 0.15;
  }
  
  churnScore += (tickets.length * 0.10); // Complaints increase churn
  
  const failedTx = transactions.filter(t => t.status === 'failed').length;
  churnScore += (failedTx * 0.05);

  churnScore = Math.min(parseFloat(churnScore.toFixed(2)), 0.99);

  // Dynamic Value Scoring (Deposit depth + Transaction count)
  let valueScore = 10;
  if (account) {
    valueScore += Math.floor(Math.min(account.balance / 1000, 50)); // up to 50 points for balance
  }
  valueScore += Math.min(transactions.length * 2, 40); // up to 40 points for transactions activity
  valueScore = Math.min(valueScore, 100);

  // Recommendation Engine Rules
  const recommendations = [];
  if (account) {
    if (account.balance > 10000) {
      recommendations.push('Premium High-Yield Fixed Deposit (FD) at 7.5% APY');
    }
    if (account.balance > 5000) {
      recommendations.push('Pre-Approved Visa Signature Credit Card with 2% cashback');
    } else {
      recommendations.push('Savings Auto-Sweep Booster plan');
    }
  }
  
  const loans = db.find('loans', l => l.customerId === customerId);
  if (loans.length === 0 && valueScore > 50) {
    recommendations.push('Special Low-Interest Personal Loan offer at 9.9% fixed');
  }

  // Update customerScore database collection cache
  const scoreCache = db.findOne('customerScores', cs => cs.customerId === customerId);
  if (scoreCache) {
    db.update('customerScores', cs => cs.id === scoreCache.id, {
      churnProbability: churnScore,
      customerValueScore: valueScore,
      recommendations,
      lastUpdated: new Date().toISOString()
    });
  } else {
    db.insert('customerScores', {
      customerId,
      churnProbability: churnScore,
      creditScore: valueScore > 60 ? 750 : 620,
      customerValueScore: valueScore,
      recommendations,
      lastUpdated: new Date().toISOString()
    });
  }

  // Segment Determination
  let segment = 'Standard Saver';
  if (account) {
    if (account.balance >= 50000) {
      segment = 'High-Net-Worth (HNW) Client';
    } else if (account.balance >= 10000) {
      segment = 'Affluent Silver';
    } else if (account.balance < 1000) {
      segment = 'Risk / Low Engagement';
    }
  }

  return res.status(200).json({
    customerId,
    fullName: user.fullName,
    segment,
    churnProbability: churnScore,
    customerValueScore: valueScore,
    creditScore: valueScore > 60 ? 750 : 620,
    recommendations,
    lastUpdated: new Date().toISOString()
  });
}

module.exports = {
  getCrmData,
  createLead,
  updateLead,
  createCampaign,
  getCustomerAiAnalytics
};
