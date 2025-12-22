const authService = require('../services/authService');

/**
 * Auth Controller
 * Handles HTTP requests and responses for authentication
 */
class AuthController {
    /**
     * Signup - Create new user account
     * POST /api/auth/signup
     */
    async signup(req, res) {
        try {
            const { email, password, name } = req.body;

            const result = await authService.createUser(email, password, name);

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: result.user,
            });
        } catch (error) {
            console.error('Signup error:', error);

            // Handle specific errors
            if (error.message === 'User with this email already exists') {
                return res.status(409).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error during signup',
            });
        }
    }

    /**
     * Create Admin - Create new admin account (admin only)
     * POST /api/auth/create-admin
     */
    async createAdmin(req, res) {
        try {
            const { email, password, name } = req.body;
            const creatorRole = req.user.role; // From auth middleware

            const result = await authService.createAdminUser(email, password, name, creatorRole);

            res.status(201).json({
                success: true,
                message: 'Admin user created successfully',
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: result.user,
            });
        } catch (error) {
            console.error('Create admin error:', error);

            // Handle specific errors
            if (error.message === 'User with this email already exists') {
                return res.status(409).json({
                    success: false,
                    message: error.message,
                });
            }

            if (error.message === 'Only admins can create admin users') {
                return res.status(403).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error during admin creation',
            });
        }
    }

    /**
     * Login - Authenticate user
     * POST /api/auth/login
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            const result = await authService.loginUser(email, password);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: result.user,
            });
        } catch (error) {
            console.error('Login error:', error);

            // Handle specific errors
            if (error.message === 'Invalid email or password') {
                return res.status(401).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error during login',
            });
        }
    }

    /**
     * Get Current User
     * GET /api/auth/me
     */
    async getCurrentUser(req, res) {
        try {
            const { email } = req.user;

            const user = await authService.getUserByEmail(email);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            // Return user without password
            const { password: _, ...userWithoutPassword } = user;

            res.status(200).json({
                success: true,
                user: userWithoutPassword,
            });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Update User Profile
     * PUT /api/auth/profile
     */
    async updateProfile(req, res) {
        try {
            const { email } = req.user;
            const { name } = req.body;

            const updatedUser = await authService.updateUserProfile(email, name);

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                user: updatedUser,
            });
        } catch (error) {
            console.error('Update profile error:', error);

            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Change Password
     * PUT /api/auth/change-password
     */
    async changePassword(req, res) {
        try {
            const { email } = req.user;
            const { currentPassword, newPassword } = req.body;

            await authService.changeUserPassword(email, currentPassword, newPassword);

            res.status(200).json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error) {
            console.error('Change password error:', error);

            // Handle specific errors
            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            if (error.message === 'Current password is incorrect') {
                return res.status(401).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Refresh Token - Get new access token using refresh token
     * POST /api/auth/refresh
     */
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required',
                });
            }

            const tokens = await authService.refreshTokens(refreshToken);

            res.status(200).json({
                success: true,
                message: 'Tokens refreshed successfully',
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            });
        } catch (error) {
            console.error('Refresh token error:', error);

            // Handle specific errors
            if (error.message === 'Refresh token expired') {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token expired. Please login again.',
                });
            }

            if (error.message === 'Invalid refresh token' || error.message === 'User not found') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token',
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Logout
     * POST /api/auth/logout
     */
    async logout(req, res) {
        // In a stateless JWT system, logout is handled client-side by removing the token
        // This endpoint can be used for logging or token blacklisting if needed
        res.status(200).json({
            success: true,
            message: 'Logout successful',
        });
    }
}

module.exports = new AuthController();
