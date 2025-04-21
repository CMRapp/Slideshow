-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS uploaded_items;
DROP TABLE IF EXISTS media_items;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS settings;

-- Create settings table
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create teams table
CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create media_items table
CREATE TABLE media_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team VARCHAR(255) NOT NULL,
    item_type ENUM('photo', 'video') NOT NULL,
    item_number INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_media_item (team, item_type, item_number)
);

-- Create uploaded_items table
CREATE TABLE uploaded_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team VARCHAR(255) NOT NULL,
    item_type ENUM('photo', 'video') NOT NULL,
    item_number INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_uploaded_item (team, item_type, item_number)
);

-- Insert default settings
INSERT INTO settings (`key`, value) VALUES 
    ('photo_count', '0'),
    ('video_count', '0');

-- Add indexes for better query performance
CREATE INDEX idx_media_items_team ON media_items(team);
CREATE INDEX idx_media_items_type ON media_items(item_type);
CREATE INDEX idx_uploaded_items_team ON uploaded_items(team);
CREATE INDEX idx_uploaded_items_type ON uploaded_items(item_type);

-- Add comments to tables and columns
ALTER TABLE settings COMMENT 'Application settings and configuration';
ALTER TABLE teams COMMENT 'Stores team information';
ALTER TABLE media_items COMMENT 'Stores information about media items in the slideshow';
ALTER TABLE uploaded_items COMMENT 'Tracks uploaded media items';

-- Add column comments
ALTER TABLE settings MODIFY COLUMN `key` VARCHAR(255) COMMENT 'Setting key/name';
ALTER TABLE settings MODIFY COLUMN value TEXT COMMENT 'Setting value';
ALTER TABLE teams MODIFY COLUMN name VARCHAR(255) COMMENT 'Team name';
ALTER TABLE media_items MODIFY COLUMN team VARCHAR(255) COMMENT 'Team name';
ALTER TABLE media_items MODIFY COLUMN item_type ENUM('photo', 'video') COMMENT 'Type of media item';
ALTER TABLE media_items MODIFY COLUMN item_number INT COMMENT 'Item number within the team';
ALTER TABLE media_items MODIFY COLUMN file_path VARCHAR(255) COMMENT 'Path to the media file';
ALTER TABLE uploaded_items MODIFY COLUMN team VARCHAR(255) COMMENT 'Team name';
ALTER TABLE uploaded_items MODIFY COLUMN item_type ENUM('photo', 'video') COMMENT 'Type of media item';
ALTER TABLE uploaded_items MODIFY COLUMN item_number INT COMMENT 'Item number within the team';
ALTER TABLE uploaded_items MODIFY COLUMN file_path VARCHAR(255) COMMENT 'Path to the uploaded file'; 