-- إنشاء جدول الطلبات
CREATE TABLE IF NOT EXISTS requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR NOT NULL,
  item_name VARCHAR NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  urgent BOOLEAN DEFAULT false,
  notes TEXT,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_notes TEXT,
  user_department VARCHAR NOT NULL,
  user_id VARCHAR,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول المخزون
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 10,
  location VARCHAR,
  category VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول السلع منتهية الصلاحية
CREATE TABLE IF NOT EXISTS expiring_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  expiry_date DATE NOT NULL,
  location VARCHAR,
  notes TEXT,
  department VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الرسائل
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user VARCHAR NOT NULL,
  to_user VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR DEFAULT 'normal',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول المستخدمين (ملف تعريف)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  department VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'worker',
  avatar VARCHAR DEFAULT '👤',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول النسخ الاحتياطية
CREATE TABLE IF NOT EXISTS backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_requests_department ON requests(user_department);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_expiring_items_date ON expiring_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(from_user, to_user);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- إنشاء وظائف RLS (Row Level Security)
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE expiring_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للطلبات
CREATE POLICY "Users can view their own requests" ON requests
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own requests" ON requests
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "HR and Warehouse can view all requests" ON requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('hr', 'warehouse')
    )
  );

-- سياسات الأمان للمخزون
CREATE POLICY "Warehouse can manage inventory" ON inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'warehouse'
    )
  );

-- سياسات الأمان للرسائل
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    auth.uid()::text = from_user OR auth.uid()::text = to_user
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid()::text = from_user);

-- سياسات الأمان للإشعارات
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id);

-- إدراج بيانات تجريبية
INSERT INTO inventory (name, quantity, min_quantity, location, category) VALUES
('أقلام حبر', 50, 10, 'رف A1', 'مستلزمات مكتبية'),
('أوراق A4', 200, 50, 'رف B2', 'مستلزمات مكتبية'),
('شريط لاصق', 30, 5, 'رف C3', 'مستلزمات مكتبية'),
('مقاعد مكتبية', 15, 3, 'مستودع الأثاث', 'أثاث'),
('طاولات مكتبية', 8, 2, 'مستودع الأثاث', 'أثاث'),
('أجهزة كمبيوتر', 12, 4, 'مستودع الإلكترونيات', 'إلكترونيات'),
('طابعات', 6, 2, 'مستودع الإلكترونيات', 'إلكترونيات'),
('كابلات USB', 100, 20, 'مستودع الإلكترونيات', 'إلكترونيات')
ON CONFLICT (name) DO NOTHING;

-- إدراج سلع منتهية الصلاحية تجريبية
INSERT INTO expiring_items (name, expiry_date, location, notes, department) VALUES
('أدوية طبية', '2024-12-31', 'مستودع الأدوية', 'أدوية للطوارئ', 'الطوارئ'),
('مواد غذائية', '2024-11-15', 'مستودع الطعام', 'طعام للموظفين', 'المطبخ'),
('مواد تنظيف', '2024-10-20', 'مستودع التنظيف', 'مواد تنظيف عامة', 'النظافة')
ON CONFLICT DO NOTHING; 