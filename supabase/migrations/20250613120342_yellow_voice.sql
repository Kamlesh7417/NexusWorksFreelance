/*
  # Create reviews and ratings system

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `reviewer_id` (uuid, references user_profiles)
      - `reviewee_id` (uuid, references user_profiles)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `reviews` table
    - Add policies for creating and viewing reviews
*/

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one review per reviewer per project per reviewee
  UNIQUE(project_id, reviewer_id, reviewee_id)
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view reviews" 
  ON reviews FOR SELECT 
  USING (true);

CREATE POLICY "Users can create reviews for completed projects" 
  ON reviews FOR INSERT 
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id 
      AND p.status = 'completed'
      AND (p.client_id = auth.uid() OR p.developer_id = auth.uid())
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_project_id ON reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Create function to calculate average rating
CREATE OR REPLACE FUNCTION public.calculate_user_rating(user_id UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews 
    WHERE reviewee_id = user_id
  );
END;
$$ LANGUAGE plpgsql;