const progressService = require('../services/progressService');

/**
 * Progress Controller
 * Handles HTTP requests for user progress tracking
 */
class ProgressController {
    /**
     * Get user's progress
     * GET /api/progress
     */
    async getProgress(req, res) {
        try {
            const userId = req.user.userId;
            const progress = await progressService.getUserProgress(userId);

            res.status(200).json({
                success: true,
                progress,
            });
        } catch (error) {
            console.error('Get progress error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching progress',
            });
        }
    }

    /**
     * Mark problem as solved
     * POST /api/progress/solve
     */
    async solveProblem(req, res) {
        try {
            const userId = req.user.userId;
            const { problemId, level } = req.body;

            if (!problemId || !level) {
                return res.status(400).json({
                    success: false,
                    message: 'problemId and level are required',
                });
            }

            const validLevels = ['basic', 'medium', 'advanced'];
            if (!validLevels.includes(level)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid level. Must be: basic, medium, or advanced',
                });
            }

            const progress = await progressService.markProblemSolved(userId, problemId, level);

            res.status(200).json({
                success: true,
                message: 'Problem marked as solved',
                progress,
            });
        } catch (error) {
            console.error('Solve problem error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while marking problem as solved',
            });
        }
    }

    /**
     * Mark problem as unsolved
     * POST /api/progress/unsolve
     */
    async unsolveProblem(req, res) {
        try {
            const userId = req.user.userId;
            const { problemId, level } = req.body;

            if (!problemId || !level) {
                return res.status(400).json({
                    success: false,
                    message: 'problemId and level are required',
                });
            }

            const progress = await progressService.markProblemUnsolved(userId, problemId, level);

            res.status(200).json({
                success: true,
                message: 'Problem marked as unsolved',
                progress,
            });
        } catch (error) {
            console.error('Unsolve problem error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while marking problem as unsolved',
            });
        }
    }

    /**
     * Get progress statistics
     * GET /api/progress/stats
     */
    async getStats(req, res) {
        try {
            const userId = req.user.userId;
            const stats = await progressService.getProgressStats(userId);

            res.status(200).json({
                success: true,
                stats,
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching statistics',
            });
        }
    }

    /**
     * Get leaderboard
     * GET /api/progress/leaderboard
     */
    async getLeaderboard(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const leaderboard = await progressService.getLeaderboard(limit);

            res.status(200).json({
                success: true,
                leaderboard,
            });
        } catch (error) {
            console.error('Get leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching leaderboard',
            });
        }
    }
}

module.exports = new ProgressController();
