// سكربت اختبار سريع لتسجيل الدخول

// بيانات المستخدمين من enhanced-auth.ts
const users = {
  // الممرات - 10 ممرات
  'ممر1': { password: "311", role: "worker", department: "التمريض", name: "ممر 1", avatar: "👨‍💼" },
  'ممر2': { password: "342", role: "worker", department: "التمريض", name: "ممر 2", avatar: "👩‍💼" },
  'ممر3': { password: "353", role: "worker", department: "التمريض", name: "ممر 3", avatar: "👨‍💼" },
  'ممر4': { password: "364", role: "worker", department: "التمريض", name: "ممر 4", avatar: "👩‍💼" },
  'ممر5': { password: "375", role: "worker", department: "التمريض", name: "ممر 5", avatar: "👨‍💼" },
  'ممر6': { password: "386", role: "worker", department: "التمريض", name: "ممر 6", avatar: "👩‍💼" },
  'ممر7': { password: "397", role: "worker", department: "التمريض", name: "ممر 7", avatar: "👨‍💼" },
  'ممر8': { password: "408", role: "worker", department: "التمريض", name: "ممر 8", avatar: "👩‍💼" },
  'ممر9': { password: "419", role: "worker", department: "التمريض", name: "ممر 9", avatar: "👨‍💼" },
  'ممر10': { password: "420", role: "worker", department: "التمريض", name: "ممر 10", avatar: "👩‍💼" },

  // الإدارة
  'المخزن': { password: "932", role: "warehouse", department: "المستودع", name: "مدير المخزن", avatar: "📦" },
  'hr': { password: "237", role: "hr", department: "الموارد البشرية", name: "مسؤول الموارد البشرية", avatar: "👔" },
};

function authenticateUser(username, password) {
  const user = users[username];
  if (user && user.password === password) {
    return {
      username,
      ...user,
    };
  }
  return null;
}

// اختبار المستخدمين
console.log('🧪 اختبار تسجيل الدخول...\n');

const testCases = [
  { username: 'ممر1', password: '311', expected: true },
  { username: 'ممر2', password: '342', expected: true },
  { username: 'المخزن', password: '932', expected: true },
  { username: 'hr', password: '237', expected: true },
  { username: 'ممر1', password: '123', expected: false },
  { username: 'غيرموجود', password: '123', expected: false },
];

testCases.forEach((test, index) => {
  const result = authenticateUser(test.username, test.password);
  const success = (result !== null) === test.expected;
  
  if (success) {
    console.log(`✅ اختبار ${index + 1}: ${test.username} - ${test.password} (${result ? 'نجح' : 'فشل كما هو متوقع'})`);
  } else {
    console.log(`❌ اختبار ${index + 1}: ${test.username} - ${test.password} (فشل)`);
  }
});

console.log('\n📋 قائمة المستخدمين المتاحة:');
Object.keys(users).forEach(username => {
  console.log(`- ${username}: ${users[username].password}`);
}); 