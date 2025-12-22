const { dynamoDB } = require('../config/database');
const { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const TECH_PRODUCTS_TABLE = process.env.TECH_PRODUCTS_TABLE_NAME || 'TechProducts';

/**
 * Tech Products Service
 * Handles all database operations for tech products
 */
class TechProductsService {
    /**
     * Create a new tech product
     */
    async createProduct(productData) {
        const timestamp = new Date().toISOString();

        const product = {
            productId: `${productData.category}-${Date.now()}`,
            ...productData,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        const params = {
            TableName: TECH_PRODUCTS_TABLE,
            Item: product,
        };

        await dynamoDB.send(new PutCommand(params));
        return product;
    }

    /**
     * Get product by ID
     */
    async getProductById(productId) {
        const params = {
            TableName: TECH_PRODUCTS_TABLE,
            Key: { productId },
        };

        const result = await dynamoDB.send(new GetCommand(params));
        return result.Item;
    }

    /**
     * Get all products by category
     */
    async getProductsByCategory(category) {
        const params = {
            TableName: TECH_PRODUCTS_TABLE,
            FilterExpression: 'category = :category',
            ExpressionAttributeValues: {
                ':category': category,
            },
        };

        const result = await dynamoDB.send(new ScanCommand(params));
        return result.Items || [];
    }

    /**
     * Get all products
     */
    async getAllProducts() {
        const params = {
            TableName: TECH_PRODUCTS_TABLE,
        };

        const result = await dynamoDB.send(new ScanCommand(params));
        return result.Items || [];
    }

    /**
     * Update a product
     */
    async updateProduct(productId, updateData) {
        const timestamp = new Date().toISOString();

        // Build update expression dynamically
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        Object.keys(updateData).forEach((key, index) => {
            const placeholder = `#attr${index}`;
            const valuePlaceholder = `:val${index}`;

            updateExpressions.push(`${placeholder} = ${valuePlaceholder}`);
            expressionAttributeNames[placeholder] = key;
            expressionAttributeValues[valuePlaceholder] = updateData[key];
        });

        // Add updatedAt timestamp
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = timestamp;

        const params = {
            TableName: TECH_PRODUCTS_TABLE,
            Key: { productId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        };

        const result = await dynamoDB.send(new UpdateCommand(params));
        return result.Attributes;
    }

    /**
     * Delete a product
     */
    async deleteProduct(productId) {
        const params = {
            TableName: TECH_PRODUCTS_TABLE,
            Key: { productId },
        };

        await dynamoDB.send(new DeleteCommand(params));
        return { success: true, productId };
    }

    /**
     * Search products by name or brand
     */
    async searchProducts(searchTerm) {
        const params = {
            TableName: TECH_PRODUCTS_TABLE,
            FilterExpression: 'contains(#name, :searchTerm) OR contains(#brand, :searchTerm)',
            ExpressionAttributeNames: {
                '#name': 'name',
                '#brand': 'brand',
            },
            ExpressionAttributeValues: {
                ':searchTerm': searchTerm,
            },
        };

        const result = await dynamoDB.send(new ScanCommand(params));
        return result.Items || [];
    }

    /**
     * Get products with pagination
     */
    async getProductsPaginated(limit = 20, lastEvaluatedKey = null) {
        const params = {
            TableName: TECH_PRODUCTS_TABLE,
            Limit: limit,
        };

        if (lastEvaluatedKey) {
            params.ExclusiveStartKey = lastEvaluatedKey;
        }

        const result = await dynamoDB.send(new ScanCommand(params));

        return {
            items: result.Items || [],
            lastEvaluatedKey: result.LastEvaluatedKey,
            hasMore: !!result.LastEvaluatedKey,
        };
    }
}

module.exports = new TechProductsService();
