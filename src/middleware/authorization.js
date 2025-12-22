/**
 * Role-based authorization middleware
 * Checks if the authenticated user has the required role(s)
 */

/**
 * Middleware to require admin role
 * Must be used after authenticateToken middleware
 */
const requireAdmin = (req, res, next) => {
    try {
        // Check if user is authenticated (should be set by authenticateToken middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        // Check if user has admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required',
            });
        }

        // User is admin, proceed
        next();
    } catch (error) {
        console.error('Authorization error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

/**
 * Middleware factory to require specific role(s)
 * @param {string|string[]} roles - Required role(s)
 * @returns {Function} Express middleware function
 */
const requireRole = (roles) => {
    // Ensure roles is an array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            // Check if user has one of the required roles
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
                });
            }

            // User has required role, proceed
            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    };
};

module.exports = {
    requireAdmin,
    requireRole,
};
