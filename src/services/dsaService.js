const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const dynamoDB = DynamoDBDocumentClient.from(client);
const DSA_TABLE = process.env.DSA_TABLE_NAME || 'dsa-problems';

/**
 * Create a new DSA problem
 * @param {Object} problemData - Problem data
 * @returns {Promise<Object>} Created problem
 */
const createProblem = async (problemData) => {
    const { name, difficulty, level, link, description, tags } = problemData;

    // Create problem ID
    const problemId = `problem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newProblem = {
        problemId,
        name,
        difficulty, // Easy, Medium, Hard
        level, // basic, medium, advanced
        link,
        description: description || '',
        tags: tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await dynamoDB.send(
        new PutCommand({
            TableName: DSA_TABLE,
            Item: newProblem,
        })
    );

    return newProblem;
};

/**
 * Get all DSA problems
 * @returns {Promise<Array>} Array of problems
 */
const getAllProblems = async () => {
    const result = await dynamoDB.send(
        new ScanCommand({
            TableName: DSA_TABLE,
        })
    );

    return result.Items || [];
};

/**
 * Get problems by level
 * @param {string} level - Level (basic, medium, advanced)
 * @returns {Promise<Array>} Array of problems
 */
const getProblemsByLevel = async (level) => {
    const result = await dynamoDB.send(
        new ScanCommand({
            TableName: DSA_TABLE,
            FilterExpression: '#level = :level',
            ExpressionAttributeNames: {
                '#level': 'level',
            },
            ExpressionAttributeValues: {
                ':level': level,
            },
        })
    );

    return result.Items || [];
};

/**
 * Get problem by ID
 * @param {string} problemId - Problem ID
 * @returns {Promise<Object>} Problem object
 */
const getProblemById = async (problemId) => {
    const result = await dynamoDB.send(
        new GetCommand({
            TableName: DSA_TABLE,
            Key: { problemId },
        })
    );

    return result.Item;
};

/**
 * Update a DSA problem
 * @param {string} problemId - Problem ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated problem
 */
const updateProblem = async (problemId, updates) => {
    const problem = await getProblemById(problemId);

    if (!problem) {
        throw new Error('Problem not found');
    }

    const updatedProblem = {
        ...problem,
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    await dynamoDB.send(
        new PutCommand({
            TableName: DSA_TABLE,
            Item: updatedProblem,
        })
    );

    return updatedProblem;
};

/**
 * Delete a DSA problem
 * @param {string} problemId - Problem ID
 * @returns {Promise<boolean>} True if deleted
 */
const deleteProblem = async (problemId) => {
    const problem = await getProblemById(problemId);

    if (!problem) {
        throw new Error('Problem not found');
    }

    await dynamoDB.send(
        new DeleteCommand({
            TableName: DSA_TABLE,
            Key: { problemId },
        })
    );

    return true;
};

module.exports = {
    createProblem,
    getAllProblems,
    getProblemsByLevel,
    getProblemById,
    updateProblem,
    deleteProblem,
};
