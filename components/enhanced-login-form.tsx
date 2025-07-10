"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, Users } from "lucide-react"
import { authenticateUser, setCurrentUser } from "@/lib/enhanced-auth"

export default function EnhancedLoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const user = authenticateUser(username, password)

      if (!user) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة")
        return
      }

      setCurrentUser(user)

      // إعادة التوجيه حسب نوع المستخدم
      if (user.role === "worker") {
        router.push("/worker")
      } else if (user.role === "warehouse") {
        router.push("/warehouse")
      } else if (user.role === "hr") {
        router.push("/hr")
      }
    } catch (err) {
      setError("حدث خطأ أثناء تسجيل الدخول")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            نظام إدارة الطلبات
          </CardTitle>
          <p className="text-gray-600 text-sm">تسجيل الدخول للوصول إلى النظام</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                اسم المستخدم
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="مثال: ممر1، المخزن، hr"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                كلمة المرور (3 أرقام)
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="أدخل 3 أرقام"
                maxLength={3}
                pattern="[0-9]{3}"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
            >
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تسجيل الدخول
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <h3 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
              <Users className="h-4 w-4" />
              أمثلة على أسماء المستخدمين:
            </h3>
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>للممرات: ممر1، ممر2، ممر3... إلخ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>للمخزن: المخزن</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>للموارد البشرية: hr</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
