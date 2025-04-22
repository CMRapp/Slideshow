"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const serverless_1 = require("@neondatabase/serverless");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
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
async function migrate() {
    let mysqlConnection = null;
    let neonPool = null;
    try {
        // Connect to MySQL
        mysqlConnection = await promise_1.default.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });
        // Connect to Neon PostgreSQL
        neonPool = new serverless_1.Pool({
            host: process.env.NEON_HOST,
            user: process.env.NEON_USER,
            password: process.env.NEON_PASSWORD,
            database: process.env.NEON_DATABASE,
            ssl: true,
        });
        // Get all photos from MySQL
        const [photos] = await mysqlConnection.execute('SELECT id, filename, created_at FROM photos');
        // Get all videos from MySQL
        const [videos] = await mysqlConnection.execute('SELECT id, filename, created_at FROM videos');
        // Insert photos into Neon
        for (const photo of photos) {
            await neonPool.query('INSERT INTO photos (id, filename, created_at) VALUES ($1, $2, $3)', [photo.id, photo.filename, photo.created_at]);
        }
        // Insert videos into Neon
        for (const video of videos) {
            await neonPool.query('INSERT INTO videos (id, filename, created_at) VALUES ($1, $2, $3)', [video.id, video.filename, video.created_at]);
        }
        console.log(`Migrated ${photos.length} photos and ${videos.length} videos successfully.`);
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
    finally {
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
