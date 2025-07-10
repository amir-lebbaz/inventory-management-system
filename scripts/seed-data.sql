-- Insert sample users (you'll need to create these users in Supabase Auth first)
-- This is just sample data structure

-- Insert sample inventory items
INSERT INTO inventory (name, quantity) VALUES
('أقلام حبر جاف', 100),
('ورق A4', 50),
('دباسة', 25),
('مشابك ورق', 200),
('أقلام رصاص', 75),
('ممحاة', 30),
('مقص', 15),
('شريط لاصق', 40),
('ملفات', 60),
('أظرف', 80)
ON CONFLICT (name) DO UPDATE SET
  quantity = EXCLUDED.quantity;

-- Note: You'll need to manually create user accounts in Supabase Auth
-- and then insert corresponding profiles. Here's the structure:

-- Sample profiles (replace UUIDs with actual user IDs from auth.users)
-- INSERT INTO profiles (id, name, department, role) VALUES
-- ('user-uuid-1', 'أحمد محمد', 'المبيعات', 'worker'),
-- ('user-uuid-2', 'فاطمة علي', 'المحاسبة', 'worker'),
-- ('user-uuid-3', 'محمد أحمد', 'المخزن', 'warehouse'),
-- ('user-uuid-4', 'سارة خالد', 'الموارد البشرية', 'hr');
