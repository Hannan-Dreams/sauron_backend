const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const authenticateToken = require('../middleware/auth');

/**
 * Progress Routes
 * All routes require authentication
 * Prefix: /api/progress
 */

// Get user's progress
router.get('/', authenticateToken, progressController.getProgress);

// Get progress statistics
router.get('/stats', authenticateToken, progressController.getStats);

// Get leaderboard
router.get('/leaderboard', authenticateToken, progressController.getLeaderboard);

// Mark problem as solved
router.post('/solve', authenticateToken, progressController.solveProblem);

// Mark problem as unsolved
router.post('/unsolve', authenticateToken, progressController.unsolveProblem);

module.exports = router;
