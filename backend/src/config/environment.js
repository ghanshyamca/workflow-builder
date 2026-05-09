const Joi = require('joi');
// Do not load .env when running under Jest to avoid interfering with test-controlled env vars
if (!process.env.JEST_WORKER_ID) {
  require('dotenv').config();
}

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  API_VERSION: Joi.string().default('v1'),

  DB_HOST: Joi.string().trim().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().trim().default('workflow_builder'),
  DB_USER: Joi.string().trim().default('postgres'),
  DB_PASSWORD: Joi.string().allow('').default('postgres'),
  DB_POOL_MIN: Joi.number().integer().min(0).max(20).default(2),
  DB_POOL_MAX: Joi.number().integer().min(1).max(50).default(10),

  REDIS_HOST: Joi.string().trim().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_DB: Joi.number().integer().min(0).max(15).default(0),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  JWT_SECRET: Joi.string().min(16).default('your-super-secret-key-change-in-production'),
  JWT_EXPIRE: Joi.string().pattern(/^\d+[smhdw]$/).default('7d'),
  JWT_REFRESH_SECRET: Joi.string().min(16).default('your-refresh-secret-key'),
  JWT_REFRESH_EXPIRE: Joi.string().pattern(/^\d+[smhdw]$/).default('30d'),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly').default('info'),
  LOG_DIR: Joi.string().default('./logs'),

  WEBHOOK_SECRET_KEY: Joi.string().allow('').default('your-webhook-secret-key'),
  WEBHOOK_TIMEOUT: Joi.number().integer().min(1000).max(120000).default(30000),

  HTTP_REQUEST_TIMEOUT: Joi.number().integer().min(1000).max(120000).default(30000),
  HTTP_REQUEST_MAX_RETRIES: Joi.number().integer().min(0).max(10).default(3),

  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).max(24 * 60 * 60 * 1000).default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(1).max(10000).default(100),

  CORS_ORIGIN: Joi.string().uri({ allowRelative: false }).default('http://localhost:3001'),
  CORS_CREDENTIALS: Joi.boolean().truthy('true').falsy('false').default(true),

  FRONTEND_URL: Joi.string().uri({ allowRelative: false }).default('http://localhost:3001'),
  SMTP_HOST: Joi.string().allow('').default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().allow('').default('your-email@gmail.com'),
  SMTP_PASS: Joi.string().allow('').default('your-app-password'),
  SMTP_FROM: Joi.string().allow('').default('noreply@workflowbuilder.com'),
  SLACK_BOT_TOKEN: Joi.string().allow('').default(''),
  SLACK_WEBHOOK_URL: Joi.string().allow('').default(''),
  SLACK_NOTIFY_TIMEOUT_MS: Joi.number().integer().min(1000).max(120000).default(10000),
}).unknown(true);

// Fast fail against raw process.env for production secrets to avoid test flakiness
if (process.env.NODE_ENV === 'production') {
  const weakSecrets = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-key-change-in-production') weakSecrets.push('JWT_SECRET');
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'your-refresh-secret-key') weakSecrets.push('JWT_REFRESH_SECRET');
  if (!process.env.WEBHOOK_SECRET_KEY || process.env.WEBHOOK_SECRET_KEY === 'your-webhook-secret-key') weakSecrets.push('WEBHOOK_SECRET_KEY');
  if (weakSecrets.length > 0) {
    throw new Error(`Environment validation failed: production secrets must be set (${weakSecrets.join(', ')})`);
  }
}

const { value: env, error } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: false,
});

if (error) {
  throw new Error(`Environment validation failed: ${error.message}`);
}

if (env.NODE_ENV === 'production') {
  const weakSecrets = [];

  if (!env.JWT_SECRET || env.JWT_SECRET === 'your-super-secret-key-change-in-production') {
    weakSecrets.push('JWT_SECRET');
  }
  if (!env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET === 'your-refresh-secret-key') {
    weakSecrets.push('JWT_REFRESH_SECRET');
  }
  if (!env.WEBHOOK_SECRET_KEY || env.WEBHOOK_SECRET_KEY === 'your-webhook-secret-key') {
    weakSecrets.push('WEBHOOK_SECRET_KEY');
  }

  if (weakSecrets.length > 0) {
    throw new Error(`Environment validation failed: production secrets must be set (${weakSecrets.join(', ')})`);
  }
}

module.exports = Object.freeze({
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiVersion: env.API_VERSION,
  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    poolMin: env.DB_POOL_MIN,
    poolMax: env.DB_POOL_MAX,
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    db: env.REDIS_DB,
    password: env.REDIS_PASSWORD,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expire: env.JWT_EXPIRE,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpire: env.JWT_REFRESH_EXPIRE,
  },
  logging: {
    level: env.LOG_LEVEL,
    dir: env.LOG_DIR,
  },
  webhook: {
    secretKey: env.WEBHOOK_SECRET_KEY,
    timeout: env.WEBHOOK_TIMEOUT,
  },
  http: {
    requestTimeout: env.HTTP_REQUEST_TIMEOUT,
    maxRetries: env.HTTP_REQUEST_MAX_RETRIES,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_CREDENTIALS,
  },
  frontendUrl: env.FRONTEND_URL,
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
  },
  slack: {
    botToken: env.SLACK_BOT_TOKEN,
    webhookUrl: env.SLACK_WEBHOOK_URL,
    notifyTimeout: env.SLACK_NOTIFY_TIMEOUT_MS,
  },
});