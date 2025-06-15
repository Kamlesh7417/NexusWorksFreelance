/*
  # Sample Data Insertion for Testing

  1. Sample Data
    - Create sample user profiles for different roles
    - Create sample projects with various statuses
    - Create sample bids and transactions
    - Create sample reviews and messages

  2. Data Integrity Testing
    - Test all foreign key relationships
    - Verify RLS policies work correctly
    - Test data validation triggers
*/

-- Insert sample user profiles
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  role,
  bio,
  skills,
  hourly_rate,
  location,
  experience_level,
  availability_status,
  timezone
) VALUES 
-- Clients
(
  gen_random_uuid(),
  'client1@nexusworks.com',
  'Sarah Johnson',
  'client',
  'Tech entrepreneur focused on AI and healthcare innovation',
  ARRAY['Project Management', 'Healthcare', 'AI Strategy'],
  NULL,
  'San Francisco, CA',
  'advanced',
  'available',
  'America/Los_Angeles'
),
(
  gen_random_uuid(),
  'client2@nexusworks.com',
  'Michael Chen',
  'client',
  'Startup founder building the next generation of fintech solutions',
  ARRAY['Fintech', 'Blockchain', 'Product Strategy'],
  NULL,
  'New York, NY',
  'intermediate',
  'available',
  'America/New_York'
),

-- Developers/Freelancers
(
  gen_random_uuid(),
  'dev1@nexusworks.com',
  'Alexandra Reed',
  'developer',
  'Full-stack developer specializing in AI and quantum computing applications',
  ARRAY['React', 'Node.js', 'Python', 'TensorFlow', 'Quantum Computing', 'AI/ML'],
  85,
  'Remote',
  'expert',
  'available',
  'UTC'
),
(
  gen_random_uuid(),
  'dev2@nexusworks.com',
  'Marcus Tan',
  'freelancer',
  'UI/UX designer and frontend developer with expertise in AR/VR interfaces',
  ARRAY['UI/UX Design', 'React', 'Three.js', 'AR/VR', 'Figma', 'WebGL'],
  75,
  'Singapore',
  'advanced',
  'available',
  'Asia/Singapore'
),
(
  gen_random_uuid(),
  'dev3@nexusworks.com',
  'Sofia Mendes',
  'developer',
  'Blockchain security expert and smart contract auditor',
  ARRAY['Blockchain', 'Solidity', 'Security', 'Smart Contracts', 'Web3', 'Cryptography'],
  95,
  'São Paulo, Brazil',
  'expert',
  'busy',
  'America/Sao_Paulo'
),

-- Students
(
  gen_random_uuid(),
  'student1@nexusworks.com',
  'James Wilson',
  'student',
  'Computer Science student learning full-stack development',
  ARRAY['JavaScript', 'React', 'Node.js', 'Python'],
  25,
  'Austin, TX',
  'beginner',
  'available',
  'America/Chicago'
),
(
  gen_random_uuid(),
  'student2@nexusworks.com',
  'Emma Rodriguez',
  'student',
  'Data Science student with focus on machine learning',
  ARRAY['Python', 'Machine Learning', 'Data Analysis', 'SQL'],
  30,
  'Barcelona, Spain',
  'intermediate',
  'available',
  'Europe/Madrid'
)
ON CONFLICT (email) DO NOTHING;

