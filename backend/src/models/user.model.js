const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get user by email
const getUserByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
};

// Get user by ID
const getUserById = async (id) => {
  const query = 'SELECT id, email, username, first_name, last_name, profile_picture_url, is_active, created_at, last_login FROM users WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Get user by username
const getUserByUsername = async (username) => {
  const query = 'SELECT * FROM users WHERE username = $1';
  const result = await pool.query(query, [username]);
  return result.rows[0];
};

// Create new user
const createUser = async (email, username, passwordHash, firstName = null, lastName = null) => {
  const id = uuidv4();
  const query = `
    INSERT INTO users (id, email, username, password_hash, first_name, last_name, is_active, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING id, email, username, first_name, last_name, is_active, created_at
  `;
  const result = await pool.query(query, [id, email, username, passwordHash, firstName, lastName, true]);
  return result.rows[0];
};

// Update user
const updateUser = async (id, updates) => {
  const allowedFields = ['first_name', 'last_name', 'profile_picture_url', 'is_active'];
  const fields = [];
  const values = [];
  let paramCount = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  }

  if (fields.length === 0) {
    return getUserById(id);
  }

  values.push(id);
  const query = `
    UPDATE users
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount}
    RETURNING id, email, username, first_name, last_name, profile_picture_url, is_active, created_at, updated_at
  `;
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Update last login
const updateLastLogin = async (userId) => {
  const query = 'UPDATE users SET last_login = NOW() WHERE id = $1';
  await pool.query(query, [userId]);
};

// Update password
const updatePassword = async (userId, passwordHash) => {
  const query = 'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2';
  await pool.query(query, [passwordHash, userId]);
};

// Delete user
const deleteUser = async (id) => {
  const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Check if user exists
const userExists = async (email, username) => {
  const query = 'SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1';
  const result = await pool.query(query, [email, username]);
  return result.rows.length > 0;
};

module.exports = {
  getUserByEmail,
  getUserById,
  getUserByUsername,
  createUser,
  updateUser,
  updateLastLogin,
  updatePassword,
  deleteUser,
  userExists,
};
