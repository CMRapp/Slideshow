import mysql from 'mysql2/promise';
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check for required environment variables
const requiredEnvVars = [
  'MYSQL_HOST',
  'MYSQL_USER',
  'MYSQL_PASSWORD',
  'MYSQL_DATABASE',
  'NEON_HOST',
  'NEON_USER',
  'NEON_PASSWORD',
  'NEON_DATABASE'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

interface Photo {
  id: number;
  filename: string;
  created_at: Date;
}

interface Video {
  id: number;
  filename: string;
  created_at: Date;
}

async function migrate() {
  let mysqlConnection: mysql.Connection | null = null;
  let neonPool: Pool | null = null;

  try {
    // Connect to MySQL
    mysqlConnection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    // Connect to Neon PostgreSQL
    neonPool = new Pool({
      host: process.env.NEON_HOST,
      user: process.env.NEON_USER,
      password: process.env.NEON_PASSWORD,
      database: process.env.NEON_DATABASE,
      ssl: true,
    });

    // Get all photos from MySQL
    const [photos] = await mysqlConnection.execute<mysql.RowDataPacket[]>(
      'SELECT id, filename, created_at FROM photos'
    );

    // Get all videos from MySQL
    const [videos] = await mysqlConnection.execute<mysql.RowDataPacket[]>(
      'SELECT id, filename, created_at FROM videos'
    );

    // Insert photos into Neon
    for (const photo of photos) {
      await neonPool.query(
        'INSERT INTO photos (id, filename, created_at) VALUES ($1, $2, $3)',
        [photo.id, photo.filename, photo.created_at]
      );
    }

    // Insert videos into Neon
    for (const video of videos) {
      await neonPool.query(
        'INSERT INTO videos (id, filename, created_at) VALUES ($1, $2, $3)',
        [video.id, video.filename, video.created_at]
      );
    }

    console.log(`Migrated ${photos.length} photos and ${videos.length} videos successfully.`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
    if (neonPool) {
      await neonPool.end();
    }
  }
}

migrate(); 