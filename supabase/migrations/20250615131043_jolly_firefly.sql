/*
  # Create Project Tasks Table

  1. New Tables
    - `project_tasks`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `title` (text)
      - `description` (text)
      - `status` (text, check constraint)
      - `priority` (text, check constraint)
      - `assignee_id` (uuid, references user_profiles)
      - `reporter_id` (uuid, references user_profiles)
      - `story_points` (integer)
      - `labels` (text array)
      - `due_date` (date)
      - `estimated_hours` (integer)
      - `logged_hours` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `project_tasks` table
    - Add policies for viewing, creating, and updating tasks
*/

-- Create project tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in-progress', 'review', 'done')) DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  assignee_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  reporter_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  story_points INTEGER CHECK (story_points > 0),
  labels TEXT[] DEFAULT '{}',
  due_date DATE,
  estimated_hours INTEGER CHECK (estimated_hours >= 0) DEFAULT 0,
  logged_hours INTEGER CHECK (logged_hours >= 0) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE NOT NULL,
  depends_on_task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent self-dependency and ensure unique dependencies
  CHECK (task_id != depends_on_task_id),
  UNIQUE(task_id, depends_on_task_id)
);

-- Create task comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for project_tasks
CREATE POLICY "Project participants can view tasks" 
  ON project_tasks FOR SELECT 
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

CREATE POLICY "Project participants can create tasks" 
  ON project_tasks FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id AND (p.client_id = auth.uid() OR p.developer_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Project participants can update tasks" 
  ON project_tasks FOR UPDATE 
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

CREATE POLICY "Project participants can delete tasks" 
  ON project_tasks FOR DELETE 
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

-- Create policies for task_dependencies
CREATE POLICY "Project participants can view task dependencies" 
  ON task_dependencies FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN projects p ON pt.project_id = p.id
      WHERE pt.id = task_id AND (p.client_id = auth.uid() OR p.developer_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Project participants can manage task dependencies" 
  ON task_dependencies FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN projects p ON pt.project_id = p.id
      WHERE pt.id = task_id AND (p.client_id = auth.uid() OR p.developer_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for task_comments
CREATE POLICY "Project participants can view task comments" 
  ON task_comments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN projects p ON pt.project_id = p.id
      WHERE pt.id = task_id AND (p.client_id = auth.uid() OR p.developer_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Project participants can create task comments" 
  ON task_comments FOR INSERT 
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN projects p ON pt.project_id = p.id
      WHERE pt.id = task_id AND (p.client_id = auth.uid() OR p.developer_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own task comments" 
  ON task_comments FOR UPDATE 
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own task comments" 
  ON task_comments FOR DELETE 
  USING (auth.uid() = author_id);

-- Create triggers for updated_at
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee_id ON project_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_reporter_id ON project_tasks(reporter_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_priority ON project_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON project_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_project_tasks_created_at ON project_tasks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on_task_id ON task_dependencies(depends_on_task_id);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author_id ON task_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at DESC);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE project_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_dependencies;
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;

-- Insert sample tasks for existing projects
DO $$
DECLARE
  project_cursor CURSOR FOR SELECT id, client_id, developer_id FROM projects;
  project_id UUID;
  client_id UUID;
  developer_id UUID;
  task_id UUID;
  task_id2 UUID;
BEGIN
  OPEN project_cursor;
  
  LOOP
    FETCH project_cursor INTO project_id, client_id, developer_id;
    EXIT WHEN NOT FOUND;
    
    -- Create 3-5 tasks per project
    FOR i IN 1..3 + floor(random() * 3)::int LOOP
      INSERT INTO project_tasks (
        project_id,
        title,
        description,
        status,
        priority,
        assignee_id,
        reporter_id,
        story_points,
        labels,
        due_date,
        estimated_hours,
        logged_hours
      ) VALUES (
        project_id,
        CASE 
          WHEN i = 1 THEN 'Project Setup'
          WHEN i = 2 THEN 'Core Functionality'
          WHEN i = 3 THEN 'UI/UX Implementation'
          WHEN i = 4 THEN 'Testing & QA'
          WHEN i = 5 THEN 'Deployment & Documentation'
          ELSE 'Task ' || i
        END,
        'Description for task ' || i || ' of project ' || project_id,
        CASE 
          WHEN i = 1 THEN 'done'
          WHEN i = 2 THEN 'in-progress'
          ELSE 'todo'
        END,
        CASE 
          WHEN i = 1 THEN 'high'
          WHEN i = 2 THEN 'high'
          WHEN i = 3 THEN 'medium'
          ELSE 'low'
        END,
        CASE 
          WHEN developer_id IS NOT NULL THEN developer_id
          ELSE NULL
        END,
        client_id,
        i + 1,
        ARRAY['task', 'priority-' || (CASE WHEN i = 1 THEN 'high' WHEN i = 2 THEN 'high' WHEN i = 3 THEN 'medium' ELSE 'low' END)],
        CURRENT_DATE + ((i * 7) || ' days')::INTERVAL,
        i * 8,
        CASE 
          WHEN i = 1 THEN i * 8
          WHEN i = 2 THEN floor(i * 4)::int
          ELSE 0
        END
      ) RETURNING id INTO task_id;
      
      -- Add a comment to the first task
      IF i = 1 THEN
        INSERT INTO task_comments (
          task_id,
          author_id,
          content
        ) VALUES (
          task_id,
          client_id,
          'Let''s make sure we follow the project requirements closely.'
        );
        
        -- Add a second task for dependencies
        INSERT INTO project_tasks (
          project_id,
          title,
          description,
          status,
          priority,
          assignee_id,
          reporter_id,
          story_points,
          due_date,
          estimated_hours
        ) VALUES (
          project_id,
          'Dependency Task',
          'This task depends on Task 1',
          'todo',
          'medium',
          developer_id,
          client_id,
          3,
          CURRENT_DATE + '14 days'::INTERVAL,
          16
        ) RETURNING id INTO task_id2;
        
        -- Create dependency
        INSERT INTO task_dependencies (
          task_id,
          depends_on_task_id
        ) VALUES (
          task_id2,
          task_id
        );
      END IF;
    END LOOP;
  END LOOP;
  
  CLOSE project_cursor;
  
  RAISE NOTICE 'Sample tasks created for all projects';
END $$;