const authService = require('../../services/auth.service');
const { validatePasswordStrength } = require('../../utils/password');
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require('../validators/auth.validator');

// Register controller
const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.context.label || detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    // Check password strength
    const passwordStrength = validatePasswordStrength(value.password);
    if (!passwordStrength.isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Password does not meet strength requirements',
        details: passwordStrength.errors.map(err => ({
          field: 'password',
          message: err,
        })),
      });
    }

    const result = await authService.registerUser(
      value.email,
      value.username,
      value.password,
      value.firstName,
      value.lastName
    );

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: result,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        status: 'error',
        message: err.message,
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
    });
  }
};

// Login controller
const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.context.label || detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    const result = await authService.loginUser(value.email, value.password);

    res.json({
      status: 'success',
      message: 'Login successful',
      data: result,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        status: 'error',
        message: err.message,
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Login failed',
    });
  }
};

// Refresh tokens controller
const refreshTokens = async (req, res) => {
  try {
    const { error, value } = refreshTokenSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.context.label || detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    const result = await authService.refreshTokens(value.refreshToken);

    res.json({
      status: 'success',
      message: 'Tokens refreshed successfully',
      data: result,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        status: 'error',
        message: err.message,
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Token refresh failed',
    });
  }
};

// Get profile controller
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await authService.getUserProfile(userId);

    res.json({
      status: 'success',
      data: user,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        status: 'error',
        message: err.message,
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to get profile',
    });
  }
};

// Update profile controller
const updateProfile = async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.context.label || detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    const userId = req.user.userId;
    const user = await authService.updateUserProfile(userId, value);

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        status: 'error',
        message: err.message,
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
    });
  }
};

// Change password controller
const changePassword = async (req, res) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.context.label || detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    // Check new password strength
    const passwordStrength = validatePasswordStrength(value.newPassword);
    if (!passwordStrength.isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'New password does not meet strength requirements',
        details: passwordStrength.errors.map(err => ({
          field: 'newPassword',
          message: err,
        })),
      });
    }

    const userId = req.user.userId;
    const result = await authService.changeUserPassword(
      userId,
      value.currentPassword,
      value.newPassword
    );

    res.json({
      status: 'success',
      message: result.message,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        status: 'error',
        message: err.message,
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to change password',
    });
  }
};

module.exports = {
  register,
  login,
  refreshTokens,
  getProfile,
  updateProfile,
  changePassword,
};
