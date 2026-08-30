const express = require('express');
const path = require('path');
const http = require('http');
const net = require('net');
const app = express();

const FRONTEND_PORT = 3001;
const BACKEND_PORT = 5001;

// Auto-boot HQ Backend Server (Port 5001) if not already active
try {
  const backendApp = require('../backend/server.js');
  const bServer = backendApp.listen(BACKEND_PORT, () => {
    console.log(`[HQ BACKEND] Automatically started on port ${BACKEND_PORT}`);
  });
  bServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[HQ BACKEND] Port ${BACKEND_PORT} already active.`);
    } else {
      console.error('[HQ BACKEND ERROR]', err.message);
    }
  });
} catch (e) {
  console.log('[HQ BACKEND AUTOSTART]', e.message);
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

// Proxy API requests directly to HQ Backend Engine (5001) with clean stream forwarding
app.use(['/api', '/admin', '/manager', '/employee', '/customer', '/customers', '/merchant', '/auth'], (req, res) => {
  const bodyData = (req.body && Object.keys(req.body).length > 0) ? JSON.stringify(req.body) : null;
  
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (!['host', 'content-length'].includes(k.toLowerCase())) {
      headers[k] = v;
    }
  }
  if (bodyData) {
    headers['content-length'] = Buffer.byteLength(bodyData);
    headers['content-type'] = 'application/json';
  }

  const options = {
    hostname: 'localhost',
    port: BACKEND_PORT,
    path: req.originalUrl,
    method: req.method,
    headers: headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    for (const [hk, hv] of Object.entries(proxyRes.headers)) {
      res.setHeader(hk, hv);
    }
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.status(502).json({ message: 'HQ Backend engine service is temporarily offline.', error: err.message });
  });

  if (bodyData) {
    proxyReq.write(bodyData);
  }
  proxyReq.end();
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

// Serve HQ Dedicated Portal HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start HQ Frontend Server
const server = app.listen(FRONTEND_PORT, () => {
  console.log(`=================================================`);
  console.log(`🏛️ HQ CORE CONSOLE FRONTEND ACTIVE (PORT ${FRONTEND_PORT})`);
  console.log(`URL: http://localhost:${FRONTEND_PORT}`);
  console.log(`=================================================`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] HQ Frontend Port ${FRONTEND_PORT} is already in use.`);
  } else {
    throw error;
  }
});
