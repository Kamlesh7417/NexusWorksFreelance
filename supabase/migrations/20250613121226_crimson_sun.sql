/*
  # Fix Missing developer_id Column

  1. Changes
    - Add developer_id column to projects table if it doesn't exist
    - Ensure proper foreign key constraint
    - Update indexes to include developer_id

  2. Safety
    - Uses IF NOT EXISTS to prevent errors
    - Checks for existing column before adding
*/

-- Add developer_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'developer_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN developer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure the index exists
CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON projects(developer_id);

-- Verify the column exists and show table structure
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'developer_id'
  ) THEN
    RAISE NOTICE 'developer_id column exists in projects table';
  ELSE
    RAISE NOTICE 'developer_id column is still missing from projects table';
  END IF;
END $$;