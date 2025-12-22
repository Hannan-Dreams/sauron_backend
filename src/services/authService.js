const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamoDB, USERS_TABLE } = require('../config/database');
const JWT_CONFIG = require('../config/jwt');

/**
 * Generate Access Token (short-lived)
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} role - User role (admin or user)
 * @returns {string} JWT access token
 */
const generateAccessToken = (userId, email, role) => {
    return jwt.sign(
        { userId, email, role, type: 'access' },
        JWT_CONFIG.accessToken.secret,
        { expiresIn: JWT_CONFIG.accessToken.expiresIn }
    );
};

/**
 * Generate Refresh Token (long-lived)
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} role - User role (admin or user)
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (userId, email, role) => {
    return jwt.sign(
        { userId, email, role, type: 'refresh' },
        JWT_CONFIG.refreshToken.secret,
        { expiresIn: JWT_CONFIG.refreshToken.expiresIn }
    );
};

/**
 * Generate both access and refresh tokens
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} role - User role (admin or user)
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokens = (userId, email, role) => {
    return {
        accessToken: generateAccessToken(userId, email, role),
        refreshToken: generateRefreshToken(userId, email, role),
    };
};

/**
 * Verify and decode refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_CONFIG.refreshToken.secret);
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Refresh token expired');
        }
        throw new Error('Invalid refresh token');
    }
};

/**
 * Hash password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

/**
 * Get user by email from database
 * @param {string} email - User email
 * @returns {Promise<Object|undefined>} User object or undefined
 */
const getUserByEmail = async (email) => {
    const result = await dynamoDB.send(
        new GetCommand({
            TableName: USERS_TABLE,
            Key: { email },
        })
    );
    return result.Item;
};

/**
 * Check if any users exist in the database
 * @returns {Promise<boolean>} True if at least one user exists
 */
const hasAnyUsers = async () => {
    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
    const result = await dynamoDB.send(
        new ScanCommand({
            TableName: USERS_TABLE,
            Limit: 1, // We only need to know if at least one exists
        })
    );
    return result.Items && result.Items.length > 0;
};

/**
 * Create new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User name
 * @returns {Promise<Object>} Object containing tokens and user data
 */
const createUser = async (email, password, name) => {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine role: First user is admin, rest are regular users
    const usersExist = await hasAnyUsers();
    const role = usersExist ? 'user' : 'admin';

    // Generate tokens with role
    const tokens = generateTokens(userId, email, role);

    // Create user object
    const newUser = {
        userId,
        email,
        name,
        password: hashedPassword,
        role,
        refreshToken: tokens.refreshToken,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // Save to DynamoDB
    await dynamoDB.send(
        new PutCommand({
            TableName: USERS_TABLE,
            Item: newUser,
        })
    );

    // Return user without password and refresh token
    const { password: _, refreshToken: __, ...userWithoutPassword } = newUser;

    return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: userWithoutPassword,
    };
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Object containing tokens and user data
 */
const loginUser = async (email, password) => {
    // Get user from database
    const user = await getUserByEmail(email);

    if (!user) {
        throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

    // Generate new tokens with role
    const tokens = generateTokens(user.userId, user.email, user.role || 'user');

    // Update refresh token in database
    const updatedUser = {
        ...user,
        refreshToken: tokens.refreshToken,
        updatedAt: new Date().toISOString(),
    };

    await dynamoDB.send(
        new PutCommand({
            TableName: USERS_TABLE,
            Item: updatedUser,
        })
    );

    // Return user without password and refresh token
    const { password: _, refreshToken: __, ...userWithoutPassword } = updatedUser;

    return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: userWithoutPassword,
    };
};

/**
 * Update user profile
 * @param {string} email - User email
 * @param {string} name - New name
 * @returns {Promise<Object>} Updated user object without password
 */
const updateUserProfile = async (email, name) => {
    // Get current user
    const user = await getUserByEmail(email);

    if (!user) {
        throw new Error('User not found');
    }

    // Update user
    const updatedUser = {
        ...user,
        name,
        updatedAt: new Date().toISOString(),
    };

    await dynamoDB.send(
        new PutCommand({
            TableName: USERS_TABLE,
            Item: updatedUser,
        })
    );

    // Return updated user without password
    const { password: _, ...userWithoutPassword } = updatedUser;

    return userWithoutPassword;
};

/**
 * Change user password
 * @param {string} email - User email
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} True if password changed successfully
 */
const changeUserPassword = async (email, currentPassword, newPassword) => {
    // Get user from database
    const user = await getUserByEmail(email);

    if (!user) {
        throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    const updatedUser = {
        ...user,
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
    };

    await dynamoDB.send(
        new PutCommand({
            TableName: USERS_TABLE,
            Item: updatedUser,
        })
    );

    return true;
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} Object containing new tokens
 */
const refreshTokens = async (refreshToken) => {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user from database
    const user = await getUserByEmail(decoded.email);

    if (!user) {
        throw new Error('User not found');
    }

    // Verify that the refresh token matches the one stored in database
    if (user.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
    }

    // Generate new tokens with role
    const tokens = generateTokens(user.userId, user.email, user.role || 'user');

    // Update refresh token in database
    const updatedUser = {
        ...user,
        refreshToken: tokens.refreshToken,
        updatedAt: new Date().toISOString(),
    };

    await dynamoDB.send(
        new PutCommand({
            TableName: USERS_TABLE,
            Item: updatedUser,
        })
    );

    return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    };
};

/**
 * Create new admin user (only admins can do this)
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User name
 * @param {string} creatorRole - Role of the user creating this admin
 * @returns {Promise<Object>} Object containing tokens and user data
 */
const createAdminUser = async (email, password, name, creatorRole) => {
    // Only admins can create admin users
    if (creatorRole !== 'admin') {
        throw new Error('Only admins can create admin users');
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Set role as admin
    const role = 'admin';

    // Generate tokens with admin role
    const tokens = generateTokens(userId, email, role);

    // Create admin user object
    const newAdmin = {
        userId,
        email,
        name,
        password: hashedPassword,
        role,
        refreshToken: tokens.refreshToken,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // Save to DynamoDB
    await dynamoDB.send(
        new PutCommand({
            TableName: USERS_TABLE,
            Item: newAdmin,
        })
    );

    // Return user without password and refresh token
    const { password: _, refreshToken: __, ...userWithoutPassword } = newAdmin;

    return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: userWithoutPassword,
    };
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyRefreshToken,
    hashPassword,
    comparePassword,
    getUserByEmail,
    hasAnyUsers,
    createUser,
    createAdminUser,
    loginUser,
    updateUserProfile,
    changeUserPassword,
    refreshTokens,
};
