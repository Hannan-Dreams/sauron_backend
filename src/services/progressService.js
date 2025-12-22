const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const dynamoDB = DynamoDBDocumentClient.from(client);
const PROGRESS_TABLE = process.env.USER_PROGRESS_TABLE_NAME || 'user-progress';

/**
 * Get user's progress for all problems
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User progress data
 */
const getUserProgress = async (userId) => {
    try {
        const result = await dynamoDB.send(
            new GetCommand({
                TableName: PROGRESS_TABLE,
                Key: { userId },
            })
        );

        if (result.Item) {
            return result.Item;
        }

        // Return empty progress if not found
        return {
            userId,
            solvedProblems: [],
            progressByLevel: {
                basic: { solved: [], total: 0 },
                medium: { solved: [], total: 0 },
                advanced: { solved: [], total: 0 },
            },
            totalSolved: 0,
            lastUpdated: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error getting user progress:', error);
        throw error;
    }
};

/**
 * Mark a problem as solved
 * @param {string} userId - User ID
 * @param {string} problemId - Problem ID
 * @param {string} level - Problem level (basic, medium, advanced)
 * @returns {Promise<Object>} Updated progress
 */
const markProblemSolved = async (userId, problemId, level) => {
    try {
        // Get current progress
        const currentProgress = await getUserProgress(userId);

        // Check if already solved
        if (currentProgress.solvedProblems.includes(problemId)) {
            return currentProgress;
        }

        // Add to solved problems
        const updatedSolvedProblems = [...currentProgress.solvedProblems, problemId];
        const updatedLevelSolved = [...(currentProgress.progressByLevel[level]?.solved || []), problemId];

        const updatedProgress = {
            userId,
            solvedProblems: updatedSolvedProblems,
            progressByLevel: {
                ...currentProgress.progressByLevel,
                [level]: {
                    solved: updatedLevelSolved,
                    total: currentProgress.progressByLevel[level]?.total || 0,
                },
            },
            totalSolved: updatedSolvedProblems.length,
            lastUpdated: new Date().toISOString(),
        };

        await dynamoDB.send(
            new PutCommand({
                TableName: PROGRESS_TABLE,
                Item: updatedProgress,
            })
        );

        return updatedProgress;
    } catch (error) {
        console.error('Error marking problem as solved:', error);
        throw error;
    }
};

/**
 * Mark a problem as unsolved (remove from solved list)
 * @param {string} userId - User ID
 * @param {string} problemId - Problem ID
 * @param {string} level - Problem level
 * @returns {Promise<Object>} Updated progress
 */
const markProblemUnsolved = async (userId, problemId, level) => {
    try {
        const currentProgress = await getUserProgress(userId);

        // Remove from solved problems
        const updatedSolvedProblems = currentProgress.solvedProblems.filter(id => id !== problemId);
        const updatedLevelSolved = (currentProgress.progressByLevel[level]?.solved || []).filter(id => id !== problemId);

        const updatedProgress = {
            userId,
            solvedProblems: updatedSolvedProblems,
            progressByLevel: {
                ...currentProgress.progressByLevel,
                [level]: {
                    solved: updatedLevelSolved,
                    total: currentProgress.progressByLevel[level]?.total || 0,
                },
            },
            totalSolved: updatedSolvedProblems.length,
            lastUpdated: new Date().toISOString(),
        };

        await dynamoDB.send(
            new PutCommand({
                TableName: PROGRESS_TABLE,
                Item: updatedProgress,
            })
        );

        return updatedProgress;
    } catch (error) {
        console.error('Error marking problem as unsolved:', error);
        throw error;
    }
};

/**
 * Get progress statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Progress statistics
 */
const getProgressStats = async (userId) => {
    try {
        const progress = await getUserProgress(userId);

        return {
            totalSolved: progress.totalSolved || 0,
            basicSolved: progress.progressByLevel?.basic?.solved?.length || 0,
            mediumSolved: progress.progressByLevel?.medium?.solved?.length || 0,
            advancedSolved: progress.progressByLevel?.advanced?.solved?.length || 0,
            lastUpdated: progress.lastUpdated,
        };
    } catch (error) {
        console.error('Error getting progress stats:', error);
        throw error;
    }
};

/**
 * Get leaderboard (top users by problems solved)
 * @param {number} limit - Number of users to return
 * @returns {Promise<Array>} Top users
 */
const getLeaderboard = async (limit = 10) => {
    try {
        const result = await dynamoDB.send(
            new ScanCommand({
                TableName: PROGRESS_TABLE,
            })
        );

        const users = result.Items || [];

        // Sort by total solved (descending)
        users.sort((a, b) => (b.totalSolved || 0) - (a.totalSolved || 0));

        // Return top N users
        return users.slice(0, limit).map(user => ({
            userId: user.userId,
            totalSolved: user.totalSolved || 0,
            basicSolved: user.progressByLevel?.basic?.solved?.length || 0,
            mediumSolved: user.progressByLevel?.medium?.solved?.length || 0,
            advancedSolved: user.progressByLevel?.advanced?.solved?.length || 0,
            lastUpdated: user.lastUpdated,
        }));
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        throw error;
    }
};

module.exports = {
    getUserProgress,
    markProblemSolved,
    markProblemUnsolved,
    getProgressStats,
    getLeaderboard,
};
