const { verifyAccessToken } = require('../../utils/jwt');
const logger = require('../../utils/logger');

/**
 * Middleware to verify JWT access token and attach user info to request
 * Expects Authorization header: Bearer <token>
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
    };

    next();
  } catch (err) {
    logger.warn('Authentication failed', {
      error: err.message,
      ip: req.ip,
    });

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Access token has expired',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid access token',
      });
    }

    res.status(401).json({
      status: 'error',
      message: 'Authentication failed',
    });
  }
};

module.exports = authenticateToken;
