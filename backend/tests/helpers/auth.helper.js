const bcrypt = require('bcryptjs');
const prisma = require('../../src/config/db');
const { generateToken } = require('../../src/utils/jwt.utils');

let cachedPasswordHash = null;

async function getPasswordHash() {
  if (!cachedPasswordHash) {
    cachedPasswordHash = await bcrypt.hash('TestPass123!', 10);
  }
  return cachedPasswordHash;
}

/**
 * Creates an isolated test user and returns { user, token, headers }
 */
async function createTestUser(overrides = {}) {
  const timestamp = Date.now() + Math.floor(Math.random() * 100000);
  const passwordHash = await getPasswordHash();

  const role = overrides.role || 'CITIZEN';
  const email = overrides.email || `test_${role.toLowerCase()}_${timestamp}@civicfix.test`;

  const userData = {
    name: overrides.name || `Test ${role} ${timestamp}`,
    email: email.toLowerCase(),
    password: passwordHash,
    role: role,
    status: overrides.status || 'ACTIVE',
    phone: overrides.phone || '9988776655',
    address: overrides.address || '123 Test Street',
    department: overrides.department || (role === 'AUTHORITY' ? 'Water Supply & Sewerage' : (role === 'WORKER' ? 'Water Supply & Sewerage' : null)),
  };

  const user = await prisma.user.create({
    data: userData,
  });

  const token = generateToken(user);
  const headers = {
    Authorization: `Bearer ${token}`,
    'x-bypass-rate-limit': 'test-suite-internal',
  };

  return { user, token, headers, rawPassword: 'TestPass123!' };
}

module.exports = {
  createTestUser,
  getPasswordHash,
};

