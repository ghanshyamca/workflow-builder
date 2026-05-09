const logger = require('../../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error Handler', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
  });

  // Validation error
  if (err.isJoi) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      requestId: req.requestId,
      details: err.details.map(detail => ({
        field: detail.context.label || detail.path.join('.'),
        message: detail.message,
      })),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
      requestId: req.requestId,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired',
      requestId: req.requestId,
    });
  }

  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      status: 'error',
      message: 'Duplicate entry',
      requestId: req.requestId,
      field: err.detail,
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      status: 'error',
      message: 'Invalid reference',
      requestId: req.requestId,
      detail: err.detail,
    });
  }

  // Custom app errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      requestId: req.requestId,
      ...(require('../../config/environment').nodeEnv === 'development' && { stack: err.stack }),
    });
  }

  // Default error
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    requestId: req.requestId,
    ...(require('../../config/environment').nodeEnv === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
