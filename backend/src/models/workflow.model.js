const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Create workflow
const createWorkflow = async (userId, name, description = null, definition = {}) => {
  const id = uuidv4();
  const query = `
    INSERT INTO workflows (id, user_id, name, description, definition, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    RETURNING id, user_id, name, description, definition, status, created_at, updated_at
  `;
  const result = await pool.query(query, [id, userId, name, description, definition, 'draft']);
  return result.rows[0];
};

// Get workflows for a user (with pagination)
const getWorkflowsByUser = async (userId, limit = 50, offset = 0) => {
  const query = `
    SELECT id, user_id, name, description, definition, status, created_at, updated_at, published_at
    FROM workflows
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await pool.query(query, [userId, limit, offset]);
  return result.rows;
};

// Get workflow by id
const getWorkflowById = async (id) => {
  const query = `
    SELECT id, user_id, name, description, definition, status, created_at, updated_at, published_at
    FROM workflows
    WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Update workflow (only allowed fields)
const updateWorkflow = async (id, updates = {}) => {
  const allowed = ['name', 'description', 'definition', 'status'];
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }

  if (fields.length === 0) {
    return getWorkflowById(id);
  }

  values.push(id);
  const query = `
    UPDATE workflows
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING id, user_id, name, description, definition, status, created_at, updated_at, published_at
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Delete workflow
const deleteWorkflow = async (id) => {
  const query = `DELETE FROM workflows WHERE id = $1 RETURNING id`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Publish workflow
const publishWorkflow = async (id) => {
  const query = `
    UPDATE workflows
    SET status = 'published', published_at = NOW(), updated_at = NOW()
    WHERE id = $1
    RETURNING id, user_id, name, description, definition, status, created_at, updated_at, published_at
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  createWorkflow,
  getWorkflowsByUser,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  publishWorkflow,
};
