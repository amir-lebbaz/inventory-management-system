-- =====================================================
-- سكريبت إعداد قاعدة البيانات الكامل
-- نظام إدارة المخزون - Supabase
-- =====================================================

-- =====================================================
-- 1. إنشاء الجداول الأساسية
-- =====================================================

-- جدول البروفايلات
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('worker', 'warehouse', 'hr')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المخزون
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الطلبات
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

-- جدول المواد منتهية الصلاحية
CREATE TABLE IF NOT EXISTS expiring_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الرسائل
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

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول سجل النشاطات
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. تفعيل Row Level Security
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE expiring_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. إنشاء السياسات الأمنية
-- =====================================================

-- سياسات جدول البروفايلات
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- سياسات جدول المخزون
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

-- سياسات جدول الطلبات
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

-- سياسات جدول المواد منتهية الصلاحية
CREATE POLICY "All authenticated users can view expiring items" ON expiring_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Workers can create expiring items" ON expiring_items
  FOR INSERT TO authenticated WITH CHECK (true);

-- سياسات جدول الرسائل
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

-- سياسات جدول الإشعارات
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT TO authenticated USING (
    user_id = auth.jwt() ->> 'email'
  );

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE TO authenticated USING (
    user_id = auth.jwt() ->> 'email'
  );

-- سياسات جدول سجل النشاطات
CREATE POLICY "All authenticated users can view activity log" ON activity_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create activity log entries" ON activity_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- 4. إنشاء الدوال والـ Triggers
-- =====================================================

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء Triggers للجداول
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expiring_items_updated_at BEFORE UPDATE ON expiring_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_log_updated_at BEFORE UPDATE ON activity_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. إدخال بيانات المخزون الافتراضية
-- =====================================================

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
('أظرف', 80),
('قفازات طبية', 500),
('كمامات', 300),
('مطهرات', 50),
('ضمادات', 200),
('حقن', 150)
ON CONFLICT (name) DO UPDATE SET
  quantity = EXCLUDED.quantity;

-- =====================================================
-- 6. إدخال البروفايلات (يجب استبدال UUIDs بالأرقام الفعلية)
-- =====================================================

-- ملاحظة: يجب إنشاء المستخدمين أولاً في Authentication
-- ثم استبدال UUIDs بالأرقام الفعلية من جدول auth.users

INSERT INTO profiles (id, name, department, role) VALUES
-- الممرات (استبدل UUIDs بالأرقام الفعلية)
('00000000-0000-0000-0000-000000000001', 'ممر 1', 'التمريض', 'worker'),
('00000000-0000-0000-0000-000000000002', 'ممر 2', 'التمريض', 'worker'),
('00000000-0000-0000-0000-000000000003', 'ممر 3', 'التمريض', 'worker'),
('00000000-0000-0000-0000-000000000004', 'ممر 4', 'التمريض', 'worker'),
('00000000-0000-0000-0000-000000000005', 'ممر 5', 'التمريض', 'worker'),
('00000000-0000-0000-0000-000000000006', 'ممر 6', 'التمريض', 'worker'),
('00000000-0000-0000-0000-000000000007', 'ممر 7', 'التمريض', 'worker'),
('00000000-0000-0000-0000-000000000008', 'ممر 8', 'التمريض', 'worker'),
('00000000-0000-0000-0000-000000000009', 'ممر 9', 'التمريض', 'worker'),
('00000000-0000-0000-0000-000000000010', 'ممر 10', 'التمريض', 'worker'),

-- المديرين
('00000000-0000-0000-0000-000000000011', 'مدير المخزن', 'المستودع', 'warehouse'),
('00000000-0000-0000-0000-000000000012', 'مسؤول الموارد البشرية', 'الموارد البشرية', 'hr')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  role = EXCLUDED.role;

-- =====================================================
-- 7. إدخال بيانات تجريبية للرسائل والإشعارات
-- =====================================================

-- إدخال رسائل تجريبية
INSERT INTO messages (from_user, to_user, subject, content, priority) VALUES
('ممر1@hospital.com', 'hr@hospital.com', 'طلب إمدادات', 'نحتاج إلى قفازات طبية إضافية', 'high'),
('المخزن@hospital.com', 'ممر1@hospital.com', 'رد على الطلب', 'تم إرسال القفازات المطلوبة', 'medium'),
('hr@hospital.com', 'ممر2@hospital.com', 'تحديث جدول العمل', 'يرجى مراجعة الجدول الجديد', 'medium')
ON CONFLICT DO NOTHING;

-- إدخال إشعارات تجريبية
INSERT INTO notifications (user_id, title, message, type) VALUES
('ممر1@hospital.com', 'طلب جديد', 'تم إنشاء طلب جديد للمخزون', 'info'),
('المخزن@hospital.com', 'طلب عاجل', 'طلب عاجل من ممر 1', 'warning'),
('hr@hospital.com', 'تحديث النظام', 'تم تحديث النظام بنجاح', 'success')
ON CONFLICT DO NOTHING;

-- إدخال سجل نشاطات تجريبية
INSERT INTO activity_log (user_id, action, details) VALUES
('ممر1@hospital.com', 'login', 'تم تسجيل الدخول بنجاح'),
('المخزن@hospital.com', 'inventory_update', 'تم تحديث كمية القفازات الطبية'),
('hr@hospital.com', 'request_approval', 'تم الموافقة على طلب جديد')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. إنشاء فهارس لتحسين الأداء
-- =====================================================

-- فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_expiring_items_date ON expiring_items(expiry_date);

-- =====================================================
-- ملاحظات مهمة:
-- =====================================================

/*
1. يجب إنشاء المستخدمين أولاً في Authentication قبل تشغيل هذا السكريبت
2. استبدل UUIDs في جدول profiles بالأرقام الفعلية من جدول auth.users
3. تأكد من وجود جميع الجداول قبل تشغيل السياسات
4. اختبر النظام بعد التشغيل للتأكد من صحة الإعدادات
5. يمكن حذف البيانات التجريبية لاحقاً إذا لزم الأمر
*/

-- =====================================================
-- نهاية السكريبت
-- ===================================================== 