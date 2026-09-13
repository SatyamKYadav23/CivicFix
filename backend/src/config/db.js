const { PrismaClient } = require('@prisma/client');
const config = require('./env');

let prisma = null;

try {
  prisma = new PrismaClient({
    log: config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
} catch (error) {
  // Prisma Client initializes once models are added in Phase 1 and `npx prisma generate` is run
  prisma = null;
}

module.exports = prisma;


