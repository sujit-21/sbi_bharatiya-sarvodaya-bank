const express = require('express');
const path = require('path');
const http = require('http');
const app = express();

const FRONTEND_PORT = 3000;
const BACKEND_PORT = process.env.PORT || 5000;

// Proxy API & Backend requests directly to Backend Engine
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
    res.status(502).json({ message: 'Backend engine service is temporarily offline or starting up.', error: err.message });
  });

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    req.pipe(proxyReq, { end: true });
  } else {
    proxyReq.end();
  }
});

// Serve static frontend assets
app.use(express.static(__dirname));

// Fallback to SPA Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start frontend server
const server = app.listen(FRONTEND_PORT, () => {
  console.log(`=================================================`);
  console.log(`BHARATIYA SARVODAYA BANK (BSB) FRONTEND PORTAL ACTIVE`);
  console.log(`URL: http://localhost:${FRONTEND_PORT}`);
  console.log(`=================================================`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Frontend Port ${FRONTEND_PORT} is already in use.`);
  } else {
    throw error;
  }
});
