"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function migrate() {
    // MySQL connection
    const mysqlConnection = await promise_1.default.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    });
    // PostgreSQL connection
    const pgPool = new pg_1.Pool({
        connectionString: process.env.NEON_DATABASE_URL,
    });
    try {
        console.log('Starting migration...');
        // Get all photos from MySQL
        const [photos] = await mysqlConnection.query('SELECT * FROM photos');
        console.log(`Found ${photos.length} photos to migrate`);
        // Get all videos from MySQL
        const [videos] = await mysqlConnection.query('SELECT * FROM videos');
        console.log(`Found ${videos.length} videos to migrate`);
        // Get all settings from MySQL
        const [settings] = await mysqlConnection.query('SELECT * FROM settings');
        console.log(`Found ${settings.length} settings to migrate`);
        // Get all media items from MySQL
        const [mediaItems] = await mysqlConnection.query('SELECT * FROM media_items');
        console.log(`Found ${mediaItems.length} media items to migrate`);
        // Get all uploaded items from MySQL
        const [uploadedItems] = await mysqlConnection.query('SELECT * FROM uploaded_items');
        console.log(`Found ${uploadedItems.length} uploaded items to migrate`);
        // Get all teams from MySQL
        const [teams] = await mysqlConnection.query('SELECT * FROM teams');
        console.log(`Found ${teams.length} teams to migrate`);
        // Begin transaction in PostgreSQL
        const client = await pgPool.connect();
        try {
            await client.query('BEGIN');
            // Migrate photos
            for (const photo of photos) {
                await client.query(`INSERT INTO photos (id, filename, team, created_at) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (id) DO NOTHING`, [photo.id, photo.filename, photo.team, photo.created_at]);
            }
            // Migrate videos
            for (const video of videos) {
                await client.query(`INSERT INTO videos (id, filename, team, created_at) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (id) DO NOTHING`, [video.id, video.filename, video.team, video.created_at]);
            }
            // Migrate settings
            for (const setting of settings) {
                await client.query(`INSERT INTO settings (key, value) 
           VALUES ($1, $2) 
           ON CONFLICT (key) DO UPDATE SET value = $2`, [setting.key, setting.value]);
            }
            // Migrate media items
            for (const item of mediaItems) {
                await client.query(`INSERT INTO media_items (id, team, item_number, type, filename, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           ON CONFLICT (id) DO NOTHING`, [item.id, item.team, item.item_number, item.type, item.filename, item.created_at]);
            }
            // Migrate uploaded items
            for (const item of uploadedItems) {
                await client.query(`INSERT INTO uploaded_items (id, filename, team, created_at) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (id) DO NOTHING`, [item.id, item.filename, item.team, item.created_at]);
            }
            // Migrate teams
            for (const team of teams) {
                await client.query(`INSERT INTO teams (id, name, created_at) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (id) DO NOTHING`, [team.id, team.name, team.created_at]);
            }
            await client.query('COMMIT');
            console.log('Migration completed successfully!');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
    finally {
        await mysqlConnection.end();
        await pgPool.end();
    }
}
migrate();
