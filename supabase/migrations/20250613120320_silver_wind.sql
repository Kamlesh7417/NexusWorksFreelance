/*
  # Create project bids table

  1. New Tables
    - `project_bids`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `developer_id` (uuid, references user_profiles)
      - `amount` (integer)
      - `message` (text)
      - `status` (text, check constraint)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `project_bids` table
    - Add policies for viewing, creating, and updating bids
*/

-- Create project bids table
CREATE TABLE IF NOT EXISTS project_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  developer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one bid per developer per project
  UNIQUE(project_id, developer_id)
);

-- Enable RLS
ALTER TABLE project_bids ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view bids" 
  ON project_bids FOR SELECT 
  USING (true);

CREATE POLICY "Developers can create bids" 
  ON project_bids FOR INSERT 
  WITH CHECK (
    auth.uid() = developer_id AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('developer', 'admin')
    )
  );

CREATE POLICY "Developers can update their own bids" 
  ON project_bids FOR UPDATE 
  USING (
    auth.uid() = developer_id OR 
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id AND p.client_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Developers can delete their own bids" 
  ON project_bids FOR DELETE 
  USING (
    auth.uid() = developer_id OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_bids_project_id ON project_bids(project_id);
CREATE INDEX IF NOT EXISTS idx_project_bids_developer_id ON project_bids(developer_id);
CREATE INDEX IF NOT EXISTS idx_project_bids_status ON project_bids(status);
CREATE INDEX IF NOT EXISTS idx_project_bids_created_at ON project_bids(created_at DESC);