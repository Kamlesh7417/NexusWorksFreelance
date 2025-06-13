/*
  # Create storage buckets

  1. Storage Buckets
    - `project-files` - For project-related file uploads
    - `avatars` - For user avatar images
    - `portfolios` - For developer portfolio files

  2. Security
    - Set up RLS policies for each bucket
    - Allow authenticated users to upload files
    - Allow public access to view files
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('project-files', 'project-files', true),
  ('avatars', 'avatars', true),
  ('portfolios', 'portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for project-files bucket
CREATE POLICY "Authenticated users can upload project files" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'project-files' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view project files" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'project-files');

CREATE POLICY "Users can update their own project files" 
  ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'project-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own project files" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'project-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policies for avatars bucket
CREATE POLICY "Authenticated users can upload avatars" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view avatars" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars" 
  ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatars" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policies for portfolios bucket
CREATE POLICY "Authenticated users can upload portfolio files" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'portfolios' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view portfolio files" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'portfolios');

CREATE POLICY "Users can update their own portfolio files" 
  ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'portfolios' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own portfolio files" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'portfolios' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );