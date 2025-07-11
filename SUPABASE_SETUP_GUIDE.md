# دليل إعداد Supabase

## كيفية الحصول على بيانات Supabase:

### 1. إنشاء مشروع Supabase:
1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اضغط على "New Project"
3. اختر اسم للمشروع (مثال: inventory-system)
4. اختر كلمة مرور قوية لقاعدة البيانات
5. اختر المنطقة الأقرب لك
6. اضغط "Create new project"

### 2. الحصول على البيانات المطلوبة:
1. في لوحة التحكم، اذهب إلى **Settings** > **API**
2. انسخ البيانات التالية:

#### Project URL:
```
https://your-project-id.supabase.co
```

#### anon public key:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### service_role secret key:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. تحديث ملف .env.local:
استبدل القيم في ملف `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. إنشاء الجداول:
1. اذهب إلى **SQL Editor** في Supabase
2. انسخ والصق محتوى ملف `scripts/create-tables.sql`
3. اضغط "Run" لإنشاء الجداول

### 5. تشغيل سكربت إنشاء المستخدمين:
```bash
cd scripts
npm run create-users
```

## ملاحظات مهمة:
- **لا تشارك Service Role Key** مع أي شخص
- احتفظ بالبيانات في مكان آمن
- تأكد من أن ملف .env.local موجود في .gitignore 