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
const systemController = require(path.join(rootBackend, 'controllers/systemController'));
const authController = require(path.join(rootBackend, 'controllers/authController'));
const dashboardController = require(path.join(rootBackend, 'controllers/dashboardController'));
const { authenticate } = require(path.join(rootBackend, 'middleware/auth'));

const app = express();
const PORT = process.env.PORT || 5003;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/', apiLimiter);
app.use('/api/', csrfProtection);
app.use('/api/', auditLogger);

// Enforce Customer Portal Context
app.use((req, res, next) => {
  req.portalType = 'customer';
  next();
});

// System Health checks
app.get('/api/health', systemController.getHealth);
app.get('/api/status', systemController.getStatus);
app.get('/api/version', systemController.getVersion);

// Dedicated Customer NetBanking Login Routes
app.post('/api/customer/login', (req, res, next) => {
  req.body.role = 'Customer';
  next();
}, authController.login);
app.post('/api/customer/signup', authController.customerSignup);

// Account Transactions History Endpoint
app.get('/api/accounts/:accountNumber/transactions', authenticate, dashboardController.getAccountTransactions);
app.get('/api/dashboard/accounts/:accountNumber/transactions', authenticate, dashboardController.getAccountTransactions);

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Customer API endpoint '${req.originalUrl}' not found.` });
});

app.use((err, req, res, next) => {
  console.error('[CUSTOMER SERVER ERROR]', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Customer Server Error' });
});

if (require.main === module) {
  const { execSync } = require('child_process');
  const server = app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`👤 CUSTOMER NETBANKING API SERVER RUNNING ON PORT ${PORT}`);
    console.log(`Shared Database: ${process.env.MONGODB_URI}`);
    console.log(`=================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[CUSTOMER SERVER] Port ${PORT} in use. Freeing port and restarting...`);
      try {
        execSync(
          `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${PORT} ^| findstr LISTENING') do taskkill /F /PID %a`,
          { shell: 'cmd.exe', stdio: 'pipe' }
        );
      } catch (e) {}
      setTimeout(() => {
        server.close();
        app.listen(PORT, () => {
          console.log(`=================================================`);
          console.log(`👤 CUSTOMER NETBANKING API SERVER RUNNING ON PORT ${PORT}`);
          console.log(`Shared Database: ${process.env.MONGODB_URI}`);
          console.log(`=================================================`);
        });
      }, 1500);
    } else {
      console.error('[CUSTOMER SERVER ERROR]', err);
      process.exit(1);
    }
  });
}

module.exports = app;
