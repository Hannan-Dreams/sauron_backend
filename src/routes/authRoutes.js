const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorization');
const {
    validateSignup,
    validateLogin,
    validateProfileUpdate,
    validatePasswordChange,
} = require('../middleware/validation');

/**
 * Auth Routes
 * All routes are prefixed with /api/auth
 */

// Public routes
router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes (require authentication)
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/profile', authenticateToken, validateProfileUpdate, authController.updateProfile);
router.put('/change-password', authenticateToken, validatePasswordChange, authController.changePassword);
router.post('/logout', authenticateToken, authController.logout);

// Admin-only routes
router.post('/create-admin', authenticateToken, requireAdmin, validateSignup, authController.createAdmin);

module.exports = router;
