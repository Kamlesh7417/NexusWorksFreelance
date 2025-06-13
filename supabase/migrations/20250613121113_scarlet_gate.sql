-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  client_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  developer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'in_progress', 'completed', 'cancelled')) DEFAULT 'draft',
  budget_min INTEGER DEFAULT 0,
  budget_max INTEGER DEFAULT 0,
  deadline DATE,
  skills_required TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Clients can create projects" ON projects;
DROP POLICY IF EXISTS "Clients can update their own projects" ON projects;
DROP POLICY IF EXISTS "Clients can delete their own projects" ON projects;

-- Create policies
CREATE POLICY "Anyone can view projects" 
  ON projects FOR SELECT 
  USING (true);

CREATE POLICY "Clients can create projects" 
  ON projects FOR INSERT 
  WITH CHECK (
    auth.uid() = client_id AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('client', 'admin')
    )
  );

CREATE POLICY "Clients can update their own projects" 
  ON projects FOR UPDATE 
  USING (
    auth.uid() = client_id OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Clients can delete their own projects" 
  ON projects FOR DELETE 
  USING (
    auth.uid() = client_id OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger for updated_at (only if it doesn't exist)
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);