const pool = require('../config/database');

const query = (text, params) => {
  // Support '?' placeholders (from some tests) by converting to $1, $2... for pg
  if (params && params.length && text.includes('?')) {
    let i = 0;
    const converted = text.replace(/\?/g, () => {
      i += 1;
      return `$${i}`;
    });
    return pool.query(converted, params);
  }
  return pool.query(text, params);
};

module.exports = { query, pool };
