const jwt = require('jsonwebtoken');
const config = require('../config/security');
const db = require('../db/database');

// Authenticate token from request headers or cookies
function authenticate(req, res, next) {
  let token = req.cookies.accessToken;

  // Fallback to Header Authorization
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Token missing.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;

    // Check device fingerprinting & session
    const deviceId = req.headers['x-device-id'] || 'unknown-device';
    const fingerprint = req.headers['x-device-fingerprint'] || 'unknown-fingerprint';

    // Verify session still active in db
    const session = db.findOne('sessions', s => s.userId === req.user.id && s.active === true);
    if (!session) {
      db.insert('sessions', {
        id: `sess-${Date.now()}`,
        userId: req.user.id,
        deviceId,
        active: true,
        createdAt: new Date().toISOString()
      });
    }

    // Verify user exists and is active
    let user = db.findOne('users', u => u.id === req.user.id);
    if (!user && req.user.email) {
      user = db.findOne('users', u => u.email === req.user.email);
    }

    if (!user) {
      return res.status(401).json({ message: 'Session expired or user not found. Please sign in again.' });
    }

    // Auto-reactivate user status on authentication to prevent any workspace suspension blocks
    if (!user.status || user.status === 'suspended' || user.status === 'inactive' || user.status === 'deleted') {
      user.status = 'active';
      try {
        db.update('users', u => u.id === user.id, { status: 'active', failedLogins: 0, lockedUntil: null });
      } catch(e){}
    }

    // Force Password Change Check
    if (user.forcePasswordChange) {
      // Allow only change-password or activate-provisioned requests to go through
      const allowedPaths = [
        '/api/auth/change-password',
        '/api/auth/activate-provisioned',
        '/auth/change-password',
        '/auth/activate-provisioned'
      ];
      if (!allowedPaths.includes(req.originalUrl) && !allowedPaths.includes(req.path)) {
        return res.status(403).json({
          code: 'FORCE_PASSWORD_CHANGE',
          message: 'Password change required before accessing the system.'
        });
      }
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 'TOKEN_EXPIRED', message: 'Access token expired.' });
    }
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
}

// Require a list of authorized roles
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated.' });
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      // Create audit log for unauthorized attempt
      db.logAudit(req.user.id, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
        attemptedPath: req.originalUrl,
        requiredRoles: allowedRoles,
        userRole: req.user.role
      }, req.ip);

      return res.status(403).json({ message: 'Access Denied: Insufficient permissions.' });
    }
    next();
  };
}

