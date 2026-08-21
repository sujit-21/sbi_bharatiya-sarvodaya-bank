const express = require('express');
const router = express.Router();

const { authenticate, requirePermission } = require('../middleware/auth');
const dashboard = require('../controllers/dashboardController');
const treasury = require('../controllers/treasuryController');
const interest = require('../controllers/interestController');
const accounting = require('../controllers/accountingController');
const crm = require('../controllers/crmController');
const workflow = require('../controllers/workflowController');
const dms = require('../controllers/dmsController');
const fraud = require('../controllers/fraudController');
const system = require('../controllers/systemController');
const developer = require('../controllers/developerController');
const auth = require('../controllers/authController');
const customer = require('../controllers/customerController');

// 1. Dashboard summary
router.get('/dashboard/summary', authenticate, dashboard.getDashboardSummary);

// 2. Users CRUD & Management Actions
router.get('/dashboard/users', authenticate, requirePermission('Read', ['users', 'employees']), dashboard.getUsers);
router.post('/dashboard/users', authenticate, requirePermission('Create', ['users', 'employees']), dashboard.createUser);
router.put('/dashboard/users', authenticate, requirePermission('Update', ['users', 'employees']), dashboard.updateUser);
router.delete('/dashboard/users/:userId', authenticate, requirePermission('Delete', 'users'), dashboard.deleteUser);

// User Status, Password Resets & Branch Reassignments
router.get('/auth/me', authenticate, auth.getCurrentUser);
router.post('/users/provision', authenticate, requirePermission('Create', 'users'), auth.provisionUser);
router.post('/users/suspend', authenticate, requirePermission('Update', 'users'), dashboard.suspendUser);
router.post('/users/activate', authenticate, requirePermission('Update', 'users'), dashboard.activateUser);
router.post('/users/reassign-branch', authenticate, requirePermission('Update', 'users'), dashboard.reassignBranch);
router.post('/users/reset-password', authenticate, requirePermission('Update', 'users'), dashboard.resetUserPassword);

// Customer Registry Endpoints
router.get('/customers/registry', authenticate, customer.getCustomersRegistry);
router.post('/customers/register', authenticate, customer.registerCustomer);
router.put('/customers/:id', authenticate, customer.updateCustomer);
router.post('/customers/freeze', authenticate, customer.toggleCustomerFreeze);
router.post('/customers/add-account', authenticate, customer.createCustomerAccount);
router.delete('/customers/:id', authenticate, customer.deleteCustomer);
router.get('/branches/:branchId/customers', authenticate, customer.getBranchCustomers);
router.get('/branch-customers', authenticate, customer.getBranchCustomers);

// 3. Accounts management
router.get('/dashboard/accounts', authenticate, requirePermission('Read', ['users', 'employees', 'customers']), dashboard.getAccounts);
router.put('/dashboard/accounts/status', authenticate, requirePermission('Update', ['users', 'employees']), dashboard.updateAccountStatus);

// 4. Core Banking (CBS) transactions
router.post('/dashboard/transactions', authenticate, dashboard.postTransaction);

// 5. Card requested/approved
router.post('/dashboard/cards/request', authenticate, dashboard.requestCard);
router.post('/dashboard/cards/approve', authenticate, requirePermission('Approve', ['users', 'employees']), dashboard.processCardApproval);

// 6. Loans & Fixed Deposits placement
router.post('/dashboard/loans/apply', authenticate, requirePermission('Create', ['products', 'customers']), dashboard.applyLoan);
router.post('/dashboard/fds/apply', authenticate, requirePermission('Create', ['products', 'customers']), dashboard.applyFD);

// 7. Customer relationships: Beneficiaries & Nominees
router.get('/dashboard/beneficiaries', authenticate, requirePermission('Read', 'beneficiaries'), dashboard.getBeneficiaries);
router.post('/dashboard/beneficiaries', authenticate, requirePermission('Create', 'beneficiaries'), dashboard.addBeneficiary);
router.delete('/dashboard/beneficiaries/:id', authenticate, requirePermission('Delete', 'beneficiaries'), dashboard.deleteBeneficiary);
router.post('/dashboard/nominee', authenticate, requirePermission('Create', 'settings'), dashboard.addNominee);

// 8. Support ticketing system
router.get('/dashboard/tickets', authenticate, dashboard.getTickets);
router.post('/dashboard/tickets', authenticate, dashboard.createTicket);
router.put('/dashboard/tickets', authenticate, requirePermission('Update', 'tickets'), dashboard.updateTicket);

// 9. Customer notifications
router.get('/dashboard/notifications', authenticate, requirePermission('Read', 'settings'), dashboard.getNotifications);
router.put('/dashboard/notifications/read', authenticate, requirePermission('Update', 'settings'), dashboard.markNotificationsRead);

// 10. Knowledge Base
router.get('/dashboard/kb', dashboard.getKb);
router.post('/dashboard/kb', authenticate, requirePermission('Create', 'developers'), dashboard.createKbArticle);

