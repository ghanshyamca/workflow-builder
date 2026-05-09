const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('express-async-errors');
require('dotenv').config();

const env = require('./config/environment');
const logger = require('./utils/logger');
const errorHandler = require('./api/middleware/errorHandler');
const authMiddleware = require('./api/middleware/auth');

// Import routes
const authRoutes = require('./api/routes/auth');
const workflowRoutes = require('./api/routes/workflows');
const triggerRoutes = require('./api/routes/triggers');
const executionRoutes = require('./api/routes/executions');

const app = express();
const PORT = env.port;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: env.cors.origin,
  credentials: env.cors.credentials,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API version endpoint
app.get('/api/version', (req, res) => {
  res.json({
    version: env.apiVersion,
    name: 'Workflow Builder API',
    description: 'Workflow automation platform backend',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/triggers', triggerRoutes);
app.use('/api/executions', executionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path,
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server unless running tests
let server = null;
if (env.nodeEnv !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, {
      environment: env.nodeEnv,
      port: PORT,
    });
  });

  // Start scheduler (schedules active cron triggers). Skip in tests.
  try {
    require('./workers/scheduler');
  } catch (e) {
    logger.error('Failed to start scheduler worker', { error: e.message });
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  if (server) server.close(() => {
    logger.info('HTTP server closed');
    // close DB pool then exit
    try {
      const pool = require('./config/database');
      pool.end().finally(() => process.exit(0));
    } catch (e) {
      process.exit(0);
    }
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  if (server) server.close(() => {
    logger.info('HTTP server closed');
    try {
      const pool = require('./config/database');
      pool.end().finally(() => process.exit(0));
    } catch (e) {
      process.exit(0);
    }
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  try {
    const pool = require('./config/database');
    pool.end().finally(() => process.exit(1));
  } catch (e) {
    process.exit(1);
  }
});

module.exports = app;
