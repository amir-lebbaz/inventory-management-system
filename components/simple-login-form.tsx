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
import { authenticateUser, setCurrentUser } from "@/lib/auth"

export default function SimpleLoginForm() {
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
    <Card>
      <CardHeader>
        <CardTitle className="text-center">تسجيل الدخول</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
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
              required
              placeholder="مثال: ممر1، المخزن، hr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور (3 أرقام)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="أدخل 3 أرقام"
              maxLength={3}
              pattern="[0-9]{3}"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تسجيل الدخول
          </Button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">أمثلة على أسماء المستخدمين:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• للممرات: ممر1، ممر2، ممر3... إلخ</p>
            <p>• للمخزن: المخزن</p>
            <p>• للموارد البشرية: hr</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