// 11. Treasury cash vault limits and teller drawer actions
router.get('/treasury/summary', authenticate, requirePermission('Read', ['treasury', 'summary']), treasury.getTreasurySummary);
router.post('/treasury/transfer', authenticate, requirePermission('Create', ['treasury', 'employees']), treasury.transferCash);
router.post('/treasury/transfer/approve', authenticate, requirePermission('Approve', 'treasury'), treasury.approveTransfer);
router.post('/treasury/bod', authenticate, requirePermission('Create', 'treasury'), treasury.processBOD);
router.post('/treasury/eod', authenticate, requirePermission('Create', 'treasury'), treasury.processEOD);

// 12. Centralized Interest calculation engine
router.get('/interest/status', authenticate, requirePermission('Read', 'interest'), interest.getInterestStatus);
router.post('/interest/post', authenticate, requirePermission('Create', 'interest'), interest.runInterestPosting);

// 13. General Ledger balanced journals and dynamic financial statements
router.get('/accounting/ledger', authenticate, requirePermission('Read', 'ledger'), accounting.getGeneralLedger);
router.post('/accounting/journal', authenticate, requirePermission('Create', 'ledger'), accounting.postJournalEntry);
router.get('/accounting/trial-balance', authenticate, requirePermission('Read', 'ledger'), accounting.getTrialBalance);
router.get('/accounting/balance-sheet', authenticate, requirePermission('Read', 'ledger'), accounting.getBalanceSheet);
router.get('/accounting/pl', authenticate, requirePermission('Read', 'ledger'), accounting.getProfitAndLoss);
router.get('/accounting/journal-history', authenticate, requirePermission('Read', 'ledger'), accounting.getJournalHistory);

// 14. CRM Marketing analytics & AI recommendations
router.get('/crm/data', authenticate, requirePermission('Read', ['crm', 'summary']), crm.getCrmData);
router.post('/crm/leads', authenticate, requirePermission('Create', ['crm', 'summary']), crm.createLead);
router.put('/crm/leads', authenticate, requirePermission('Update', ['crm', 'summary']), crm.updateLead);
router.post('/crm/campaigns', authenticate, requirePermission('Create', ['crm', 'summary']), crm.createCampaign);
router.get('/crm/analytics/:customerId', authenticate, requirePermission('Read', ['crm', 'summary', 'settings']), crm.getCustomerAiAnalytics);

// 15. Workflow Engine
router.get('/workflows', authenticate, requirePermission('Read', ['approvals', 'summary']), workflow.getWorkflows);
router.post('/workflows/step', authenticate, requirePermission('Approve', ['approvals', 'summary']), workflow.processWorkflowStep);

// 16. Document Management (DMS)
router.get('/dms', authenticate, dms.getDocuments);
router.post('/dms/upload', authenticate, dms.uploadDocument);
router.post('/dms/approve', authenticate, requirePermission('Approve', ['approvals', 'dms']), dms.processDocumentApproval);

// 17. Advanced Fraud detection metrics
router.get('/fraud/alerts', authenticate, requirePermission('Read', ['ledger', 'summary']), fraud.getFraudAlerts);
router.post('/fraud/resolve', authenticate, requirePermission('Update', ['ledger', 'summary']), fraud.resolveFraudAlert);

// 18. Recovery tools
router.post('/system/backups', authenticate, requirePermission('Create', 'disaster'), system.createBackup);
router.get('/system/backups/list', authenticate, requirePermission('Read', 'disaster'), system.listBackups);
router.post('/system/restore', authenticate, requirePermission('Update', 'disaster'), system.restoreBackup);

// 19. API Developer portal
router.post('/developer/keys', authenticate, requirePermission('Create', ['developers', 'qr']), developer.createDeveloperKey);
router.get('/developer/keys', authenticate, requirePermission('Read', ['developers', 'qr']), developer.getDeveloperKeys);
router.post('/developer/keys/revoke', authenticate, requirePermission('Update', ['developers', 'qr']), developer.revokeDeveloperKey);
router.get('/developer/logs', authenticate, requirePermission('Read', ['developers', 'qr']), developer.getDeveloperLogs);
router.get('/developer/swagger', developer.getSwagger);

// 20. Role-Based Access Control (RBAC) CRUD Endpoints
router.get('/roles', authenticate, requirePermission('Read', 'users'), dashboard.getRolesAndPermissions);
router.post('/roles', authenticate, requirePermission('Create', 'users'), dashboard.createRole);
router.put('/roles', authenticate, requirePermission('Update', 'users'), dashboard.updateRole);
router.delete('/roles/:roleId', authenticate, requirePermission('Delete', 'users'), dashboard.deleteRole);
router.post('/roles/clone', authenticate, requirePermission('Create', 'users'), dashboard.cloneRole);

// 21. Branch Registry CRUD Endpoints
router.get('/branches', authenticate, requirePermission('Read', ['branches', 'users', 'employees']), dashboard.getBranches);
router.post('/branches', authenticate, requirePermission('Create', 'branches'), dashboard.createBranch);
router.put('/branches/:id', authenticate, requirePermission('Update', 'branches'), dashboard.updateBranch);
router.delete('/branches/:id', authenticate, requirePermission('Delete', 'branches'), dashboard.deleteBranch);

module.exports = router;
