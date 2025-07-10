// نظام مصادقة محسن مع بيانات إضافية
export const users = {
  // الممرات - 10 ممرات
  ممر1: { password: "123", role: "worker", department: "ممر1", name: "عامل ممر 1", avatar: "👨‍💼" },
  ممر2: { password: "456", role: "worker", department: "ممر2", name: "عامل ممر 2", avatar: "👩‍💼" },
  ممر3: { password: "789", role: "worker", department: "ممر3", name: "عامل ممر 3", avatar: "👨‍💼" },
  ممر4: { password: "321", role: "worker", department: "ممر4", name: "عامل ممر 4", avatar: "👩‍💼" },
  ممر5: { password: "654", role: "worker", department: "ممر5", name: "عامل ممر 5", avatar: "👨‍💼" },
  ممر6: { password: "987", role: "worker", department: "ممر6", name: "عامل ممر 6", avatar: "👩‍💼" },
  ممر7: { password: "147", role: "worker", department: "ممر7", name: "عامل ممر 7", avatar: "👨‍💼" },
  ممر8: { password: "258", role: "worker", department: "ممر8", name: "عامل ممر 8", avatar: "👩‍💼" },
  ممر9: { password: "369", role: "worker", department: "ممر9", name: "عامل ممر 9", avatar: "👨‍💼" },
  ممر10: { password: "741", role: "worker", department: "ممر10", name: "عامل ممر 10", avatar: "👩‍💼" },

  // الإدارة
  المخزن: { password: "852", role: "warehouse", department: "المخزن", name: "أمين المخزن", avatar: "📦" },
  hr: { password: "963", role: "hr", department: "الموارد البشرية", name: "مدير الموارد البشرية", avatar: "👔" },
}

export interface User {
  username: string
  password: string
  role: string
  department: string
  name: string
  avatar: string
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

// وظائف إدارة البيانات المحسنة
export const saveInventoryItem = (item: any) => {
  const inventory = JSON.parse(localStorage.getItem("warehouse_inventory") || "[]")
  const existingIndex = inventory.findIndex((i: any) => i.name === item.name)

  if (existingIndex >= 0) {
    inventory[existingIndex] = { ...inventory[existingIndex], ...item, updated_at: new Date().toISOString() }
  } else {
    inventory.push({ ...item, id: Date.now().toString(), created_at: new Date().toISOString() })
  }

  localStorage.setItem("warehouse_inventory", JSON.stringify(inventory))
}

export const getInventoryItems = () => {
  return JSON.parse(localStorage.getItem("warehouse_inventory") || "[]")
}

export const saveExpiringItem = (item: any) => {
  const expiringItems = JSON.parse(localStorage.getItem("expiring_items") || "[]")
  expiringItems.push({ ...item, id: Date.now().toString(), created_at: new Date().toISOString() })
  localStorage.setItem("expiring_items", JSON.stringify(expiringItems))
}

export const getExpiringItems = () => {
  return JSON.parse(localStorage.getItem("expiring_items") || "[]")
}

/* ------------------------------------------------------------------ */
/* 🌟 NEW HELPERS – system bootstrap & easy login                     */
/* ------------------------------------------------------------------ */

/**
 * Boot-strap localStorage with the required keys if they don’t exist yet.
 * – Creates empty arrays for requests / inventory / expiring items
 * – Saves a timestamp for lastCleanup so the data-cleanup util can run
 */
export function initializeSystem() {
  if (typeof window === "undefined") return

  const defaults: Record<string, any> = {
    all_requests: [],
    warehouse_inventory: [],
    expiring_items: [],
    lastCleanup: new Date().toISOString(),
  }

  Object.entries(defaults).forEach(([key, value]) => {
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, JSON.stringify(value))
    }
  })
}

/**
 * Convenience wrapper used by the login page.
 * Validates the credentials, saves the user in localStorage, and returns it.
 * Returns null if auth fails.
 */
export function login(username: string, password: string, department?: string): User | null {
  const user = authenticateUser(username, password)

  // allow workers to log in using only their corridor name
  if (!user && department) {
    // department-based auth fallback
    const deptUser = authenticateUser(username, password) // reuse normal validation
    if (deptUser && deptUser.department === department) {
      setCurrentUser(deptUser)
      return deptUser
    }
    return null
  }

  if (user) {
    setCurrentUser(user)
    return user
  }
  return null
}
