const { Pool } = require('pg');

// Use DATABASE_URL if provided (production), else build from parts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Team members (join table)
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'member')),
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (team_id, user_id)
      )
    `);

    // Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        creator_id INTEGER NOT NULL REFERENCES users(id),
        assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        due_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Session store table (connect-pg-simple)
    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMPTZ NOT NULL,
        CONSTRAINT session_pkey PRIMARY KEY (sid)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire)
    `);

    await client.query('COMMIT');
    console.log('✅ Database initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, initializeDatabase };