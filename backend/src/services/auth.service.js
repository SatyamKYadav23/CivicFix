const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { generateToken } = require('../utils/jwt.utils');
const { sanitizeUser } = require('../utils/userSerializer');
const AppError = require('../utils/appError');

/**
 * Authentication Service - Handles registration, login, token issuance, and profile retrieval
 */
class AuthService {
  /**
   * Registers a new Citizen user
   * @param {object} registrationData - { name, email, password, phone, address }
   * @returns {Promise<{ user: object, token: string }>}
   */
  async register(registrationData) {
    const normalizedEmail = registrationData.email.toLowerCase().trim();

    // 1. Check whether email already exists
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    // 2. Hash password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registrationData.password, saltRounds);

    // 3. Create user in database (strictly enforcing CITIZEN role)
    const newUser = await userRepository.create({
      name: registrationData.name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: registrationData.phone ? registrationData.phone.trim() : null,
      address: registrationData.address ? registrationData.address.trim() : null,
      role: 'CITIZEN', // Default & enforce public registration to CITIZEN
      status: 'ACTIVE',
    });

    // 4. Generate JWT
    const token = generateToken(newUser);

    // 5. Return sanitized user info and token (password NEVER returned)
    return {
      user: sanitizeUser(newUser),
      token,
    };
  }

  /**
   * Authenticates user credentials and generates JWT
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ user: object, token: string }>}
   */
  async login(email, password) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find user by email
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    // 2. Verify hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    // 3. Check if account is active
    if (user.status === 'INACTIVE') {
      throw new AppError('Your account is currently inactive. Please contact administration.', 403);
    }

    // 4. Generate JWT
    const token = generateToken(user);

    // 5. Return safe user info and token
    return {
      user: sanitizeUser(user),
      token,
    };
  }

  /**
   * Retrieves current user profile from database
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User belonging to this token no longer exists.', 404);
    }

    return sanitizeUser(user);
  }

  /**
   * Handles logout confirmation
   * In a stateless JWT architecture, the client discards the token.
   */
  logout() {
    return {
      message: 'Logged out successfully. Please discard the authentication token from client storage.',
    };
  }
}

module.exports = new AuthService();

