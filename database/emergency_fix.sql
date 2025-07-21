-- ====================================
-- EMERGENCY FIX - Quick Solution for Foreign Key Error
-- ====================================

-- This is a quick fix to resolve the immediate error
-- Run this first, then run the comprehensive fix later

-- Step 1: Check the problematic data
SELECT 'Checking problematic events...' as status;
SELECT id, title, client_id, client_name 
FROM events 
WHERE client_id = '0bb08b8d-b527-4986-9fc0-5e56d0e8aed9';

-- Step 2: Fix the specific problematic record
UPDATE events 
SET client_id = NULL,
    client_name = COALESCE(client_name, 'Klien Tidak Terdaftar')
WHERE client_id = '0bb08b8d-b527-4986-9fc0-5e56d0e8aed9';

-- Step 3: Check for any other problematic records
SELECT 'Checking for other invalid client_id references...' as status;
SELECT COUNT(*) as invalid_count
FROM events e
WHERE e.client_id IS NOT NULL 
AND e.client_id NOT IN (SELECT id FROM clients WHERE id IS NOT NULL);

-- Step 4: Fix all invalid client_id references
UPDATE events 
SET client_id = NULL,
    client_name = COALESCE(client_name, 'Klien Tidak Terdaftar')
WHERE client_id IS NOT NULL 
AND client_id NOT IN (SELECT id FROM clients WHERE id IS NOT NULL);

-- Step 5: Now try to update the foreign key constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_client_id_fkey;
ALTER TABLE events 
ADD CONSTRAINT events_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Step 6: Disable RLS temporarily for testing
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Step 7: Test a simple insert
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
  'Emergency Test Event',
  'Testing after emergency fix',
  'other',
  '2024-12-25',
  '10:00',
  '16:00',
  'Emergency Test Location',
  25,
  100000
);

-- Step 8: Verify the insert worked
SELECT id, title FROM events WHERE title = 'Emergency Test Event';

-- Step 9: Clean up test
DELETE FROM events WHERE title = 'Emergency Test Event';

-- Step 10: Re-enable RLS with basic admin policy
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage events" ON events;
CREATE POLICY "Admin can manage events" ON events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

SELECT 'Emergency fix completed! You should now be able to create events.' as status;