-- ====================================
-- Events Schema Fix for Client Reference
-- ====================================

-- Step 1: Drop existing foreign key constraint on client_id if it exists
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_client_id_fkey;

-- Step 2: Update client_id to reference clients table instead of users
ALTER TABLE events 
ADD CONSTRAINT events_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Step 3: Temporarily disable RLS for testing (re-enable after fixing)
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Step 4: Check if we have any test data that might be causing issues
-- Delete any invalid test data
DELETE FROM events WHERE title IS NULL OR title = '';
DELETE FROM events WHERE description IS NULL OR description = '';
DELETE FROM events WHERE date IS NULL;

-- Step 5: Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- Step 6: Test insert with minimal required data
INSERT INTO events (
  title,
  description,
  event_type,
  date,
  start_time,
  end_time,
  location,
  max_participants,
  price
) VALUES (
  'Test Event Fix',
  'Testing event creation after schema fix',
  'wedding',
  '2024-12-25',
  '09:00',
  '17:00',
  'Test Location Studio',
  50,
  1000000
);

-- Step 7: Check if insert worked
SELECT * FROM events WHERE title = 'Test Event Fix';

-- Step 8: Clean up test data
DELETE FROM events WHERE title = 'Test Event Fix';

-- Step 9: Re-enable RLS with proper policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Step 10: Create/Update RLS policies for events
DROP POLICY IF EXISTS "Admin can manage events" ON events;
DROP POLICY IF EXISTS "Users can view public events" ON events;

-- Policy for admin access
CREATE POLICY "Admin can manage events" ON events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy for public event viewing
CREATE POLICY "Users can view public events" ON events
  FOR SELECT
  USING (is_public = true OR client_id = auth.uid());

-- Verify policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies WHERE tablename = 'events';