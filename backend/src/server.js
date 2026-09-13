const app = require('./app');
const config = require('./config/env');
const prisma = require('./config/db');

const PORT = config.port || 5000;

const server = app.listen(PORT, () => {
  console.log('==============================================');
  console.log(` CivicFix Backend API running on port ${PORT}`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log('==============================================');
});

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  try {
    if (prisma && typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
      console.log('Database connection disconnected.');
    }
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

module.exports = server;

