import { Pool } from '@neondatabase/serverless';

// Check for required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Create connection pool with Neon configuration
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

// Test the connection
pool.connect()
  .then(client => {
    console.log('Database connection successful');
    client.release();
  })
  .catch(error => {
    console.error('Database connection failed:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  });

// Initialize database tables if they don't exist
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Starting database initialization...');
    
    // Define schema directly in the code
    const schema = `
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        team VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        team VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS media_items (
        id SERIAL PRIMARY KEY,
        team VARCHAR(255) NOT NULL,
        item_number INT NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('photo', 'video')),
        filename VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS uploaded_items (
        id SERIAL PRIMARY KEY,
        team VARCHAR(255) NOT NULL,
        item_type VARCHAR(50) NOT NULL,
        item_number INTEGER NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team, item_type, item_number)
      );

      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_uploaded_items_team ON uploaded_items(team);
    `;

    await client.query(schema);
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Call initializeDatabase when the module is imported
initializeDatabase().catch(console.error);

// Initialize database on startup
initializeDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}); 