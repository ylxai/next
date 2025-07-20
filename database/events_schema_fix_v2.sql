-- ====================================
-- Events Schema Fix V2 - Handle Existing Data Conflicts
-- ====================================

-- Step 1: Check existing data conflicts
SELECT 'Checking existing events with invalid client_id references...' as status;

-- Show events with invalid client_id references
SELECT e.id, e.title, e.client_id, e.client_name
FROM events e
LEFT JOIN clients c ON e.client_id = c.id
WHERE e.client_id IS NOT NULL AND c.id IS NULL;

-- Count of problematic records
SELECT COUNT(*) as invalid_client_references
FROM events e
LEFT JOIN clients c ON e.client_id = c.id
WHERE e.client_id IS NOT NULL AND c.id IS NULL;

-- Step 2: Check if clients table exists and has data
SELECT 'Checking clients table...' as status;
SELECT COUNT(*) as clients_count FROM clients;

-- Step 3: Clean up invalid client_id references
SELECT 'Cleaning up invalid client_id references...' as status;

-- Option A: Set invalid client_id to NULL and preserve client data in separate fields
UPDATE events 
SET client_id = NULL,
    client_name = COALESCE(client_name, 'Klien Tidak Terdaftar'),
    client_email = COALESCE(client_email, ''),
    client_phone = COALESCE(client_phone, '')
WHERE client_id IS NOT NULL 
AND client_id NOT IN (SELECT id FROM clients);

-- Step 4: Drop existing foreign key constraint if it exists
SELECT 'Dropping existing foreign key constraint...' as status;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_client_id_fkey;

-- Step 5: Update client_id to reference clients table instead of users
SELECT 'Adding new foreign key constraint to clients table...' as status;
ALTER TABLE events 
ADD CONSTRAINT events_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Step 6: Temporarily disable RLS for testing
SELECT 'Temporarily disabling RLS for testing...' as status;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- Step 7: Test insert with minimal required data
SELECT 'Testing event insert...' as status;
INSERT INTO events (
  title,
  description,
  event_type,
  date,
  start_time,
  end_time,
  location,
  max_participants,
  price,
  status
) VALUES (
  'Test Event Schema Fix V2',
  'Testing event creation after schema fix with conflict resolution',
  'other',
  '2024-12-25',
  '10:00',
  '16:00',
  'Test Location Studio Fix',
  50,
  500000,
  'draft'
);

-- Step 8: Verify the test insert worked
SELECT 'Verifying test insert...' as status;
SELECT id, title, client_id, created_at 
FROM events 
WHERE title = 'Test Event Schema Fix V2';

-- Step 9: Clean up test data
SELECT 'Cleaning up test data...' as status;
DELETE FROM events WHERE title = 'Test Event Schema Fix V2';

-- Step 10: Create sample client for testing (optional)
SELECT 'Creating sample client for testing...' as status;
INSERT INTO clients (name, phone, email, status) 
VALUES ('Test Client for Events', '081234567890', 'testclient@example.com', 'active')
ON CONFLICT (email) DO NOTHING;

-- Get the sample client ID
SELECT id, name FROM clients WHERE email = 'testclient@example.com';

-- Step 11: Test event creation with client reference
SELECT 'Testing event with client reference...' as status;
INSERT INTO events (
  title,
  description,
  event_type,
  date,
  start_time,
  end_time,
  location,
  max_participants,
  price,
  status,
  client_id
) VALUES (
  'Test Event With Client',
  'Testing event creation with valid client reference',
  'wedding',
  '2024-12-26',
  '14:00',
  '18:00',
  'Test Wedding Venue',
  100,
  5000000,
  'draft',
  (SELECT id FROM clients WHERE email = 'testclient@example.com')
);

-- Step 12: Verify client relationship works
SELECT 'Verifying client relationship...' as status;
SELECT e.title, e.client_id, c.name as client_name, c.email as client_email
FROM events e
LEFT JOIN clients c ON e.client_id = c.id
WHERE e.title = 'Test Event With Client';

-- Step 13: Clean up test data
SELECT 'Cleaning up test data with client...' as status;
DELETE FROM events WHERE title = 'Test Event With Client';
-- DELETE FROM clients WHERE email = 'testclient@example.com'; -- Keep for future testing

-- Step 14: Re-enable RLS with proper policies
SELECT 'Re-enabling RLS with proper policies...' as status;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Step 15: Create/Update RLS policies for events
SELECT 'Creating RLS policies...' as status;

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can manage events" ON events;
DROP POLICY IF EXISTS "Users can view public events" ON events;
DROP POLICY IF EXISTS "Clients can view own events" ON events;

-- Create admin policy for events
CREATE POLICY "Admin can manage events" ON events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policy for public events
CREATE POLICY "Users can view public events" ON events
  FOR SELECT
  USING (is_public = true);

-- Create policy for client events (if client_id matches user)
CREATE POLICY "Clients can view own events" ON events
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE id = auth.uid()
    )
  );

-- Step 16: Create/Update RLS policies for clients
-- Drop existing policies
DROP POLICY IF EXISTS "Admin can manage clients" ON clients;

-- Create admin policy for clients
CREATE POLICY "Admin can manage clients" ON clients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Step 17: Final verification
SELECT 'Final verification...' as status;

-- Check foreign key constraints
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'events'
AND kcu.column_name = 'client_id';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('events', 'clients')
ORDER BY tablename, policyname;

-- Summary of data
SELECT 
  'Events total' as table_name,
  COUNT(*) as record_count
FROM events
UNION ALL
SELECT 
  'Events with client_id' as table_name,
  COUNT(*) as record_count
FROM events WHERE client_id IS NOT NULL
UNION ALL
SELECT 
  'Events with client data' as table_name,
  COUNT(*) as record_count
FROM events WHERE client_name IS NOT NULL
UNION ALL
SELECT 
  'Clients total' as table_name,
  COUNT(*) as record_count
FROM clients;

SELECT 'Schema fix V2 completed successfully!' as status;