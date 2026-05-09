const authService = require('../../services/auth.service');
const { validatePasswordStrength } = require('../../utils/password');

// Register controller
const register = async (req, res) => {
  try {
    // Check password strength
    const passwordStrength = validatePasswordStrength(req.body.password);
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
      req.body.email,
      req.body.username,
      req.body.password,
      req.body.firstName,
      req.body.lastName
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
    const result = await authService.loginUser(req.body.email, req.body.password);

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
    const result = await authService.refreshTokens(req.body.refreshToken);

    // Normalize response to include top-level accessToken/refreshToken for tests
    res.json({
      status: 'success',
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: result.tokens?.accessToken,
        refreshToken: result.tokens?.refreshToken,
        tokens: result.tokens,
        user: result.user,
      },
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
    const userId = req.user.userId;
    const user = await authService.updateUserProfile(userId, req.body);

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
    // Check new password strength
    const passwordStrength = validatePasswordStrength(req.body.newPassword);
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
      req.body.currentPassword,
      req.body.newPassword
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
