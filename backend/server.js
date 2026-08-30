const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const config = require('./config/security');
const { apiLimiter, csrfProtection } = require('./middleware/security');
const auditLogger = require('./middleware/audit');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const systemController = require('./controllers/systemController');
const authController = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 5000;

// Express Security middlewares (Helmet config)
app.use(helmet({
  contentSecurityPolicy: false
}));

// CORS Configuration
app.use(cors({
  origin: true, // Allow all origins for the simulation
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply global rate limiting and CSRF protection
app.use('/api/', apiLimiter);
app.use('/api/', csrfProtection);

// Apply audit logger middleware for state mutations
app.use('/api/', auditLogger);

// System Health checks (Public endpoints)
app.get('/api/health', systemController.getHealth);
app.get('/api/status', systemController.getStatus);
app.get('/api/version', systemController.getVersion);

// Root Level Authentication URL Route mappings
app.post('/admin/login', (req, res, next) => { req.portalType = 'headquarter'; req.body.role = 'Super Admin'; next(); }, authController.login);
app.post('/api/hq/login', (req, res, next) => { req.portalType = 'headquarter'; next(); }, authController.login);
app.post('/manager/login', (req, res, next) => { req.portalType = 'branch'; req.body.role = 'Branch Manager'; next(); }, authController.login);
app.post('/employee/login', (req, res, next) => { req.portalType = 'branch'; req.body.role = 'Employee'; next(); }, authController.login);
app.post('/api/branch/login', (req, res, next) => { req.portalType = 'branch'; next(); }, authController.login);
app.post('/api/employee/login', (req, res, next) => { req.portalType = 'branch'; next(); }, authController.login);
app.post('/customer/login', (req, res, next) => { req.portalType = 'customer'; req.body.role = 'Customer'; next(); }, authController.login);
app.post('/api/customer/login', (req, res, next) => { req.portalType = 'customer'; req.body.role = 'Customer'; next(); }, authController.login);
app.post('/customer/signup', authController.customerSignup);
app.post('/api/customer/signup', authController.customerSignup);
app.post('/merchant/login', (req, res, next) => { req.portalType = 'customer'; req.body.role = 'Merchant'; next(); }, authController.login);
app.post('/merchant/signup', authController.merchantSignup);

const kycRoutes = require('./routes/kycRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Mount Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', apiRoutes);
app.use('/customers', apiRoutes);
app.use('/', apiRoutes);

// Global Catch-all 404 Handler (Always returns JSON)
app.use((req, res) => {
  res.status(404).json({ message: `API endpoint '${req.originalUrl}' not found.` });
});

// Global Express Error Handler (Always returns JSON)
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Run server
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`BHARATIYA SARVODAYA BANK (BSB) ENTERPRISE ENGINE ACTIVE`);
    console.log(`Port: ${PORT}`);
    console.log(`Status: ONLINE & MONITORING`);
    console.log(`=================================================`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n[CORE SERVER ERROR] Port ${PORT} is already in use. Please terminate existing instance or use another port.`);
    } else {
      console.error('[CORE SERVER ERROR]', error);
    }
  });
}

module.exports = app;
