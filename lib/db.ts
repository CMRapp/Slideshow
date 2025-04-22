import { Pool } from '@neondatabase/serverless';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();

// Check for required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !serverRuntimeConfig[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Log database configuration (excluding sensitive data)
console.log('Database Configuration:', {
  host: new URL(serverRuntimeConfig.DATABASE_URL).hostname,
  database: new URL(serverRuntimeConfig.DATABASE_URL).pathname.slice(1),
  ssl: true,
  max: 10
});

// Create connection pool with Neon configuration
const pool = new Pool({
  connectionString: serverRuntimeConfig.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
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
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'media_items'
      ) as media_items_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'uploaded_items'
      ) as uploaded_items_exists
    `);

    const { media_items_exists, uploaded_items_exists } = tablesResult.rows[0];

    if (!media_items_exists || !uploaded_items_exists) {
      console.log('Creating database tables...');
      // Import and execute schema
      const { default: schema } = await import('./schema.sql');
      await client.query(schema);
      console.log('Database tables created successfully');
    } else {
      console.log('Database tables already exist');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Initialize database on startup
initializeDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

export default async function getPool() {
  return pool;
} 