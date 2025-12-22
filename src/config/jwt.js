/**
 * JWT Configuration
 */
const JWT_CONFIG = {
    // Access Token Configuration
    accessToken: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h', // Changed from 20m to 24h
    },
    // Refresh Token Configuration
    refreshToken: {
        secret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    // Legacy support (for backward compatibility)
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
};

module.exports = JWT_CONFIG;
