# دليل إعداد قاعدة البيانات الكامل

## 📋 نظرة عامة

هذا الدليل يوضح كيفية إعداد قاعدة البيانات الكاملة لنظام إدارة المخزون باستخدام ملف `complete-setup.sql` الواحد.

## 🚀 خطوات الإعداد

### الخطوة 1: إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ مشروع جديد
3. احصل على المفاتيح المطلوبة:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### الخطوة 2: إعداد ملف البيئة

أضف المفاتيح إلى ملف `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### الخطوة 3: إنشاء المستخدمين في Authentication

اذهب إلى **Authentication > Users** في Supabase وأضف:

#### الممرات (10 مستخدمين):
```
Email: ممر1@hospital.com
Password: 311

Email: ممر2@hospital.com  
Password: 342

Email: ممر3@hospital.com
Password: 353

Email: ممر4@hospital.com
Password: 364

Email: ممر5@hospital.com
Password: 375

Email: ممر6@hospital.com
Password: 386

Email: ممر7@hospital.com
Password: 397

Email: ممر8@hospital.com
Password: 408

Email: ممر9@hospital.com
Password: 419

Email: ممر10@hospital.com
Password: 420
```

#### المديرين (2 مستخدمين):
```
Email: المخزن@hospital.com
Password: 932

