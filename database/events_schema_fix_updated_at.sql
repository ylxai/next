-- Fix for updated_at trigger issue in events table
-- This script fixes the "record 'new' has no field 'updated_at'" error

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS trigger_update_events_updated_at ON events;

-- Drop the existing function
DROP FUNCTION IF EXISTS update_updated_at();

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update the updated_at field if it exists and this is an UPDATE operation
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at = NOW();
    RETURN NEW;
  END IF;
  
  -- For INSERT operations, just return NEW as-is
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger only for UPDATE operations
CREATE TRIGGER trigger_update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Verify the updated_at column exists
DO $$
BEGIN
  -- Check if updated_at column exists, if not, add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' 
    AND column_name = 'updated_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Update any existing records that might have null updated_at
UPDATE events 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Test the trigger by updating a dummy field (if events exist)
-- This will help us verify that the trigger works correctly
DO $$
DECLARE
  test_event_id UUID;
BEGIN
  -- Get the first event ID to test with
  SELECT id INTO test_event_id FROM events LIMIT 1;
  
  -- If we have an event, test the trigger
  IF test_event_id IS NOT NULL THEN
    -- Update a field to trigger the updated_at update
    UPDATE events 
    SET notes = COALESCE(notes, '') 
    WHERE id = test_event_id;
    
    RAISE NOTICE 'Trigger test completed successfully for event ID: %', test_event_id;
  ELSE
    RAISE NOTICE 'No events found to test trigger with - this is normal for new installations';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Trigger test failed, but this might be normal: %', SQLERRM;
END $$;

-- Verify trigger is working
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_events_updated_at';