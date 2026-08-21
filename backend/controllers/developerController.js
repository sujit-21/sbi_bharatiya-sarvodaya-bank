const db = require('../db/database');
const crypto = require('crypto');

// Generate developer API Key
function createDeveloperKey(req, res) {
  const { keyName, rateLimit } = req.body;
  const userId = req.user.id;

  if (!keyName) {
    return res.status(400).json({ message: 'Key name is required.' });
  }

  // Create random plain key
  const plainKey = 'sk_bank_' + crypto.randomBytes(16).toString('hex');
  const keyHash = crypto.createHash('sha256').update(plainKey).digest('hex');

  const keyRecord = db.insert('apiKeys', {
    name: keyName,
    keyHash,
    userId,
    rateLimit: parseInt(rateLimit) || 100, // limit per minute
    status: 'active',
    usageCount: 0
  });

  return res.status(201).json({
    message: 'API Key generated successfully. Save this key - it will not be shown again.',
    apiKey: plainKey,
    details: keyRecord
  });
}

// Get developer keys
function getDeveloperKeys(req, res) {
  const keys = db.find('apiKeys', k => k.userId === req.user.id);
  return res.status(200).json(keys);
}

// Revoke key
function revokeDeveloperKey(req, res) {
  const { keyId } = req.body;
  const updated = db.update('apiKeys', k => k.id === keyId && k.userId === req.user.id, { status: 'revoked' });
  
  if (updated.length === 0) {
    return res.status(404).json({ message: 'API key not found.' });
  }

  return res.status(200).json({ message: 'API key successfully revoked.' });
}

// Get usage logs
function getDeveloperLogs(req, res) {
  const userKeys = db.find('apiKeys', k => k.userId === req.user.id);
  const keyIds = userKeys.map(k => k.id);
  const logs = db.find('apiLogs', l => keyIds.includes(l.apiKeyId));
  return res.status(200).json({ keys: userKeys, logs });
}

// Developer API Key Auth Middleware
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ message: 'API key missing. Use x-api-key header.' });
  }

  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const keyRecord = db.findOne('apiKeys', k => k.keyHash === hash && k.status === 'active');

  if (!keyRecord) {
    return res.status(401).json({ message: 'Invalid or revoked API key.' });
  }

  // Basic rate limit check (usage logs check)
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const recentCalls = db.find('apiLogs', l => l.apiKeyId === keyRecord.id && l.timestamp > oneMinuteAgo);

  if (recentCalls.length >= keyRecord.rateLimit) {
    return res.status(429).json({ message: 'API rate limit exceeded. Check credentials portal.' });
  }

  // Log usage interceptor
  const start = Date.now();
  const originalSend = res.send;

  res.send = function(body) {
    res.send = originalSend;
    res.send(body);

    // Log request asynchronously
    try {
      db.insert('apiLogs', {
        apiKeyId: keyRecord.id,
        path: req.originalUrl,
        method: req.method,
        responseTime: Date.now() - start,
        statusCode: res.statusCode,
        ipAddress: req.ip,
        timestamp: new Date().toISOString()
      });

      // Increment count
      db.update('apiKeys', k => k.id === keyRecord.id, { usageCount: keyRecord.usageCount + 1 });
    } catch (err) {
      console.error('Failed logging api usage', err);
    }
  };

  next();
}

// Return Swagger Documentation configuration
function getSwagger(req, res) {
  return res.status(200).json({
    openapi: '3.0.0',
    info: {
      title: 'BSB Enterprise Banking REST APIs',
      version: '1.0.0-enterprise',
      description: 'API services for CBS Core Banking integrations.'
    },
    paths: {
      '/api/public/accounts/lookup': {
        get: {
          summary: 'Retrieve account details externally',
          parameters: [{ name: 'accountNumber', in: 'query', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Successful response' },
            401: { description: 'Unauthorized key' }
          }
        }
      },
      '/api/public/transactions/disburse': {
        post: {
          summary: 'Trigger external payment disbursement',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    fromAccount: { type: 'string' },
                    toAccount: { type: 'string' },
                    amount: { type: 'number' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Disbursement recorded' }
          }
        }
      }
    }
  });
}

module.exports = {
  createDeveloperKey,
  getDeveloperKeys,
  revokeDeveloperKey,
  getDeveloperLogs,
  validateApiKey,
  getSwagger
};
