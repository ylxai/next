-- ====================================
-- Events Table Schema for Photo Studio
-- ====================================

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 100),
  description TEXT NOT NULL CHECK (length(description) >= 10 AND length(description) <= 1000),
  event_type TEXT NOT NULL CHECK (event_type IN ('wedding', 'birthday', 'corporate', 'graduation', 'engagement', 'family', 'other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'ongoing', 'completed', 'cancelled')),
  
  -- Date & Time
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Location & Participants
  location TEXT NOT NULL CHECK (length(location) >= 3 AND length(location) <= 200),
  max_participants INTEGER NOT NULL DEFAULT 50 CHECK (max_participants >= 1 AND max_participants <= 1000),
  
  -- Client Information
  client_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_name TEXT CHECK (client_name IS NULL OR (length(client_name) >= 2 AND length(client_name) <= 100)),
  client_email TEXT CHECK (client_email IS NULL OR client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  client_phone TEXT CHECK (client_phone IS NULL OR (length(client_phone) >= 8 AND length(client_phone) <= 15)),
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  
  -- Access Control
  access_code TEXT UNIQUE CHECK (access_code IS NULL OR (length(access_code) >= 4 AND length(access_code) <= 20)),
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Additional Information
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 500),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_access_code ON events(access_code);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Create function to auto-generate access code if not provided
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.access_code IS NULL OR NEW.access_code = '' THEN
    NEW.access_code := UPPER(substring(md5(random()::text) from 1 for 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate access code
DROP TRIGGER IF EXISTS trigger_generate_access_code ON events;
CREATE TRIGGER trigger_generate_access_code
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION generate_access_code();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS trigger_update_events_updated_at ON events;
CREATE TRIGGER trigger_update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can do everything
CREATE POLICY "Admins can manage events" ON events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Clients can view their own events
CREATE POLICY "Clients can view own events" ON events
  FOR SELECT
  USING (
    client_id = auth.uid() OR
    is_public = TRUE
  );

-- Public events can be viewed by everyone (if is_public = true)
CREATE POLICY "Public events viewable" ON events
  FOR SELECT
  USING (is_public = TRUE);

-- ====================================
-- Sample Data (Optional)
-- ====================================

-- Insert sample events (uncomment if needed)
/*
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
  client_name,
  client_email,
  client_phone,
  status,
  is_public
) VALUES 
(
  'Wedding Photography - John & Sarah',
  'Outdoor wedding photography session at beautiful garden venue. Include pre-wedding, ceremony, and reception coverage.',
  'wedding',
  '2024-06-15',
  '08:00',
  '22:00',
  'Garden Paradise Venue, Jl. Raya Bogor No. 123, Jakarta',
  100,
  15000000,
  'John Smith',
  'john.smith@email.com',
  '081234567890',
  'scheduled',
  false
),
(
  'Corporate Event - Tech Conference 2024',
  'Photography coverage for annual tech conference including speakers, networking sessions, and award ceremony.',
  'corporate',
  '2024-07-20',
  '09:00',
  '18:00',
  'Jakarta Convention Center, Hall A',
  500,
  8000000,
  'PT Technology Solutions',
  'events@techsol.com',
  '021-12345678',
  'scheduled',
  true
),
(
  'Birthday Party - Sweet 17 Celebration',
  'Sweet seventeen birthday party photography with elegant theme. Include decoration, cake cutting, and family portraits.',
  'birthday',
  '2024-05-25',
  '14:00',
  '20:00',
  'Ballroom Hotel Grand, Jakarta',
  80,
  5000000,
  'Maria Rodriguez',
  'maria.rodriguez@email.com',
  '081987654321',
  'completed',
  false
);
*/

-- ====================================
-- Verification Queries
-- ====================================

-- Check table structure
-- \d events

-- Check constraints
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'events'::regclass;

-- Check indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'events';

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'events';