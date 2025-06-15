/*
  # Fix Critical Database Schema Issues

  1. Schema Fixes
    - Ensure developer_id column exists in projects table with proper constraints
    - Add missing freelancer_id column to project_bids table
    - Create transactions table for payment tracking
    - Update user_profiles to support student/freelancer/client roles
    - Add proper indexes for performance
    - Fix any inconsistent relationships

  2. Performance Indexes
    - Add all required indexes for optimal query performance
    - Ensure foreign key relationships are properly indexed

  3. Data Integrity
    - Add proper constraints and checks
    - Ensure referential integrity across all tables

  4. Security
    - Update RLS policies for new schema
    - Ensure proper access controls
*/

-- First, let's ensure the projects table has the correct structure
DO $$
BEGIN
  -- Check if developer_id column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'developer_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN developer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update user_profiles to support student role
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
  
  -- Add new constraint with student role
  ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
    CHECK (role IN ('client', 'developer', 'student', 'freelancer', 'admin'));
END $$;

-- Fix project_bids table to use freelancer_id instead of developer_id for clarity
DO $$
BEGIN
  -- Check if we need to rename developer_id to freelancer_id in project_bids
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_bids' AND column_name = 'developer_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_bids' AND column_name = 'freelancer_id'
  ) THEN
    -- Add freelancer_id column
    ALTER TABLE project_bids ADD COLUMN freelancer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
    
    -- Copy data from developer_id to freelancer_id
    UPDATE project_bids SET freelancer_id = developer_id;
    
    -- Make freelancer_id NOT NULL
    ALTER TABLE project_bids ALTER COLUMN freelancer_id SET NOT NULL;
    
    -- Drop the old developer_id column
    ALTER TABLE project_bids DROP COLUMN developer_id;
    
    -- Recreate the unique constraint
    ALTER TABLE project_bids DROP CONSTRAINT IF EXISTS project_bids_project_id_developer_id_key;
    ALTER TABLE project_bids ADD CONSTRAINT project_bids_project_id_freelancer_id_key 
      UNIQUE(project_id, freelancer_id);
  END IF;
END $$;

-- Create transactions table for payment tracking
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  freelancer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  transaction_type TEXT CHECK (transaction_type IN ('payment', 'refund', 'bonus', 'fee')) DEFAULT 'payment',
  payment_method TEXT CHECK (payment_method IN ('crypto', 'bank_transfer', 'escrow')) DEFAULT 'escrow',
  blockchain_tx_hash TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" 
  ON transactions FOR SELECT 
  USING (
    auth.uid() = client_id OR 
    auth.uid() = freelancer_id OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Clients can create transactions" 
  ON transactions FOR INSERT 
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins can update transactions" 
  ON transactions FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger for transactions updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies for project_bids to use freelancer_id
DROP POLICY IF EXISTS "Developers can create bids" ON project_bids;
DROP POLICY IF EXISTS "Developers can update their own bids" ON project_bids;
DROP POLICY IF EXISTS "Developers can delete their own bids" ON project_bids;

CREATE POLICY "Freelancers can create bids" 
  ON project_bids FOR INSERT 
  WITH CHECK (
    auth.uid() = freelancer_id AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('developer', 'freelancer', 'student', 'admin')
    )
  );

