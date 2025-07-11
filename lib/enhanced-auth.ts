import { supabase } from './supabase'
import { addActivityNotification } from "./communication"

// تهيئة النظام
export const initializeSystem = () => {
  try {
    console.log('تهيئة النظام...')
    
    // التحقق من اتصال Supabase
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('خطأ في الاتصال بـ Supabase:', error)
      } else {
        console.log('تم الاتصال بـ Supabase بنجاح')
      }
    })

    console.log('تم تهيئة النظام بنجاح')
  } catch (error) {
    console.error('خطأ في تهيئة النظام:', error)
  }
}

// نظام مصادقة محسن مع بيانات إضافية
export const users = {
  // الممرات - 10 ممرات
  ممر1: { password: "311", role: "worker", name: "ممر 1", avatar: "👨‍💼" },
  ممر2: { password: "342", role: "worker", name: "ممر 2", avatar: "👩‍💼" },
  ممر3: { password: "353", role: "worker", name: "ممر 3", avatar: "👨‍💼" },
  ممر4: { password: "364", role: "worker", name: "ممر 4", avatar: "👩‍💼" },
  ممر5: { password: "375", role: "worker", name: "ممر 5", avatar: "👨‍💼" },
  ممر6: { password: "386", role: "worker", name: "ممر 6", avatar: "👩‍💼" },
  ممر7: { password: "397", role: "worker", name: "ممر 7", avatar: "👨‍💼" },
  ممر8: { password: "408", role: "worker", name: "ممر 8", avatar: "👩‍💼" },
  ممر9: { password: "419", role: "worker", name: "ممر 9", avatar: "👨‍💼" },
  ممر10: { password: "420", role: "worker", name: "ممر 10", avatar: "👩‍💼" },

  // الإدارة
  المخزن: { password: "932", role: "warehouse", name: "مدير المخزن", avatar: "📦" },
  hr: { password: "237", role: "hr", name: "مسؤول الموارد البشرية", avatar: "👔" },
}

export interface User {
  username: string
  role: string
  name: string
  avatar: string
  loginTime?: string
}

export const authenticateUser = (username: string, password: string): User | null => {
  const user = users[username as keyof typeof users]
  if (user && user.password === password) {
    return {
      username,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
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
  try {
    const currentUser = getCurrentUser()
    if (currentUser) {
      // إضافة إشعار تسجيل الخروج
      addActivityNotification(currentUser.username, "logout", `تم تسجيل الخروج في ${new Date().toLocaleString("ar-SA")}`)
    }
    
    localStorage.removeItem("currentUser")
  } catch (error) {
    console.error("خطأ في تسجيل الخروج:", error)
  }
}

export const saveExpiringItem = (item: {
  name: string
  expiry_date: string
  location: string
  notes: string
}) => {
  const expiringItems = JSON.parse(localStorage.getItem("expiring_items") || "[]")
  const newItem = {
    id: Date.now().toString(),
    ...item,
    created_at: new Date().toISOString(),
  }
  expiringItems.push(newItem)
  localStorage.setItem("expiring_items", JSON.stringify(expiringItems))
  return newItem
}

export const getExpiringItems = () => {
  return JSON.parse(localStorage.getItem("expiring_items") || "[]")
}

export const getInventoryItems = () => {
  return JSON.parse(localStorage.getItem("inventory_items") || "[]")
}

export const saveInventoryItem = (item: any) => {
  const inventory = JSON.parse(localStorage.getItem("inventory_items") || "[]")
  const existingIndex = inventory.findIndex((i: any) => i.name === item.name)

  if (existingIndex >= 0) {
    inventory[existingIndex] = { ...inventory[existingIndex], ...item, updated_at: new Date().toISOString() }
  } else {
    inventory.push({ ...item, id: Date.now().toString(), created_at: new Date().toISOString() })
  }

  localStorage.setItem("inventory_items", JSON.stringify(inventory))
  return item
}

/**
 * Convenience wrapper used by the login page.
 * Validates the credentials, saves the user in localStorage, and returns it.
 * Returns null if auth fails.
 */
export function login(username: string, password: string): User | null {
  try {
    // التحقق من المستخدمين
    const users = [
      // الممرات
      { username: "ممر1", password: "311", role: "worker" },
      { username: "ممر2", password: "342", role: "worker" },
      { username: "ممر3", password: "353", role: "worker" },
      { username: "ممر4", password: "364", role: "worker" },
      { username: "ممر5", password: "375", role: "worker" },
      { username: "ممر6", password: "386", role: "worker" },
      { username: "ممر7", password: "397", role: "worker" },
      { username: "ممر8", password: "408", role: "worker" },
      { username: "ممر9", password: "419", role: "worker" },
      { username: "ممر10", password: "420", role: "worker" },
      // المخزن
      { username: "المخزن", password: "932", role: "warehouse" },
      // الموارد البشرية
      { username: "hr", password: "237", role: "hr" },
    ]

    const user = users.find((u) => u.username === username && u.password === password)

    if (user) {
      const userData: User = {
        username: user.username,
        role: user.role,
        name: user.username,
        avatar: user.role === "worker" ? "👨‍💼" : user.role === "warehouse" ? "📦" : "👔",
        loginTime: new Date().toISOString(),
      }

      // حفظ المستخدم الحالي
      localStorage.setItem("currentUser", JSON.stringify(userData))
      
      // إضافة إشعار تسجيل الدخول
      addActivityNotification(user.username, "login", `تم تسجيل الدخول بنجاح في ${new Date().toLocaleString("ar-SA")}`)
      
      return userData
    }

    return null
  } catch (error) {
    console.error("خطأ في تسجيل الدخول:", error)
    return null
  }
}

export const signInWithSupabase = async (email: string, password: string) => {
  try {
    // استخدام النظام المحلي بدلاً من Supabase
    const user = authenticateUser(email, password)
    if (!user) return { user: null, error: 'Invalid credentials' }

    setCurrentUser(user)
    return { user, error: null }
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error)
    return { user: null, error }
  }
}

export const signOutWithSupabase = async () => {
  try {
    logout()
    return { error: null }
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error)
    return { error }
  }
}

export const getCurrentUserFromSupabase = async () => {
  try {
    return getCurrentUser()
  } catch (error) {
    console.error('خطأ في جلب المستخدم:', error)
    return null
  }
}
