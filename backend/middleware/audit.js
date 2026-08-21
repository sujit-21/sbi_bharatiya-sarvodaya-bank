const db = require('../db/database');

function auditLogger(req, res, next) {
  // We only log mutating operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const originalSend = res.send;
    
    // Intercept response to check status and log
    res.send = function(body) {
      res.send = originalSend;
      res.send(body);

      try {
        const userId = req.user ? req.user.id : 'anonymous';
        const statusCode = res.statusCode;
        
        // Don't log sensitive info like password
        const cleanBody = { ...req.body };
        if (cleanBody.password) cleanBody.password = '***';
        if (cleanBody.confirmPassword) cleanBody.confirmPassword = '***';
        if (cleanBody.transactionPin) cleanBody.transactionPin = '***';

        if (statusCode >= 200 && statusCode < 300) {
          db.logAudit(
            userId,
            `${req.method}_${req.originalUrl.split('?')[0].toUpperCase()}`,
            {
              body: cleanBody,
              status: 'SUCCESS',
              statusCode
            },
            req.ip
          );
        }
      } catch (err) {
        console.error('Audit logging failed', err);
      }
    };
  }
  next();
}

module.exports = auditLogger;
