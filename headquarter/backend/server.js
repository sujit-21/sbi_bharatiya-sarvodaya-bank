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

const app = express();
const PORT = process.env.PORT || 5001;

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/', apiLimiter);
app.use('/api/', csrfProtection);
app.use('/api/', auditLogger);

// System Health checks
app.get('/api/health', systemController.getHealth);
app.get('/api/status', systemController.getStatus);
app.get('/api/version', systemController.getVersion);

// Dedicated HQ Login Route
app.post('/api/hq/login', (req, res, next) => {
  req.body.role = 'Super Admin';
  next();
}, authController.login);

app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `HQ API endpoint '${req.originalUrl}' not found.` });
});

app.use((err, req, res, next) => {
  console.error('[HQ SERVER ERROR]', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal HQ Server Error' });
});

if (require.main === module) {
  const { execSync } = require('child_process');
  const server = app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🏛️ HEADQUARTER CORE API SERVER RUNNING ON PORT ${PORT}`);
    console.log(`Shared Database: ${process.env.MONGODB_URI}`);
    console.log(`=================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[HQ SERVER] Port ${PORT} in use. Freeing port and restarting...`);
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
          console.log(`🏛️ HEADQUARTER CORE API SERVER RUNNING ON PORT ${PORT}`);
          console.log(`Shared Database: ${process.env.MONGODB_URI}`);
          console.log(`=================================================`);
        });
      }, 1500);
    } else {
      console.error('[HQ SERVER ERROR]', err);
      process.exit(1);
    }
  });
}

module.exports = app;
