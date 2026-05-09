const path = require('path');

const envModulePath = path.resolve(__dirname, '../src/config/environment.js');

const loadEnvironment = () => {
  jest.resetModules();
  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(envModulePath);
};

describe('environment validation', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  test('loads with valid production secrets', () => {
    process.env = {
      NODE_ENV: 'production',
      JWT_SECRET: 'this-is-a-long-enough-secret-123',
      JWT_REFRESH_SECRET: 'another-long-enough-refresh-secret-456',
      WEBHOOK_SECRET_KEY: 'yet-another-long-enough-webhook-secret-789',
    };

    const env = loadEnvironment();
    expect(env.nodeEnv).toBe('production');
    expect(env.jwt.secret).toContain('this-is-a-long-enough-secret');
  });

  test('rejects weak production secrets', () => {
    process.env = {
      NODE_ENV: 'production',
      JWT_SECRET: 'your-super-secret-key-change-in-production',
      JWT_REFRESH_SECRET: 'your-refresh-secret-key',
      WEBHOOK_SECRET_KEY: 'your-webhook-secret-key',
    };

    expect(() => loadEnvironment()).toThrow(/production secrets must be set/i);
  });
});
