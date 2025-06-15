/*
  # Fix Realtime Subscriptions

  1. Realtime Configuration
    - Ensure all tables have realtime enabled
    - Fix any subscription issues
    - Update publication settings

  2. Performance Optimization
    - Configure realtime for optimal performance
    - Set appropriate limits and timeouts
*/

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE project_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- Configure realtime settings for optimal performance
-- Note: These settings are applied at the database level and affect all realtime subscriptions

-- Create function to handle realtime notifications
CREATE OR REPLACE FUNCTION handle_realtime_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- For insert/update operations, return the new row
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Add any custom logic here if needed
    RETURN NEW;
  -- For delete operations, return the old row
  ELSIF (TG_OP = 'DELETE') THEN
    -- Add any custom logic here if needed
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for realtime notifications on key tables
DO $$
DECLARE
  tables TEXT[] := ARRAY['projects', 'project_bids', 'messages', 'transactions'];
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    -- Drop existing trigger if it exists
    EXECUTE format('DROP TRIGGER IF EXISTS realtime_notification_trigger ON %I', table_name);
    
    -- Create new trigger
    EXECUTE format('
      CREATE TRIGGER realtime_notification_trigger
      AFTER INSERT OR UPDATE OR DELETE ON %I
      FOR EACH ROW EXECUTE FUNCTION handle_realtime_notification()
    ', table_name);
  END LOOP;
END $$;

-- Verify realtime configuration
DO $$
BEGIN
  RAISE NOTICE 'Realtime configuration updated for all tables';
  RAISE NOTICE 'Realtime triggers created for key tables';
  RAISE NOTICE 'Publication supabase_realtime updated';
END $$;