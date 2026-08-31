const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

function generate10DigitUserId() {
  const prefix = "BSB@";
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let random = "";
  for (let i = 0; i < 7; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + random;
}
const { MongoClient } = require('mongodb');

const DB_FILE = path.join(__dirname, 'db.json');
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bsb_banking';

// All required database collections
const COLLECTIONS = [
  'users',
  'sessions',
  'loginHistory',
  'branches',
  'cashVaults',
  'cashPositions',
  'accounts',
  'transactions',
  'cards',
  'loans',
  'fixedDeposits',
  'recurringDeposits',
  'beneficiaries',
  'nominees',
  'tickets',
  'grievances',
  'notifications',
  'auditLogs',
  'treasuryTransfers',
  'interestPostings',
  'interestSchedules',
  'generalLedger',
  'journalEntries',
  'journalLines',
  'trialBalances',
  'financialStatements',
  'crmLeads',
  'crmCampaigns',
  'customerScores',
  'knowledgeBase',
  'scheduledJobs',
  'backups',
  'workflowDefinitions',
  'workflowExecutions',
  'documents',
  'documentVersions',
  'apiKeys',
  'apiLogs',
  'reconciliationLogs',
  'settlements',
  'roles',
  'permissions',
  'rolePermissions',
  'userRoles',
  'branchAssignments',
  'departmentAssignments',
  'customerRequests'
];

class Database {
  constructor() {
    this.data = {};
    this.mongoClient = null;
    this.mongoDb = null;
    this.wasSeeded = false;
    this.syncQueue = {};
    this.lastLoadedMtime = 0;
    this.init();
  }

  reloadIfModified() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const stat = fs.statSync(DB_FILE);
        if (stat.mtimeMs > this.lastLoadedMtime) {
          const fileContent = fs.readFileSync(DB_FILE, 'utf8');
          const parsed = JSON.parse(fileContent);
          if (parsed && typeof parsed === 'object') {
            this.data = parsed;
            this.lastLoadedMtime = stat.mtimeMs;
          }
        }
      }
    } catch(e) {}
  }

  init() {
    // If database file exists, load it
    if (fs.existsSync(DB_FILE)) {
      try {
        const stat = fs.statSync(DB_FILE);
        this.lastLoadedMtime = stat.mtimeMs;
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
        // Ensure all collections exist
        COLLECTIONS.forEach(col => {
          if (!this.data[col]) {
            this.data[col] = [];
          }
        });
      } catch (err) {
        console.error('Failed to parse database file. Initializing empty DB.', err);
        this.createEmptyDb();
      }
    } else {
      this.createEmptyDb();
    }

    // Set up file watcher for cross-server instant sync
    try {
      fs.watch(DB_FILE, () => {
        this.reloadIfModified();
      });
    } catch(e) {}

    // If db.json does not have the 10 Indian branches or 100 staff employees, re-seed
    if (!this.data.branches || this.data.branches.length < 10 || !this.data.users || this.data.users.length < 100) {
      console.log('[DATABASE] Re-seeding 10 Indian Branches & 100 Staff Users (10 per branch)...');
      this.createEmptyDb();
    }

    // Guarantee Super Admin status is always active in memory
    if (this.data.users && Array.isArray(this.data.users)) {
      this.data.users.forEach(u => {
        if (u.id === 'u-admin' || u.email === 'admin@bank.com' || u.role === 'Super Admin') {
          u.status = 'active';
          u.failedLogins = 0;
          u.lockedUntil = null;
        }
      });
    }

    // Seed customerRequests if empty
    if (!this.data.customerRequests || this.data.customerRequests.length === 0) {
      this.data.customerRequests = [];
      const seededRequests = [
        {
          id: 'REQ-DC-88121',
          customerId: 'u-cust-5',
          customerName: 'Kabir Malhotra',
          accountNumber: '1000987658',
          branchId: 'b-delhi',
          branchName: 'Connaught Place Branch',
          type: 'Debit Card',
          variant: 'RuPay Platinum Contactless',
          status: 'pending',
          statusClass: 'pending',
          deliveryAddress: 'Flat 402, Barakhamba Road, Connaught Place, New Delhi',
          mobileNumber: '+91 9810199881',
          details: 'Emboss Name: KABIR MALHOTRA • Daily ATM Limit: ₹50,000 • Contactless NFC Enabled',
          trackingNumber: null,
          processedBy: null,
          remarks: 'Customer requested RuPay Platinum card upgrade via NetBanking portal.',
          createdAt: '2026-08-31T09:15:00Z',
          updatedAt: '2026-08-31T09:15:00Z'
        },
        {
          id: 'REQ-CC-90412',
          customerId: 'u-cust-3',
          customerName: 'Rohan Kulkarni',
          accountNumber: '1000987656',
          branchId: 'b-main',
          branchName: 'Mumbai Main HQ Branch',
          type: 'Credit Card',
          variant: 'BSB Titanium Rewards Credit Card',
          status: 'pending',
          statusClass: 'pending',
          deliveryAddress: 'Tower 3, Dadar West, Mumbai 400028',
          mobileNumber: '+91 9820011226',
          details: 'Credit Limit Requested: ₹3,00,000 • Fuel Surcharge Waiver • Airport Lounge Access',
          trackingNumber: null,
          processedBy: null,
          remarks: 'Salary account customer, verified 3-month credit turnover.',
          createdAt: '2026-08-31T10:30:00Z',
          updatedAt: '2026-08-31T10:30:00Z'
        },
        {
          id: 'REQ-CHQ-67210',
          customerId: 'u-cust-5',
          customerName: 'Kabir Malhotra',
          accountNumber: '1000987658',
          branchId: 'b-delhi',
          branchName: 'Connaught Place Branch',
          type: 'Cheque Book',
          variant: 'CTS-2010 High Security Cheque Book (25 Leaves)',
          status: 'pending',
          statusClass: 'pending',
          deliveryAddress: 'Flat 402, Barakhamba Road, Connaught Place, New Delhi',
          mobileNumber: '+91 9810199881',
          details: '25 Leaves Personalized • Multi-city CTS-2010 Standard • Home Delivery',
          trackingNumber: null,
          processedBy: null,
          remarks: 'Standard cheque book request for personal savings account.',
          createdAt: '2026-08-31T11:00:00Z',
          updatedAt: '2026-08-31T11:00:00Z'
        },
        {
          id: 'REQ-DD-45190',
          customerId: 'u-cust-4',
          customerName: 'Ananya Swami',
          accountNumber: '1000987657',
          branchId: 'b-chennai',
          branchName: 'Anna Salai Branch',
          type: 'Demand Draft',
          variant: 'Demand Draft (DD) in favor of University Registrar',
          status: 'pending',
          statusClass: 'pending',
          deliveryAddress: 'Anna Salai Main Branch Counter Pickup',
          mobileNumber: '+91 9845011992',
          details: 'Amount: ₹45,000.00 • Payable at: Chennai • In Favor of: Registrar, Anna University',
          trackingNumber: 'DD-OTP-8821',
          processedBy: null,
          remarks: 'Counter collection requested with OTP verification.',
          createdAt: '2026-08-31T08:45:00Z',
          updatedAt: '2026-08-31T08:45:00Z'
        },
        {
          id: 'REQ-UPI-33019',
          customerId: 'u-cust-5',
          customerName: 'Kabir Malhotra',
          accountNumber: '1000987658',
          branchId: 'b-delhi',
          branchName: 'Connaught Place Branch',
          type: 'UPI Channel',
          variant: 'UPI VPA Channel Activation & Limit Increase',
          status: 'pending',
          statusClass: 'pending',
          deliveryAddress: 'Digital Channel Activation',
          mobileNumber: '+91 9810199881',
          details: 'VPA: kabir.malhotra@bsb • Daily Channel Limit: ₹1,00,000 • P2P & P2M Active',
          trackingNumber: null,
          processedBy: null,
          remarks: 'Digital Banking channel activation for NPCI UPI 2.0 network.',
          createdAt: '2026-08-31T11:30:00Z',
          updatedAt: '2026-08-31T11:30:00Z'
        },
        {
          id: 'REQ-DC-10929',
          customerId: 'u-cust-1',
          customerName: 'Aarav Mehta',
          accountNumber: '1000987654',
          branchId: 'b-main',
          branchName: 'Mumbai Main HQ Branch',
          type: 'Debit Card',
          variant: 'Visa Platinum International Contactless',
          status: 'approved',
          statusClass: 'active',
          deliveryAddress: 'Marine Lines, Mumbai, Maharashtra 400020',
          mobileNumber: '+91 9820011223',
          details: 'Emboss Name: AARAV MEHTA • Daily ATM Limit: ₹1,00,000 • Zero Forex Markup',
          trackingNumber: 'Speed Post #IN98124501',
          processedBy: 'Priya Patel (Branch Manager)',
          remarks: 'Approved after KYC verification.',
          createdAt: '2026-08-28T14:30:00Z',
          updatedAt: '2026-08-28T16:00:00Z'
        },
        {
          id: 'REQ-CHQ-12001',
          customerId: 'u-cust-2',
          customerName: 'Diya Banerjee',
          accountNumber: '1000987655',
          branchId: 'b-kolkata',
          branchName: 'Park Street Branch',
          type: 'Cheque Book',
          variant: 'Personal CTS-2010 Cheque Book (50 Leaves)',
          status: 'approved',
          statusClass: 'active',
          deliveryAddress: 'Salt Lake Sector 5, Kolkata 700091',
          mobileNumber: '+91 9830022334',
          details: '50 Leaves Personalized CTS-2010 Cheque Book',
          trackingNumber: 'Speed Post #IN77192834',
          processedBy: 'Vikram Singh (Cashier/Employee)',
          remarks: 'Dispatched to registered mailing address.',
          createdAt: '2026-08-26T10:00:00Z',
          updatedAt: '2026-08-26T12:30:00Z'
        }
      ];
      this.data.customerRequests.push(...seededRequests);
      this.save('customerRequests');
    }

    // Connect to MongoDB in the background
    this.connectMongo();
  }

  createEmptyDb() {
    this.wasSeeded = true;
    COLLECTIONS.forEach(col => {
      this.data[col] = [];
    });
    this.seed();
    this.save();
  }

  async connectMongo() {
    try {
      console.log(`[MONGODB] Connecting to ${mongoUri}...`);
      this.mongoClient = new MongoClient(mongoUri, { connectTimeoutMS: 5000, serverSelectionTimeoutMS: 5000 });
      await this.mongoClient.connect();
      const dbName = mongoUri.split('/').pop().split('?')[0] || 'bsb_banking';
      this.mongoDb = this.mongoClient.db(dbName);
      console.log(`[MONGODB] Connected successfully to database: ${dbName}`);

      // Always sync local 10 Indian records to MongoDB
      console.log('[MONGODB] Syncing local 10 Indian records dataset to MongoDB...');
      await this.syncAllToMongo();

      // Enforce Super Admin active status in MongoDB
      try {
        await this.mongoDb.collection('users').updateMany(
          { $or: [{ id: 'u-admin' }, { email: 'admin@bank.com' }, { role: 'Super Admin' }] },
          { $set: { status: 'active', failedLogins: 0, lockedUntil: null } }
        );
      } catch(e){}
    } catch (err) {
      console.warn(`[MONGODB] Could not connect to MongoDB: ${err.message}`);
      console.warn(`[MONGODB] Falling back to local JSON database (db.json).`);
      this.mongoDb = null;
    }
  }

  async syncAllToMongo() {
    if (!this.mongoDb) return;
    try {
      for (const colName of COLLECTIONS) {
        this.queueSync(colName);
      }
      await Promise.all(COLLECTIONS.map(colName => this.syncQueue[colName]));
      console.log('[MONGODB] Successfully synchronized all collections to MongoDB.');
    } catch (err) {
      console.error('[MONGODB] Failed to sync collections to MongoDB:', err);
    }
  }

  async syncCollectionToMongo(collectionName) {
    if (!this.mongoDb) return;
    try {
      const col = this.mongoDb.collection(collectionName);
      await col.deleteMany({});
      const docs = this.data[collectionName];
      if (docs && docs.length > 0) {
        const mongoDocs = docs.map(d => ({ ...d, _id: d.id }));
        await col.insertMany(mongoDocs);
      }
    } catch (err) {
      console.error(`[MONGODB] Failed to sync collection ${collectionName}:`, err.message);
    }
  }

  async loadAllFromMongo() {
    if (!this.mongoDb) return;
    try {
      for (const colName of COLLECTIONS) {
        const col = this.mongoDb.collection(colName);
        const docs = await col.find({}).toArray();
        this.data[colName] = docs.map(d => {
          const { _id, ...rest } = d;
          return { id: rest.id || _id, ...rest };
        });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
      console.log('[MONGODB] Loaded all collections from MongoDB into memory.');
    } catch (err) {
      console.error('[MONGODB] Failed to load collections from MongoDB:', err);
    }
  }

  seed() {
    console.log('Seeding initial bank data...');
    const salt = bcrypt.genSaltSync(10);

    // 1. Seed 10 Indian Branches
    const indianBranches = [
      { id: 'b-main', name: 'Mumbai Main HQ Branch', code: 'MUM001', ifscCode: 'BSB0000MUM1', micrCode: '400240001', address: 'Nariman Point, Marine Drive, Mumbai, Maharashtra 400021', vaultBalance: 15000000.00, minVaultLimit: 2000000.00, maxVaultLimit: 50000000.00, cashInHand: 500000.00, createdAt: new Date().toISOString() },
      { id: 'b-delhi', name: 'Connaught Place Branch', code: 'DEL001', ifscCode: 'BSB0000DEL1', micrCode: '110240001', address: 'Connaught Place, Inner Circle, New Delhi, Delhi 110001', vaultBalance: 12000000.00, minVaultLimit: 1500000.00, maxVaultLimit: 40000000.00, cashInHand: 400000.00, createdAt: new Date().toISOString() },
      { id: 'b-blr', name: 'MG Road Branch', code: 'BLR001', ifscCode: 'BSB0000BLR1', micrCode: '560240001', address: 'MG Road, Brigade Junction, Bengaluru, Karnataka 560001', vaultBalance: 10000000.00, minVaultLimit: 1000000.00, maxVaultLimit: 35000000.00, cashInHand: 350000.00, createdAt: new Date().toISOString() },
      { id: 'b-chennai', name: 'Anna Salai Branch', code: 'CHE001', ifscCode: 'BSB0000CHE1', micrCode: '600240001', address: 'Mount Road, Anna Salai, Chennai, Tamil Nadu 600002', vaultBalance: 8500000.00, minVaultLimit: 1000000.00, maxVaultLimit: 30000000.00, cashInHand: 300000.00, createdAt: new Date().toISOString() },
      { id: 'b-kolkata', name: 'Park Street Branch', code: 'KOL001', ifscCode: 'BSB0000KOL1', micrCode: '700240001', address: 'Park Street, Chowringhee, Kolkata, West Bengal 700016', vaultBalance: 7500000.00, minVaultLimit: 800000.00, maxVaultLimit: 25000000.00, cashInHand: 250000.00, createdAt: new Date().toISOString() },
      { id: 'b-hyd', name: 'Banjara Hills Branch', code: 'HYD001', ifscCode: 'BSB0000HYD1', micrCode: '500240001', address: 'Road No. 1, Banjara Hills, Hyderabad, Telangana 500034', vaultBalance: 9000000.00, minVaultLimit: 1000000.00, maxVaultLimit: 30000000.00, cashInHand: 300000.00, createdAt: new Date().toISOString() },
      { id: 'b-ahmedabad', name: 'CG Road Branch', code: 'AMD001', ifscCode: 'BSB0000AMD1', micrCode: '380240001', address: 'CG Road, Navrangpura, Ahmedabad, Gujarat 380009', vaultBalance: 8000000.00, minVaultLimit: 900000.00, maxVaultLimit: 28000000.00, cashInHand: 280000.00, createdAt: new Date().toISOString() },
      { id: 'b-pune', name: 'FC Road Branch', code: 'PUN001', ifscCode: 'BSB0000PUN1', micrCode: '411240001', address: 'FC Road, Shivajinagar, Pune, Maharashtra 411004', vaultBalance: 9500000.00, minVaultLimit: 1000000.00, maxVaultLimit: 32000000.00, cashInHand: 320000.00, createdAt: new Date().toISOString() },
      { id: 'b-jaipur', name: 'MI Road Branch', code: 'JAI001', ifscCode: 'BSB0000JAI1', micrCode: '302240001', address: 'MI Road, Jayanti Market, Jaipur, Rajasthan 302001', vaultBalance: 6500000.00, minVaultLimit: 700000.00, maxVaultLimit: 20000000.00, cashInHand: 200000.00, createdAt: new Date().toISOString() },
      { id: 'b-lucknow', name: 'Hazratganj Branch', code: 'LKO001', ifscCode: 'BSB0000LKO1', micrCode: '226240001', address: 'Hazratganj Main Market, Lucknow, Uttar Pradesh 226001', vaultBalance: 7000000.00, minVaultLimit: 750000.00, maxVaultLimit: 22000000.00, cashInHand: 220000.00, createdAt: new Date().toISOString() }
    ];
    this.data.branches.push(...indianBranches);

    // 2. Seed 10 Indian Staff Users PER BRANCH (10 Branches x 10 Staff = 100 Staff Employees in User Registry)
    const defaultPinHash = bcrypt.hashSync('123456', salt);
    const defaultStaffPassHash = bcrypt.hashSync('Teller123!', salt);

    const staffUsers = [
      // --- BRANCH 1: Mumbai Main HQ Branch (b-main) ---
      { id: 'u-admin', userId: 'NX@SHARMA01', email: 'admin@bank.com', passwordHash: bcrypt.hashSync('Admin123!', salt), role: 'Super Admin', fullName: 'Rajesh Sharma', dob: '1980-01-01', gender: 'Male', mobileNumber: '+91 9820011223', address: 'System HQ, Nariman Point, Mumbai', branchId: 'b-main', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-mum-02', userId: 'NX@MUMEMP02', email: 'mumbai.emp2@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Aarav Shah', dob: '1991-03-12', gender: 'Male', mobileNumber: '+91 9820011224', address: 'Nariman Point, Mumbai', branchId: 'b-main', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-mum-03', userId: 'NX@MUMEMP03', email: 'mumbai.emp3@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Priyanka Kulkarni', dob: '1993-07-25', gender: 'Female', mobileNumber: '+91 9820011225', address: 'Bandra West, Mumbai', branchId: 'b-main', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-mum-04', userId: 'NX@MUMEMP04', email: 'mumbai.emp4@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Aditya Jadhav', dob: '1989-11-04', gender: 'Male', mobileNumber: '+91 9820011226', address: 'Dadra Nagar, Mumbai', branchId: 'b-main', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-mum-05', userId: 'NX@MUMEMP05', email: 'mumbai.emp5@bank.com', passwordHash: defaultStaffPassHash, role: 'Loan Officer', fullName: 'Snehal Shinde', dob: '1987-02-18', gender: 'Female', mobileNumber: '+91 9820011227', address: 'Worli, Mumbai', branchId: 'b-main', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-mum-06', userId: 'NX@MUMEMP06', email: 'mumbai.emp6@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Rohan Sawant', dob: '1994-09-30', gender: 'Male', mobileNumber: '+91 9820011228', address: 'Lower Parel, Mumbai', branchId: 'b-main', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-mum-07', userId: 'NX@MUMEMP07', email: 'mumbai.emp7@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Tanvi More', dob: '1995-04-14', gender: 'Female', mobileNumber: '+91 9820011229', address: 'Fort, Mumbai', branchId: 'b-main', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-mum-08', userId: 'NX@MUMEMP08', email: 'mumbai.emp8@bank.com', passwordHash: defaultStaffPassHash, role: 'Compliance Officer', fullName: 'Nikhil Patil', dob: '1986-08-22', gender: 'Male', mobileNumber: '+91 9820011230', address: 'Colaba, Mumbai', branchId: 'b-main', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-mum-09', userId: 'NX@MUMEMP09', email: 'mumbai.emp9@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Riya Salunkhe', dob: '1992-12-09', gender: 'Female', mobileNumber: '+91 9820011231', address: 'Juhu, Mumbai', branchId: 'b-main', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-mum-10', userId: 'NX@MUMEMP10', email: 'mumbai.emp10@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Harshvardhan Bhosale', dob: '1988-06-17', gender: 'Male', mobileNumber: '+91 9820011232', address: 'Prabhadevi, Mumbai', branchId: 'b-main', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },

      // --- BRANCH 2: Connaught Place Branch (b-delhi) ---
      { id: 'u-manager', userId: 'NX@PATEL002', email: 'manager@bank.com', passwordHash: bcrypt.hashSync('Manager123!', salt), role: 'Branch Manager', fullName: 'Priya Patel', dob: '1985-05-12', gender: 'Female', mobileNumber: '+91 9811022334', address: 'Connaught Place, New Delhi', branchId: 'b-delhi', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-del-02', userId: 'NX@DELEMP02', email: 'delhi.emp2@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Gaurav Kapoor', dob: '1990-01-15', gender: 'Male', mobileNumber: '+91 9811022335', address: 'South Ext 1, New Delhi', branchId: 'b-delhi', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-del-03', userId: 'NX@DELEMP03', email: 'delhi.emp3@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Meenakshi Sharma', dob: '1992-06-20', gender: 'Female', mobileNumber: '+91 9811022336', address: 'Lajpat Nagar, New Delhi', branchId: 'b-delhi', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-del-04', userId: 'NX@DELEMP04', email: 'delhi.emp4@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Abhinav Malhotra', dob: '1988-10-10', gender: 'Male', mobileNumber: '+91 9811022337', address: 'Hauz Khas, New Delhi', branchId: 'b-delhi', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-del-05', userId: 'NX@DELEMP05', email: 'delhi.emp5@bank.com', passwordHash: defaultStaffPassHash, role: 'Loan Officer', fullName: 'Neha Aggarwal', dob: '1994-03-28', gender: 'Female', mobileNumber: '+91 9811022338', address: 'Rohini, New Delhi', branchId: 'b-delhi', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-del-06', userId: 'NX@DELEMP06', email: 'delhi.emp6@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Kunal Khurana', dob: '1991-08-05', gender: 'Male', mobileNumber: '+91 9811022339', address: 'Janakpuri, New Delhi', branchId: 'b-delhi', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-del-07', userId: 'NX@DELEMP07', email: 'delhi.emp7@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Divya Bhasin', dob: '1993-11-19', gender: 'Female', mobileNumber: '+91 9811022340', address: 'Vasant Kunj, New Delhi', branchId: 'b-delhi', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-del-08', userId: 'NX@DELEMP08', email: 'delhi.emp8@bank.com', passwordHash: defaultStaffPassHash, role: 'Compliance Officer', fullName: 'Tarun Sethi', dob: '1987-04-11', gender: 'Male', mobileNumber: '+91 9811022341', address: 'Karol Bagh, New Delhi', branchId: 'b-delhi', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-del-09', userId: 'NX@DELEMP09', email: 'delhi.emp9@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Radhika Tandon', dob: '1995-09-02', gender: 'Female', mobileNumber: '+91 9811022342', address: 'Dwarka Sector 10, New Delhi', branchId: 'b-delhi', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-del-10', userId: 'NX@DELEMP10', email: 'delhi.emp10@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Alok Rastogi', dob: '1989-12-14', gender: 'Male', mobileNumber: '+91 9811022343', address: 'Pitampura, New Delhi', branchId: 'b-delhi', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },

      // --- BRANCH 3: MG Road Branch (b-blr) ---
      { id: 'u-auditor', userId: 'NX@VERMA003', email: 'auditor@bank.com', passwordHash: bcrypt.hashSync('Auditor123!', salt), role: 'Auditor', fullName: 'Amit Verma', dob: '1983-09-18', gender: 'Male', mobileNumber: '+91 9845033445', address: 'MG Road, Bengaluru', branchId: 'b-blr', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-blr-02', userId: 'NX@BLREMP02', email: 'bangalore.emp2@bank.com', passwordHash: defaultStaffPassHash, role: 'Branch Manager', fullName: 'Karthik Rao', dob: '1986-04-23', gender: 'Male', mobileNumber: '+91 9845033446', address: 'Indiranagar, Bengaluru', branchId: 'b-blr', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-blr-03', userId: 'NX@BLREMP03', email: 'bangalore.emp3@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Deepa Hegde', dob: '1992-08-11', gender: 'Female', mobileNumber: '+91 9845033447', address: 'Koramangala, Bengaluru', branchId: 'b-blr', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-blr-04', userId: 'NX@BLREMP04', email: 'bangalore.emp4@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Ashwin Murthy', dob: '1990-02-19', gender: 'Male', mobileNumber: '+91 9845033448', address: 'Jayanagar, Bengaluru', branchId: 'b-blr', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-blr-05', userId: 'NX@BLREMP05', email: 'bangalore.emp5@bank.com', passwordHash: defaultStaffPassHash, role: 'Loan Officer', fullName: 'Lavanya Gowda', dob: '1994-06-30', gender: 'Female', mobileNumber: '+91 9845033449', address: 'Whitefield, Bengaluru', branchId: 'b-blr', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-blr-06', userId: 'NX@BLREMP06', email: 'bangalore.emp6@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Varun Kamath', dob: '1988-11-15', gender: 'Male', mobileNumber: '+91 9845033450', address: 'HSR Layout, Bengaluru', branchId: 'b-blr', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-blr-07', userId: 'NX@BLREMP07', email: 'bangalore.emp7@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Swathi Bhat', dob: '1993-01-27', gender: 'Female', mobileNumber: '+91 9845033451', address: 'Malleswaram, Bengaluru', branchId: 'b-blr', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-blr-08', userId: 'NX@BLREMP08', email: 'bangalore.emp8@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Praveen Shetty', dob: '1987-10-09', gender: 'Male', mobileNumber: '+91 9845033452', address: 'Hebbal, Bengaluru', branchId: 'b-blr', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-blr-09', userId: 'NX@BLREMP09', email: 'bangalore.emp9@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Keerthi Prasad', dob: '1995-05-18', gender: 'Female', mobileNumber: '+91 9845033453', address: 'Rajajinagar, Bengaluru', branchId: 'b-blr', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-blr-10', userId: 'NX@BLREMP10', email: 'bangalore.emp10@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Chethan Reddy', dob: '1991-07-04', gender: 'Male', mobileNumber: '+91 9845033454', address: 'Electronic City, Bengaluru', branchId: 'b-blr', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },

      // --- BRANCH 4: Anna Salai Branch (b-chennai) ---
      { id: 'u-teller', userId: 'NX@REDDY004', email: 'teller@bank.com', passwordHash: bcrypt.hashSync('Teller123!', salt), role: 'Employee', fullName: 'Sunita Reddy', dob: '1992-09-21', gender: 'Female', mobileNumber: '+91 9840044556', address: 'Mount Road, Anna Salai, Chennai', branchId: 'b-chennai', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-che-02', userId: 'NX@CHEEMP02', email: 'chennai.emp2@bank.com', passwordHash: defaultStaffPassHash, role: 'Branch Manager', fullName: 'K. Sundaram', dob: '1984-03-14', gender: 'Male', mobileNumber: '+91 9840044557', address: 'T Nagar, Chennai', branchId: 'b-chennai', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-che-03', userId: 'NX@CHEEMP03', email: 'chennai.emp3@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Revathi Raman', dob: '1990-11-28', gender: 'Female', mobileNumber: '+91 9840044558', address: 'Adyar, Chennai', branchId: 'b-chennai', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-che-04', userId: 'NX@CHEEMP04', email: 'chennai.emp4@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Venkatesh Iyer', dob: '1987-05-09', gender: 'Male', mobileNumber: '+91 9840044559', address: 'Mylapore, Chennai', branchId: 'b-chennai', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-che-05', userId: 'NX@CHEEMP05', email: 'chennai.emp5@bank.com', passwordHash: defaultStaffPassHash, role: 'Loan Officer', fullName: 'Malini Balaji', dob: '1993-02-22', gender: 'Female', mobileNumber: '+91 9840044560', address: 'Velachery, Chennai', branchId: 'b-chennai', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-che-06', userId: 'NX@CHEEMP06', email: 'chennai.emp6@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Senthil Kumar', dob: '1989-10-16', gender: 'Male', mobileNumber: '+91 9840044561', address: 'Anna Nagar, Chennai', branchId: 'b-chennai', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-che-07', userId: 'NX@CHEEMP07', email: 'chennai.emp7@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Nithya Natarajan', dob: '1994-08-01', gender: 'Female', mobileNumber: '+91 9840044562', address: 'Nungambakkam, Chennai', branchId: 'b-chennai', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-che-08', userId: 'NX@CHEEMP08', email: 'chennai.emp8@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Vijay Ranganathan', dob: '1986-12-12', gender: 'Male', mobileNumber: '+91 9840044563', address: 'Guindy, Chennai', branchId: 'b-chennai', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-che-09', userId: 'NX@CHEEMP09', email: 'chennai.emp9@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Preeti Subramanian', dob: '1995-04-05', gender: 'Female', mobileNumber: '+91 9840044564', address: 'Besant Nagar, Chennai', branchId: 'b-chennai', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-che-10', userId: 'NX@CHEEMP10', email: 'chennai.emp10@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Dinesh Kannan', dob: '1991-06-25', gender: 'Male', mobileNumber: '+91 9840044565', address: 'Porur, Chennai', branchId: 'b-chennai', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },

      // --- BRANCH 5: Park Street Branch (b-kolkata) ---
      { id: 'u-cashier', userId: 'NX@SINGH005', email: 'cashier@bank.com', passwordHash: bcrypt.hashSync('Cashier123!', salt), role: 'Employee', fullName: 'Vikram Singh', dob: '1989-04-11', gender: 'Male', mobileNumber: '+91 9830055667', address: 'Park Street, Kolkata', branchId: 'b-kolkata', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-kol-02', userId: 'NX@KOLEMP02', email: 'kolkata.emp2@bank.com', passwordHash: defaultStaffPassHash, role: 'Branch Manager', fullName: 'Sourav Ganguly', dob: '1982-07-08', gender: 'Male', mobileNumber: '+91 9830055668', address: 'Ballygunge, Kolkata', branchId: 'b-kolkata', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-kol-03', userId: 'NX@KOLEMP03', email: 'kolkata.emp3@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Joyeeta Sen', dob: '1992-01-19', gender: 'Female', mobileNumber: '+91 9830055669', address: 'Salt Lake Sector V, Kolkata', branchId: 'b-kolkata', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-kol-04', userId: 'NX@KOLEMP04', email: 'kolkata.emp4@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Arnab Mukherjee', dob: '1988-09-14', gender: 'Male', mobileNumber: '+91 9830055670', address: 'Alipore, Kolkata', branchId: 'b-kolkata', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-kol-05', userId: 'NX@KOLEMP05', email: 'kolkata.emp5@bank.com', passwordHash: defaultStaffPassHash, role: 'Loan Officer', fullName: 'Poulomi Das', dob: '1993-05-26', gender: 'Female', mobileNumber: '+91 9830055671', address: 'New Town, Kolkata', branchId: 'b-kolkata', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-kol-06', userId: 'NX@KOLEMP06', email: 'kolkata.emp6@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Subhashish Roy', dob: '1990-12-03', gender: 'Male', mobileNumber: '+91 9830055672', address: 'Jadavpur, Kolkata', branchId: 'b-kolkata', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-kol-07', userId: 'NX@KOLEMP07', email: 'kolkata.emp7@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Sanchita Bose', dob: '1995-03-10', gender: 'Female', mobileNumber: '+91 9830055673', address: 'Shyam Bazar, Kolkata', branchId: 'b-kolkata', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-kol-08', userId: 'NX@KOLEMP08', email: 'kolkata.emp8@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Debabrata Ghosh', dob: '1987-08-21', gender: 'Male', mobileNumber: '+91 9830055674', address: 'Howrah, Kolkata', branchId: 'b-kolkata', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-kol-09', userId: 'NX@KOLEMP09', email: 'kolkata.emp9@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Rimpa Dutta', dob: '1994-10-15', gender: 'Female', mobileNumber: '+91 9830055675', address: 'Behala, Kolkata', branchId: 'b-kolkata', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-kol-10', userId: 'NX@KOLEMP10', email: 'kolkata.emp10@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Amitabha Bhattacharya', dob: '1986-06-30', gender: 'Male', mobileNumber: '+91 9830055676', address: 'Gariahat, Kolkata', branchId: 'b-kolkata', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },

      // --- BRANCH 6: Banjara Hills Branch (b-hyd) ---
      { id: 'u-mgr-hyd', userId: 'NX@IYER0007', email: 'suresh.i@bank.com', passwordHash: bcrypt.hashSync('Manager123!', salt), role: 'Branch Manager', fullName: 'Suresh Iyer', dob: '1984-07-24', gender: 'Male', mobileNumber: '+91 9849077889', address: 'Banjara Hills, Hyderabad', branchId: 'b-hyd', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-hyd-02', userId: 'NX@HYDEMP02', email: 'hyderabad.emp2@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Srilatha Varma', dob: '1991-04-18', gender: 'Female', mobileNumber: '+91 9849077890', address: 'Jubilee Hills, Hyderabad', branchId: 'b-hyd', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-hyd-03', userId: 'NX@HYDEMP03', email: 'hyderabad.emp3@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Madhav Naidu', dob: '1989-09-02', gender: 'Male', mobileNumber: '+91 9849077891', address: 'Gachibowli, Hyderabad', branchId: 'b-hyd', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-hyd-04', userId: 'NX@HYDEMP04', email: 'hyderabad.emp4@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Bhavana Raju', dob: '1993-11-12', gender: 'Female', mobileNumber: '+91 9849077892', address: 'HITEC City, Hyderabad', branchId: 'b-hyd', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-hyd-05', userId: 'NX@HYDEMP05', email: 'hyderabad.emp5@bank.com', passwordHash: defaultStaffPassHash, role: 'Loan Officer', fullName: 'Tarun Teja', dob: '1987-01-25', gender: 'Male', mobileNumber: '+91 9849077893', address: 'Madhapur, Hyderabad', branchId: 'b-hyd', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-hyd-06', userId: 'NX@HYDEMP06', email: 'hyderabad.emp6@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Haritha Reddy', dob: '1994-06-08', gender: 'Female', mobileNumber: '+91 9849077894', address: 'Kukatpally, Hyderabad', branchId: 'b-hyd', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-hyd-07', userId: 'NX@HYDEMP07', email: 'hyderabad.emp7@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Mahesh Chowdary', dob: '1990-03-31', gender: 'Male', mobileNumber: '+91 9849077895', address: 'Secunderabad, Hyderabad', branchId: 'b-hyd', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-hyd-08', userId: 'NX@HYDEMP08', email: 'hyderabad.emp8@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Anusha Kulkarni', dob: '1992-10-14', gender: 'Female', mobileNumber: '+91 9849077896', address: 'Begumpet, Hyderabad', branchId: 'b-hyd', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-hyd-09', userId: 'NX@HYDEMP09', email: 'hyderabad.emp9@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Sravan Kumar', dob: '1988-08-20', gender: 'Male', mobileNumber: '+91 9849077897', address: 'Ameerpet, Hyderabad', branchId: 'b-hyd', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-hyd-10', userId: 'NX@HYDEMP10', email: 'hyderabad.emp10@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Pradeep Goud', dob: '1995-12-05', gender: 'Male', mobileNumber: '+91 9849077898', address: 'Kondapur, Hyderabad', branchId: 'b-hyd', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },

      // --- BRANCH 7: CG Road Branch (b-ahmedabad) ---
      { id: 'u-teller-amd', userId: 'NX@JOSHI008', email: 'kavita.j@bank.com', passwordHash: bcrypt.hashSync('Teller123!', salt), role: 'Employee', fullName: 'Kavita Joshi', dob: '1993-02-14', gender: 'Female', mobileNumber: '+91 9825088990', address: 'CG Road, Ahmedabad', branchId: 'b-ahmedabad', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-amd-02', userId: 'NX@AMDEMP02', email: 'ahmedabad.emp2@bank.com', passwordHash: defaultStaffPassHash, role: 'Branch Manager', fullName: 'Jayesh Patel', dob: '1983-05-19', gender: 'Male', mobileNumber: '+91 9825088991', address: 'Navrangpura, Ahmedabad', branchId: 'b-ahmedabad', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-amd-03', userId: 'NX@AMDEMP03', email: 'ahmedabad.emp3@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Hiral Shah', dob: '1991-09-08', gender: 'Female', mobileNumber: '+91 9825088992', address: 'Satellite, Ahmedabad', branchId: 'b-ahmedabad', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-amd-04', userId: 'NX@AMDEMP04', email: 'ahmedabad.emp4@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Chirag Mehta', dob: '1989-11-23', gender: 'Male', mobileNumber: '+91 9825088993', address: 'Vastrapur, Ahmedabad', branchId: 'b-ahmedabad', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-amd-05', userId: 'NX@AMDEMP05', email: 'ahmedabad.emp5@bank.com', passwordHash: defaultStaffPassHash, role: 'Loan Officer', fullName: 'Kinjal Parikh', dob: '1994-01-30', gender: 'Female', mobileNumber: '+91 9825088994', address: 'Bodakdev, Ahmedabad', branchId: 'b-ahmedabad', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-amd-06', userId: 'NX@AMDEMP06', email: 'ahmedabad.emp6@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Nimesh Trivedi', dob: '1987-07-15', gender: 'Male', mobileNumber: '+91 9825088995', address: 'Ambawadi, Ahmedabad', branchId: 'b-ahmedabad', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-amd-07', userId: 'NX@AMDEMP07', email: 'ahmedabad.emp7@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Falak Pandya', dob: '1992-04-03', gender: 'Female', mobileNumber: '+91 9825088996', address: 'Paldi, Ahmedabad', branchId: 'b-ahmedabad', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-amd-08', userId: 'NX@AMDEMP08', email: 'ahmedabad.emp8@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Bhavesh Solanki', dob: '1990-10-17', gender: 'Male', mobileNumber: '+91 9825088997', address: 'Maninagar, Ahmedabad', branchId: 'b-ahmedabad', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-amd-09', userId: 'NX@AMDEMP09', email: 'ahmedabad.emp9@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Purvi Vora', dob: '1995-08-21', gender: 'Female', mobileNumber: '+91 9825088998', address: 'Thaltej, Ahmedabad', branchId: 'b-ahmedabad', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-amd-10', userId: 'NX@AMDEMP10', email: 'ahmedabad.emp10@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Darshan Choksi', dob: '1988-12-11', gender: 'Male', mobileNumber: '+91 9825088999', address: 'Sabarmati, Ahmedabad', branchId: 'b-ahmedabad', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },

      // --- BRANCH 8: FC Road Branch (b-pune) ---
      { id: 'u-mgr-pune', userId: 'NX@DESH0006', email: 'ananya.d@bank.com', passwordHash: bcrypt.hashSync('Manager123!', salt), role: 'Branch Manager', fullName: 'Ananya Deshmukh', dob: '1986-12-05', gender: 'Female', mobileNumber: '+91 9822066778', address: 'FC Road, Shivajinagar, Pune', branchId: 'b-pune', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-pun-02', userId: 'NX@PUNEMP02', email: 'pune.emp2@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Sachin Gadgil', dob: '1989-03-24', gender: 'Male', mobileNumber: '+91 9822066779', address: 'Kothrud, Pune', branchId: 'b-pune', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-pun-03', userId: 'NX@PUNEMP03', email: 'pune.emp3@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Rutuja Jagtap', dob: '1992-07-16', gender: 'Female', mobileNumber: '+91 9822066780', address: 'Baner, Pune', branchId: 'b-pune', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-pun-04', userId: 'NX@PUNEMP04', email: 'pune.emp4@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Omkar Barve', dob: '1990-11-09', gender: 'Male', mobileNumber: '+91 9822066781', address: 'Aundh, Pune', branchId: 'b-pune', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-pun-05', userId: 'NX@PUNEMP05', email: 'pune.emp5@bank.com', passwordHash: defaultStaffPassHash, role: 'Loan Officer', fullName: 'Sayali Kakade', dob: '1994-05-02', gender: 'Female', mobileNumber: '+91 9822066782', address: 'Viman Nagar, Pune', branchId: 'b-pune', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-pun-06', userId: 'NX@PUNEMP06', email: 'pune.emp6@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Tushar Mahajan', dob: '1987-09-18', gender: 'Male', mobileNumber: '+91 9822066783', address: 'Deccan Gymkhana, Pune', branchId: 'b-pune', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-pun-07', userId: 'NX@PUNEMP07', email: 'pune.emp7@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Asmita Phadke', dob: '1993-04-11', gender: 'Female', mobileNumber: '+91 9822066784', address: 'Kalyani Nagar, Pune', branchId: 'b-pune', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-pun-08', userId: 'NX@PUNEMP08', email: 'pune.emp8@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Prasad Dhage', dob: '1988-01-29', gender: 'Male', mobileNumber: '+91 9822066785', address: 'Pimpri, Pune', branchId: 'b-pune', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-pun-09', userId: 'NX@PUNEMP09', email: 'pune.emp9@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Sneha Nene', dob: '1995-10-07', gender: 'Female', mobileNumber: '+91 9822066786', address: 'Karve Nagar, Pune', branchId: 'b-pune', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-pun-10', userId: 'NX@PUNEMP10', email: 'pune.emp10@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Siddhesh Bapat', dob: '1991-08-20', gender: 'Male', mobileNumber: '+91 9822066787', address: 'Hadapsar, Pune', branchId: 'b-pune', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },

      // --- BRANCH 9: MI Road Branch (b-jaipur) ---
      { id: 'u-loan-jai', userId: 'NX@AGAR0010', email: 'pooja.a@bank.com', passwordHash: bcrypt.hashSync('Loan123!', salt), role: 'Loan Officer', fullName: 'Pooja Agarwal', dob: '1991-08-16', gender: 'Female', mobileNumber: '+91 9829011223', address: 'MI Road, Jaipur', branchId: 'b-jaipur', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-jai-02', userId: 'NX@JAIEMP02', email: 'jaipur.emp2@bank.com', passwordHash: defaultStaffPassHash, role: 'Branch Manager', fullName: 'Vikramaditya Rathore', dob: '1985-02-17', gender: 'Male', mobileNumber: '+91 9829011224', address: 'C-Scheme, Jaipur', branchId: 'b-jaipur', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-jai-03', userId: 'NX@JAIEMP03', email: 'jaipur.emp3@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Sunita Shekhawat', dob: '1992-06-25', gender: 'Female', mobileNumber: '+91 9829011225', address: 'Malviya Nagar, Jaipur', branchId: 'b-jaipur', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-jai-04', userId: 'NX@JAIEMP04', email: 'jaipur.emp4@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Harshwardhan Singh', dob: '1988-10-31', gender: 'Male', mobileNumber: '+91 9829011226', address: 'Vaishali Nagar, Jaipur', branchId: 'b-jaipur', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-jai-05', userId: 'NX@JAIEMP05', email: 'jaipur.emp5@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Kirti Kanwar', dob: '1994-04-12', gender: 'Female', mobileNumber: '+91 9829011227', address: 'Raja Park, Jaipur', branchId: 'b-jaipur', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-jai-06', userId: 'NX@JAIEMP06', email: 'jaipur.emp6@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Lokendra Chouhan', dob: '1990-09-08', gender: 'Male', mobileNumber: '+91 9829011228', address: 'Mansarovar, Jaipur', branchId: 'b-jaipur', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-jai-07', userId: 'NX@JAIEMP07', email: 'jaipur.emp7@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Yashoda Sharma', dob: '1993-11-20', gender: 'Female', mobileNumber: '+91 9829011229', address: 'Bani Park, Jaipur', branchId: 'b-jaipur', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-jai-08', userId: 'NX@JAIEMP08', email: 'jaipur.emp8@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Digvijay Mina', dob: '1987-12-03', gender: 'Male', mobileNumber: '+91 9829011230', address: 'Jagatpura, Jaipur', branchId: 'b-jaipur', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-jai-09', userId: 'NX@JAIEMP09', email: 'jaipur.emp9@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Shweta Mathur', dob: '1995-07-14', gender: 'Female', mobileNumber: '+91 9829011231', address: 'Tonk Road, Jaipur', branchId: 'b-jaipur', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-jai-10', userId: 'NX@JAIEMP10', email: 'jaipur.emp10@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Jitendra Saini', dob: '1991-01-22', gender: 'Male', mobileNumber: '+91 9829011232', address: 'Amer Road, Jaipur', branchId: 'b-jaipur', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },

      // --- BRANCH 10: Hazratganj Branch (b-lucknow) ---
      { id: 'u-comp-lko', userId: 'NX@GUPTA009', email: 'rahul.g@bank.com', passwordHash: bcrypt.hashSync('Compliance123!', salt), role: 'Compliance Officer', fullName: 'Rahul Gupta', dob: '1987-10-30', gender: 'Male', mobileNumber: '+91 9839099001', address: 'Hazratganj, Lucknow', branchId: 'b-lucknow', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-lko-02', userId: 'NX@LKOEMP02', email: 'lucknow.emp2@bank.com', passwordHash: defaultStaffPassHash, role: 'Branch Manager', fullName: 'Shailendra Srivastava', dob: '1984-06-18', gender: 'Male', mobileNumber: '+91 9839099002', address: 'Gomti Nagar, Lucknow', branchId: 'b-lucknow', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-lko-03', userId: 'NX@LKOEMP03', email: 'lucknow.emp3@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Archana Tripathi', dob: '1992-02-09', gender: 'Female', mobileNumber: '+91 9839099003', address: 'Aliganj, Lucknow', branchId: 'b-lucknow', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-lko-04', userId: 'NX@LKOEMP04', email: 'lucknow.emp4@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Alok Pandey', dob: '1989-11-27', gender: 'Male', mobileNumber: '+91 9839099004', address: 'Mahanagar, Lucknow', branchId: 'b-lucknow', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-lko-05', userId: 'NX@LKOEMP05', email: 'lucknow.emp5@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Pragya Mishra', dob: '1994-08-15', gender: 'Female', mobileNumber: '+91 9839099005', address: 'Indira Nagar, Lucknow', branchId: 'b-lucknow', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-lko-06', userId: 'NX@LKOEMP06', email: 'lucknow.emp6@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Devesh Shukla', dob: '1990-04-03', gender: 'Male', mobileNumber: '+91 9839099006', address: 'Jankipuram, Lucknow', branchId: 'b-lucknow', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-lko-07', userId: 'NX@LKOEMP07', email: 'lucknow.emp7@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Shalini Yadav', dob: '1993-10-21', gender: 'Female', mobileNumber: '+91 9839099007', address: 'Charbagh, Lucknow', branchId: 'b-lucknow', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-lko-08', userId: 'NX@LKOEMP08', email: 'lucknow.emp8@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Vivek Nigam', dob: '1987-03-12', gender: 'Male', mobileNumber: '+91 9839099008', address: 'Ashiyana, Lucknow', branchId: 'b-lucknow', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-lko-09', userId: 'NX@LKOEMP09', email: 'lucknow.emp9@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Garima Bajpai', dob: '1995-01-07', gender: 'Female', mobileNumber: '+91 9839099009', address: 'Rajajipuram, Lucknow', branchId: 'b-lucknow', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() },
      { id: 'u-lko-10', userId: 'NX@LKOEMP10', email: 'lucknow.emp10@bank.com', passwordHash: defaultStaffPassHash, role: 'Employee', fullName: 'Rakesh Tiwari', dob: '1991-09-29', gender: 'Male', mobileNumber: '+91 9839099010', address: 'Vikas Nagar, Lucknow', branchId: 'b-lucknow', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: defaultPinHash, createdAt: new Date().toISOString() }
    ];
    this.data.users.push(...staffUsers);

    // 3. Seed 10 Indian Customers (Customer Registry)
    const indianCustomers = [
      { id: 'u-customer', userId: 'NX@MEHTA001', email: 'customer@bank.com', passwordHash: bcrypt.hashSync('Customer123!', salt), role: 'Customer', fullName: 'Aarav Mehta', dob: '1990-05-14', gender: 'Male', mobileNumber: '+91 9820123456', address: '124, Sarvodaya Enclave, New Delhi, 110017', panNumber: 'BPRPM1234A', sdhwo: 'S/o Ramesh Mehta', branchId: 'b-delhi', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: bcrypt.hashSync('987654', salt), createdAt: new Date().toISOString() },
      { id: 'u-cust-2', userId: 'NX@BANE0002', email: 'diya.banerjee@yahoo.com', passwordHash: bcrypt.hashSync('Customer123!', salt), role: 'Customer', fullName: 'Diya Banerjee', dob: '1992-08-22', gender: 'Female', mobileNumber: '+91 9830234567', address: '12/1 Ballygunge Circular Rd, Kolkata', panNumber: 'ADPBK5678B', sdhwo: 'D/o Subhash Banerjee', branchId: 'b-kolkata', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: bcrypt.hashSync('123456', salt), createdAt: new Date().toISOString() },
      { id: 'u-cust-3', userId: 'NX@KULK0003', email: 'rohan.kulkarni@gmail.com', passwordHash: bcrypt.hashSync('Customer123!', salt), role: 'Customer', fullName: 'Rohan Kulkarni', dob: '1985-11-03', gender: 'Male', mobileNumber: '+91 9822345678', address: '75 Prabhat Road, Erandwane, Pune', panNumber: 'CFCPK9012C', sdhwo: 'S/o Anand Kulkarni', branchId: 'b-pune', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: bcrypt.hashSync('123456', salt), createdAt: new Date().toISOString() },
      { id: 'u-cust-4', userId: 'NX@SWAM0004', email: 'ananya.swami@gmail.com', passwordHash: bcrypt.hashSync('Customer123!', salt), role: 'Customer', fullName: 'Ananya Swaminathan', dob: '1996-03-19', gender: 'Female', mobileNumber: '+91 9840456789', address: '45 TTK Road, Alwarpet, Chennai', panNumber: 'EGPSM3456D', sdhwo: 'D/o V. Swaminathan', branchId: 'b-chennai', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: bcrypt.hashSync('123456', salt), createdAt: new Date().toISOString() },
      { id: 'u-cust-5', userId: 'NX@MALH0005', email: 'kabir.malhotra@gmail.com', passwordHash: bcrypt.hashSync('Customer123!', salt), role: 'Customer', fullName: 'Kabir Malhotra', dob: '1988-07-30', gender: 'Male', mobileNumber: '+91 9811567890', address: 'C-12 South Extension Part II, New Delhi', panNumber: 'FGXPM7890E', sdhwo: 'S/o Sunil Malhotra', branchId: 'b-delhi', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: bcrypt.hashSync('123456', salt), createdAt: new Date().toISOString() },
      { id: 'u-cust-6', userId: 'NX@NAIR0006', email: 'sneha.nair@outlook.com', passwordHash: bcrypt.hashSync('Customer123!', salt), role: 'Customer', fullName: 'Sneha Nair', dob: '1994-01-12', gender: 'Female', mobileNumber: '+91 9845678901', address: '88 Indiranagar 100ft Road, Bengaluru', panNumber: 'HKSPS1234F', sdhwo: 'D/o K. T. Nair', branchId: 'b-blr', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: bcrypt.hashSync('123456', salt), createdAt: new Date().toISOString() },
      { id: 'u-cust-7', userId: 'NX@CHAW0007', email: 'aditya.chawla@gmail.com', passwordHash: bcrypt.hashSync('Customer123!', salt), role: 'Customer', fullName: 'Aditya Chawla', dob: '1983-09-05', gender: 'Male', mobileNumber: '+91 9829789012', address: '21 C-Scheme, Ashok Nagar, Jaipur', panNumber: 'JKRPC5678G', sdhwo: 'S/o OP Chawla', branchId: 'b-jaipur', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: bcrypt.hashSync('123456', salt), createdAt: new Date().toISOString() },
      { id: 'u-cust-8', userId: 'NX@DESH0008', email: 'meera.deshpande@gmail.com', passwordHash: bcrypt.hashSync('Customer123!', salt), role: 'Customer', fullName: 'Meera Deshpande', dob: '1991-12-25', gender: 'Female', mobileNumber: '+91 9825890123', address: '304 Satellite Plaza, Satellite, Ahmedabad', panNumber: 'LMNPD9012H', sdhwo: 'W/o Nitin Deshpande', branchId: 'b-ahmedabad', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: bcrypt.hashSync('123456', salt), createdAt: new Date().toISOString() },
      { id: 'u-cust-9', userId: 'NX@RAO00009', email: 'siddharth.rao@gmail.com', passwordHash: bcrypt.hashSync('Customer123!', salt), role: 'Customer', fullName: 'Siddharth Rao', dob: '1987-04-17', gender: 'Male', mobileNumber: '+91 9849901234', address: '102 Jubilee Hills Checkpost, Hyderabad', panNumber: 'PQRPR3456I', sdhwo: 'S/o Narayana Rao', branchId: 'b-hyd', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: bcrypt.hashSync('123456', salt), createdAt: new Date().toISOString() },
      { id: 'u-cust-10', userId: 'NX@SAXE0010', email: 'ishita.saxena@gmail.com', passwordHash: bcrypt.hashSync('Customer123!', salt), role: 'Customer', fullName: 'Ishita Saxena', dob: '1993-06-08', gender: 'Female', mobileNumber: '+91 9839012345', address: '56 Gomti Nagar Scheme, Lucknow', panNumber: 'RSTPS7890J', sdhwo: 'D/o RK Saxena', branchId: 'b-lucknow', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: bcrypt.hashSync('123456', salt), createdAt: new Date().toISOString() }
    ];
    this.data.users.push(...indianCustomers);

    // Seed Merchant User
    const merchantUser = { id: 'u-merchant', userId: 'NX@MERCH01', email: 'merchant@bank.com', passwordHash: bcrypt.hashSync('Merchant123!', salt), role: 'Merchant', fullName: 'Rajesh Retail Traders', dob: '1988-11-30', gender: 'Male', mobileNumber: '+91 9820099887', address: '404 Retail Market, Crawford Market, Mumbai', status: 'active', failedLogins: 0, lockedUntil: null, transactionPinHash: bcrypt.hashSync('123456', salt), createdAt: new Date().toISOString() };
    this.data.users.push(merchantUser);

    // Seed Accounts for 10 Customers & Merchant
    this.data.accounts.push(
      { id: 'acc-cust-1', customerId: 'u-customer', accountNumber: '1000987654', branchId: 'b-delhi', type: 'savings', mopType: 'Self', balance: 150000.00, status: 'active', createdAt: new Date().toISOString() },
      { id: 'acc-cust-2', customerId: 'u-cust-2', accountNumber: '1000987655', branchId: 'b-kolkata', type: 'savings', mopType: 'Self', balance: 285000.00, status: 'active', createdAt: new Date().toISOString() },
      { id: 'acc-cust-3', customerId: 'u-cust-3', accountNumber: '1000987656', branchId: 'b-pune', type: 'current', mopType: 'Self', balance: 540000.00, status: 'active', createdAt: new Date().toISOString() },
      { id: 'acc-cust-4', customerId: 'u-cust-4', accountNumber: '1000987657', branchId: 'b-chennai', type: 'savings', mopType: 'Self', balance: 95000.00, status: 'active', createdAt: new Date().toISOString() },
      { id: 'acc-cust-5', customerId: 'u-cust-5', accountNumber: '1000987658', branchId: 'b-delhi', type: 'savings', mopType: 'Either or Survivor', balance: 420000.00, status: 'active', createdAt: new Date().toISOString() },
      { id: 'acc-cust-6', customerId: 'u-cust-6', accountNumber: '1000987659', branchId: 'b-blr', type: 'savings', mopType: 'Self', balance: 180000.00, status: 'active', createdAt: new Date().toISOString() },
      { id: 'acc-cust-7', customerId: 'u-cust-7', accountNumber: '1000987660', branchId: 'b-jaipur', type: 'current', mopType: 'Self', balance: 890000.00, status: 'active', createdAt: new Date().toISOString() },
      { id: 'acc-cust-8', customerId: 'u-cust-8', accountNumber: '1000987661', branchId: 'b-ahmedabad', type: 'savings', mopType: 'Self', balance: 315000.00, status: 'active', createdAt: new Date().toISOString() },
      { id: 'acc-cust-9', customerId: 'u-cust-9', accountNumber: '1000987662', branchId: 'b-hyd', type: 'savings', mopType: 'Either or Survivor', balance: 675000.00, status: 'active', createdAt: new Date().toISOString() },
      { id: 'acc-cust-10', customerId: 'u-cust-10', accountNumber: '1000987663', branchId: 'b-lucknow', type: 'savings', mopType: 'Self', balance: 210000.00, status: 'active', createdAt: new Date().toISOString() },
      { id: 'acc-merch-1', customerId: 'u-merchant', accountNumber: '2000123456', branchId: 'b-main', type: 'current', mopType: 'Self', balance: 1000000.00, status: 'active', createdAt: new Date().toISOString() }
    );

    // Seed Active Debit Cards for Customers & Merchant
    const seededCards = indianCustomers.map((c, i) => {
      const acc = this.data.accounts[i];
      const last4 = (acc.accountNumber || '1000').slice(-4);
      return {
        id: `card-${c.id}`,
        customerId: c.id,
        userId: c.userId,
        accountId: acc.id,
        accountNumber: acc.accountNumber,
        cardNumber: `4532${last4}8821${last4}`,
        cardHolder: c.fullName,
        type: 'Debit',
        name: 'RuPay Platinum Contactless',
        status: 'active',
        expiryDate: '12/29',
        cvv: '321',
        dailyLimit: 50000.00,
        createdAt: new Date().toISOString()
      };
    });
    this.data.cards.push(...seededCards);

    // Seed Initial Transactions for Customers
    const now = Date.now();
    const seededTx = [];
    indianCustomers.forEach((c, i) => {
      const acc = this.data.accounts[i];
      seededTx.push(
        {
          id: `tx-${acc.accountNumber}-1`,
          type: 'deposit',
          amount: 85000.00,
          toAccountId: acc.id,
          toAccountNumber: acc.accountNumber,
          accountNumber: acc.accountNumber,
          category: 'Salary NEFT Credit',
          description: 'Monthly Corporate Salary NEFT - Payroll Credit',
          status: 'completed',
          createdAt: new Date(now - 7 * 86400000).toISOString()
        },
        {
          id: `tx-${acc.accountNumber}-2`,
          type: 'withdrawal',
          amount: 3200.00,
          fromAccountId: acc.id,
          fromAccountNumber: acc.accountNumber,
          accountNumber: acc.accountNumber,
          category: 'ATM Cash Withdrawal',
          description: 'Cash Dispense - BSB Branch ATM Terminal',
          status: 'completed',
          createdAt: new Date(now - 4 * 86400000).toISOString()
        },
        {
          id: `tx-${acc.accountNumber}-3`,
          type: 'withdrawal',
          amount: 1450.00,
          fromAccountId: acc.id,
          fromAccountNumber: acc.accountNumber,
          accountNumber: acc.accountNumber,
          category: 'UPI Merchant Payment',
          description: 'UPI / BharatPe Grocery Store Payment',
          status: 'completed',
          createdAt: new Date(now - 2 * 86400000).toISOString()
        },
        {
          id: `tx-${acc.accountNumber}-4`,
          type: 'deposit',
          amount: 2845.50,
          toAccountId: acc.id,
          toAccountNumber: acc.accountNumber,
          accountNumber: acc.accountNumber,
          category: 'Savings Interest',
          description: 'Quarterly Savings Bank Interest Credit (7.25% p.a.)',
          status: 'completed',
          createdAt: new Date(now - 1 * 86400000).toISOString()
        }
      );
    });
    this.data.transactions.push(...seededTx);

    // Seed Cash Vaults
    this.data.cashVaults.push({
      id: 'cv-main',
      branchId: 'b-main',
      type: 'main',
      balance: 15000000.00,
      lastReconciledAt: new Date().toISOString()
    });

    // Seed Cash Positions (Teller Drawer)
    this.data.cashPositions.push({
      id: 'cp-1',
      branchId: 'b-main',
      tellerId: 'u-teller',
      cashInHand: 50000.00,
      limit: 100000.00,
      status: 'active',
      updatedAt: new Date().toISOString()
    });

    // Seed General Ledger (GL) Codes
    this.data.generalLedger.push(
      { id: 'gl-1010', code: '1010', name: 'Cash in Vault', type: 'asset', balance: 15000000.00 },
      { id: 'gl-1020', code: '1020', name: 'Cash in Hand (Tellers)', type: 'asset', balance: 50000.00 },
      { id: 'gl-2010', code: '2010', name: 'Customer Savings Deposits', type: 'liability', balance: 150000.00 },
      { id: 'gl-2020', code: '2020', name: 'Merchant Current Deposits', type: 'liability', balance: 1000000.00 },
      { id: 'gl-3010', code: '3010', name: 'Share Capital', type: 'equity', balance: 13900000.00 },
      { id: 'gl-4010', code: '4010', name: 'Interest Revenue from Loans', type: 'revenue', balance: 0.00 },
      { id: 'gl-5010', code: '5010', name: 'Interest Expense on Savings', type: 'expense', balance: 0.00 }
    );

    // Seed Workflow Definitions
    this.data.workflowDefinitions.push(
      {
        id: 'wf-kyc',
        name: 'KYC Verification Approval Flow',
        triggerType: 'KYC',
        steps: ['Employee review', 'Manager approval'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'wf-loan',
        name: 'Loan Disbursement Workflow',
        triggerType: 'Loans',
        steps: ['Credit check analysis', 'Manager approval', 'Treasury allocation'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'wf-merchant',
        name: 'Merchant Onboarding Validation',
        triggerType: 'Merchant Requests',
        steps: ['Document validation', 'Manager approval'],
        createdAt: new Date().toISOString()
      }
    );

    // 3. Dynamic RBAC Seeding
    const actions = ['Create', 'Read', 'Update', 'Delete', 'Approve', 'Reject', 'Export', 'Import', 'Assign', 'Freeze', 'Unfreeze', 'Activate', 'Deactivate', 'Monitor'];
    actions.forEach(action => {
      this.data.permissions.push({
        id: `p-${action.toLowerCase()}`,
        action,
        description: `Permission to perform ${action} operations`
      });
    });

    const standardRoles = [
      { id: 'r-admin', name: 'Super Admin', modules: ['branch-customers', 'users', 'customer-registry', 'branches', 'ledger', 'developers', 'interest', 'disaster'], custom: false },
      { id: 'r-manager', name: 'Branch Manager', modules: ['summary', 'branch-customers', 'approvals', 'employees', 'treasury', 'ledger'], custom: false },
      { id: 'r-employee', name: 'Employee', modules: ['summary', 'customers', 'transactions', 'crm', 'tickets', 'dms'], custom: false },
      { id: 'r-customer', name: 'Customer', modules: ['summary', 'transfers', 'products', 'dms', 'assistant', 'settings'], custom: false },
      { id: 'r-merchant', name: 'Merchant', modules: ['summary', 'qr', 'settlements', 'developers'], custom: false },
      { id: 'r-auditor', name: 'Auditor', modules: ['summary', 'ledger', 'disaster'], custom: false },
      { id: 'r-compliance', name: 'Compliance Officer', modules: ['summary', 'ledger', 'dms'], custom: false },
      { id: 'r-treasury', name: 'Treasury Officer', modules: ['summary', 'treasury', 'ledger'], custom: false },
      { id: 'r-loan', name: 'Loan Officer', modules: ['summary', 'approvals'], custom: false },
      { id: 'r-support', name: 'Customer Support Agent', modules: ['summary', 'tickets'], custom: false },
      { id: 'r-fraud', name: 'Fraud Analyst', modules: ['summary', 'ledger'], custom: false },
      { id: 'r-sysadmin', name: 'System Administrator', modules: ['summary', 'disaster'], custom: false }
    ];
    this.data.roles.push(...standardRoles);

    // Seed Super Admin mappings (All permissions, Global scope)
    actions.forEach(action => {
      this.data.rolePermissions.push({
        id: `rp-admin-${action.toLowerCase()}`,
        roleId: 'r-admin',
        permissionId: `p-${action.toLowerCase()}`,
        scope: 'Global'
      });
    });

    // Seed standard role permissions mapping
    const managerActions = ['Create', 'Read', 'Update', 'Delete', 'Approve', 'Reject', 'Export', 'Import', 'Assign', 'Freeze', 'Unfreeze', 'Activate', 'Deactivate', 'Monitor'];
    managerActions.forEach(action => {
      this.data.rolePermissions.push({
        id: `rp-manager-${action.toLowerCase()}`,
        roleId: 'r-manager',
        permissionId: `p-${action.toLowerCase()}`,
        scope: 'Branch'
      });
    });

    const tellerActions = ['Create', 'Read', 'Update', 'Deactivate'];
    tellerActions.forEach(action => {
      this.data.rolePermissions.push({
        id: `rp-teller-${action.toLowerCase()}`,
        roleId: 'r-employee',
        permissionId: `p-${action.toLowerCase()}`,
        scope: 'Branch'
      });
    });

    const custMerchantActions = ['Create', 'Read', 'Update', 'Delete'];
    custMerchantActions.forEach(action => {
      this.data.rolePermissions.push({
        id: `rp-cust-${action.toLowerCase()}`,
        roleId: 'r-customer',
        permissionId: `p-${action.toLowerCase()}`,
        scope: 'Own Records'
      }, {
        id: `rp-merch-${action.toLowerCase()}`,
        roleId: 'r-merchant',
        permissionId: `p-${action.toLowerCase()}`,
        scope: 'Own Records'
      });
    });

    const auditorActions = ['Read', 'Monitor'];
    auditorActions.forEach(action => {
      this.data.rolePermissions.push({
        id: `rp-auditor-${action.toLowerCase()}`,
        roleId: 'r-auditor',
        permissionId: `p-${action.toLowerCase()}`,
        scope: 'Global'
      });
    });

    const complianceActions = ['Read', 'Monitor'];
    complianceActions.forEach(action => {
      this.data.rolePermissions.push({
        id: `rp-compliance-${action.toLowerCase()}`,
        roleId: 'r-compliance',
        permissionId: `p-${action.toLowerCase()}`,
        scope: 'Global'
      });
    });

    const treasuryActions = ['Read', 'Update', 'Approve', 'Reject'];
    treasuryActions.forEach(action => {
      this.data.rolePermissions.push({
        id: `rp-treasury-${action.toLowerCase()}`,
        roleId: 'r-treasury',
        permissionId: `p-${action.toLowerCase()}`,
        scope: 'Branch'
      });
    });

    const loanActions = ['Read', 'Create', 'Update', 'Approve', 'Reject'];
    loanActions.forEach(action => {
      this.data.rolePermissions.push({
        id: `rp-loan-${action.toLowerCase()}`,
        roleId: 'r-loan',
        permissionId: `p-${action.toLowerCase()}`,
        scope: 'Branch'
      });
    });

    const supportActions = ['Read', 'Create', 'Update'];
    supportActions.forEach(action => {
      this.data.rolePermissions.push({
        id: `rp-support-${action.toLowerCase()}`,
        roleId: 'r-support',
        permissionId: `p-${action.toLowerCase()}`,
        scope: 'Branch'
      });
    });

    const fraudActions = ['Read', 'Update', 'Monitor'];
    fraudActions.forEach(action => {
      this.data.rolePermissions.push({
        id: `rp-fraud-${action.toLowerCase()}`,
        roleId: 'r-fraud',
        permissionId: `p-${action.toLowerCase()}`,
        scope: 'Global'
      });
    });

    actions.forEach(action => {
      this.data.rolePermissions.push({
        id: `rp-sysadmin-${action.toLowerCase()}`,
        roleId: 'r-sysadmin',
        permissionId: `p-${action.toLowerCase()}`,
        scope: 'Global'
      });
    });

    // User-Role Mapping
    this.data.userRoles.push(
      { id: 'ur-1', userId: 'u-admin', roleId: 'r-admin' },
      { id: 'ur-2', userId: 'u-manager', roleId: 'r-manager' },
      { id: 'ur-3', userId: 'u-teller', roleId: 'r-employee' },
      { id: 'ur-4', userId: 'u-customer', roleId: 'r-customer' },
      { id: 'ur-5', userId: 'u-merchant', roleId: 'r-merchant' }
    );

    // Branch Assignments Mapping
    this.data.branchAssignments.push(
      { id: 'ba-2', userId: 'u-manager', branchId: 'b-delhi', createdAt: new Date().toISOString() },
      { id: 'ba-3', userId: 'u-teller', branchId: 'b-main', createdAt: new Date().toISOString() }
    );

    // Setup User Password Reset simulation flags
    this.data.users.forEach(u => {
      u.forcePasswordChange = false;
      u.tempPassword = null;
    });

    // Seed Customer Service Requests (Debit Cards, Credit Cards, Cheque Books, Demand Drafts, UPI Channels)
    const seededRequests = [
      {
        id: 'REQ-DC-88121',
        customerId: 'u-cust-5',
        customerName: 'Kabir Malhotra',
        accountNumber: '1000987658',
        branchId: 'b-delhi',
        branchName: 'Connaught Place Branch',
        type: 'Debit Card',
        variant: 'RuPay Platinum Contactless',
        status: 'pending',
        statusClass: 'pending',
        deliveryAddress: 'Flat 402, Barakhamba Road, Connaught Place, New Delhi',
        mobileNumber: '+91 9810199881',
        details: 'Emboss Name: KABIR MALHOTRA • Daily ATM Limit: ₹50,000 • Contactless NFC Enabled',
        trackingNumber: null,
        processedBy: null,
        remarks: 'Customer requested RuPay Platinum card upgrade via NetBanking portal.',
        createdAt: '2026-08-31T09:15:00Z',
        updatedAt: '2026-08-31T09:15:00Z'
      },
      {
        id: 'REQ-CC-90412',
        customerId: 'u-cust-3',
        customerName: 'Rohan Kulkarni',
        accountNumber: '1000987656',
        branchId: 'b-main',
        branchName: 'Mumbai Main HQ Branch',
        type: 'Credit Card',
        variant: 'BSB Titanium Rewards Credit Card',
        status: 'pending',
        statusClass: 'pending',
        deliveryAddress: 'Tower 3, Dadar West, Mumbai 400028',
        mobileNumber: '+91 9820011226',
        details: 'Credit Limit Requested: ₹3,00,000 • Fuel Surcharge Waiver • Airport Lounge Access',
        trackingNumber: null,
        processedBy: null,
        remarks: 'Salary account customer, verified 3-month credit turnover.',
        createdAt: '2026-08-31T10:30:00Z',
        updatedAt: '2026-08-31T10:30:00Z'
      },
      {
        id: 'REQ-CHQ-67210',
        customerId: 'u-cust-5',
        customerName: 'Kabir Malhotra',
        accountNumber: '1000987658',
        branchId: 'b-delhi',
        branchName: 'Connaught Place Branch',
        type: 'Cheque Book',
        variant: 'CTS-2010 High Security Cheque Book (25 Leaves)',
        status: 'pending',
        statusClass: 'pending',
        deliveryAddress: 'Flat 402, Barakhamba Road, Connaught Place, New Delhi',
        mobileNumber: '+91 9810199881',
        details: '25 Leaves Personalized • Multi-city CTS-2010 Standard • Home Delivery',
        trackingNumber: null,
        processedBy: null,
        remarks: 'Standard cheque book request for personal savings account.',
        createdAt: '2026-08-31T11:00:00Z',
        updatedAt: '2026-08-31T11:00:00Z'
      },
      {
        id: 'REQ-DD-45190',
        customerId: 'u-cust-4',
        customerName: 'Ananya Swami',
        accountNumber: '1000987657',
        branchId: 'b-chennai',
        branchName: 'Anna Salai Branch',
        type: 'Demand Draft',
        variant: 'Demand Draft (DD) in favor of University Registrar',
        status: 'pending',
        statusClass: 'pending',
        deliveryAddress: 'Anna Salai Main Branch Counter Pickup',
        mobileNumber: '+91 9845011992',
        details: 'Amount: ₹45,000.00 • Payable at: Chennai • In Favor of: Registrar, Anna University',
        trackingNumber: 'DD-OTP-8821',
        processedBy: null,
        remarks: 'Counter collection requested with OTP verification.',
        createdAt: '2026-08-31T08:45:00Z',
        updatedAt: '2026-08-31T08:45:00Z'
      },
      {
        id: 'REQ-UPI-33019',
        customerId: 'u-cust-5',
        customerName: 'Kabir Malhotra',
        accountNumber: '1000987658',
        branchId: 'b-delhi',
        branchName: 'Connaught Place Branch',
        type: 'UPI Channel',
        variant: 'UPI VPA Channel Activation & Limit Increase',
        status: 'pending',
        statusClass: 'pending',
        deliveryAddress: 'Digital Channel Activation',
        mobileNumber: '+91 9810199881',
        details: 'VPA: kabir.malhotra@bsb • Daily Channel Limit: ₹1,00,000 • P2P & P2M Active',
        trackingNumber: null,
        processedBy: null,
        remarks: 'Digital Banking channel activation for NPCI UPI 2.0 network.',
        createdAt: '2026-08-31T11:30:00Z',
        updatedAt: '2026-08-31T11:30:00Z'
      },
      {
        id: 'REQ-DC-10929',
        customerId: 'u-cust-1',
        customerName: 'Aarav Mehta',
        accountNumber: '1000987654',
        branchId: 'b-main',
        branchName: 'Mumbai Main HQ Branch',
        type: 'Debit Card',
        variant: 'Visa Platinum International Contactless',
        status: 'approved',
        statusClass: 'active',
        deliveryAddress: 'Marine Lines, Mumbai, Maharashtra 400020',
        mobileNumber: '+91 9820011223',
        details: 'Emboss Name: AARAV MEHTA • Daily ATM Limit: ₹1,00,000 • Zero Forex Markup',
        trackingNumber: 'Speed Post #IN98124501',
        processedBy: 'Priya Patel (Branch Manager)',
        remarks: 'Approved after KYC verification.',
        createdAt: '2026-08-28T14:30:00Z',
        updatedAt: '2026-08-28T16:00:00Z'
      },
      {
        id: 'REQ-CHQ-12001',
        customerId: 'u-cust-2',
        customerName: 'Diya Banerjee',
        accountNumber: '1000987655',
        branchId: 'b-kolkata',
        branchName: 'Park Street Branch',
        type: 'Cheque Book',
        variant: 'Personal CTS-2010 Cheque Book (50 Leaves)',
        status: 'approved',
        statusClass: 'active',
        deliveryAddress: 'Salt Lake Sector 5, Kolkata 700091',
        mobileNumber: '+91 9830022334',
        details: '50 Leaves Personalized CTS-2010 Cheque Book',
        trackingNumber: 'Speed Post #IN77192834',
        processedBy: 'Vikram Singh (Cashier/Employee)',
        remarks: 'Dispatched to registered mailing address.',
        createdAt: '2026-08-26T10:00:00Z',
        updatedAt: '2026-08-26T12:30:00Z'
      }
    ];
    this.data.customerRequests.push(...seededRequests);

    console.log('Seeding completed successfully!');
  }

  queueSync(collectionName) {
    if (!this.syncQueue[collectionName]) {
      this.syncQueue[collectionName] = Promise.resolve();
    }
    this.syncQueue[collectionName] = this.syncQueue[collectionName].then(async () => {
      await this.syncCollectionToMongo(collectionName);
    }).catch(err => {
      console.error(`[MONGODB] Queued sync error for ${collectionName}:`, err);
    });
  }

  save(collectionName) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
      try {
        const stat = fs.statSync(DB_FILE);
        this.lastLoadedMtime = stat.mtimeMs;
      } catch(e) {}
      if (this.mongoDb) {
        if (collectionName) {
          this.queueSync(collectionName);
        } else {
          COLLECTIONS.forEach(col => this.queueSync(col));
        }
      }
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // Helper: sanitize user record — Super Admin is always active
  _sanitizeUser(user) {
    if (!user) return user;
    if (user.id === 'u-admin' || user.email === 'admin@bank.com' || user.role === 'Super Admin') {
      user.status = 'active';
      user.failedLogins = 0;
      user.lockedUntil = null;
    }
    return user;
  }

  // Repository Methods
  find(collectionName, filterFn) {
    this.reloadIfModified();
    if (!this.data[collectionName]) return [];
    const results = filterFn ? this.data[collectionName].filter(filterFn) : this.data[collectionName];
    if (collectionName === 'users') return results.map(u => this._sanitizeUser(u));
    return results;
  }

  findOne(collectionName, filterFn) {
    this.reloadIfModified();
    if (!this.data[collectionName]) return null;
    const result = this.data[collectionName].find(filterFn) || null;
    if (collectionName === 'users') return this._sanitizeUser(result);
    return result;
  }

  insert(collectionName, document) {
    this.reloadIfModified();
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    let extraUserFields = {};
    if (collectionName === 'users') {
      const generatedId = document.userId || generate10DigitUserId();
      extraUserFields = { userId: generatedId };
    }
    const docWithId = {
      id: document.id || (collectionName === 'users' ? extraUserFields.userId : `${collectionName.substring(0,3)}-${uuidv4().substring(0,8)}`),
      ...extraUserFields,
      ...document,
      createdAt: document.createdAt || new Date().toISOString()
    };
    this.data[collectionName].push(docWithId);

    // Auto-update GL ledger balances on journalLines insertions
    if (collectionName === 'journalLines') {
      const amount = parseFloat(document.amount);
      const glCode = document.glCode;
      const type = document.type;

      this.update('generalLedger', g => g.code === glCode, gl => {
        if (gl.type === 'asset' || gl.type === 'expense') {
          if (type === 'debit') {
            gl.balance += amount;
          } else {
            gl.balance -= amount;
          }
        } else if (gl.type === 'liability' || gl.type === 'equity' || gl.type === 'revenue') {
          if (type === 'credit') {
            gl.balance += amount;
          } else {
            gl.balance -= amount;
          }
        }
        return gl;
      });
    }

    this.save(collectionName);
    return docWithId;
  }

  update(collectionName, filterFn, updateObjOrFn) {
    this.reloadIfModified();
    if (!this.data[collectionName]) return [];
    const updated = [];
    this.data[collectionName].forEach((doc, index) => {
      if (filterFn(doc)) {
        let updatedDoc;
        if (typeof updateObjOrFn === 'function') {
          updatedDoc = updateObjOrFn(doc);
        } else {
          updatedDoc = { ...doc, ...updateObjOrFn };
        }
        // Retain original ID & createdAt
        updatedDoc.id = doc.id;
        updatedDoc.createdAt = doc.createdAt;
        updatedDoc.updatedAt = new Date().toISOString();
        this.data[collectionName][index] = updatedDoc;
        updated.push(updatedDoc);
      }
    });
    if (updated.length > 0) {
      this.save(collectionName);
    }
    return updated;
  }

  delete(collectionName, filterFn) {
    this.reloadIfModified();
    if (!this.data[collectionName]) return 0;
    const initialCount = this.data[collectionName].length;
    this.data[collectionName] = this.data[collectionName].filter(doc => !filterFn(doc));
    const deletedCount = initialCount - this.data[collectionName].length;
    if (deletedCount > 0) {
      this.save(collectionName);
    }
    return deletedCount;
  }

  // Helper transaction log recorder
  logAudit(userId, action, details, ipAddress = '127.0.0.1') {
    this.insert('auditLogs', {
      userId,
      action,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      ipAddress,
      timestamp: new Date().toISOString()
    });
  }
}

// Single instance exports
const db = new Database();
module.exports = db;
