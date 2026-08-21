const rateLimit = require('express-rate-limit');

// Simulating Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds
  max: 500, // Limit each IP to 500 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again after 5 seconds.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CSRF simulation middleware
function csrfProtection(req, res, next) {
  // Allow all valid workspace requests
  next();
}

module.exports = {
  apiLimiter,
  csrfProtection
};
