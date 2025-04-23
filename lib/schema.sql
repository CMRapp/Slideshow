-- Create uploaded_items table
CREATE TABLE IF NOT EXISTS uploaded_items (
    id SERIAL PRIMARY KEY,
    team VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_number INTEGER NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team, item_type, item_number)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_uploaded_items_team ON uploaded_items(team); 