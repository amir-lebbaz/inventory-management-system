# إعداد ملف البيئة (.env.local)

## خطوات إنشاء ملف .env.local:

### 1. إنشاء الملف
قم بإنشاء ملف `.env.local` في المجلد الرئيسي للمشروع (inventory-management-system/)

### 2. إضافة المتغيرات التالية:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database Configuration
DATABASE_URL=your_database_url_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="نظام إدارة المخزون"

# Feature Flags
NEXT_PUBLIC_ENABLE_REAL_TIME=true
NEXT_PUBLIC_ENABLE_AUDIO_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_BACKUP_SYSTEM=true
NEXT_PUBLIC_ENABLE_DATA_CLEANUP=true

# Mobile Configuration
NEXT_PUBLIC_MOBILE_OPTIMIZATION=true
NEXT_PUBLIC_RESPONSIVE_DESIGN=true
```

### 3. الحصول على قيم Supabase:

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. اذهب إلى Settings > API
4. انسخ القيم التالية:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 4. مثال على القيم:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ملاحظات مهمة:

- **لا تشارك Service Role Key** مع أي شخص
- تأكد من أن الملف `.env.local` موجود في `.gitignore`
- بعد إنشاء الملف، يمكنك تشغيل سكربت إنشاء المستخدمين

## تشغيل سكربت إنشاء المستخدمين:

بعد إنشاء ملف `.env.local`:

```bash
cd scripts
npm install
npm run create-users
``` 