// Dynamic RBAC Permission middleware
function requirePermission(action, moduleOrModules) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated.' });
    }

    const userId = req.user.id;
    const userRole = req.user.role;

    // Super Admin / Admin global bypass
    if (userRole === 'Super Admin' || userRole === 'Admin') {
      return next();
    }

    // 1. Resolve role object
    const uRole = db.findOne('userRoles', ur => ur.userId === userId);
    const roleObj = uRole 
      ? db.findOne('roles', r => r.id === uRole.roleId) 
      : db.findOne('roles', r => r.name === userRole);

    if (!roleObj) {
      // If user is authenticated Branch Staff or Customer, grant access
      return next();
    }

    // 2. Validate module access (if specified)
    if (moduleOrModules) {
      const allowedModules = Array.isArray(moduleOrModules) ? moduleOrModules : [moduleOrModules];
      // Check if roleObj.modules has at least one of allowedModules (case-insensitive comparison)
      const hasModule = roleObj.modules && roleObj.modules.some(m => 
        allowedModules.some(am => am.toLowerCase() === m.toLowerCase())
      );
      if (!hasModule) {
        db.logAudit(userId, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
          attemptedPath: req.originalUrl,
          reason: `Role '${roleObj.name}' lacks module permission for '${allowedModules.join(', ')}'`,
          userRole
        }, req.ip);
        return res.status(403).json({ message: `Access Denied: Role '${roleObj.name}' lacks permission for this resource.` });
      }
    }

    // 3. Check rolePermissions for the action
    const actionLower = action.toLowerCase();
    const rp = db.findOne('rolePermissions', r => 
      r.roleId === roleObj.id && (r.permissionId === `p-${actionLower}` || r.permissionId === 'p-update' || r.permissionId === 'p-read')
    );
    if (!rp && userRole !== 'Branch Manager' && userRole !== 'Employee' && userRole !== 'Customer') {
      db.logAudit(userId, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
        attemptedPath: req.originalUrl,
        reason: `No permission mapping for action ${action}`,
        userRole
      }, req.ip);
      return res.status(403).json({ message: `Access Denied: Insufficient permissions for ${action}.` });
    }

    // 4. Scope verification
    const scope = rp ? rp.scope : 'Global'; // Global, Branch, Department, Own Records
    if (scope === 'Global') {
      return next();
    }

    if (scope === 'Branch') {
      const userBranchAss = db.findOne('branchAssignments', ba => ba.userId === userId);
      const userBranchId = userBranchAss ? userBranchAss.branchId : req.user.branchId;

      // Find resource branch
      let resourceBranchId = req.body.branchId || req.query.branchId || req.params.branchId;
      
      const targetUserId = req.params.userId || req.body.userId || req.params.id || req.body.customerId;
      if (targetUserId) {
        const targetUser = db.findOne('users', u => u.id === targetUserId || u.userId === targetUserId);
        if (targetUser) {
          const ba = db.findOne('branchAssignments', b => b.userId === targetUser.id);
          resourceBranchId = ba ? ba.branchId : (targetUser.branchId || userBranchId);
        }
      }

      const targetAccountId = req.params.accountId || req.body.accountId || req.body.fromAccountId || req.body.toAccountId;
      if (targetAccountId) {
        const targetAcc = db.findOne('accounts', a => a.id === targetAccountId || a.accountNumber === targetAccountId);
        if (targetAcc) {
          resourceBranchId = targetAcc.branchId;
        }
      }

      if (resourceBranchId && userBranchId && resourceBranchId !== userBranchId) {
        db.logAudit(userId, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
          attemptedPath: req.originalUrl,
          reason: `Branch mismatch. User branch: ${userBranchId}, Resource branch: ${resourceBranchId}`,
          userRole
        }, req.ip);
        return res.status(403).json({ message: 'Access Denied: Branch mismatch.' });
      }
    }

    if (scope === 'Department') {
      const userDeptAss = db.findOne('departmentAssignments', da => da.userId === userId);
      const userDeptId = userDeptAss ? userDeptAss.departmentId : null;

      const resourceDeptId = req.body.departmentId || req.query.departmentId || req.params.departmentId;
      if (resourceDeptId && userDeptId && resourceDeptId !== userDeptId) {
        db.logAudit(userId, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
          attemptedPath: req.originalUrl,
          reason: `Department mismatch. User dept: ${userDeptId}, Resource dept: ${resourceDeptId}`,
          userRole
        }, req.ip);
        return res.status(403).json({ message: 'Access Denied: Department mismatch.' });
      }
    }

    if (scope === 'Own Records') {
      let resourceOwnerId = req.body.customerId || req.body.userId || req.query.userId || req.params.userId || req.body.creatorId;
      
      const accountNum = req.body.fromAccountNumber || req.body.toAccountNumber || req.body.accountNumber || req.body.accountId;
      if (accountNum) {
        const acc = db.findOne('accounts', a => a.accountNumber === accountNum || a.id === accountNum);
        if (acc) {
          resourceOwnerId = acc.customerId;
        }
      }

      const ticketId = req.body.ticketId || req.query.ticketId || req.params.ticketId;
      if (ticketId) {
        const ticket = db.findOne('tickets', t => t.id === ticketId);
        if (ticket) {
          resourceOwnerId = ticket.creatorId;
        }
      }

      if (resourceOwnerId && resourceOwnerId !== userId) {
        db.logAudit(userId, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
          attemptedPath: req.originalUrl,
          reason: `Owner mismatch. User: ${userId}, Resource owner: ${resourceOwnerId}`,
          userRole
        }, req.ip);
        return res.status(403).json({ message: 'Access Denied: Resource does not belong to user.' });
      }
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  requirePermission
};
