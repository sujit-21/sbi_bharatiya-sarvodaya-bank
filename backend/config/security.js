module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'super-secret-bank-key-998877',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super-refresh-bank-key-112233',
  accessTokenExpiry: '15m',     // 15 minutes
  refreshTokenExpiry: '7d',      // 7 days
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,           // 5 attempts lock
  lockoutTime: parseInt(process.env.LOCKOUT_TIME_MS) || 5 * 1000,    // 5 seconds lockout
  cookieConfig: {
    httpOnly: true,
    secure: false, // Set to true in prod (HTTPS)
    sameSite: 'strict',
    maxAge: 7 * 24 * 3600 * 1000 // 7 days matching refresh token
  }
};
