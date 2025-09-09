const express = require('express');
const router = express.Router();
const reservationsController = require('../controllers/reservations.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/requireAdmin.middleware');
const upload = require('../middleware/upload.middleware');

// נתיבים קיימים
router.get('/', reservationsController.getReservations);
router.post('/', authenticateToken, reservationsController.createReservation);
router.patch('/:id', authenticateToken, requireAdmin, reservationsController.update);

// נתיבים חדשים לניהול פיקדון
router.patch('/:id/approve_with_deposit', authenticateToken, requireAdmin, reservationsController.approveWithDeposit);
router.patch('/:id/confirm_deposit', authenticateToken, reservationsController.confirmDeposit);
router.get('/with_deposit', authenticateToken, reservationsController.getReservationsWithDeposit);
router.get('/check_expired_deposits', authenticateToken, requireAdmin, reservationsController.checkExpiredDeposits);

// נתיבים חדשים לניהול הסמכתאות
router.post('/:id/upload_receipt', authenticateToken, upload.single('receipt'), reservationsController.uploadReceipt);
router.post('/:id/verify_receipt', authenticateToken, reservationsController.verifyReceipt);

module.exports = router;