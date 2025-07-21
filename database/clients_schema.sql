-- ====================================
-- Clients Table Schema for Photo Studio
-- ====================================

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  email TEXT UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone TEXT CHECK (length(phone) >= 8 AND length(phone) <= 15),
  
  -- Additional Information
  company TEXT CHECK (company IS NULL OR length(company) <= 100),
  address TEXT CHECK (address IS NULL OR length(address) <= 300),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 500),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS trigger_update_clients_updated_at ON clients;
CREATE TRIGGER trigger_update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can manage all clients
CREATE POLICY "Admins can manage clients" ON clients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Sample data (uncomment if needed)
/*
INSERT INTO clients (name, email, phone, company, address, status) VALUES 
('John Smith', 'john.smith@email.com', '081234567890', 'Tech Solutions Inc', 'Jl. Sudirman No. 123, Jakarta', 'active'),
('Maria Rodriguez', 'maria.rodriguez@email.com', '081987654321', NULL, 'Jl. Thamrin No. 456, Jakarta', 'active'),
('David Chen', 'david.chen@email.com', '081555666777', 'Creative Agency Ltd', 'Jl. Gatot Subroto No. 789, Jakarta', 'active');
*/