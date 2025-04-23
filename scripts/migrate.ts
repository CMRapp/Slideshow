import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config();

// Check if we're in a Vercel environment
const isVercel = process.env.VERCEL === '1';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

async function tableExists(client: any, tableName: string): Promise<boolean> {
  const result = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
    [tableName]
  );
  return result.rows[0].exists;
}

async function columnExists(client: any, tableName: string, columnName: string): Promise<boolean> {
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

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if we're in production (Vercel)
    if (isVercel) {
      console.log('Running in Vercel environment');

      // Create teams table if it doesn't exist
      if (!(await tableExists(client, 'teams'))) {
        console.log('Creating teams table...');
        await client.query(`
          CREATE TABLE teams (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
      }

      // Create settings table if it doesn't exist
      if (!(await tableExists(client, 'settings'))) {
        console.log('Creating settings table...');
        await client.query(`
          CREATE TABLE settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(255) NOT NULL UNIQUE,
            value TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
      }

      // Create media_items table if it doesn't exist
      if (!(await tableExists(client, 'media_items'))) {
        console.log('Creating media_items table...');
        await client.query(`
          CREATE TABLE media_items (
            id SERIAL PRIMARY KEY,
            team_id INTEGER REFERENCES teams(id),
            item_type VARCHAR(50) NOT NULL,
            item_number INTEGER NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(255) NOT NULL,
            file_size INTEGER NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            file_data BYTEA,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
      }

      // Create uploaded_items table if it doesn't exist
      if (!(await tableExists(client, 'uploaded_items'))) {
        console.log('Creating uploaded_items table...');
        await client.query(`
          CREATE TABLE uploaded_items (
            id SERIAL PRIMARY KEY,
            team_id INTEGER REFERENCES teams(id),
            item_type VARCHAR(50) NOT NULL,
            item_number INTEGER NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(255) NOT NULL,
            file_size INTEGER NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            file_data BYTEA,
            upload_status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
      }

      // Add foreign key constraints if they don't exist
      console.log('Adding foreign key constraints...');
      
      // Check and add media_items foreign key
      if (await columnExists(client, 'media_items', 'team_id')) {
        await client.query(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'fk_media_items_team'
            ) THEN
              ALTER TABLE media_items
              ADD CONSTRAINT fk_media_items_team
              FOREIGN KEY (team_id)
              REFERENCES teams(id)
              ON DELETE CASCADE;
            END IF;
          END $$;
        `);
      }

      // Check and add uploaded_items foreign key
      if (await columnExists(client, 'uploaded_items', 'team_id')) {
        await client.query(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'fk_uploaded_items_team'
            ) THEN
              ALTER TABLE uploaded_items
              ADD CONSTRAINT fk_uploaded_items_team
              FOREIGN KEY (team_id)
              REFERENCES teams(id)
              ON DELETE CASCADE;
            END IF;
          END $$;
        `);
      }

      // Create indexes if they don't exist
      const indexDefinitions = [
        { name: 'idx_media_items_team_id', table: 'media_items', column: 'team_id' },
        { name: 'idx_media_items_item_type', table: 'media_items', column: 'item_type' },
        { name: 'idx_media_items_is_processed', table: 'media_items', column: 'is_processed' },
        { name: 'idx_uploaded_items_team_id', table: 'uploaded_items', column: 'team_id' },
        { name: 'idx_uploaded_items_item_type', table: 'uploaded_items', column: 'item_type' },
        { name: 'idx_uploaded_items_upload_status', table: 'uploaded_items', column: 'upload_status' }
      ];

      for (const index of indexDefinitions) {
        if (await columnExists(client, index.table, index.column)) {
          const result = await client.query(
            `SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = $1)`,
            [index.name]
          );
          if (!result.rows[0].exists) {
            console.log(`Creating index ${index.name}...`);
            await client.query(`CREATE INDEX ${index.name} ON ${index.table}(${index.column})`);
          }
        }
      }

      // Insert default settings if they don't exist
      await client.query(`
        INSERT INTO settings (key, value, description) VALUES 
          ('photo_count', '0', 'Total number of photos allowed per team'),
          ('video_count', '0', 'Total number of videos allowed per team'),
          ('max_file_size', '10485760', 'Maximum file size in bytes (10MB)'),
          ('allowed_image_types', 'image/jpeg,image/png,image/gif', 'Allowed image MIME types'),
          ('allowed_video_types', 'video/mp4,video/webm,video/quicktime,video/hevc', 'Allowed video MIME types')
        ON CONFLICT (key) DO NOTHING;
      `);
    } else {
      // Development environment - drop and recreate tables
      console.log('Running in development environment');
      
      // Drop existing tables if they exist
      await client.query(`
        DROP TABLE IF EXISTS uploaded_items CASCADE;
        DROP TABLE IF EXISTS media_items CASCADE;
        DROP TABLE IF EXISTS settings CASCADE;
        DROP TABLE IF EXISTS teams CASCADE;
      `);

      // Create teams table
      await client.query(`
        CREATE TABLE teams (
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
        CREATE TABLE settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) NOT NULL UNIQUE,
          value TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create media_items table
      await client.query(`
        CREATE TABLE media_items (
          id SERIAL PRIMARY KEY,
          team_id INTEGER REFERENCES teams(id),
          item_type VARCHAR(50) NOT NULL,
          item_number INTEGER NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(255) NOT NULL,
          file_size INTEGER NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          file_data BYTEA,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create uploaded_items table
      await client.query(`
        CREATE TABLE uploaded_items (
          id SERIAL PRIMARY KEY,
          team_id INTEGER REFERENCES teams(id),
          item_type VARCHAR(50) NOT NULL,
          item_number INTEGER NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(255) NOT NULL,
          file_size INTEGER NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          file_data BYTEA,
          upload_status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Add foreign key constraints
      await client.query(`
        ALTER TABLE media_items
        ADD CONSTRAINT fk_media_items_team
        FOREIGN KEY (team_id)
        REFERENCES teams(id)
        ON DELETE CASCADE;

        ALTER TABLE uploaded_items
        ADD CONSTRAINT fk_uploaded_items_team
        FOREIGN KEY (team_id)
        REFERENCES teams(id)
        ON DELETE CASCADE;
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX idx_media_items_team_id ON media_items(team_id);
        CREATE INDEX idx_media_items_item_type ON media_items(item_type);
        CREATE INDEX idx_media_items_is_processed ON media_items(is_processed);
        CREATE INDEX idx_uploaded_items_team_id ON uploaded_items(team_id);
        CREATE INDEX idx_uploaded_items_item_type ON uploaded_items(item_type);
        CREATE INDEX idx_uploaded_items_upload_status ON uploaded_items(upload_status);
      `);

      // Insert default settings
      await client.query(`
        INSERT INTO settings (key, value, description) VALUES 
          ('photo_count', '0', 'Total number of photos allowed per team'),
          ('video_count', '0', 'Total number of videos allowed per team'),
          ('max_file_size', '10485760', 'Maximum file size in bytes (10MB)'),
          ('allowed_image_types', 'image/jpeg,image/png,image/gif', 'Allowed image MIME types'),
          ('allowed_video_types', 'video/mp4,video/webm,video/quicktime,video/hevc', 'Allowed video MIME types')
        ON CONFLICT (key) DO NOTHING;
      `);
    }

    await client.query('COMMIT');
    console.log('Database migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 