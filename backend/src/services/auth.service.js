const User = require('../models/user.model');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const logger = require('../utils/logger');

// Register new user
const registerUser = async (email, username, password, firstName, lastName) => {
  try {
    // Check if user already exists
    const existingUser = await User.userExists(email, username);
    if (existingUser) {
      const error = new Error('User with this email or username already exists');
      error.statusCode = 409; // Conflict
      throw error;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await User.createUser(email, username, passwordHash, firstName, lastName);

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.username);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      tokens,
    };
  } catch (error) {
    logger.error('Error registering user', { error: error.message });
    throw error;
  }
};

// Login user
const loginUser = async (email, password) => {
  try {
    // Find user by email
    const user = await User.getUserByEmail(email);

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401; // Unauthorized
      throw error;
    }

    // Check if user is active
    if (!user.is_active) {
      const error = new Error('Account is inactive');
      error.statusCode = 403; // Forbidden
      throw error;
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      logger.warn('Failed login attempt', {
        email,
        userId: user.id,
      });

      const error = new Error('Invalid email or password');
      error.statusCode = 401; // Unauthorized
      throw error;
    }

    // Update last login
    await User.updateLastLogin(user.id);

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
    });

    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.username);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      tokens,
    };
  } catch (error) {
    logger.error('Error logging in user', { error: error.message });
    throw error;
  }
};

// Refresh tokens
const refreshTokens = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user
    const user = await User.getUserById(decoded.userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404; // Not Found
      throw error;
    }

    if (!user.is_active) {
      const error = new Error('Account is inactive');
      error.statusCode = 403; // Forbidden
      throw error;
    }

    // Generate new tokens
    const tokens = generateTokens(user.id, user.email, user.username);

    logger.info('Tokens refreshed successfully', {
      userId: user.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      tokens,
    };
  } catch (error) {
    logger.error('Error refreshing tokens', { error: error.message });
    const err = new Error('Invalid refresh token');
    err.statusCode = 401; // Unauthorized
    throw err;
  }
};

// Get current user profile
const getUserProfile = async (userId) => {
  try {
    const user = await User.getUserById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404; // Not Found
      throw error;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      profilePictureUrl: user.profile_picture_url,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    };
  } catch (error) {
    logger.error('Error getting user profile', { error: error.message });
    throw error;
  }
};

// Update user profile
const updateUserProfile = async (userId, updates) => {
  try {
    const user = await User.updateUser(userId, {
      first_name: updates.firstName,
      last_name: updates.lastName,
    });

    logger.info('User profile updated', {
      userId,
      fields: Object.keys(updates),
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      profilePictureUrl: user.profile_picture_url,
      isActive: user.is_active,
      createdAt: user.created_at,
    };
  } catch (error) {
    logger.error('Error updating user profile', { error: error.message });
    throw error;
  }
};

// Change password
const changeUserPassword = async (userId, currentPassword, newPassword) => {
  try {
    // Get user with password hash
    const user = await User.getUserByEmail((await User.getUserById(userId)).email);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404; // Not Found
      throw error;
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 401; // Unauthorized
      throw error;
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await User.updatePassword(userId, newPasswordHash);

    logger.info('User password changed', {
      userId,
    });

    return { message: 'Password changed successfully' };
  } catch (error) {
    logger.error('Error changing user password', { error: error.message });
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshTokens,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
};
