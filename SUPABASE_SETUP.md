# دليل إعداد Supabase - Supabase Setup Guide

## الخطوة الأولى: إنشاء مشروع Supabase

### 1. الذهاب إلى Supabase
- اذهب إلى [https://supabase.com](https://supabase.com)
- اضغط على "Start your project"
- سجل دخول أو أنشئ حساب جديد

### 2. إنشاء مشروع جديد
- اضغط على "New Project"
- اختر منظمة (Organization) أو أنشئ واحدة جديدة
- أدخل اسم المشروع: `inventory-management-system`
- أدخل كلمة مرور قوية لقاعدة البيانات
- اختر المنطقة الأقرب لك (مثل Europe West)
- اضغط على "Create new project"

### 3. انتظار إنشاء المشروع
- سيستغرق إنشاء المشروع حوالي 2-3 دقائق
- ستظهر رسالة "Your project is ready" عند الانتهاء

## الخطوة الثانية: الحصول على بيانات الاتصال

### 1. الذهاب إلى إعدادات المشروع
- في لوحة التحكم، اضغط على "Settings" في القائمة الجانبية
- ثم اضغط على "API"

### 2. نسخ بيانات الاتصال
ستجد المعلومات التالية:

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Anon/Public Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. إنشاء ملف البيئة
```bash
# في مجلد المشروع
cp .env.example .env.local
```

### 4. تعديل ملف البيئة
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## الخطوة الثالثة: إنشاء الجداول

### 1. الذهاب إلى SQL Editor
- في لوحة التحكم، اضغط على "SQL Editor" في القائمة الجانبية
- اضغط على "New Query"

### 2. نسخ ولصق الكود
انسخ محتوى ملف `scripts/setup-database.sql` والصقه في المحرر

### 3. تشغيل الكود
- اضغط على "Run" لتنفيذ الكود
- ستظهر رسالة نجاح عند الانتهاء

### 4. التحقق من الجداول
- اذهب إلى "Table Editor" في القائمة الجانبية
- ستجد الجداول التالية:
  - `requests` - الطلبات
  - `inventory` - المخزون
  - `expiring_items` - السلع منتهية الصلاحية
  - `messages` - الرسائل
  - `user_profiles` - ملفات تعريف المستخدمين
  - `notifications` - الإشعارات
  - `backups` - النسخ الاحتياطية

## الخطوة الرابعة: إعداد المصادقة

### 1. الذهاب إلى Authentication
- في لوحة التحكم، اضغط على "Authentication" في القائمة الجانبية
- ثم اضغط على "Settings"

### 2. تكوين إعدادات المصادقة
```bash
# Site URL
http://localhost:3000

# Redirect URLs
http://localhost:3000/auth/callback
http://localhost:3000/dashboard
```

### 3. إعداد مزودي المصادقة
- اذهب إلى "Providers"
- تأكد من تفعيل "Email"
- يمكنك إضافة مزودين آخرين مثل Google أو GitHub

## الخطوة الخامسة: إنشاء مستخدمين تجريبيين

### 1. الذهاب إلى Authentication > Users
- اضغط على "Add User"

### 2. إضافة المستخدمين التجريبيين

#### مستخدم عامل:
```bash
Email: worker@example.com
Password: 123456
```

#### مستخدم أمين مخزن:
```bash
Email: warehouse@example.com
Password: 123456
```

#### مستخدم موارد بشرية:
```bash
Email: hr@example.com
Password: 123456
```

### 3. إضافة بيانات إضافية للمستخدمين
بعد إنشاء المستخدمين، اذهب إلى "Table Editor" > `user_profiles` وأضف:

```sql
-- للمستخدم العامل
INSERT INTO user_profiles (user_id, name, department, role, avatar) 
VALUES ('user-id-here', 'عامل تجريبي', 'الإنتاج', 'worker', '👷');

-- لأمين المخزن
INSERT INTO user_profiles (user_id, name, department, role, avatar) 
VALUES ('user-id-here', 'أمين المخزن', 'المخزن', 'warehouse', '📦');

-- لمدير الموارد البشرية
INSERT INTO user_profiles (user_id, name, department, role, avatar) 
VALUES ('user-id-here', 'مدير الموارد البشرية', 'الموارد البشرية', 'hr', '👔');
```

## الخطوة السادسة: اختبار الاتصال

### 1. تشغيل المشروع
```bash
npm run dev
# أو
pnpm dev
```

### 2. فتح المتصفح
- اذهب إلى `http://localhost:3000`
- جرب تسجيل الدخول بالمستخدمين التجريبيين

### 3. التحقق من البيانات
- اذهب إلى "Table Editor" في Supabase
- تحقق من أن البيانات تُحفظ في الجداول

## الخطوة السابعة: إعداد الإشعارات (اختياري)

### 1. إعداد Realtime
- اذهب إلى "Database" > "Replication"
- فعّل Realtime لجميع الجداول

### 2. إعداد Storage (اختياري)
- اذهب إلى "Storage"
- أنشئ bucket جديد للصور والملفات

## استكشاف الأخطاء

### مشكلة: "Table doesn't exist"
**الحل:** تأكد من تشغيل ملف SQL بشكل صحيح

### مشكلة: "Invalid API key"
**الحل:** تحقق من صحة المفاتيح في ملف `.env.local`

### مشكلة: "CORS error"
**الحل:** أضف `http://localhost:3000` إلى قائمة المواقع المسموحة

### مشكلة: "RLS policy error"
**الحل:** تأكد من إنشاء سياسات الأمان بشكل صحيح

## الملفات المهمة

```bash
lib/supabase.ts          # إعداد Supabase
lib/enhanced-auth.ts     # نظام المصادقة
scripts/setup-database.sql # إنشاء الجداول
.env.local               # متغيرات البيئة
```

## الدعم

إذا واجهت أي مشاكل:
1. تحقق من [وثائق Supabase](https://supabase.com/docs)
2. تحقق من [GitHub Issues](https://github.com/supabase/supabase/issues)
3. اطرح سؤالاً في [Discord](https://discord.supabase.com) 