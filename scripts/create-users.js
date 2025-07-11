const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase Admin Client (requires service_role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Users to create - المعلومات الحقيقية من المشروع
const users = [
  // الممرات - 10 ممرات
  { name: 'ممر 1', username: 'ممر1', password: '311', role: 'worker', department: 'التمريض' },
  { name: 'ممر 2', username: 'ممر2', password: '342', role: 'worker', department: 'التمريض' },
  { name: 'ممر 3', username: 'ممر3', password: '353', role: 'worker', department: 'التمريض' },
  { name: 'ممر 4', username: 'ممر4', password: '364', role: 'worker', department: 'التمريض' },
  { name: 'ممر 5', username: 'ممر5', password: '375', role: 'worker', department: 'التمريض' },
  { name: 'ممر 6', username: 'ممر6', password: '386', role: 'worker', department: 'التمريض' },
  { name: 'ممر 7', username: 'ممر7', password: '397', role: 'worker', department: 'التمريض' },
  { name: 'ممر 8', username: 'ممر8', password: '408', role: 'worker', department: 'التمريض' },
  { name: 'ممر 9', username: 'ممر9', password: '419', role: 'worker', department: 'التمريض' },
  { name: 'ممر 10', username: 'ممر10', password: '420', role: 'worker', department: 'التمريض' },
  
  // الإدارة
  { name: 'مدير المخزن', username: 'المخزن', password: '932', role: 'warehouse', department: 'المستودع' },
  { name: 'مسؤول الموارد البشرية', username: 'hr', password: '237', role: 'hr', department: 'الموارد البشرية' }
];

async function createUsers() {
  console.log('بدء إنشاء المستخدمين...');
  
  for (const user of users) {
    try {
      console.log(`إنشاء المستخدم: ${user.name}`);
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: `${user.username}@hospital.com`,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          username: user.username,
          name: user.name,
          role: user.role,
          department: user.department
        }
      });

      if (authError) {
        console.error(`خطأ في إنشاء المستخدم ${user.name}:`, authError.message);
        continue;
      }

      // Insert profile in profiles table
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: user.name,
          department: user.department,
          role: user.role
        });

      if (profileError) {
        console.error(`خطأ في إضافة البروفايل للمستخدم ${user.name}:`, profileError.message);
      } else {
        console.log(`✅ تم إنشاء المستخدم بنجاح: ${user.name} (${user.username})`);
      }

    } catch (error) {
      console.error(`خطأ غير متوقع للمستخدم ${user.name}:`, error.message);
    }
  }
  
  console.log('انتهى إنشاء المستخدمين!');
}

// Run the script
createUsers().catch(console.error); 