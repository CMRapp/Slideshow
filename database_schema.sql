-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS slideshow;
USE slideshow;

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_team_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create media_items table
CREATE TABLE IF NOT EXISTS media_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_team_name (team_name),
    FOREIGN KEY (team_name) REFERENCES teams(name) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create uploaded_items table
CREATE TABLE IF NOT EXISTS uploaded_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL,
    item_type ENUM('photo', 'video') NOT NULL,
    item_number INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_team_item (team_name, item_type, item_number),
    INDEX idx_team_name (team_name),
    INDEX idx_item_type (item_type),
    INDEX idx_item_number (item_number),
    FOREIGN KEY (team_name) REFERENCES teams(name) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT IGNORE INTO settings (`key`, value) VALUES 
('photo_count', '0'),
('video_count', '0');

-- Create indexes for better performance
CREATE INDEX idx_media_team_file ON media_items(team_name, file_name);
CREATE INDEX idx_uploaded_team_type ON uploaded_items(team_name, item_type);

-- Create a view for media statistics
CREATE OR REPLACE VIEW media_statistics AS
SELECT 
    team_name,
    COUNT(CASE WHEN file_type LIKE 'image/%' THEN 1 END) as photo_count,
    COUNT(CASE WHEN file_type LIKE 'video/%' THEN 1 END) as video_count,
    MAX(created_at) as last_upload
FROM media_items
GROUP BY team_name;

-- Create a view for uploaded items summary
CREATE OR REPLACE VIEW uploaded_items_summary AS
SELECT 
    team_name,
    item_type,
    COUNT(*) as total_uploaded,
    MAX(uploaded_at) as last_upload
FROM uploaded_items
GROUP BY team_name, item_type; 