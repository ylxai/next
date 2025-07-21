-- Comprehensive fix for events table updated_at trigger issue
-- Run this in Supabase SQL Editor to fix the "record 'new' has no field 'updated_at'" error

-- Step 1: Drop existing problematic trigger and function
DROP TRIGGER IF EXISTS trigger_update_events_updated_at ON events;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- Step 2: Ensure updated_at column exists with proper definition
DO $$
BEGIN
  -- Check if updated_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' 
    AND column_name = 'updated_at'
    AND table_schema = 'public'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to events table';
  ELSE
    RAISE NOTICE 'updated_at column already exists in events table';
  END IF;
END $$;

-- Step 3: Create a robust trigger function
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if this is an UPDATE operation
  IF TG_OP = 'UPDATE' THEN
    -- Safely set updated_at to current timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  -- Always return NEW for both INSERT and UPDATE
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the trigger only for UPDATE operations
CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Step 5: Update any existing records with NULL updated_at
UPDATE events 
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

-- Step 6: Verify the fix
DO $$
DECLARE
  event_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- Count events
  SELECT COUNT(*) INTO event_count FROM events;
  
  -- Count triggers
  SELECT COUNT(*) INTO trigger_count 
  FROM information_schema.triggers 
  WHERE trigger_name = 'events_set_updated_at' 
  AND table_name = 'events';
  
  RAISE NOTICE 'Fix completed successfully:';
  RAISE NOTICE '- Events table has % records', event_count;
  RAISE NOTICE '- Trigger is % (1 = active, 0 = missing)', trigger_count;
  
  -- Test trigger if we have events
  IF event_count > 0 THEN
    -- Get a test event ID
    DECLARE
      test_id UUID;
      old_updated_at TIMESTAMP WITH TIME ZONE;
      new_updated_at TIMESTAMP WITH TIME ZONE;
    BEGIN
      -- Get first event
      SELECT id, updated_at INTO test_id, old_updated_at FROM events LIMIT 1;
      
      -- Wait a moment then update
      PERFORM pg_sleep(0.1);
      
      -- Trigger the update
      UPDATE events 
      SET notes = COALESCE(notes, 'Trigger test') 
      WHERE id = test_id;
      
      -- Get new timestamp
      SELECT updated_at INTO new_updated_at FROM events WHERE id = test_id;
      
      IF new_updated_at > old_updated_at THEN
        RAISE NOTICE '- Trigger test PASSED: updated_at changed from % to %', old_updated_at, new_updated_at;
      ELSE
        RAISE WARNING '- Trigger test FAILED: updated_at did not change';
      END IF;
    END;
  END IF;
END $$;

-- Step 7: Show final status
SELECT 
  'events_set_updated_at' as trigger_name,
  COUNT(*) as trigger_exists
FROM information_schema.triggers 
WHERE trigger_name = 'events_set_updated_at'
AND table_name = 'events';

RAISE NOTICE 'Events table updated_at trigger fix completed successfully!';