/*
  # Create Schema Documentation

  1. Documentation
    - Create a view that documents the database schema
    - Include table descriptions, column details, and relationships
    - Provide usage examples

  2. Maintenance
    - Add functions for schema maintenance
    - Create views for monitoring database health
*/

-- Create a view that documents the database schema
CREATE OR REPLACE VIEW schema_documentation AS
WITH tables AS (
  SELECT 
    t.table_name,
    obj_description(pgc.oid) as table_description
  FROM information_schema.tables t
  JOIN pg_class pgc ON pgc.relname = t.table_name
  JOIN pg_namespace nsp ON nsp.oid = pgc.relnamespace AND nsp.nspname = t.table_schema
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
),
columns AS (
  SELECT 
    c.table_name,
    c.column_name,
    c.data_type,
    c.column_default,
    c.is_nullable,
    pg_catalog.col_description(pgc.oid, c.ordinal_position) as column_description
  FROM information_schema.columns c
  JOIN pg_class pgc ON pgc.relname = c.table_name
  JOIN pg_namespace nsp ON nsp.oid = pgc.relnamespace AND nsp.nspname = c.table_schema
  WHERE c.table_schema = 'public'
  ORDER BY c.table_name, c.ordinal_position
),
constraints AS (
  SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.table_schema = 'public'
  ORDER BY tc.table_name, tc.constraint_name
),
policies AS (
  SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT 
  t.table_name,
  t.table_description,
  json_agg(
    json_build_object(
      'column_name', c.column_name,
      'data_type', c.data_type,
      'default_value', c.column_default,
      'nullable', c.is_nullable,
      'description', c.column_description
    )
  ) as columns,
  json_agg(
    DISTINCT jsonb_build_object(
      'constraint_name', con.constraint_name,
      'constraint_type', con.constraint_type,
      'column_name', con.column_name,
      'foreign_table', con.foreign_table_name,
      'foreign_column', con.foreign_column_name
    )
  ) FILTER (WHERE con.constraint_name IS NOT NULL) as constraints,
  json_agg(
    DISTINCT jsonb_build_object(
      'policy_name', p.policyname,
      'command', p.cmd,
      'roles', p.roles,
      'using', p.qual,
      'with_check', p.with_check
    )
  ) FILTER (WHERE p.policyname IS NOT NULL) as policies
FROM tables t
LEFT JOIN columns c ON t.table_name = c.table_name
LEFT JOIN constraints con ON t.table_name = con.table_name
LEFT JOIN policies p ON t.table_name = p.tablename
GROUP BY t.table_name, t.table_description
ORDER BY t.table_name;

-- Create a view for database statistics
CREATE OR REPLACE VIEW database_statistics AS
SELECT
  (SELECT COUNT(*) FROM user_profiles) as user_count,
  (SELECT COUNT(*) FROM projects) as project_count,
  (SELECT COUNT(*) FROM project_bids) as bid_count,
  (SELECT COUNT(*) FROM transactions) as transaction_count,
  (SELECT COUNT(*) FROM messages) as message_count,
  (SELECT COUNT(*) FROM reviews) as review_count,
  (SELECT COUNT(*) FROM project_tasks) as task_count,
  (SELECT COUNT(*) FROM project_milestones) as milestone_count,
  (SELECT COUNT(*) FROM skills) as skill_count,
  (SELECT COUNT(*) FROM user_skills) as user_skill_count,
  (SELECT COUNT(*) FROM project_skills) as project_skill_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%') as index_count,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policy_count;

-- Create a function to add table comments
CREATE OR REPLACE FUNCTION add_table_comment(
  p_table_name TEXT,
  p_comment TEXT
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('COMMENT ON TABLE %I IS %L', p_table_name, p_comment);
END;
$$ LANGUAGE plpgsql;

-- Create a function to add column comments
CREATE OR REPLACE FUNCTION add_column_comment(
  p_table_name TEXT,
  p_column_name TEXT,
  p_comment TEXT
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('COMMENT ON COLUMN %I.%I IS %L', p_table_name, p_column_name, p_comment);
END;
$$ LANGUAGE plpgsql;

-- Add table comments
SELECT add_table_comment('user_profiles', 'Stores user profile information for all platform users including clients, developers, freelancers, and students');
SELECT add_table_comment('projects', 'Contains all project information including budget, timeline, and requirements');
SELECT add_table_comment('project_bids', 'Stores bids submitted by freelancers for projects');
SELECT add_table_comment('transactions', 'Records all financial transactions between clients and freelancers');
SELECT add_table_comment('messages', 'Stores all messages exchanged between users');
SELECT add_table_comment('reviews', 'Contains reviews and ratings for users and projects');
SELECT add_table_comment('project_milestones', 'Tracks project milestones, deadlines, and payments');
SELECT add_table_comment('project_tasks', 'Manages individual tasks within projects');
SELECT add_table_comment('task_dependencies', 'Tracks dependencies between tasks');
SELECT add_table_comment('task_comments', 'Stores comments on project tasks');
SELECT add_table_comment('skills', 'Master list of all available skills on the platform');
SELECT add_table_comment('user_skills', 'Maps users to their skills with proficiency levels');
SELECT add_table_comment('project_skills', 'Maps projects to required skills with importance levels');

-- Add column comments for key tables
-- user_profiles
SELECT add_column_comment('user_profiles', 'id', 'Primary key, references auth.users');
SELECT add_column_comment('user_profiles', 'role', 'User role: client, developer, freelancer, student, or admin');
SELECT add_column_comment('user_profiles', 'skills', 'Legacy array of skills (migrating to user_skills table)');
SELECT add_column_comment('user_profiles', 'hourly_rate', 'Hourly rate for developers/freelancers in USD');

-- projects
SELECT add_column_comment('projects', 'client_id', 'Reference to the client who created the project');
SELECT add_column_comment('projects', 'developer_id', 'Reference to the assigned developer (if any)');
SELECT add_column_comment('projects', 'status', 'Project status: draft, active, in_progress, completed, cancelled');
SELECT add_column_comment('projects', 'budget_min', 'Minimum budget in USD');
SELECT add_column_comment('projects', 'budget_max', 'Maximum budget in USD');
SELECT add_column_comment('projects', 'skills_required', 'Legacy array of required skills (migrating to project_skills table)');

-- transactions
SELECT add_column_comment('transactions', 'amount', 'Transaction amount in USD');
SELECT add_column_comment('transactions', 'status', 'Transaction status: pending, processing, completed, failed, refunded');
SELECT add_column_comment('transactions', 'transaction_type', 'Type: payment, refund, bonus, fee');
SELECT add_column_comment('transactions', 'blockchain_tx_hash', 'Blockchain transaction hash for crypto payments');

-- Create a view for relationship documentation
CREATE OR REPLACE VIEW relationship_documentation AS
WITH fk_constraints AS (
  SELECT
    tc.table_schema,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
)
SELECT
  fk.table_name || '.' || fk.column_name AS relationship,
  '→' AS direction,
  fk.foreign_table_name || '.' || fk.foreign_column_name AS references,
  obj_description(pgc.oid) as table_description,
  obj_description(pgc_foreign.oid) as foreign_table_description
FROM fk_constraints fk
JOIN pg_class pgc ON pgc.relname = fk.table_name
JOIN pg_class pgc_foreign ON pgc_foreign.relname = fk.foreign_table_name
ORDER BY fk.table_name, fk.column_name;

-- Create a view for usage examples
CREATE OR REPLACE VIEW usage_examples AS
SELECT 'user_profiles' AS table_name, $$
-- Get all developers with their skills
SELECT 
  up.id, 
  up.full_name, 
  up.hourly_rate,
  array_agg(s.name) as skills,
  AVG(us.proficiency_level) as avg_proficiency
FROM user_profiles up
JOIN user_skills us ON up.id = us.user_id
JOIN skills s ON us.skill_id = s.id
WHERE up.role IN ('developer', 'freelancer')
GROUP BY up.id, up.full_name, up.hourly_rate
ORDER BY avg_proficiency DESC;
$$ AS example

UNION ALL

SELECT 'projects' AS table_name, $$
-- Find projects matching user skills
SELECT 
  p.id,
  p.title,
  p.budget_min,
  p.budget_max,
  array_agg(DISTINCT s.name) as required_skills,
  COUNT(DISTINCT s.id) FILTER (
    WHERE s.id IN (
      SELECT skill_id FROM user_skills WHERE user_id = 'USER_ID_HERE'
    )
  )::float / COUNT(DISTINCT s.id) * 100 as match_percentage
FROM projects p
JOIN project_skills ps ON p.id = ps.project_id
JOIN skills s ON ps.skill_id = s.id
WHERE p.status = 'active'
GROUP BY p.id, p.title, p.budget_min, p.budget_max
HAVING COUNT(DISTINCT s.id) FILTER (
  WHERE s.id IN (
    SELECT skill_id FROM user_skills WHERE user_id = 'USER_ID_HERE'
  )
) > 0
ORDER BY match_percentage DESC;
$$ AS example

UNION ALL

SELECT 'transactions' AS table_name, $$
-- Get earnings summary for a freelancer
SELECT 
  date_trunc('month', t.created_at) as month,
  SUM(t.amount) as total_earnings,
  COUNT(DISTINCT t.project_id) as projects_count,
  AVG(t.amount) as avg_payment
FROM transactions t
WHERE t.freelancer_id = 'FREELANCER_ID_HERE'
  AND t.status = 'completed'
GROUP BY date_trunc('month', t.created_at)
ORDER BY month DESC;
$$ AS example

UNION ALL

SELECT 'project_tasks' AS table_name, $$
-- Get task completion statistics for a project
SELECT 
  pt.status,
  COUNT(*) as task_count,
  SUM(pt.story_points) as total_story_points,
  SUM(pt.estimated_hours) as total_estimated_hours,
  SUM(pt.logged_hours) as total_logged_hours
FROM project_tasks pt
WHERE pt.project_id = 'PROJECT_ID_HERE'
GROUP BY pt.status
ORDER BY 
  CASE 
    WHEN pt.status = 'done' THEN 1
    WHEN pt.status = 'review' THEN 2
    WHEN pt.status = 'in-progress' THEN 3
    WHEN pt.status = 'todo' THEN 4
    ELSE 5
  END;
$$ AS example;

-- Grant appropriate permissions
GRANT SELECT ON schema_documentation TO authenticated;
GRANT SELECT ON database_statistics TO authenticated;
GRANT SELECT ON relationship_documentation TO authenticated;
GRANT SELECT ON usage_examples TO authenticated;

-- Create RLS policies for views
CREATE POLICY "Anyone can view schema documentation" ON schema_documentation FOR SELECT USING (true);
CREATE POLICY "Anyone can view database statistics" ON database_statistics FOR SELECT USING (true);
CREATE POLICY "Anyone can view relationship documentation" ON relationship_documentation FOR SELECT USING (true);
CREATE POLICY "Anyone can view usage examples" ON usage_examples FOR SELECT USING (true);

-- Final documentation message
DO $$
BEGIN
  RAISE NOTICE '=== NEXUSWORKS DATABASE DOCUMENTATION CREATED ===';
  RAISE NOTICE 'The following documentation views are available:';
  RAISE NOTICE '- schema_documentation: Detailed schema information';
  RAISE NOTICE '- database_statistics: Database statistics and counts';
  RAISE NOTICE '- relationship_documentation: Foreign key relationships';
  RAISE NOTICE '- usage_examples: SQL query examples for common operations';
  RAISE NOTICE '';
  RAISE NOTICE 'To view documentation, run:';
  RAISE NOTICE 'SELECT * FROM schema_documentation;';
END $$;