const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Create trigger
const createTrigger = async (workflowId, triggerType, data) => {
  const id = uuidv4();
  const isActive = data.isActive !== undefined ? data.isActive : true;
  
  const query = `
    INSERT INTO triggers 
    (id, workflow_id, trigger_type, is_active, webhook_url, webhook_secret, cron_expression, timezone, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING *
  `;
  
  const values = [
    id,
    workflowId,
    triggerType,
    isActive,
    triggerType === 'webhook' ? data.webhookUrl : null,
    triggerType === 'webhook' ? data.webhookSecret : null,
    triggerType === 'schedule' ? data.cronExpression : null,
    triggerType === 'schedule' ? (data.timezone || 'UTC') : null,
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Get triggers by workflow
const getTriggersByWorkflow = async (workflowId, options = {}) => {
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  
  const query = `
    SELECT * FROM triggers 
    WHERE workflow_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  
  const result = await pool.query(query, [workflowId, limit, offset]);
  return result.rows;
};

// Get trigger by ID
const getTriggerById = async (id) => {
  const query = 'SELECT * FROM triggers WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Update trigger
const updateTrigger = async (id, updates) => {
  const allowedFields = ['trigger_type', 'is_active', 'webhook_url', 'webhook_secret', 'cron_expression', 'timezone'];
  const fields = [];
  const values = [];
  let paramCount = 1;
  
  for (const [key, value] of Object.entries(updates)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowedFields.includes(snakeKey)) {
      fields.push(`${snakeKey} = $${paramCount}`);
      values.push(value);
      paramCount += 1;
    }
  }
  
  if (fields.length === 0) {
    return getTriggerById(id);
  }
  
  values.push(id);
  const query = `
    UPDATE triggers
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount}
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Update last triggered time
const updateLastTriggeredAt = async (id) => {
  const query = 'UPDATE triggers SET last_triggered_at = NOW() WHERE id = $1';
  await pool.query(query, [id]);
};

// Delete trigger
const deleteTrigger = async (id) => {
  const query = 'DELETE FROM triggers WHERE id = $1 RETURNING id';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Enable/disable trigger
const toggleTriggerActive = async (id, isActive) => {
  const query = 'UPDATE triggers SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
  const result = await pool.query(query, [isActive, id]);
  return result.rows[0];
};

module.exports = {
  createTrigger,
  getTriggersByWorkflow,
  getTriggerById,
  updateTrigger,
  updateLastTriggeredAt,
  deleteTrigger,
  toggleTriggerActive,
};
