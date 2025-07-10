"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/enhanced-auth"
import EnhancedFileManager from "@/components/enhanced-file-manager"

export default function FilesPage() {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== "hr") {
      router.push("/")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50" dir="rtl">
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                إدارة الملفات
              </h1>
              <p className="text-gray-600">إدارة جميع الملفات والمرفقات</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EnhancedFileManager />
      </main>
    </div>
  )
}
