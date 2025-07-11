"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const users = {
    // الممرات
    ممر1: { password: "123", role: "worker" },
    ممر2: { password: "456", role: "worker" },
    ممر3: { password: "789", role: "worker" },
    ممر4: { password: "321", role: "worker" },
    ممر5: { password: "654", role: "worker" },
    ممر6: { password: "987", role: "worker" },
    ممر7: { password: "147", role: "worker" },
    ممر8: { password: "258", role: "worker" },
    ممر9: { password: "369", role: "worker" },
    ممر10: { password: "741", role: "worker" },

    // الإدارة
    المخزن: { password: "852", role: "warehouse" },
    hr: { password: "963", role: "hr" },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const user = users[username as keyof typeof users]
      if (user && user.password === password) {
        // حفظ بيانات المستخدم
        const userData = {
          username,
          role: user.role,
          name: username,
        }
        localStorage.setItem("currentUser", JSON.stringify(userData))

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
        setError("اسم المستخدم أو كلمة المرور غير صحيحة")
      }
    } catch (error) {
      setError("حدث خطأ أثناء تسجيل الدخول")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            تسجيل الدخول
          </CardTitle>
          <p className="text-gray-600">أدخل بياناتك للوصول إلى النظام</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                required
                className="text-center"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                required
                className="text-center"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">بيانات تسجيل الدخول:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>الممرات:</strong> ممر1-ممر10 (كلمة المرور: 123, 456, 789, 321, 654, 987, 147, 258, 369, 741)</p>
              <p><strong>المخزن:</strong> المخزن (كلمة المرور: 852)</p>
              <p><strong>الموارد البشرية:</strong> hr (كلمة المرور: 963)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
