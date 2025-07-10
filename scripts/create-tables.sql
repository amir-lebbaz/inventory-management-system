-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('worker', 'warehouse', 'hr')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('warehouse', 'hr')),
  item_name TEXT NOT NULL,
  quantity INTEGER,
  urgent BOOLEAN DEFAULT FALSE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'delivered')),
  response_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for inventory
CREATE POLICY "All authenticated users can view inventory" ON inventory
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only warehouse and HR can modify inventory" ON inventory
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('warehouse', 'hr')
    )
  );

-- Create policies for requests
CREATE POLICY "Workers can view their own requests" ON requests
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('warehouse', 'hr')
    )
  );

CREATE POLICY "Workers can create requests" ON requests
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'worker'
    )
  );

CREATE POLICY "Warehouse and HR can update requests" ON requests
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('warehouse', 'hr')
    )
  );

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
