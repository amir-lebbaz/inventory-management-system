# الخطوة 3: إضافة البروفايلات بالمعلومات الحقيقية

## البيانات الحقيقية من المشروع:

### قائمة المستخدمين المطلوبين:

#### الممرات (10 مستخدمين):
1. **ممر 1** - كلمة المرور: `311` - الدور: `worker` - القسم: `التمريض`
2. **ممر 2** - كلمة المرور: `342` - الدور: `worker` - القسم: `التمريض`
3. **ممر 3** - كلمة المرور: `353` - الدور: `worker` - القسم: `التمريض`
4. **ممر 4** - كلمة المرور: `364` - الدور: `worker` - القسم: `التمريض`
5. **ممر 5** - كلمة المرور: `375` - الدور: `worker` - القسم: `التمريض`
6. **ممر 6** - كلمة المرور: `386` - الدور: `worker` - القسم: `التمريض`
7. **ممر 7** - كلمة المرور: `397` - الدور: `worker` - القسم: `التمريض`
8. **ممر 8** - كلمة المرور: `408` - الدور: `worker` - القسم: `التمريض`
9. **ممر 9** - كلمة المرور: `419` - الدور: `worker` - القسم: `التمريض`
10. **ممر 10** - كلمة المرور: `420` - الدور: `worker` - القسم: `التمريض`

#### المديرين (2 مستخدمين):
11. **المخزن** - كلمة المرور: `932` - الدور: `warehouse` - القسم: `المستودع`
12. **hr** - كلمة المرور: `237` - الدور: `hr` - القسم: `الموارد البشرية`

## خطوات إضافة البروفايلات:

### 1. إنشاء المستخدمين في Authentication:

اذهب إلى **Authentication > Users** في Supabase وأضف:

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

Email: المخزن@hospital.com
Password: 932

Email: hr@hospital.com
Password: 237
```

### 2. إضافة البروفايلات في جدول profiles:

اذهب إلى **Table Editor > profiles** وأضف:

```
id: (UUID من جدول auth.users)
name: ممر 1
department: التمريض
role: worker

id: (UUID من جدول auth.users)
name: ممر 2
department: التمريض
role: worker

id: (UUID من جدول auth.users)
name: ممر 3
department: التمريض
role: worker

id: (UUID من جدول auth.users)
name: ممر 4
department: التمريض
role: worker

id: (UUID من جدول auth.users)
name: ممر 5
department: التمريض
role: worker

id: (UUID من جدول auth.users)
name: ممر 6
department: التمريض
role: worker

id: (UUID من جدول auth.users)
name: ممر 7
department: التمريض
role: worker

id: (UUID من جدول auth.users)
name: ممر 8
department: التمريض
role: worker

id: (UUID من جدول auth.users)
name: ممر 9
department: التمريض
role: worker

id: (UUID من جدول auth.users)
name: ممر 10
department: التمريض
role: worker

id: (UUID من جدول auth.users)
name: مدير المخزن
department: المستودع
role: warehouse

id: (UUID من جدول auth.users)
name: مسؤول الموارد البشرية
department: الموارد البشرية
role: hr
```

### 3. الحصول على UUIDs:

1. اذهب إلى **Table Editor > auth.users**
2. انسخ UUID لكل مستخدم
3. استخدم هذا UUID في جدول profiles

### 4. اختبار تسجيل الدخول:

بعد إضافة جميع المستخدمين، اختبر:

```
ممر 1 / 311
ممر 2 / 342
ممر 3 / 353
...
المخزن / 932
hr / 237
```

## ملاحظات مهمة:

- ✅ استخدم كلمات المرور بالضبط كما هي مكتوبة
- ✅ تأكد من إضافة البروفايل لكل مستخدم
- ✅ اختبر تسجيل الدخول بعد كل إضافة
- ❌ لا تستخدم كلمات مرور مختلفة
- ❌ لا تنسى إضافة البروفايل بعد إنشاء المستخدم في Auth 