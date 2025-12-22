/**
 * Validation Middleware
 * Validates request body for different operations
 */

/**
 * Validate signup request
 */
const validateSignup = (req, res, next) => {
    const { email, password, name } = req.body;

    // Check required fields
    if (!email || !password || !name) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format'
        });
    }

    // Password length validation
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters'
        });
    }

    next();
};

/**
 * Validate login request
 */
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    next();
};

/**
 * Validate profile update request
 */
const validateProfileUpdate = (req, res, next) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Name is required'
        });
    }

    next();
};

/**
 * Validate password change request
 */
const validatePasswordChange = (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Current and new password are required'
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'New password must be at least 6 characters'
        });
    }

    next();
};

module.exports = {
    validateSignup,
    validateLogin,
    validateProfileUpdate,
    validatePasswordChange,
};
