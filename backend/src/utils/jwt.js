const jwt = require('jsonwebtoken');
const env = require('../config/environment');

// Generate access token
const generateAccessToken = (userId, email, username) => {
  const payload = {
    userId,
    email,
    username,
    type: 'access',
  };

  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expire,
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh',
  };

  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpire,
  });
};

// Generate both tokens
const generateTokens = (userId, email, username) => {
  const accessToken = generateAccessToken(userId, email, username);
  const refreshToken = generateRefreshToken(userId);

  return {
    accessToken,
    refreshToken,
    expiresIn: getTokenExpiry(env.jwt.expire),
    tokenType: 'Bearer',
  };
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, env.jwt.refreshSecret);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

// Decode token without verification
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

// Get token expiry in seconds
const getTokenExpiry = (expireString) => {
  const units = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };

  const match = expireString.match(/^(\d+)([smhdw])$/);
  if (!match) return 604800; // Default 7 days

  const value = parseInt(match[1]);
  const unit = match[2];
  return value * (units[unit] || 1);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiry,
};
