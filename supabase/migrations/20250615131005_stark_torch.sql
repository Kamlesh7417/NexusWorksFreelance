/*
  # Add Skills Table and Relationships

  1. New Tables
    - `skills`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `category` (text)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_skills`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `skill_id` (uuid, references skills)
      - `proficiency_level` (integer, 1-5)
      - `years_experience` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `project_skills`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `skill_id` (uuid, references skills)
      - `importance_level` (integer, 1-5)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_skills table
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5) NOT NULL,
  years_experience INTEGER CHECK (years_experience >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one skill per user
  UNIQUE(user_id, skill_id)
);

-- Create project_skills table
CREATE TABLE IF NOT EXISTS project_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  importance_level INTEGER CHECK (importance_level BETWEEN 1 AND 5) DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one skill per project
  UNIQUE(project_id, skill_id)
);

-- Enable RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;

-- Create policies for skills table
CREATE POLICY "Anyone can view skills" 
  ON skills FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage skills" 
  ON skills FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for user_skills table
CREATE POLICY "Users can view all user skills" 
  ON user_skills FOR SELECT 
  USING (true);

CREATE POLICY "Users can manage their own skills" 
  ON user_skills FOR ALL 
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for project_skills table
CREATE POLICY "Anyone can view project skills" 
  ON project_skills FOR SELECT 
  USING (true);

CREATE POLICY "Project owners can manage project skills" 
  ON project_skills FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND client_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON user_skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_proficiency ON user_skills(proficiency_level);

CREATE INDEX IF NOT EXISTS idx_project_skills_project_id ON project_skills(project_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_skill_id ON project_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_importance ON project_skills(importance_level);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE skills;
ALTER PUBLICATION supabase_realtime ADD TABLE user_skills;
ALTER PUBLICATION supabase_realtime ADD TABLE project_skills;

-- Insert common skills
INSERT INTO skills (name, category, description) VALUES
-- Programming Languages
('JavaScript', 'Programming', 'Web programming language'),
('TypeScript', 'Programming', 'Typed superset of JavaScript'),
('Python', 'Programming', 'General-purpose programming language'),
('Java', 'Programming', 'Object-oriented programming language'),
('C#', 'Programming', 'Microsoft programming language'),
('PHP', 'Programming', 'Server-side scripting language'),
('Ruby', 'Programming', 'Dynamic programming language'),
('Swift', 'Programming', 'Apple programming language'),
('Kotlin', 'Programming', 'Modern JVM language'),
('Go', 'Programming', 'Google programming language'),
('Rust', 'Programming', 'Systems programming language'),
('Solidity', 'Programming', 'Smart contract programming language'),

-- Frontend
('React', 'Frontend', 'JavaScript library for building user interfaces'),
('Angular', 'Frontend', 'TypeScript-based web application framework'),
('Vue.js', 'Frontend', 'Progressive JavaScript framework'),
('Next.js', 'Frontend', 'React framework for production'),
('Svelte', 'Frontend', 'Compiler-based JavaScript framework'),
('HTML', 'Frontend', 'Markup language for web pages'),
('CSS', 'Frontend', 'Style sheet language'),
('Tailwind CSS', 'Frontend', 'Utility-first CSS framework'),
('SASS/SCSS', 'Frontend', 'CSS preprocessor'),

-- Backend
('Node.js', 'Backend', 'JavaScript runtime environment'),
('Express.js', 'Backend', 'Web application framework for Node.js'),
('Django', 'Backend', 'Python web framework'),
('Flask', 'Backend', 'Python micro web framework'),
('Spring Boot', 'Backend', 'Java-based framework'),
('Laravel', 'Backend', 'PHP web framework'),
('Ruby on Rails', 'Backend', 'Ruby web framework'),
('ASP.NET Core', 'Backend', '.NET web framework'),

-- Database
('SQL', 'Database', 'Structured Query Language'),
('PostgreSQL', 'Database', 'Open-source relational database'),
('MySQL', 'Database', 'Open-source relational database'),
('MongoDB', 'Database', 'NoSQL document database'),
('Redis', 'Database', 'In-memory data structure store'),
('Firebase', 'Database', 'Google platform for mobile and web applications'),
('Supabase', 'Database', 'Open source Firebase alternative'),

-- DevOps
('Docker', 'DevOps', 'Containerization platform'),
('Kubernetes', 'DevOps', 'Container orchestration'),
('AWS', 'DevOps', 'Amazon Web Services cloud platform'),
('Azure', 'DevOps', 'Microsoft cloud platform'),
('Google Cloud', 'DevOps', 'Google cloud platform'),
('CI/CD', 'DevOps', 'Continuous integration and deployment'),
('Git', 'DevOps', 'Version control system'),

-- Mobile
('React Native', 'Mobile', 'Cross-platform mobile framework'),
('Flutter', 'Mobile', 'Google UI toolkit for mobile'),
('iOS Development', 'Mobile', 'Apple mobile platform development'),
('Android Development', 'Mobile', 'Google mobile platform development'),

-- AI/ML
('Machine Learning', 'AI/ML', 'Algorithms that improve through experience'),
('TensorFlow', 'AI/ML', 'Open-source machine learning framework'),
('PyTorch', 'AI/ML', 'Open-source machine learning library'),
('Natural Language Processing', 'AI/ML', 'AI for processing human language'),
('Computer Vision', 'AI/ML', 'AI for visual data processing'),
('Deep Learning', 'AI/ML', 'Neural network-based machine learning'),

-- Blockchain
('Blockchain', 'Blockchain', 'Distributed ledger technology'),
('Smart Contracts', 'Blockchain', 'Self-executing contracts with code'),
('Web3', 'Blockchain', 'Decentralized web applications'),
('Ethereum', 'Blockchain', 'Blockchain platform with smart contracts'),
('DeFi', 'Blockchain', 'Decentralized finance'),
('NFT', 'Blockchain', 'Non-fungible tokens'),

-- Quantum Computing
('Quantum Computing', 'Quantum', 'Computing using quantum mechanics'),
('Qiskit', 'Quantum', 'Open-source quantum computing software'),
('Quantum Algorithms', 'Quantum', 'Algorithms for quantum computers'),
('Quantum Machine Learning', 'Quantum', 'Intersection of quantum computing and ML'),

-- AR/VR
('AR/VR', 'AR/VR', 'Augmented and virtual reality'),
('Unity', 'AR/VR', 'Cross-platform game engine'),
('Unreal Engine', 'AR/VR', 'Game engine for 3D content'),
('WebXR', 'AR/VR', 'Web standards for VR and AR'),
('Spatial Computing', 'AR/VR', 'Computing in 3D space')

ON CONFLICT (name) DO NOTHING;

-- Migrate existing skills data
DO $$
DECLARE
  user_record RECORD;
  skill_text TEXT;
  skill_id UUID;
  proficiency INTEGER;
BEGIN
  -- For each user with skills
  FOR user_record IN 
    SELECT id, skills FROM user_profiles WHERE skills IS NOT NULL AND array_length(skills, 1) > 0
  LOOP
    -- For each skill in the user's skills array
    FOREACH skill_text IN ARRAY user_record.skills
    LOOP
      -- Find or create the skill
      SELECT id INTO skill_id FROM skills WHERE name = skill_text;
      
      -- If skill doesn't exist, create it
      IF skill_id IS NULL THEN
        INSERT INTO skills (name, category, description)
        VALUES (skill_text, 'Other', 'Migrated skill')
        RETURNING id INTO skill_id;
      END IF;
      
      -- Assign random proficiency level (3-5)
      proficiency := floor(random() * 3 + 3);
      
      -- Create user_skill entry
      INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_experience)
      VALUES (user_record.id, skill_id, proficiency, floor(random() * 5 + 1))
      ON CONFLICT (user_id, skill_id) DO NOTHING;
    END LOOP;
  END LOOP;
  
  -- Migrate project skills
  FOR user_record IN 
    SELECT id, skills_required FROM projects WHERE skills_required IS NOT NULL AND array_length(skills_required, 1) > 0
  LOOP
    -- For each skill in the project's required skills array
    FOREACH skill_text IN ARRAY user_record.skills_required
    LOOP
      -- Find or create the skill
      SELECT id INTO skill_id FROM skills WHERE name = skill_text;
      
      -- If skill doesn't exist, create it
      IF skill_id IS NULL THEN
        INSERT INTO skills (name, category, description)
        VALUES (skill_text, 'Other', 'Migrated skill')
        RETURNING id INTO skill_id;
      END IF;
      
      -- Assign random importance level (3-5)
      proficiency := floor(random() * 3 + 3);
      
      -- Create project_skill entry
      INSERT INTO project_skills (project_id, skill_id, importance_level)
      VALUES (user_record.id, skill_id, proficiency)
      ON CONFLICT (project_id, skill_id) DO NOTHING;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Skill data migration completed';
END $$;