import { createPool } from 'mysql2/promise';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();

// Check for required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !serverRuntimeConfig[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Log database configuration (excluding sensitive data)
console.log('Database Configuration:', {
  host: serverRuntimeConfig.DB_HOST,
  database: serverRuntimeConfig.DB_NAME,
  connectionLimit: 10
});

// Create connection pool
const pool = createPool({
  host: serverRuntimeConfig.DB_HOST,
  user: serverRuntimeConfig.DB_USER,
  password: serverRuntimeConfig.DB_PASSWORD,
  database: serverRuntimeConfig.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Database connection successful');
    connection.release();
  })
  .catch(error => {
    console.error('Database connection failed:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    throw error;
  });

// Initialize database tables if they don't exist
async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    console.log('Starting database initialization...');

    // Check if tables exist
    const [tables] = await connection.query("SHOW TABLES");
    console.log('Existing tables:', tables);

    // Create media_items table if it doesn't exist
    console.log('Creating media_items table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS media_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team VARCHAR(255) NOT NULL,
        item_type ENUM('photo', 'video') NOT NULL,
        item_number INT NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_media_item (team, item_type, item_number)
      )
    `);
    console.log('media_items table created/verified');

    // Create teams table if it doesn't exist
    console.log('Creating teams table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('teams table created/verified');

    // Create settings table if it doesn't exist
    console.log('Creating settings table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        \`key\` VARCHAR(255) NOT NULL UNIQUE,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('settings table created/verified');

    // Create uploaded_items table if it doesn't exist
    console.log('Creating uploaded_items table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS uploaded_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team VARCHAR(255) NOT NULL,
        item_type ENUM('photo', 'video') NOT NULL,
        item_number INT NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_team_item (team, item_type, item_number)
      )
    `);
    console.log('uploaded_items table created/verified');

    // Insert default values if they don't exist
    console.log('Inserting default settings...');
    await connection.query(`
      INSERT IGNORE INTO settings (\`key\`, value)
      VALUES ('photo_count', '0'), ('video_count', '0')
    `);
    console.log('Default settings inserted/verified');

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        code: (error as any).code,
        errno: (error as any).errno,
        sqlState: (error as any).sqlState,
        sqlMessage: (error as any).sqlMessage
      });
    }
    throw error;
  } finally {
    connection.release();
  }
}

// Initialize the database and export the pool
let isInitialized = false;
export default async function getPool() {
  if (!isInitialized) {
    try {
      await initializeDatabase();
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
  return pool;
} 