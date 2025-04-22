-- Create the database if it doesn't exist
CREATE DATABASE slideshow;

-- Connect to the database
\c slideshow;

-- Create extension for UUID if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create teams table
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create media_items table
CREATE TABLE media_items (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    item_type VARCHAR(10) CHECK (item_type IN ('photo', 'video')) NOT NULL,
    item_number INTEGER NOT NULL,
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

-- Create settings table
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create uploaded_items table
CREATE TABLE uploaded_items (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    item_type VARCHAR(10) CHECK (item_type IN ('photo', 'video')) NOT NULL,
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

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES 
    ('photo_count', '0', 'Total number of photos allowed per team'),
    ('video_count', '0', 'Total number of videos allowed per team'),
    ('max_file_size', '10485760', 'Maximum file size in bytes (10MB)'),
    ('allowed_image_types', 'image/jpeg,image/png,image/gif', 'Allowed image MIME types'),
    ('allowed_video_types', 'video/mp4,video/webm,video/quicktime,video/hevc', 'Allowed video MIME types')
ON CONFLICT (key) DO NOTHING;

-- Create indexes
CREATE INDEX idx_media_items_team_id ON media_items(team_id);
CREATE INDEX idx_media_items_item_type ON media_items(item_type);
CREATE INDEX idx_media_items_is_processed ON media_items(is_processed);
CREATE INDEX idx_uploaded_items_team_id ON uploaded_items(team_id);
CREATE INDEX idx_uploaded_items_item_type ON uploaded_items(item_type);
CREATE INDEX idx_uploaded_items_upload_status ON uploaded_items(upload_status);

-- Create views for statistics and reporting
CREATE OR REPLACE VIEW media_statistics AS
SELECT 
    t.name as team_name,
    COUNT(CASE WHEN m.item_type = 'photo' THEN 1 END) as photo_count,
    COUNT(CASE WHEN m.item_type = 'video' THEN 1 END) as video_count,
    SUM(m.file_size) as total_size,
    MAX(m.created_at) as last_upload
FROM teams t
LEFT JOIN media_items m ON t.id = m.team_id
GROUP BY t.id, t.name;

CREATE OR REPLACE VIEW upload_status_summary AS
SELECT 
    t.name as team_name,
    u.item_type,
    COUNT(*) as total_uploads,
    COUNT(CASE WHEN u.upload_status = 'completed' THEN 1 END) as completed_uploads,
    COUNT(CASE WHEN u.upload_status = 'failed' THEN 1 END) as failed_uploads,
    MAX(u.updated_at) as last_activity
FROM teams t
LEFT JOIN uploaded_items u ON t.id = u.team_id
GROUP BY t.id, t.name, u.item_type;

-- Add comments to tables and columns
COMMENT ON TABLE teams IS 'Stores team information';
COMMENT ON TABLE media_items IS 'Stores information about media items in the slideshow';
COMMENT ON TABLE settings IS 'Application settings and configuration';
COMMENT ON TABLE uploaded_items IS 'Tracks uploaded media items';

-- Add column comments
COMMENT ON COLUMN teams.name IS 'Team name';
COMMENT ON COLUMN teams.description IS 'Team description';
COMMENT ON COLUMN teams.is_active IS 'Whether the team is active';
COMMENT ON COLUMN media_items.team_id IS 'Reference to team';
COMMENT ON COLUMN media_items.item_type IS 'Type of media item';
COMMENT ON COLUMN media_items.item_number IS 'Item number within the team';
COMMENT ON COLUMN media_items.file_name IS 'Original file name';
COMMENT ON COLUMN media_items.file_path IS 'Path to the media file';
COMMENT ON COLUMN media_items.file_size IS 'File size in bytes';
COMMENT ON COLUMN media_items.mime_type IS 'File MIME type';
COMMENT ON COLUMN media_items.metadata IS 'Additional file metadata';
COMMENT ON COLUMN media_items.is_processed IS 'Whether the file has been processed';
COMMENT ON COLUMN uploaded_items.team_id IS 'Reference to team';
COMMENT ON COLUMN uploaded_items.item_type IS 'Type of media item';
COMMENT ON COLUMN uploaded_items.item_number IS 'Item number within the team';
COMMENT ON COLUMN uploaded_items.file_name IS 'Original file name';
COMMENT ON COLUMN uploaded_items.file_path IS 'Path to the uploaded file';
COMMENT ON COLUMN uploaded_items.file_size IS 'File size in bytes';
COMMENT ON COLUMN uploaded_items.mime_type IS 'File MIME type';
COMMENT ON COLUMN uploaded_items.upload_status IS 'Upload status';
COMMENT ON COLUMN uploaded_items.error_message IS 'Error message if upload failed'; 