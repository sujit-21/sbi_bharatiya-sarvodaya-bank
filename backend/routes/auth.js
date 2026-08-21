const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, requirePermission } = require('../middleware/auth');

// Public Login and Signup Endpoints
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

// Customer Registration Flow
router.post('/customer/signup', authController.customerSignup);
router.post('/customer/verify-otp', authController.verifyOtp);
router.post('/customer/submit-kyc', authController.submitKyc);

// Merchant Registration Flow
router.post('/merchant/signup', authController.merchantSignup);
router.post('/merchant/verify-email', authController.verifyMerchantEmail);

// Password Recovery Flow
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Secure Handlers
router.post('/change-password', authenticate, authController.changePassword);
router.post('/pin', authenticate, authController.setupTransactionPin);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);

// Provisioning and Activation Flow
router.post('/provision', authenticate, requirePermission('Create', 'users'), authController.provisionUser);
router.post('/activate-provisioned', authController.activateAccount);

module.exports = router;
