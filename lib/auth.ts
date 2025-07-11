// نظام مصادقة مبسط
export const users = {
  // الممرات - 10 ممرات
  ممر1: { password: "123", role: "worker", name: "عامل ممر 1" },
  ممر2: { password: "456", role: "worker", name: "عامل ممر 2" },
  ممر3: { password: "789", role: "worker", name: "عامل ممر 3" },
  ممر4: { password: "321", role: "worker", name: "عامل ممر 4" },
  ممر5: { password: "654", role: "worker", name: "عامل ممر 5" },
  ممر6: { password: "987", role: "worker", name: "عامل ممر 6" },
  ممر7: { password: "147", role: "worker", name: "عامل ممر 7" },
  ممر8: { password: "258", role: "worker", name: "عامل ممر 8" },
  ممر9: { password: "369", role: "worker", name: "عامل ممر 9" },
  ممر10: { password: "741", role: "worker", name: "عامل ممر 10" },

  // الإدارة
  المخزن: { password: "852", role: "warehouse", name: "أمين المخزن" },
  hr: { password: "963", role: "hr", name: "موظف الموارد البشرية" },
}

export interface User {
  username: string
  role: string
  name: string
}

export const authenticateUser = (username: string, password: string): User | null => {
  const user = users[username as keyof typeof users]
  if (user && user.password === password) {
    return {
      username,
      role: user.role,
      name: user.name,
    }
  }
  return null
}

export const setCurrentUser = (user: User) => {
  localStorage.setItem("currentUser", JSON.stringify(user))
}

export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem("currentUser")
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

export const logout = () => {
  localStorage.removeItem("currentUser")
}
