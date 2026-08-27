const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const config = require('../config/security');

// Generate JWT tokens
function generateTokens(user, deviceId) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    branchId: user.branchId || null
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: config.accessTokenExpiry });
  const refreshToken = jwt.sign({ id: user.id, deviceId }, config.jwtRefreshSecret, { expiresIn: config.refreshTokenExpiry });

  return { accessToken, refreshToken };
}

// Custom Login for all roles
async function login(req, res) {
  const { email, password, role, deviceId, deviceName, fingerprint } = req.body;
  const ip = req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!email || !password) {
    return res.status(400).json({ message: 'Email / User ID and password are required.' });
  }

  const queryTerm = email.toString().trim().toLowerCase();

  const user = db.findOne('users', u => 
    (u.email && u.email.toLowerCase() === queryTerm) ||
    (u.userId && u.userId.toLowerCase() === queryTerm) ||
    (u.id && u.id.toLowerCase() === queryTerm)
  );

  // Log helper function
  const logLoginAttempt = (status, reason) => {
    db.insert('loginHistory', {
      userId: user ? user.id : 'unknown',
      email,
      ipAddress: ip,
      userAgent,
      deviceFingerprint: fingerprint || 'unknown',
      status,
      failureReason: reason,
      timestamp: new Date().toISOString()
    });
  };

  if (!user) {
    logLoginAttempt('failed', 'User not found');
    return res.status(401).json({ message: 'Invalid credentials. User ID or Email not found.' });
  }

  // Auto-reactivate user status on login
  if (!user.status || user.status === 'suspended' || user.status === 'inactive' || user.status === 'deleted') {
    user.status = 'active';
    user.failedLogins = 0;
    user.lockedUntil = null;
    try {
      db.update('users', u => u.id === user.id, { status: 'active', failedLogins: 0, lockedUntil: null });
    } catch(e){}
  }

  // Check Account Locking
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    logLoginAttempt('failed', 'Account locked');
    return res.status(423).json({
      message: `Account is locked. Try again after ${new Date(user.lockedUntil).toLocaleTimeString()}.`
    });
  }

  // Portal & Role Separation Verification
  const portalType = (req.portalType || req.body.portal || req.headers['x-portal-type'] || '').toString().toLowerCase().trim();
  const userRole = (user.role || '').toString().toLowerCase().trim();

  // 1. CUSTOMER PORTAL ENFORCEMENT:
  // Staff / Admin accounts CANNOT log into Customer NetBanking login page
  if (portalType === 'customer' || (role && role.toLowerCase() === 'customer')) {
    if (userRole !== 'customer' && userRole !== 'merchant') {
      logLoginAttempt('failed', `Staff/Admin attempt to login on Customer portal: ${user.role}`);
      return res.status(403).json({
        message: 'Access Denied: Staff and Administrator accounts cannot log into the Retail Customer NetBanking portal. Please log into the Headquarter or Branch Portal.'
      });
    }
  }

  // 2. HEADQUARTER PORTAL ENFORCEMENT:
  // Only HQ staff/admins (Super Admin, Auditor, Compliance Officer, Treasury Officer, etc.) can log in
  if (portalType === 'headquarter' || (role && role.toLowerCase() === 'super admin')) {
    const isHQRole = ['super admin', 'admin', 'auditor', 'compliance officer', 'treasury officer', 'fraud analyst', 'system administrator'].includes(userRole);
    if (!isHQRole) {
      logLoginAttempt('failed', `Unauthorized attempt to login on Headquarter portal: ${user.role}`);
      return res.status(403).json({
        message: 'Access Denied: Only Headquarter and Executive Administrators have access to this portal.'
      });
    }
  }

  // 3. BRANCH & EMPLOYEE PORTAL ENFORCEMENT:
  // Branch Managers, Employees, Loan Officers, Tellers can log in; Retail Customers CANNOT
  if (portalType === 'branch' || (role && (role.toLowerCase() === 'branch manager' || role.toLowerCase() === 'employee'))) {
    if (userRole === 'customer' || userRole === 'merchant') {
      logLoginAttempt('failed', `Customer attempt to login on Branch portal: ${user.role}`);
      return res.status(403).json({
        message: 'Access Denied: Retail Customers cannot access the Branch & Employee Staff Terminal.'
      });
    }
  }

  // Password matching
  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    const failedLogins = (user.failedLogins || 0) + 1;
    const updateData = { failedLogins };
    let lockMessage = '';

    if (failedLogins >= config.maxLoginAttempts) {
      updateData.lockedUntil = new Date(Date.now() + config.lockoutTime).toISOString();
      updateData.failedLogins = 0;
      lockMessage = ' Account locked for 5 seconds due to multiple failed logins.';
    }

    db.update('users', u => u.id === user.id, updateData);
    logLoginAttempt('failed', 'Invalid password');

    // Velocity / takeover detection alert trigger
    if (failedLogins >= 3) {
      db.insert('fraudAlerts', {
        id: `frd-${Date.now()}`,
        userId: user.id,
        type: 'Failed Login Velocity',
        severity: 'medium',
        description: `User ${user.email} experienced ${failedLogins} consecutive failed login attempts.`,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(401).json({ message: `Invalid credentials.${lockMessage}` });
  }

  // Reset lock and logins on success, auto-reactivate Super Admin
  if (user.role === 'Super Admin' || user.id === 'u-admin' || user.email === 'admin@bank.com') {
    db.update('users', u => u.id === user.id, { status: 'active', failedLogins: 0, lockedUntil: null });
  } else {
    db.update('users', u => u.id === user.id, { failedLogins: 0, lockedUntil: null });
  }

  // Resolve role modules dynamically
  const uRole = db.findOne('userRoles', ur => ur.userId === user.id);
  const roleObj = uRole ? db.findOne('roles', r => r.id === uRole.roleId) : db.findOne('roles', r => r.name === user.role);
  const roleModules = roleObj ? (roleObj.modules || []) : [];

  // Generate tokens & Save session
  const finalDeviceId = deviceId || 'dev-' + Math.random().toString(36).substring(2, 10);
  const { accessToken, refreshToken } = generateTokens(user, finalDeviceId);

  // Invalidate previous session for this device if exists
  db.delete('sessions', s => s.userId === user.id && s.deviceId === finalDeviceId);

  // Create new session
  db.insert('sessions', {
    userId: user.id,
    refreshToken,
    deviceId: finalDeviceId,
    deviceName: deviceName || 'Browser Session',
    ipAddress: ip,
    userAgent,
    active: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
  });

  logLoginAttempt('success', null);

  // Set cookie
  res.cookie('accessToken', accessToken, config.cookieConfig);
  res.cookie('refreshToken', refreshToken, config.cookieConfig);
  res.cookie('csrfToken', 'bank-csrf-secret-token-key', { sameSite: 'strict', secure: false });

  return res.status(200).json({
    message: user.forcePasswordChange ? 'Temporary password login successful. Password change required.' : 'Login successful',
    token: accessToken,
    refreshToken,
    csrfToken: 'bank-csrf-secret-token-key',
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      branchId: user.branchId,
      twoFactorEnabled: false,
      forcePasswordChange: user.forcePasswordChange,
      modules: roleModules
    }
  });
}

