const express = require('express');
const path = require('path');
const http = require('http');
const app = express();

const FRONTEND_PORT = process.env.VITE_PORT || 3002;
const BACKEND_PORT = process.env.PORT || 5002;

// Auto-boot Branch Backend Server (Port 5002)
try {
  require('../backend/server.js');
} catch (e) {
  console.log('[BRANCH BACKEND AUTOSTART]', e.message);
}

const rootFrontend = path.resolve(__dirname, '../../frontend');
const rootBackend = path.resolve(__dirname, '../../backend');
const dashboardController = require(path.join(rootBackend, 'controllers/dashboardController'));
const { authenticate } = require(path.join(rootBackend, 'middleware/auth'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Direct CBS Account Transactions API Route
app.get('/api/accounts/:accountNumber/transactions', authenticate, dashboardController.getAccountTransactions);
app.get('/api/dashboard/accounts/:accountNumber/transactions', authenticate, dashboardController.getAccountTransactions);

// Proxy API requests directly to Branch Backend Engine (5002)
app.use(['/api', '/admin', '/manager', '/employee', '/customer', '/customers', '/merchant'], (req, res) => {
  const options = {
    hostname: 'localhost',
    port: BACKEND_PORT,
    path: req.originalUrl,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${BACKEND_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    res.status(502).json({ message: 'Branch Backend engine service is temporarily offline.', error: err.message });
  });

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    req.pipe(proxyReq, { end: true });
  } else {
    proxyReq.end();
  }
});

// Explicit Static Files for CSS & JS
app.get('/style.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/app.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'app.js'));
});

app.use(express.static(__dirname));
app.use(express.static(rootFrontend));

// Serve Branch Dedicated Portal HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Branch Frontend Server
const server = app.listen(FRONTEND_PORT, () => {
  console.log(`=================================================`);
  console.log(`🏦 BRANCH CBS STAFF TERMINAL FRONTEND ACTIVE (PORT ${FRONTEND_PORT})`);
  console.log(`URL: http://localhost:${FRONTEND_PORT}`);
  console.log(`=================================================`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Branch Frontend Port ${FRONTEND_PORT} is already in use.`);
  } else {
    throw error;
  }
});
