require('dotenv').config();
const app = require('./src/app');

/**
 * Server Entry Point
 */
const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
    console.log('\n🚀 ================================');
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 DynamoDB Table: ${process.env.USERS_TABLE_NAME || 'Users'}`);
    console.log(`🌍 AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log('🚀 ================================\n');
    console.log(`📍 API Documentation: http://localhost:${PORT}/`);
    console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
    console.log('\n✅ Server is ready to accept connections!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n⚠️  SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n⚠️  SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
});

module.exports = app;
