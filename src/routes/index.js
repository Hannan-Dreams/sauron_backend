const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const dsaRoutes = require('./dsaRoutes');
const progressRoutes = require('./progressRoutes');
const techProductsRoutes = require('./techProductsRoutes');

/**
 * Main Router
 * Combines all route modules
 */

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// Auth routes
router.use('/auth', authRoutes);

// DSA routes
router.use('/dsa', dsaRoutes);

// Progress routes
router.use('/progress', progressRoutes);

// Tech Products routes
router.use('/tech-products', techProductsRoutes);

module.exports = router;
