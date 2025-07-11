# نظام إدارة المخزون - Inventory Management System

## المشاكل والحلول

### المشكلة الأولى: التخزين المحلي (localStorage)

**المشكلة:** البيانات تُحفظ محلياً على جهاز المستخدم فقط ولا تنتشر عبر الأجهزة الأخرى.

**الحل:**

1. **إعداد Supabase:**
   ```bash
   # إنشاء حساب على Supabase
   # https://supabase.com
   
   # إضافة متغيرات البيئة
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **إنشاء الجداول في Supabase:**
   ```sql
   -- جدول الطلبات
   CREATE TABLE requests (
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

   -- جدول المخزون
   CREATE TABLE inventory (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name VARCHAR NOT NULL,
     quantity INTEGER NOT NULL DEFAULT 0,
     min_quantity INTEGER DEFAULT 10,
     location VARCHAR,
     category VARCHAR,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- جدول السلع منتهية الصلاحية
   CREATE TABLE expiring_items (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name VARCHAR NOT NULL,
     expiry_date DATE NOT NULL,
     location VARCHAR,
     notes TEXT,
     department VARCHAR,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- جدول الرسائل
   CREATE TABLE messages (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     from_user VARCHAR NOT NULL,
     to_user VARCHAR NOT NULL,
     subject VARCHAR NOT NULL,
     message TEXT NOT NULL,
     priority VARCHAR DEFAULT 'normal',
     read BOOLEAN DEFAULT false,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **تحديث الكود لاستخدام قاعدة البيانات:**
   - تم تحديث `lib/supabase.ts` مع وظائف قاعدة البيانات
   - استبدال `localStorage` بـ `supabase` في جميع الملفات

### المشكلة الثانية: التصميم غير المتجاوب

**المشكلة:** التصميم لا يتوافق مع الهواتف المحمولة.

**الحل:**

1. **تم إضافة تحسينات CSS في `globals.css`:**
   - فئات متجاوبة للهواتف: `.mobile-*`
   - فئات متجاوبة للأجهزة اللوحية: `.tablet-*`
   - فئات متجاوبة لأجهزة الكمبيوتر: `.desktop-*`

2. **فئات CSS الجديدة:**
   ```css
   /* للهواتف */
   .text-responsive { @apply text-sm sm:text-base md:text-lg lg:text-xl; }
   .btn-mobile { @apply h-12 sm:h-10 text-sm sm:text-base px-4 sm:px-6; }
   .card-mobile { @apply p-4 sm:p-6 rounded-lg sm:rounded-xl; }
   .grid-mobile { @apply grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4; }
   ```

3. **تحديث المكونات:**
   - تم تحديث صفحة تسجيل الدخول لتكون متجاوبة
   - إضافة فئات CSS الجديدة للمكونات

## خطوات التثبيت والتشغيل

### 1. تثبيت المتطلبات
```bash
npm install
# أو
pnpm install
```

### 2. إعداد Supabase
```bash
# اتبع الدليل المفصل في SUPABASE_SETUP.md
# أو اتبع الخطوات السريعة أدناه
```

#### الخطوات السريعة لإعداد Supabase:
1. اذهب إلى [https://supabase.com](https://supabase.com)
2. أنشئ مشروع جديد
3. اذهب إلى Settings > API
4. انسخ Project URL و Anon Key
5. اذهب إلى SQL Editor
6. انسخ محتوى `scripts/setup-database.sql` واشغله

### 3. إعداد البيئة
```bash
# نسخ ملف البيئة
cp env.example .env.local

# تعديل المتغيرات في .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. تشغيل التطبيق
```bash
npm run dev
# أو
pnpm dev
```

### 5. اختبار النظام
```bash
# افتح المتصفح على http://localhost:3000
# جرب الحسابات التجريبية:
# worker@example.com / 123456
# warehouse@example.com / 123456  
# hr@example.com / 123456
```

## الميزات الجديدة

### 1. قاعدة بيانات حقيقية
- ✅ تخزين مركزي للبيانات
- ✅ مزامنة فورية بين الأجهزة
- ✅ نسخ احتياطية تلقائية
- ✅ أمان عالي

### 2. تصميم متجاوب
- ✅ توافق كامل مع الهواتف
- ✅ توافق مع الأجهزة اللوحية
- ✅ توافق مع أجهزة الكمبيوتر
- ✅ واجهة مستخدم محسنة

### 3. تحسينات الأداء
- ✅ تحميل أسرع
- ✅ استجابة أفضل
- ✅ تجربة مستخدم محسنة

## هيكل المشروع

```
inventory-management-system/
├── app/                    # صفحات Next.js
├── components/             # المكونات
│   ├── ui/               # مكونات UI الأساسية
│   └── *.tsx             # مكونات خاصة
├── lib/                   # المكتبات والوظائف
│   ├── supabase.ts       # إعداد Supabase
│   ├── enhanced-auth.ts  # نظام المصادقة
│   └── *.ts              # وظائف أخرى
├── public/                # الملفات العامة
├── styles/                # ملفات CSS
└── package.json           # تبعيات المشروع
```

## الحسابات التجريبية

```
👷 عامل: worker / 123
📦 أمين مخزن: warehouse / 123  
👔 موارد بشرية: hr / 123
```

## التقنيات المستخدمة

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, Radix UI
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Charts:** Recharts
- **Icons:** Lucide React

## الدعم والمساعدة

إذا واجهت أي مشاكل:

1. تأكد من إعداد Supabase بشكل صحيح
2. تحقق من متغيرات البيئة
3. تأكد من إنشاء الجداول في قاعدة البيانات
4. تحقق من اتصال الإنترنت

## التحديثات المستقبلية

- [ ] إضافة نظام إشعارات فوري
- [ ] إضافة تقارير متقدمة
- [ ] إضافة نظام تتبع المخزون
- [ ] إضافة نظام إدارة المستخدمين
- [ ] إضافة نظام النسخ الاحتياطية التلقائي "# -" 
