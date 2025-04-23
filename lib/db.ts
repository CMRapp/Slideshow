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
      -- Teams table (must be created first)
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Settings table (no foreign keys)
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Photos table
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Videos table
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Media items table
      CREATE TABLE IF NOT EXISTS media_items (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        item_number INT NOT NULL,
        item_type VARCHAR(10) NOT NULL CHECK (item_type IN ('photo', 'video')),
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(255) NOT NULL,
        metadata JSONB,
        is_processed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (team_id, item_type, item_number)
      );

      -- Uploaded items table
      CREATE TABLE IF NOT EXISTS uploaded_items (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        item_type VARCHAR(10) NOT NULL CHECK (item_type IN ('photo', 'video')),
        item_number INTEGER NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(255) NOT NULL,
        upload_status VARCHAR(20) CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (team_id, item_type, item_number)
      );

      -- Create indexes after all tables are created
      CREATE INDEX IF NOT EXISTS idx_media_items_team_id ON media_items(team_id);
      CREATE INDEX IF NOT EXISTS idx_media_items_item_type ON media_items(item_type);
      CREATE INDEX IF NOT EXISTS idx_media_items_is_processed ON media_items(is_processed);
      CREATE INDEX IF NOT EXISTS idx_uploaded_items_team_id ON uploaded_items(team_id);
      CREATE INDEX IF NOT EXISTS idx_uploaded_items_item_type ON uploaded_items(item_type);
      CREATE INDEX IF NOT EXISTS idx_uploaded_items_upload_status ON uploaded_items(upload_status);
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