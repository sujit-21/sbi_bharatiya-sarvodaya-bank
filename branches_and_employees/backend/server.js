const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const rootBackend = path.resolve(__dirname, '../../backend');
const config = require(path.join(rootBackend, 'config/security'));
const { apiLimiter, csrfProtection } = require(path.join(rootBackend, 'middleware/security'));
const auditLogger = require(path.join(rootBackend, 'middleware/audit'));

const authRoutes = require(path.join(rootBackend, 'routes/auth'));
const apiRoutes = require(path.join(rootBackend, 'routes/api'));
const kycRoutes = require(path.join(rootBackend, 'routes/kycRoutes'));
const reportRoutes = require(path.join(rootBackend, 'routes/reportRoutes'));
const systemController = require(path.join(rootBackend, 'controllers/systemController'));
const authController = require(path.join(rootBackend, 'controllers/authController'));
const dashboardController = require(path.join(rootBackend, 'controllers/dashboardController'));
const { authenticate } = require(path.join(rootBackend, 'middleware/auth'));

const app = express();
const PORT = 5002;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/', apiLimiter);
app.use('/api/', csrfProtection);
app.use('/api/', auditLogger);

// Enforce Branch & Employee Portal Context
app.use((req, res, next) => {
  req.portalType = 'branch';
  next();
});

// System Health checks
app.get('/api/health', systemController.getHealth);
app.get('/api/status', systemController.getStatus);
app.get('/api/version', systemController.getVersion);

// Dedicated Branch & Employee Login Routes
app.post('/api/branch/login', authController.login);
app.post('/api/employee/login', (req, res, next) => {
  if (!req.body.role) req.body.role = 'Employee';
  next();
}, authController.login);

// Account Transactions History Endpoint
app.get('/api/accounts/:accountNumber/transactions', authenticate, dashboardController.getAccountTransactions);
app.get('/api/dashboard/accounts/:accountNumber/transactions', authenticate, dashboardController.getAccountTransactions);

app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Branch API endpoint '${req.originalUrl}' not found.` });
});

app.use((err, req, res, next) => {
  console.error('[BRANCH SERVER ERROR]', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Branch Server Error' });
});

if (require.main === module) {
  const { execSync } = require('child_process');
  const server = app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🏦 BRANCH & EMPLOYEES API SERVER RUNNING ON PORT ${PORT}`);
    console.log(`Shared Database: ${process.env.MONGODB_URI}`);
    console.log(`=================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[BRANCH SERVER ERROR] Port ${PORT} is already in use. Please terminate existing instance or use another port.`);
    } else {
      console.error('[BRANCH SERVER ERROR]', err);
    }
  });
}

module.exports = app;
