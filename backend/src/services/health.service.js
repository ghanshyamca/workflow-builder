const pool = require('../config/database');

const checkHealth = async () => {
  const result = {
    status: 'ok',
    services: {
      database: 'ok',
    },
  };

  try {
    await pool.query('SELECT 1');
  } catch (err) {
    result.status = 'degraded';
    result.services.database = 'unavailable';
    result.error = 'Database connectivity check failed';
  }

  return result;
};

module.exports = {
  checkHealth,
};