"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, User, Lock } from "lucide-react"
import { login } from "@/lib/enhanced-auth"

export default function EnhancedLoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // التحقق من صحة البيانات
      if (!username.trim()) {
        setError("يرجى إدخال اسم المستخدم")
        setLoading(false)
        return
      }

      if (!password.trim()) {
        setError("يرجى إدخال كلمة المرور")
        setLoading(false)
        return
      }

      const user = login(username, password)
      if (user) {
        // التوجيه حسب الدور
        switch (user.role) {
          case "worker":
            router.push("/worker")
            break
          case "warehouse":
            router.push("/warehouse")
            break
          case "hr":
            router.push("/hr")
            break
          default:
            router.push("/")
        }
      } else {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة. تأكد من إدخال البيانات بشكل صحيح.")
      }
    } catch (error) {
      setError("حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.")
      console.error("Login error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            تسجيل الدخول
          </CardTitle>
          <p className="text-gray-600 text-sm sm:text-base mt-2">أدخل بياناتك للوصول إلى النظام</p>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                اسم المستخدم
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  required
                  className="pl-10 h-12 text-center text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                  className="pl-10 h-12 text-center text-base"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transform hover:scale-105 transition-all" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-gray-800 mb-3 text-center">بيانات تسجيل الدخول:</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="font-medium">الممرات:</span>
                <span>ممر1-ممر10</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="font-medium">كلمة المرور:</span>
                <span>311, 342, 353, 364, 375, 386, 397, 408, 419, 420</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="font-medium">المخزن:</span>
                <span>المخزن (932)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="font-medium">الموارد البشرية:</span>
                <span>hr (237)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
