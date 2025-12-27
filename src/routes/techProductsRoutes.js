const express = require('express');
const router = express.Router();
const techProductsController = require('../controllers/techProductsController');
const authenticateToken = require('../middleware/auth');
const { upload } = require('../config/s3');

/**
 * Tech Products Routes
 * All routes require authentication for admin operations
 */

// Public routes (no authentication required) - specific routes first
router.get('/search', techProductsController.searchProducts);
router.get('/paginated', techProductsController.getProductsPaginated);
router.get('/category/:category', techProductsController.getProductsByCategory);
router.get('/:productId', techProductsController.getProductById);
router.get('/', techProductsController.getAllProducts);

// Protected routes (admin only)
router.post(
    '/',
    authenticateToken,
    upload.single('image'),
    techProductsController.createProduct
);

router.put(
    '/:productId',
    authenticateToken,
    upload.single('image'),
    techProductsController.updateProduct
);

router.delete(
    '/:productId',
    authenticateToken,
    techProductsController.deleteProduct
);

module.exports = router;
