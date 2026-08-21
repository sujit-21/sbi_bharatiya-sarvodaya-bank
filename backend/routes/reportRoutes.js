const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.get('/statement/:accountNumber', authenticate, reportController.generateAccountStatement);
router.get('/ledger-export', authenticate, reportController.generateGlLedgerReport);

module.exports = router;
