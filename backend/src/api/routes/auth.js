const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const {
	registerSchema,
	loginSchema,
	refreshTokenSchema,
	updateProfileSchema,
	changePasswordSchema,
} = require('../validators/auth.validator');

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { email, username, password, firstName?, lastName? }
 */
router.post('/register', validateRequest(registerSchema), authController.register);

/**
 * POST /api/auth/login
 * Login with email and password
 * Body: { email, password }
 */
router.post('/login', validateRequest(loginSchema), authController.login);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Body: { refreshToken }
 */
router.post('/refresh', validateRequest(refreshTokenSchema), authController.refreshTokens);

/**
 * GET /api/auth/profile
 * Get current user profile (requires auth)
 * Headers: Authorization: Bearer <accessToken>
 */
router.get('/profile', auth, authController.getProfile);

/**
 * PUT /api/auth/profile
 * Update current user profile (requires auth)
 * Headers: Authorization: Bearer <accessToken>
 * Body: { firstName?, lastName? }
 */
router.put('/profile', auth, validateRequest(updateProfileSchema), authController.updateProfile);

/**
 * POST /api/auth/change-password
 * Change user password (requires auth)
 * Headers: Authorization: Bearer <accessToken>
 * Body: { currentPassword, newPassword, confirmPassword }
 */
router.post('/change-password', auth, validateRequest(changePasswordSchema), authController.changePassword);

module.exports = router;
