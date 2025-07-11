-- Create expiring_items table
CREATE TABLE IF NOT EXISTS expiring_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for new tables
ALTER TABLE expiring_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies for expiring_items
CREATE POLICY "All authenticated users can view expiring items" ON expiring_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Workers can create expiring items" ON expiring_items
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create policies for messages
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT TO authenticated USING (
    from_user = auth.jwt() ->> 'email' OR 
    to_user = auth.jwt() ->> 'email'
  );

CREATE POLICY "Users can create messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE TO authenticated USING (
    from_user = auth.jwt() ->> 'email' OR 
    to_user = auth.jwt() ->> 'email'
  );

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT TO authenticated USING (
    user_id = auth.jwt() ->> 'email'
  );

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE TO authenticated USING (
    user_id = auth.jwt() ->> 'email'
  );

-- Create policies for activity_log
CREATE POLICY "All authenticated users can view activity log" ON activity_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create activity log entries" ON activity_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create triggers for new tables
CREATE TRIGGER update_expiring_items_updated_at BEFORE UPDATE ON expiring_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_log_updated_at BEFORE UPDATE ON activity_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 