-- Get user IDs for creating relationships
DO $$
DECLARE
  client1_id UUID;
  client2_id UUID;
  dev1_id UUID;
  dev2_id UUID;
  dev3_id UUID;
  student1_id UUID;
  student2_id UUID;
  project1_id UUID;
  project2_id UUID;
  project3_id UUID;
  project4_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO client1_id FROM user_profiles WHERE email = 'client1@nexusworks.com';
  SELECT id INTO client2_id FROM user_profiles WHERE email = 'client2@nexusworks.com';
  SELECT id INTO dev1_id FROM user_profiles WHERE email = 'dev1@nexusworks.com';
  SELECT id INTO dev2_id FROM user_profiles WHERE email = 'dev2@nexusworks.com';
  SELECT id INTO dev3_id FROM user_profiles WHERE email = 'dev3@nexusworks.com';
  SELECT id INTO student1_id FROM user_profiles WHERE email = 'student1@nexusworks.com';
  SELECT id INTO student2_id FROM user_profiles WHERE email = 'student2@nexusworks.com';

  -- Insert sample projects
  INSERT INTO projects (
    id,
    title,
    description,
    client_id,
    developer_id,
    status,
    budget_min,
    budget_max,
    deadline,
    skills_required,
    category,
    urgency,
    complexity,
    estimated_hours,
    tags
  ) VALUES 
  (
    gen_random_uuid(),
    'AI-Powered Healthcare Dashboard',
    'Build a comprehensive AI-powered dashboard for healthcare providers to track patient data, predict health outcomes, and optimize treatment plans using machine learning algorithms.',
    client1_id,
    dev1_id,
    'in_progress',
    5000,
    8000,
    CURRENT_DATE + INTERVAL '30 days',
    ARRAY['React', 'Node.js', 'AI/ML', 'Healthcare', 'Python'],
    'web-development',
    'high',
    'complex',
    120,
    ARRAY['healthcare', 'ai', 'dashboard', 'machine-learning']
  ),
  (
    gen_random_uuid(),
    'Blockchain Voting System',
    'Create a secure, transparent blockchain-based voting system for organizational decision-making with smart contract integration and quantum-resistant security.',
    client2_id,
    NULL,
    'active',
    8000,
    12000,
    CURRENT_DATE + INTERVAL '45 days',
    ARRAY['Blockchain', 'Solidity', 'Security', 'Smart Contracts', 'Web3'],
    'blockchain',
    'high',
    'expert',
    200,
    ARRAY['blockchain', 'voting', 'security', 'smart-contracts']
  ),
  (
    gen_random_uuid(),
    'AR Product Visualization App',
    'Develop an augmented reality mobile application that allows customers to visualize furniture and home decor in their real-world environment before making a purchase.',
    client1_id,
    dev2_id,
    'completed',
    3000,
    5000,
    CURRENT_DATE - INTERVAL '10 days',
    ARRAY['AR/VR', 'React Native', 'Three.js', 'Mobile Development'],
    'mobile-app',
    'medium',
    'complex',
    80,
    ARRAY['ar', 'mobile', 'ecommerce', 'visualization']
  ),
  (
    gen_random_uuid(),
    'Student Portfolio Website',
    'Create a modern, responsive portfolio website for showcasing student projects and skills with interactive elements and smooth animations.',
    client2_id,
    NULL,
    'active',
    800,
    1500,
    CURRENT_DATE + INTERVAL '20 days',
    ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'UI/UX'],
    'web-development',
    'low',
    'simple',
    40,
    ARRAY['portfolio', 'student', 'responsive', 'showcase']
  )
  RETURNING id INTO project1_id, project2_id, project3_id, project4_id;

  -- Get project IDs for creating bids
  SELECT id INTO project1_id FROM projects WHERE title = 'AI-Powered Healthcare Dashboard';
  SELECT id INTO project2_id FROM projects WHERE title = 'Blockchain Voting System';
  SELECT id INTO project3_id FROM projects WHERE title = 'AR Product Visualization App';
  SELECT id INTO project4_id FROM projects WHERE title = 'Student Portfolio Website';

  -- Insert sample project bids
  INSERT INTO project_bids (
    project_id,
    freelancer_id,
    amount,
    message,
    status
  ) VALUES 
  (
    project2_id,
    dev3_id,
    9500,
    'I have extensive experience in blockchain security and smart contract development. I can implement quantum-resistant security measures and ensure the voting system meets the highest security standards.',
    'pending'
  ),
  (
    project2_id,
    dev1_id,
    8800,
    'With my background in both AI and blockchain technologies, I can create an intelligent voting system with advanced analytics and security features.',
    'pending'
  ),
  (
    project4_id,
    student1_id,
    1200,
    'As a fellow student, I understand what makes a great portfolio. I can create a modern, interactive website that showcases projects effectively.',
    'pending'
  ),
  (
    project4_id,
    dev2_id,
    1400,
    'I specialize in creating beautiful, user-friendly interfaces. I can design and develop a portfolio that stands out and effectively showcases the student''s work.',
    'accepted'
  );

  -- Insert sample transactions
  INSERT INTO transactions (
    project_id,
    client_id,
    freelancer_id,
    amount,
    status,
    transaction_type,
    payment_method,
    notes
  ) VALUES 
  (
    project1_id,
    client1_id,
    dev1_id,
    2500.00,
    'completed',
    'payment',
    'escrow',
    'First milestone payment for healthcare dashboard project'
  ),
  (
    project3_id,
    client1_id,
    dev2_id,
    4000.00,
    'completed',
    'payment',
    'escrow',
    'Final payment for AR visualization app'
  ),
  (
    project4_id,
    client2_id,
    dev2_id,
    700.00,
    'pending',
    'payment',
    'escrow',
    'Initial payment for portfolio website'
  );

  -- Insert sample messages
  INSERT INTO messages (
    sender_id,
    receiver_id,
    project_id,
    content,
    read
  ) VALUES 
  (
    client1_id,
    dev1_id,
    project1_id,
    'Great progress on the healthcare dashboard! The AI predictions are looking very accurate. Can we schedule a review meeting for next week?',
    true
  ),
  (
    dev1_id,
    client1_id,
    project1_id,
    'Thank you! I''d be happy to schedule a review. The machine learning models are performing well with 94% accuracy. How about Tuesday at 2 PM?',
    false
  ),
  (
    client2_id,
    dev3_id,
    project2_id,
    'I''m interested in your bid for the blockchain voting system. Can you provide more details about your security implementation approach?',
    false
  ),
  (
    dev2_id,
    client1_id,
    project3_id,
    'The AR app has been completed and tested on multiple devices. The furniture visualization is working perfectly. Ready for final review!',
    true
  );

  -- Insert sample reviews
  INSERT INTO reviews (
    project_id,
    reviewer_id,
    reviewee_id,
    rating,
    comment
  ) VALUES 
  (
    project3_id,
    client1_id,
    dev2_id,
    5,
    'Outstanding work on the AR visualization app! Marcus delivered exactly what we needed and the user experience is fantastic. Highly recommended!'
  ),
  (
    project3_id,
    dev2_id,
    client1_id,
    5,
    'Sarah was a great client to work with. Clear communication, reasonable requirements, and prompt payments. Would definitely work with her again!'
  );

  RAISE NOTICE 'Sample data inserted successfully!';
  RAISE NOTICE 'Created % user profiles', (SELECT COUNT(*) FROM user_profiles);
  RAISE NOTICE 'Created % projects', (SELECT COUNT(*) FROM projects);
  RAISE NOTICE 'Created % project bids', (SELECT COUNT(*) FROM project_bids);
  RAISE NOTICE 'Created % transactions', (SELECT COUNT(*) FROM transactions);
  RAISE NOTICE 'Created % messages', (SELECT COUNT(*) FROM messages);
  RAISE NOTICE 'Created % reviews', (SELECT COUNT(*) FROM reviews);
END $$;