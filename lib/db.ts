import { Pool, PoolClient, QueryResultRow } from '@neondatabase/serverless';

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create connection pool with Neon configuration optimized for serverless
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1, // Maximum number of connections in the pool
  idleTimeoutMillis: 1000, // Close idle connections after 1 second
  connectionTimeoutMillis: 5000, // Timeout after 5 seconds
  maxUses: 7500, // Close connections after a certain number of uses
});

// Query result type
interface QueryResult<T extends QueryResultRow = QueryResultRow> {
  rows: T[];
  rowCount: number;
}

// Helper function to execute queries with proper error handling
export async function executeQuery<T extends QueryResultRow = QueryResultRow>(
  query: string,
  params: unknown[] = [],
  client?: PoolClient
): Promise<QueryResult<T>> {
  const useClient = client || await pool.connect();
  try {
    const result = await useClient.query<T>(query, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0
    };
  } catch (error) {
    console.error('Database query error:', {
      query,
      params,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  } finally {
    if (!client) {
      useClient.release();
    }
  }
}

// Helper function for transactions
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function columnExists(client: PoolClient, tableName: string, columnName: string): Promise<boolean> {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = $2
    )`,
    [tableName, columnName]
  );
  return result.rows[0].exists;
}

async function indexExists(client: PoolClient, indexName: string): Promise<boolean> {
  const result = await client.query(
    `SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = $1)`,
    [indexName]
  );
  return result.rows[0].exists;
}

async function constraintExists(client: PoolClient, constraintName: string): Promise<boolean> {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = $1
    )`,
    [constraintName]
  );
  return result.rows[0].exists;
}

// Initialize database tables if they don't exist
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Starting database initialization...');
    
    // Create teams table first
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create uploaded_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS uploaded_items (
        id SERIAL PRIMARY KEY,
        team_id INTEGER,
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
    `);

    // Add foreign key constraints after ensuring columns exist
    console.log('Adding foreign key constraints...');

    // Add uploaded_items foreign key
    if (await columnExists(client, 'uploaded_items', 'team_id') && 
        await columnExists(client, 'teams', 'id') && 
        !(await constraintExists(client, 'fk_uploaded_items_team'))) {
      console.log('Adding foreign key constraint for uploaded_items...');
      await client.query(`
        ALTER TABLE uploaded_items
        ADD CONSTRAINT fk_uploaded_items_team
        FOREIGN KEY (team_id)
        REFERENCES teams(id)
        ON DELETE CASCADE;
      `);
    }

    // Create indexes
    const indexDefinitions = [
      { name: 'idx_uploaded_items_team_id', table: 'uploaded_items', column: 'team_id' },
      { name: 'idx_uploaded_items_item_type', table: 'uploaded_items', column: 'item_type' },
      { name: 'idx_uploaded_items_upload_status', table: 'uploaded_items', column: 'upload_status' }
    ];

    for (const index of indexDefinitions) {
      if (await columnExists(client, index.table, index.column) && !(await indexExists(client, index.name))) {
        console.log(`Creating index ${index.name}...`);
        await client.query(`CREATE INDEX ${index.name} ON ${index.table}(${index.column})`);
      }
    }

    // Insert default settings if they don't exist
    console.log('Inserting default settings...');
    await client.query(`
      INSERT INTO settings (key, value, description) VALUES 
        ('photo_count', '0', 'Total number of photos allowed per team'),
        ('video_count', '0', 'Total number of videos allowed per team'),
        ('max_file_size', '10485760', 'Maximum file size in bytes (10MB)'),
        ('allowed_image_types', 'image/jpeg,image/png,image/gif', 'Allowed image MIME types'),
        ('allowed_video_types', 'video/mp4,video/webm,video/quicktime,video/hevc', 'Allowed video MIME types')
      ON CONFLICT (key) DO NOTHING;
    `);

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Initialize database on startup
initializeDatabase().catch(console.error); 