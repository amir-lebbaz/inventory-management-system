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
    ممر1: { password: "123", role: "worker", department: "ممر1" },
    ممر2: { password: "456", role: "worker", department: "ممر2" },
    ممر3: { password: "789", role: "worker", department: "ممر3" },
    ممر4: { password: "321", role: "worker", department: "ممر4" },
    ممر5: { password: "654", role: "worker", department: "ممر5" },
    ممر6: { password: "987", role: "worker", department: "ممر6" },
    ممر7: { password: "147", role: "worker", department: "ممر7" },
    ممر8: { password: "258", role: "worker", department: "ممر8" },
    ممر9: { password: "369", role: "worker", department: "ممر9" },
    ممر10: { password: "741", role: "worker", department: "ممر10" },

    // الإدارة
    المخزن: { password: "852", role: "warehouse", department: "المخزن" },
    hr: { password: "963", role: "hr", department: "الموارد البشرية" },
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const user = users[username]

      if (!user || user.password !== password) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة")
        return
      }

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
              placeholder="أدخل اسم المستخدم"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="أدخل كلمة المرور"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تسجيل الدخول
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