Email: hr@hospital.com
Password: 237
```

### الخطوة 4: الحصول على UUIDs

1. اذهب إلى **Table Editor > auth.users**
2. انسخ UUID لكل مستخدم
3. استبدل UUIDs في ملف `complete-setup.sql`

### الخطوة 5: تشغيل السكريبت الكامل

1. اذهب إلى **SQL Editor** في Supabase
2. انسخ محتوى ملف `complete-setup.sql`
3. استبدل UUIDs بالأرقام الفعلية
4. شغل السكريبت

## 📊 الجداول المنشأة

### 1. **profiles** - بروفايلات المستخدمين
- `id` - معرف المستخدم (مرتبط بـ auth.users)
- `name` - اسم المستخدم
- `department` - القسم
- `role` - الدور (worker, warehouse, hr)

### 2. **inventory** - المخزون
- `id` - معرف العنصر
- `name` - اسم العنصر
- `quantity` - الكمية
- `created_at` - تاريخ الإنشاء
- `updated_at` - تاريخ التحديث

### 3. **requests** - الطلبات
- `id` - معرف الطلب
- `user_id` - معرف المستخدم الطالب
- `type` - نوع الطلب (warehouse, hr)
- `item_name` - اسم العنصر المطلوب
- `quantity` - الكمية المطلوبة
- `urgent` - عاجل أم لا
- `notes` - ملاحظات
- `status` - حالة الطلب
- `response_notes` - ملاحظات الرد

### 4. **expiring_items** - المواد منتهية الصلاحية
- `id` - معرف العنصر
- `name` - اسم العنصر
- `expiry_date` - تاريخ انتهاء الصلاحية
- `location` - الموقع
- `notes` - ملاحظات

### 5. **messages** - الرسائل
- `id` - معرف الرسالة
- `from_user` - المرسل
- `to_user` - المستلم
- `subject` - الموضوع
- `content` - المحتوى
- `priority` - الأولوية
- `read` - مقروءة أم لا

### 6. **notifications** - الإشعارات
- `id` - معرف الإشعار
- `user_id` - معرف المستخدم
- `title` - العنوان
- `message` - الرسالة
- `type` - نوع الإشعار
- `read` - مقروء أم لا

### 7. **activity_log** - سجل النشاطات
- `id` - معرف النشاط
- `user_id` - معرف المستخدم
- `action` - العملية
- `details` - التفاصيل

## 🔒 السياسات الأمنية

### Row Level Security (RLS)
تم تفعيل RLS على جميع الجداول مع السياسات التالية:

- **profiles**: المستخدمون يرون ويحدثون بروفايلاتهم فقط
- **inventory**: الجميع يرون، فقط warehouse و hr يعدلون
- **requests**: الممرات يرون طلباتهم، warehouse و hr يرون الجميع
- **messages**: المستخدمون يرون رسائلهم فقط
- **notifications**: المستخدمون يرون إشعاراتهم فقط
- **activity_log**: الجميع يرون سجل النشاطات

## 📈 الفهارس المحسنة

تم إنشاء فهارس لتحسين الأداء:
- `idx_profiles_role` - للبحث حسب الدور
- `idx_requests_status` - للبحث حسب حالة الطلب
- `idx_inventory_name` - للبحث في المخزون
- `idx_messages_from_user` - للرسائل المرسلة
- `idx_messages_to_user` - للرسائل المستلمة
- `idx_notifications_user_id` - لإشعارات المستخدم
- `idx_activity_log_user_id` - لنشاطات المستخدم
- `idx_expiring_items_date` - للمواد منتهية الصلاحية

## 🔄 Triggers والدوال

### دالة `update_updated_at_column()`
تحدث `updated_at` تلقائياً عند تحديث أي سجل

### Triggers المنشأة:
- `update_requests_updated_at`
- `update_inventory_updated_at`
- `update_expiring_items_updated_at`
- `update_messages_updated_at`
- `update_notifications_updated_at`
- `update_activity_log_updated_at`

## 📝 البيانات الافتراضية

### المخزون الافتراضي:
- أقلام حبر جاف (100)
- ورق A4 (50)
- دباسة (25)
- مشابك ورق (200)
- أقلام رصاص (75)
- ممحاة (30)
- مقص (15)
- شريط لاصق (40)
- ملفات (60)
- أظرف (80)
- قفازات طبية (500)
- كمامات (300)
- مطهرات (50)
- ضمادات (200)
- حقن (150)

### بيانات تجريبية:
- رسائل تجريبية بين المستخدمين
- إشعارات تجريبية
- سجل نشاطات تجريبية

## 🧪 اختبار النظام

بعد تشغيل السكريبت، اختبر:

1. **تسجيل الدخول:**
   ```
   ممر 1 / 311
   ممر 2 / 342
   ...
   المخزن / 932
   hr / 237
   ```

2. **الوصول للصفحات:**
   - الممرات → صفحة الممرات
   - المخزن → صفحة المخزن
   - HR → صفحة الموارد البشرية

3. **إنشاء طلبات:**
   - الممرات يمكنهم إنشاء طلبات
   - المخزن و HR يمكنهم الموافقة/رفض الطلبات

4. **إدارة المخزون:**
   - المخزن و HR يمكنهم تعديل المخزون
   - الجميع يمكنهم رؤية المخزون

## ⚠️ ملاحظات مهمة

### قبل التشغيل:
- ✅ تأكد من إنشاء المستخدمين في Authentication
- ✅ احصل على UUIDs من جدول auth.users
- ✅ استبدل UUIDs في السكريبت
- ✅ تأكد من صحة المفاتيح في .env.local

### بعد التشغيل:
- ✅ اختبر تسجيل الدخول لجميع المستخدمين
- ✅ اختبر الوصول للصفحات المختلفة
- ✅ اختبر إنشاء الطلبات
- ✅ اختبر إدارة المخزون
- ✅ اختبر نظام الرسائل والإشعارات

### في حالة الأخطاء:
- 🔍 تحقق من console في المتصفح
- 🔍 راجع logs في Supabase
- 🔍 تأكد من صحة RLS policies
- 🔍 تحقق من وجود جميع الجداول

## 🆘 الدعم

إذا واجهت أي مشاكل:

1. تحقق من **Logs** في Supabase
2. راجع **Authentication > Users**
3. تحقق من **Table Editor** للتأكد من وجود الجداول
4. اختبر **SQL Editor** للتأكد من صحة السياسات

## 📞 المساعدة

للمساعدة الإضافية:
- راجع ملفات README الأخرى في مجلد scripts
- تحقق من console في المتصفح للأخطاء
- راجع logs في Supabase للمشاكل 