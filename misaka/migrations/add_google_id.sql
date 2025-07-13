-- Add google_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Add unique constraint to prevent duplicate google_ids
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS unique_google_id UNIQUE(google_id); 