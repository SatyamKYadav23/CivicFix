/**
 * Jest Global Setup and Teardown
 */
process.env.NODE_ENV = 'test';

const prisma = require('../src/config/db');

// Ensure Prisma disconnects after all tests finish
afterAll(async () => {
  await prisma.$disconnect();
});

