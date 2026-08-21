const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const { authenticate } = require('../middleware/auth');

router.get('/queue', authenticate, kycController.getKycQueue);
router.post('/submit', authenticate, kycController.submitKycDocument);
router.post('/verify', authenticate, kycController.verifyKycStatus);

module.exports = router;
