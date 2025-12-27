const techProductsService = require('../services/techProductsService');

/**
 * Tech Products Controller
 * Handles HTTP requests for tech products management
 */

/**
 * Create a new tech product
 * POST /api/tech-products
 */
exports.createProduct = async (req, res) => {
    try {
        const { name, brand, category, price, rating, specs, description, affiliateLink } = req.body;

        // Validate required fields
        if (!name || !brand || !category || !price) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, brand, category, and price are required',
            });
        }

        // Get image URL from uploaded file (S3 location)
        const imageUrl = req.file ? req.file.location : null;

        const productData = {
            name,
            brand,
            category,
            price,
            rating: rating || 0,
            specs: specs ? JSON.parse(specs) : [],
            description: description || '',
            affiliateLink: affiliateLink || '',
            imageUrl,
        };

        const product = await techProductsService.createProduct(productData);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product,
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product',
            error: error.message,
        });
    }
};

/**
 * Get all products
 * GET /api/tech-products
 */
exports.getAllProducts = async (req, res) => {
    try {
        const products = await techProductsService.getAllProducts();

        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message,
        });
    }
};

/**
 * Get products by category
 * GET /api/tech-products/category/:category
 */
exports.getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const products = await techProductsService.getProductsByCategory(category);

        res.status(200).json({
            success: true,
            category,
            count: products.length,
            data: products,
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message,
        });
    }
};

/**
 * Get product by ID
 * GET /api/tech-products/:productId
 */
exports.getProductById = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await techProductsService.getProductById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        res.status(200).json({
            success: true,
            data: product,
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product',
            error: error.message,
        });
    }
};

/**
 * Update a product
 * PUT /api/tech-products/:productId
 */
exports.updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updateData = { ...req.body };

        // Parse specs if it's a string
        if (updateData.specs && typeof updateData.specs === 'string') {
            updateData.specs = JSON.parse(updateData.specs);
        }

        // Update image URL if new file uploaded (S3 location)
        if (req.file) {
            updateData.imageUrl = req.file.location;
        }

        const updatedProduct = await techProductsService.updateProduct(productId, updateData);

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct,
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product',
            error: error.message,
        });
    }
};

/**
 * Delete a product
 * DELETE /api/tech-products/:productId
 */
exports.deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const result = await techProductsService.deleteProduct(productId);

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
            data: result,
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product',
            error: error.message,
        });
    }
};

/**
 * Search products
 * GET /api/tech-products/search?q=searchTerm
 */
exports.searchProducts = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required',
            });
        }

        const products = await techProductsService.searchProducts(q);

        res.status(200).json({
            success: true,
            query: q,
            count: products.length,
            data: products,
        });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search products',
            error: error.message,
        });
    }
};

/**
 * Get products with pagination
 * GET /api/tech-products/paginated?limit=20&lastKey=...
 */
exports.getProductsPaginated = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const lastKey = req.query.lastKey ? JSON.parse(req.query.lastKey) : null;

        const result = await techProductsService.getProductsPaginated(limit, lastKey);

        res.status(200).json({
            success: true,
            count: result.items.length,
            hasMore: result.hasMore,
            lastEvaluatedKey: result.lastEvaluatedKey,
            data: result.items,
        });
    } catch (error) {
        console.error('Error fetching paginated products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message,
        });
    }
};
