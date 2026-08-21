const express = require('express');
const path = require('path');
const http = require('http');
const app = express();

const FRONTEND_PORT = process.env.VITE_PORT || 3003;
const BACKEND_PORT = process.env.PORT || 5003;

// Auto-boot Customer Backend Server (Port 5003)
try {
  require('../backend/server.js');
} catch (e) {
  console.log('[CUSTOMER BACKEND AUTOSTART]', e.message);
}

const rootFrontend = path.resolve(__dirname, '../../frontend');

// Proxy API requests directly to Customer Backend Engine (5003)
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
    res.status(502).json({ message: 'Customer Backend engine service is temporarily offline.', error: err.message });
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

// Serve Customer Dedicated Portal HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Customer Frontend Server
const server = app.listen(FRONTEND_PORT, () => {
  console.log(`=================================================`);
  console.log(`👤 RETAIL NETBANKING FRONTEND ACTIVE (PORT ${FRONTEND_PORT})`);
  console.log(`URL: http://localhost:${FRONTEND_PORT}`);
  console.log(`=================================================`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Customer Frontend Port ${FRONTEND_PORT} is already in use.`);
  } else {
    throw error;
  }
});
