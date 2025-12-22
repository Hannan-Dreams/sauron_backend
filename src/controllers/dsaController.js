const dsaService = require('../services/dsaService');

/**
 * DSA Controller
 * Handles HTTP requests for DSA problem management
 */
class DSAController {
    /**
     * Create new DSA problem (Admin only)
     * POST /api/dsa
     */
    async createProblem(req, res) {
        try {
            const { name, difficulty, level, link, description, tags } = req.body;

            const problem = await dsaService.createProblem({
                name,
                difficulty,
                level,
                link,
                description,
                tags,
            });

            res.status(201).json({
                success: true,
                message: 'DSA problem created successfully',
                problem,
            });
        } catch (error) {
            console.error('Create DSA problem error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while creating problem',
            });
        }
    }

    /**
     * Get all DSA problems
     * GET /api/dsa
     */
    async getAllProblems(req, res) {
        try {
            const problems = await dsaService.getAllProblems();

            res.status(200).json({
                success: true,
                count: problems.length,
                problems,
            });
        } catch (error) {
            console.error('Get all problems error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching problems',
            });
        }
    }

    /**
     * Get problems by level
     * GET /api/dsa/level/:level
     */
    async getProblemsByLevel(req, res) {
        try {
            const { level } = req.params;

            // Validate level
            const validLevels = ['basic', 'medium', 'advanced'];
            if (!validLevels.includes(level)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid level. Must be: basic, medium, or advanced',
                });
            }

            const problems = await dsaService.getProblemsByLevel(level);

            res.status(200).json({
                success: true,
                level,
                count: problems.length,
                problems,
            });
        } catch (error) {
            console.error('Get problems by level error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching problems',
            });
        }
    }

    /**
     * Get single problem by ID
     * GET /api/dsa/:problemId
     */
    async getProblemById(req, res) {
        try {
            const { problemId } = req.params;

            const problem = await dsaService.getProblemById(problemId);

            if (!problem) {
                return res.status(404).json({
                    success: false,
                    message: 'Problem not found',
                });
            }

            res.status(200).json({
                success: true,
                problem,
            });
        } catch (error) {
            console.error('Get problem by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching problem',
            });
        }
    }

    /**
     * Update DSA problem (Admin only)
     * PUT /api/dsa/:problemId
     */
    async updateProblem(req, res) {
        try {
            const { problemId } = req.params;
            const updates = req.body;

            const problem = await dsaService.updateProblem(problemId, updates);

            res.status(200).json({
                success: true,
                message: 'Problem updated successfully',
                problem,
            });
        } catch (error) {
            console.error('Update problem error:', error);

            if (error.message === 'Problem not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error while updating problem',
            });
        }
    }

    /**
     * Delete DSA problem (Admin only)
     * DELETE /api/dsa/:problemId
     */
    async deleteProblem(req, res) {
        try {
            const { problemId } = req.params;

            await dsaService.deleteProblem(problemId);

            res.status(200).json({
                success: true,
                message: 'Problem deleted successfully',
            });
        } catch (error) {
            console.error('Delete problem error:', error);

            if (error.message === 'Problem not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error while deleting problem',
            });
        }
    }
}

module.exports = new DSAController();