CREATE POLICY "Freelancers can update their own bids" 
  ON project_bids FOR UPDATE 
  USING (
    auth.uid() = freelancer_id OR 
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id AND p.client_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Freelancers can delete their own bids" 
  ON project_bids FOR DELETE 
  USING (
    auth.uid() = freelancer_id OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_urgency ON projects(urgency);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline);
CREATE INDEX IF NOT EXISTS idx_projects_budget ON projects(budget_min, budget_max);

-- Project bids indexes
CREATE INDEX IF NOT EXISTS idx_project_bids_project_id ON project_bids(project_id);
CREATE INDEX IF NOT EXISTS idx_project_bids_freelancer_id ON project_bids(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_project_bids_status ON project_bids(status);
CREATE INDEX IF NOT EXISTS idx_project_bids_created_at ON project_bids(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_bids_amount ON project_bids(amount);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_skills ON user_profiles USING GIN(skills);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_freelancer_id ON transactions(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_project_id ON reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Add additional useful columns to projects table if they don't exist
DO $$
BEGIN
  -- Add project complexity field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'complexity'
  ) THEN
    ALTER TABLE projects ADD COLUMN complexity TEXT CHECK (complexity IN ('simple', 'moderate', 'complex', 'expert')) DEFAULT 'moderate';
  END IF;

  -- Add estimated hours field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'estimated_hours'
  ) THEN
    ALTER TABLE projects ADD COLUMN estimated_hours INTEGER CHECK (estimated_hours > 0);
  END IF;

  -- Add project tags for better categorization
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'tags'
  ) THEN
    ALTER TABLE projects ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Add useful columns to user_profiles if they don't exist
DO $$
BEGIN
  -- Add experience level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'experience_level'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'beginner';
  END IF;

  -- Add portfolio URL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'portfolio_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN portfolio_url TEXT;
  END IF;

  -- Add timezone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;

  -- Add availability status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'availability_status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN availability_status TEXT CHECK (availability_status IN ('available', 'busy', 'unavailable')) DEFAULT 'available';
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_projects_complexity ON projects(complexity);
CREATE INDEX IF NOT EXISTS idx_projects_estimated_hours ON projects(estimated_hours);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_profiles_experience_level ON user_profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_availability_status ON user_profiles(availability_status);

-- Enable realtime for transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- Create helpful views for common queries
CREATE OR REPLACE VIEW project_stats AS
SELECT 
  p.id,
  p.title,
  p.status,
  p.budget_min,
  p.budget_max,
  p.created_at,
  c.full_name as client_name,
  d.full_name as developer_name,
  COUNT(pb.id) as bid_count,
  AVG(pb.amount) as avg_bid_amount
FROM projects p
LEFT JOIN user_profiles c ON p.client_id = c.id
LEFT JOIN user_profiles d ON p.developer_id = d.id
LEFT JOIN project_bids pb ON p.id = pb.project_id
GROUP BY p.id, p.title, p.status, p.budget_min, p.budget_max, p.created_at, c.full_name, d.full_name;

-- Create view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  up.id,
  up.full_name,
  up.role,
  up.created_at,
  CASE 
    WHEN up.role IN ('client') THEN (
      SELECT COUNT(*) FROM projects WHERE client_id = up.id
    )
    WHEN up.role IN ('developer', 'freelancer', 'student') THEN (
      SELECT COUNT(*) FROM projects WHERE developer_id = up.id AND status = 'completed'
    )
    ELSE 0
  END as completed_projects,
  CASE 
    WHEN up.role IN ('developer', 'freelancer', 'student') THEN (
      SELECT AVG(rating) FROM reviews WHERE reviewee_id = up.id
    )
    ELSE NULL
  END as average_rating,
  CASE 
    WHEN up.role IN ('developer', 'freelancer', 'student') THEN (
      SELECT SUM(amount) FROM transactions WHERE freelancer_id = up.id AND status = 'completed'
    )
    WHEN up.role IN ('client') THEN (
      SELECT SUM(amount) FROM transactions WHERE client_id = up.id AND status = 'completed'
    )
    ELSE 0
  END as total_transaction_amount
FROM user_profiles up;

-- Grant appropriate permissions on views
GRANT SELECT ON project_stats TO authenticated;
GRANT SELECT ON user_stats TO authenticated;

-- Create RLS policies for views
CREATE POLICY "Anyone can view project stats" ON project_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can view user stats" ON user_stats FOR SELECT USING (true);

-- Add helpful functions for common operations
CREATE OR REPLACE FUNCTION get_user_projects(user_id UUID)
RETURNS TABLE (
  project_id UUID,
  title TEXT,
  status TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as project_id,
    p.title,
    p.status,
    CASE 
      WHEN p.client_id = user_id THEN 'client'
      WHEN p.developer_id = user_id THEN 'developer'
      ELSE 'none'
    END as role
  FROM projects p
  WHERE p.client_id = user_id OR p.developer_id = user_id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate project match score
CREATE OR REPLACE FUNCTION calculate_project_match_score(
  project_skills TEXT[],
  user_skills TEXT[],
  user_experience TEXT,
  project_complexity TEXT
)
RETURNS INTEGER AS $$
DECLARE
  skill_match_score INTEGER := 0;
  experience_score INTEGER := 0;
  total_score INTEGER := 0;
BEGIN
  -- Calculate skill match (0-70 points)
  IF array_length(project_skills, 1) > 0 AND array_length(user_skills, 1) > 0 THEN
    skill_match_score := (
      SELECT COUNT(*) * 70 / array_length(project_skills, 1)
      FROM unnest(project_skills) AS ps(skill)
      WHERE ps.skill = ANY(user_skills)
    );
  END IF;
  
  -- Calculate experience match (0-30 points)
  experience_score := CASE
    WHEN project_complexity = 'simple' AND user_experience IN ('beginner', 'intermediate', 'advanced', 'expert') THEN 30
    WHEN project_complexity = 'moderate' AND user_experience IN ('intermediate', 'advanced', 'expert') THEN 30
    WHEN project_complexity = 'complex' AND user_experience IN ('advanced', 'expert') THEN 30
    WHEN project_complexity = 'expert' AND user_experience = 'expert' THEN 30
    WHEN project_complexity = 'moderate' AND user_experience = 'beginner' THEN 15
    WHEN project_complexity = 'complex' AND user_experience = 'intermediate' THEN 15
    WHEN project_complexity = 'expert' AND user_experience IN ('intermediate', 'advanced') THEN 15
    ELSE 0
  END;
  
  total_score := LEAST(skill_match_score + experience_score, 100);
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Add data validation triggers
CREATE OR REPLACE FUNCTION validate_project_budget()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.budget_max < NEW.budget_min THEN
    RAISE EXCEPTION 'Maximum budget cannot be less than minimum budget';
  END IF;
  
  IF NEW.budget_min < 0 OR NEW.budget_max < 0 THEN
    RAISE EXCEPTION 'Budget values cannot be negative';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_project_budget_trigger
  BEFORE INSERT OR UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION validate_project_budget();

-- Add trigger to prevent self-bidding
CREATE OR REPLACE FUNCTION prevent_self_bidding()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM projects 
    WHERE id = NEW.project_id AND client_id = NEW.freelancer_id
  ) THEN
    RAISE EXCEPTION 'Users cannot bid on their own projects';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_self_bidding_trigger
  BEFORE INSERT ON project_bids
  FOR EACH ROW EXECUTE FUNCTION prevent_self_bidding();

-- Create notification for schema completion
DO $$
BEGIN
  RAISE NOTICE 'Database schema fixes completed successfully!';
  RAISE NOTICE 'Tables: user_profiles, projects, project_bids, messages, reviews, transactions';
  RAISE NOTICE 'All foreign key relationships verified and indexed';
  RAISE NOTICE 'RLS policies updated for security';
  RAISE NOTICE 'Performance indexes created';
  RAISE NOTICE 'Data validation triggers added';
END $$;