// نظام مصادقة مبسط
export const users = {
  // الممرات - 10 ممرات
  ممر1: { password: "123", role: "worker", department: "ممر1", name: "عامل ممر 1" },
  ممر2: { password: "456", role: "worker", department: "ممر2", name: "عامل ممر 2" },
  ممر3: { password: "789", role: "worker", department: "ممر3", name: "عامل ممر 3" },
  ممر4: { password: "321", role: "worker", department: "ممر4", name: "عامل ممر 4" },
  ممر5: { password: "654", role: "worker", department: "ممر5", name: "عامل ممر 5" },
  ممر6: { password: "987", role: "worker", department: "ممر6", name: "عامل ممر 6" },
  ممر7: { password: "147", role: "worker", department: "ممر7", name: "عامل ممر 7" },
  ممر8: { password: "258", role: "worker", department: "ممر8", name: "عامل ممر 8" },
  ممر9: { password: "369", role: "worker", department: "ممر9", name: "عامل ممر 9" },
  ممر10: { password: "741", role: "worker", department: "ممر10", name: "عامل ممر 10" },

  // الإدارة
  المخزن: { password: "852", role: "warehouse", department: "المخزن", name: "أمين المخزن" },
  hr: { password: "963", role: "hr", department: "الموارد البشرية", name: "موظف الموارد البشرية" },
}

export interface User {
  username: string
  password: string
  role: string
  department: string
  name: string
}

export const authenticateUser = (username: string, password: string): User | null => {
  const user = users[username as keyof typeof users]
  if (user && user.password === password) {
    return {
      username,
      ...user,
    }
  }
  return null
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null

  const userData = localStorage.getItem("currentUser")
  return userData ? JSON.parse(userData) : null
}

export const setCurrentUser = (user: User) => {
  localStorage.setItem("currentUser", JSON.stringify(user))
}

export const logout = () => {
  localStorage.removeItem("currentUser")
}