// Token Refresh Route
function refresh(req, res) {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token missing.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    const session = db.findOne('sessions', s => s.userId === decoded.id && s.refreshToken === refreshToken && s.active === true);
    
    if (!session || new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({ message: 'Session expired or invalid.' });
    }

    const user = db.findOne('users', u => u.id === decoded.id);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ message: 'User is inactive or deleted.' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user, session.deviceId);

    // Update Session
    db.update('sessions', s => s.id === session.id, {
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    });

    res.cookie('accessToken', accessToken, config.cookieConfig);
    res.cookie('refreshToken', newRefreshToken, config.cookieConfig);

    return res.status(200).json({
      token: accessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token.' });
  }
}

// Customer Signup
async function customerSignup(req, res) {
  const { fullName, dob, gender, email, mobileNumber, address, password, confirmPassword } = req.body;

  if (!fullName || !dob || !gender || !email || !mobileNumber || !address || !password) {
    return res.status(400).json({ message: 'All registration fields are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  const existingUser = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(409).json({ message: 'Email address already registered.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  // Generate mock OTP codes
  const emailOtp = '1234';
  const mobileOtp = '5678';

  // Create pending customer user
  const newUser = db.insert('users', {
    email,
    passwordHash,
    role: 'Customer',
    fullName,
    dob,
    gender,
    mobileNumber,
    address,
    status: 'pending_verification',
    emailOtp,
    mobileOtp,
    emailVerified: false,
    mobileVerified: false,
    failedLogins: 0,
    lockedUntil: null
  });

  return res.status(201).json({
    message: 'Registration initiated. Verification OTP codes sent.',
    userId: newUser.id,
    emailOtpMock: emailOtp,   // Provided so UI can simulate verification
    mobileOtpMock: mobileOtp
  });
}

// Verify Customer OTPs and Activate Account
function verifyOtp(req, res) {
  const { userId, emailOtp, mobileOtp } = req.body;

  const user = db.findOne('users', u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (emailOtp && user.emailOtp === emailOtp) {
    db.update('users', u => u.id === userId, { emailVerified: true });
  }
  if (mobileOtp && user.mobileOtp === mobileOtp) {
    db.update('users', u => u.id === userId, { mobileVerified: true });
  }

  const updatedUser = db.findOne('users', u => u.id === userId);
  if (updatedUser.emailVerified && updatedUser.mobileVerified) {
    // Move to KYC submission stage
    db.update('users', u => u.id === userId, { status: 'pending_kyc' });
    
    // Automatically trigger a Workflow execution for Onboarding
    const kycWf = db.findOne('workflowDefinitions', w => w.triggerType === 'KYC');
    if (kycWf) {
      db.insert('workflowExecutions', {
        definitionId: kycWf.id,
        entityId: userId,
        entityType: 'KYC',
        currentStepIndex: 0,
        status: 'pending',
        history: [{ step: 'Email & Mobile Verified', actor: 'system', timestamp: new Date().toISOString() }]
      });
    }

    return res.status(200).json({
      message: 'Email & Mobile verified. Account status: Pending KYC Submission.',
      status: 'pending_kyc'
    });
  }

  return res.status(200).json({
    message: 'OTP validation recorded.',
    emailVerified: updatedUser.emailVerified,
    mobileVerified: updatedUser.mobileVerified
  });
}

// Submit KYC
function submitKyc(req, res) {
  const { userId, documentType, docNumber } = req.body;

  const user = db.findOne('users', u => u.id === userId);
  if (!user || user.status !== 'pending_kyc') {
    return res.status(400).json({ message: 'Invalid customer account state for KYC.' });
  }

  // Save document
  const newDoc = db.insert('documents', {
    userId,
    title: `${documentType} Document`,
    category: documentType === 'Aadhaar' ? 'aadhaar' : documentType === 'PAN' ? 'pan' : 'passport',
    fileName: `${documentType.toLowerCase()}_${docNumber}.pdf`,
    status: 'pending',
    version: 1
  });

  // Update User state
  db.update('users', u => u.id === userId, { status: 'pending_approval' });

  // Update Workflow Execution
  db.update('workflowExecutions', we => we.entityId === userId && we.status === 'pending', we => {
    we.currentStepIndex = 1; // Advanced to Manager approval
    we.history.push({ step: 'KYC Documents Submitted', actor: userId, timestamp: new Date().toISOString() });
    return we;
  });

  return res.status(200).json({
    message: 'KYC documents submitted. Awaiting manager approval.',
    status: 'pending_approval'
  });
}

// Merchant Signup
function merchantSignup(req, res) {
  const { businessName, ownerName, email, mobileNumber, gstNumber, panNumber, address, password } = req.body;

  if (!businessName || !ownerName || !email || !mobileNumber || !gstNumber || !panNumber || !address || !password) {
    return res.status(400).json({ message: 'All merchant fields are required.' });
  }

  const existingUser = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(409).json({ message: 'Email address already registered.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newMerchant = db.insert('users', {
    email,
    passwordHash,
    role: 'Merchant',
    fullName: ownerName,
    businessName,
    mobileNumber,
    gstNumber,
    panNumber,
    address,
    status: 'pending_verification',
    emailVerified: false,
    emailOtp: '9988'
  });

  return res.status(201).json({
    message: 'Merchant registered. Verify email to begin review.',
    userId: newMerchant.id,
    emailOtpMock: '9988'
  });
}

// Verify Merchant Email and Trigger Review
function verifyMerchantEmail(req, res) {
  const { userId, emailOtp } = req.body;
  const user = db.findOne('users', u => u.id === userId);

  if (!user || user.role !== 'Merchant') {
    return res.status(404).json({ message: 'Merchant not found.' });
  }

  if (user.emailOtp !== emailOtp) {
    return res.status(400).json({ message: 'Invalid OTP code.' });
  }

  // Update Merchant
  db.update('users', u => u.id === userId, {
    emailVerified: true,
    status: 'pending_approval'
  });

  // Create KYC doc
  db.insert('documents', {
    userId,
    title: 'Merchant Registration Dossier',
    category: 'merchant_doc',
    fileName: `merchant_dossier_${userId}.pdf`,
    status: 'pending',
    version: 1
  });

  // Create workflow execution
  const wf = db.findOne('workflowDefinitions', wd => wd.triggerType === 'Merchant Requests');
  if (wf) {
    db.insert('workflowExecutions', {
      definitionId: wf.id,
      entityId: userId,
      entityType: 'Merchant Requests',
      currentStepIndex: 1, // Manager Approval step
      status: 'pending',
      history: [
        { step: 'Email Verified', actor: 'system', timestamp: new Date().toISOString() },
        { step: 'Onboarding Review Triggered', actor: 'system', timestamp: new Date().toISOString() }
      ]
    });
  }

  return res.status(200).json({
    message: 'Email verified. Account is now under review by Branch Manager.',
    status: 'pending_approval'
  });
}

// Set Transaction PIN
function setupTransactionPin(req, res) {
  const { pin } = req.body;
  const userId = req.user.id;

  if (!pin || pin.length < 4) {
    return res.status(400).json({ message: 'Transaction PIN must be at least 4 digits.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const pinHash = bcrypt.hashSync(pin, salt);

  db.update('users', u => u.id === userId, { transactionPinHash: pinHash });

  return res.status(200).json({ message: 'Transaction PIN configured successfully.' });
}

// Logouts
function logout(req, res) {
  const deviceId = req.headers['x-device-id'] || 'unknown';
  if (req.user) {
    db.delete('sessions', s => s.userId === req.user.id && s.deviceId === deviceId);
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.status(200).json({ message: 'Logout successful.' });
}

function logoutAll(req, res) {
  if (req.user) {
    db.delete('sessions', s => s.userId === req.user.id);
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.status(200).json({ message: 'Logged out from all devices.' });
}

// Forgot Password simulation
function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(200).json({
      message: 'If the email matches an active account, a password reset token has been generated.',
      resetTokenMock: null
    });
  }

  const token = 'rst_' + Math.random().toString(36).substring(2, 10);
  const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  db.update('users', u => u.id === user.id, {
    resetToken: token,
    resetTokenExpires: expires
  });

  return res.status(200).json({
    message: 'Password reset code generated.',
    resetTokenMock: token
  });
}

// Reset Password
function resetPassword(req, res) {
  const { email, resetToken, newPassword } = req.body;
  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ message: 'Email, reset token and new password are required.' });
  }

  const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase() && u.resetToken === resetToken);
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired password reset token.' });
  }

  if (new Date(user.resetTokenExpires) < new Date()) {
    return res.status(400).json({ message: 'Password reset token has expired.' });
  }

  const salt = bcrypt.genSaltSync(10);
  db.update('users', u => u.id === user.id, {
    passwordHash: bcrypt.hashSync(newPassword, salt),
    resetToken: null,
    resetTokenExpires: null,
    failedLogins: 0,
    lockedUntil: null
  });

  return res.status(200).json({ message: 'Password has been successfully updated.' });
}

// Change Password (Authenticated)
function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required.' });
  }

  const user = db.findOne('users', u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Incorrect current password.' });
  }

  const salt = bcrypt.genSaltSync(10);
  db.update('users', u => u.id === userId, {
    passwordHash: bcrypt.hashSync(newPassword, salt),
    forcePasswordChange: false,
    tempPassword: null
  });

  return res.status(200).json({ message: 'Password updated successfully.' });
}

