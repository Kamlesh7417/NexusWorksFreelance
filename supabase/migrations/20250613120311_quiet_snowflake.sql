/*
  # Create projects table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `client_id` (uuid, references user_profiles)
      - `developer_id` (uuid, references user_profiles, optional)
      - `status` (text, check constraint)
      - `budget_min` (integer)
      - `budget_max` (integer)
      - `deadline` (date, optional)
      - `skills_required` (text array)
      - `category` (text)
      - `urgency` (text, check constraint)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `projects` table
    - Add policy for anyone to view projects
    - Add policy for clients to create projects
    - Add policy for clients to update their own projects
    - Add policy for clients to delete their own projects
*/

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

-- Create trigger for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);