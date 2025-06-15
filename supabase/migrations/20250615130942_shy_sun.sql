/*
  # Add Project Milestones Table

  1. New Tables
    - `project_milestones`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `title` (text)
      - `description` (text)
      - `due_date` (date)
      - `status` (text, check constraint)
      - `amount` (decimal, payment amount for milestone)
      - `completion_percentage` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `project_milestones` table
    - Add policies for viewing, creating, and updating milestones
*/

-- Create project milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')) DEFAULT 'pending',
  amount DECIMAL(10,2) CHECK (amount >= 0),
  completion_percentage INTEGER CHECK (completion_percentage >= 0 AND completion_percentage <= 100) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view milestones for their projects" 
  ON project_milestones FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id AND (p.client_id = auth.uid() OR p.developer_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Clients can create milestones" 
  ON project_milestones FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id AND p.client_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Project participants can update milestones" 
  ON project_milestones FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id AND (p.client_id = auth.uid() OR p.developer_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Clients can delete milestones" 
  ON project_milestones FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id AND p.client_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_project_milestones_updated_at
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_project_milestones_due_date ON project_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_project_milestones_created_at ON project_milestones(created_at DESC);

-- Enable realtime for project_milestones
ALTER PUBLICATION supabase_realtime ADD TABLE project_milestones;

-- Insert sample milestones for existing projects
DO $$
DECLARE
  project_cursor CURSOR FOR SELECT id, title, budget_min, budget_max FROM projects;
  project_id UUID;
  project_title TEXT;
  budget_min INTEGER;
  budget_max INTEGER;
  milestone_count INTEGER;
  milestone_amount DECIMAL;
BEGIN
  OPEN project_cursor;
  
  LOOP
    FETCH project_cursor INTO project_id, project_title, budget_min, budget_max;
    EXIT WHEN NOT FOUND;
    
    -- Determine number of milestones based on project complexity
    SELECT 
      CASE 
        WHEN complexity = 'simple' THEN 2
        WHEN complexity = 'moderate' THEN 3
        WHEN complexity = 'complex' THEN 4
        WHEN complexity = 'expert' THEN 5
        ELSE 3
      END INTO milestone_count
    FROM projects
    WHERE id = project_id;
    
    -- Calculate milestone amount
    milestone_amount := (budget_min + budget_max) / 2.0 / milestone_count;
    
    -- Insert milestones
    FOR i IN 1..milestone_count LOOP
      INSERT INTO project_milestones (
        project_id,
        title,
        description,
        due_date,
        status,
        amount,
        completion_percentage
      ) VALUES (
        project_id,
        CASE 
          WHEN i = 1 THEN 'Project Setup & Planning'
          WHEN i = 2 THEN 'Initial Development'
          WHEN i = 3 THEN 'Core Features Implementation'
          WHEN i = 4 THEN 'Testing & Refinement'
          WHEN i = 5 THEN 'Final Delivery'
          ELSE 'Milestone ' || i
        END,
        'Milestone ' || i || ' for project: ' || project_title,
        CURRENT_DATE + ((i * 10) || ' days')::INTERVAL,
        CASE 
          WHEN i = 1 AND EXISTS (SELECT 1 FROM projects WHERE id = project_id AND status IN ('in_progress', 'completed')) THEN 'completed'
          WHEN i = 2 AND EXISTS (SELECT 1 FROM projects WHERE id = project_id AND status = 'completed') THEN 'completed'
          WHEN i = 1 AND EXISTS (SELECT 1 FROM projects WHERE id = project_id AND status = 'active') THEN 'in_progress'
          ELSE 'pending'
        END,
        milestone_amount,
        CASE 
          WHEN i = 1 AND EXISTS (SELECT 1 FROM projects WHERE id = project_id AND status IN ('in_progress', 'completed')) THEN 100
          WHEN i = 2 AND EXISTS (SELECT 1 FROM projects WHERE id = project_id AND status = 'completed') THEN 100
          WHEN i = 1 AND EXISTS (SELECT 1 FROM projects WHERE id = project_id AND status = 'active') THEN 50
          ELSE 0
        END
      );
    END LOOP;
  END LOOP;
  
  CLOSE project_cursor;
  
  RAISE NOTICE 'Sample milestones created for all projects';
END $$;