// Provision a user by Super Admin
function provisionUser(req, res) {
  const { email, fullName, role, branchId, departmentId } = req.body;

  if (!email || !fullName || !role) {
    return res.status(400).json({ message: 'Email, fullName and role are required.' });
  }

  const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'A user with this email already exists.' });
  }

  // Find corresponding role in roles collection
  const roleObj = db.findOne('roles', r => r.name === role || r.id === role);
  if (!roleObj) {
    return res.status(404).json({ message: 'Specified role does not exist.' });
  }

  // Generate a temporary password
  const tempPassword = 'Temp' + Math.floor(1000 + Math.random() * 9000) + '!';
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(tempPassword, salt);

  // Insert user
  const newUser = db.insert('users', {
    email: email.toLowerCase(),
    passwordHash,
    role: roleObj.name, // Save the actual role name e.g. "Treasury Officer"
    fullName,
    branchId: branchId || null,
    status: 'active',
    forcePasswordChange: true,
    tempPassword: tempPassword,
    failedLogins: 0,
    lockedUntil: null,
    twoFactorEnabled: false
  });

  // Map role
  db.insert('userRoles', {
    userId: newUser.id,
    roleId: roleObj.id
  });

  // Assign branch
  if (branchId) {
    db.insert('branchAssignments', {
      userId: newUser.id,
      branchId
    });
  }

  // Assign department
  if (departmentId) {
    db.insert('departmentAssignments', {
      userId: newUser.id,
      departmentId
    });
  }

  // Log audit
  db.logAudit(req.user.id, 'USER_PROVISIONED', {
    provisionedUserId: newUser.id,
    email: newUser.email,
    role: roleObj.name,
    branchId
  }, req.ip);

  return res.status(201).json({
    message: 'User provisioned successfully.',
    userId: newUser.userId || newUser.id,
    email: newUser.email,
    tempPassword
  });
}

