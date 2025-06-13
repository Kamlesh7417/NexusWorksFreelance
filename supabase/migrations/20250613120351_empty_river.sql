/*
  # Create sample data for testing

  1. Sample Data
    - Create sample user profiles
    - Create sample projects
    - Create sample bids and messages
    
  Note: This is for development/demo purposes only
*/

-- Insert sample user profiles (these will be created when users sign up)
-- The trigger will handle profile creation automatically

-- Insert sample projects (only if no projects exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM projects LIMIT 1) THEN
    -- Note: In a real scenario, these would be created by actual users
    -- This is just for demo purposes
    INSERT INTO projects (
      id,
      title,
      description,
      client_id,
      status,
      budget_min,
      budget_max,
      deadline,
      skills_required,
      category,
      urgency
    ) VALUES 
    (
      gen_random_uuid(),
      'AI-Powered E-commerce Platform',
      'Build a modern e-commerce platform with AI-powered product recommendations, real-time inventory management, and advanced analytics dashboard.',
      (SELECT id FROM user_profiles WHERE role = 'client' LIMIT 1),
      'active',
      5000,
      8000,
      CURRENT_DATE + INTERVAL '30 days',
      ARRAY['React', 'Node.js', 'AI/ML', 'PostgreSQL'],
      'web-development',
      'high'
    ),
    (
      gen_random_uuid(),
      'Mobile Fitness Tracking App',
      'Develop a comprehensive fitness tracking mobile application with workout plans, nutrition tracking, and social features.',
      (SELECT id FROM user_profiles WHERE role = 'client' LIMIT 1),
      'active',
      3000,
      5000,
      CURRENT_DATE + INTERVAL '45 days',
      ARRAY['React Native', 'Firebase', 'UI/UX Design'],
      'mobile-app',
      'medium'
    ),
    (
      gen_random_uuid(),
      'Blockchain Voting System',
      'Create a secure, transparent blockchain-based voting system for organizational decision-making with smart contract integration.',
      (SELECT id FROM user_profiles WHERE role = 'client' LIMIT 1),
      'draft',
      8000,
      12000,
      CURRENT_DATE + INTERVAL '60 days',
      ARRAY['Blockchain', 'Solidity', 'Web3', 'Security'],
      'blockchain',
      'high'
    );
  END IF;
END $$;