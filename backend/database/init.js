const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const setupDatabase = async () => {
  const client = await pool.connect();
  
  try {
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'workflow_builder';
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`Creating database: ${dbName}`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    client.release();
  }
};

const runMigrations = async () => {
  const client = await pool.connect();

  try {
    // Connect to the workflow_builder database
    const dbName = process.env.DB_NAME || 'workflow_builder';
    const dbPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: dbName,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    const dbClient = await dbPool.connect();

    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      console.log('Running migrations...');
      await dbClient.query(schema);
      console.log('Migrations completed successfully');
    } finally {
      dbClient.release();
      await dbPool.end();
    }
  } catch (err) {
    console.error('Error running migrations:', err);
    throw err;
  } finally {
    client.release();
  }
};

const initialize = async () => {
  try {
    console.log('Starting database initialization...');
    await setupDatabase();
    await runMigrations();
    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

initialize();
