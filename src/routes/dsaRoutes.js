const express = require('express');
const router = express.Router();
const dsaController = require('../controllers/dsaController');
const authenticateToken = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorization');

/**
 * DSA Routes
 * All routes are prefixed with /api/dsa
 */

// Public routes (anyone can view problems)
router.get('/', dsaController.getAllProblems);
router.get('/level/:level', dsaController.getProblemsByLevel);
router.get('/:problemId', dsaController.getProblemById);

// Admin-only routes (create, update, delete)
router.post('/', authenticateToken, requireAdmin, dsaController.createProblem);
router.put('/:problemId', authenticateToken, requireAdmin, dsaController.updateProblem);
router.delete('/:problemId', authenticateToken, requireAdmin, dsaController.deleteProblem);

module.exports = router;