// Activate a provisioned account using temporary password
function activateAccount(req, res) {
  const { email, tempPassword, newPassword } = req.body;

  if (!email || !tempPassword || !newPassword) {
    return res.status(400).json({ message: 'Email, temporary password and new password are required.' });
  }

  const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (!user.forcePasswordChange) {
    return res.status(400).json({ message: 'Account is already activated.' });
  }

  // Verify temporary password
  const isMatch = (user.tempPassword && user.tempPassword === tempPassword) || bcrypt.compareSync(tempPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid temporary password.' });
  }

  const salt = bcrypt.genSaltSync(10);
  db.update('users', u => u.id === user.id, {
    passwordHash: bcrypt.hashSync(newPassword, salt),
    forcePasswordChange: false,
    tempPassword: null
  });

  db.logAudit(user.id, 'ACCOUNT_ACTIVATED', { email: user.email }, req.ip);

  return res.status(200).json({
    message: 'Account activated successfully. You can now login with your new password.'
  });
}

// Get current session user profile
function getCurrentUser(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated session.' });
    const fullUser = db.findOne('users', u => u.id === req.user.id);
    if (!fullUser) return res.status(401).json({ message: 'User record not found.' });

    const { passwordHash, transactionPinHash, ...cleanUser } = fullUser;
    return res.status(200).json({ user: cleanUser });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching session user.', error: err.message });
  }
}

module.exports = {
  login,
  refresh,
  customerSignup,
  verifyOtp,
  submitKyc,
  merchantSignup,
  verifyMerchantEmail,
  setupTransactionPin,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  logoutAll,
  provisionUser,
  activateAccount,
  getCurrentUser
};
