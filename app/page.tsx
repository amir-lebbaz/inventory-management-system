"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Package, BarChart3, Shield, Zap, Globe, Volume2 } from "lucide-react"
import { login, getCurrentUser, initializeSystem, authenticateUser, setCurrentUser } from "@/lib/enhanced-auth"
import { cleanupOldData, shouldRunCleanup } from "@/lib/data-cleanup"
import { createBackup, shouldCreateBackup } from "@/lib/backup-system"
import { audioNotifications } from "@/lib/audio-notifications"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showFeatures, setShowFeatures] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // تهيئة النظام
    initializeSystem()

    // فحص المستخدم الحالي
    const user = getCurrentUser()
    if (user) {
      redirectUser(user.role)
    }

    // تشغيل التنظيف التلقائي إذا لزم الأمر
    if (shouldRunCleanup()) {
      cleanupOldData()
    }

    // إنشاء نسخة احتياطية إذا لزم الأمر
    if (shouldCreateBackup()) {
      createBackup()
    }

    // عرض المميزات بعد 3 ثوان
    const timer = setTimeout(() => setShowFeatures(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const redirectUser = (role: string) => {
    switch (role) {
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
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log('محاولة تسجيل الدخول:', { username, password })
      const user = authenticateUser(username, password)
      console.log('نتيجة authenticateUser:', user)
      if (user) {
        setCurrentUser(user)
        console.log('تم حفظ المستخدم في localStorage:', user)
        audioNotifications.playSuccessSound()
        console.log('سيتم التوجيه إلى:', user.role)
        redirectUser(user.role)
      } else {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة")
        audioNotifications.playErrorSound()
      }
    } catch (err) {
      setError("حدث خطأ أثناء تسجيل الدخول")
      audioNotifications.playErrorSound()
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: <Package className="h-8 w-8 text-blue-500" />,
      title: "إدارة المخزون الذكية",
      description: "تتبع المخزون وتنبيهات المستوى المنخفض",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-purple-500" />,
      title: "تحليلات متقدمة",
      description: "رسوم بيانية ودوائر تحليلية شاملة",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <Shield className="h-8 w-8 text-green-500" />,
      title: "نسخ احتياطية آمنة",
      description: "حماية البيانات ونسخ احتياطية تلقائية",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <Volume2 className="h-8 w-8 text-orange-500" />,
      title: "تنبيهات صوتية",
      description: "إشعارات صوتية للطلبات والرسائل",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: "أداء فائق",
      description: "واجهة سريعة ومحسنة للأداء",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: <Globe className="h-8 w-8 text-indigo-500" />,
      title: "دعم كامل للعربية",
      description: "واجهة مصممة خصيصاً للغة العربية",
      color: "from-indigo-500 to-purple-500",
    },
  ]

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 container-mobile"
      dir="rtl"
    >
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center space-mobile">
        {/* نموذج تسجيل الدخول */}
        <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/90 backdrop-blur-lg card-mobile">
          <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">نظام إدارة المخزون</CardTitle>
            <p className="text-blue-100 mt-2">نظام متطور وشامل لإدارة الطلبات والمخزون</p>
          </CardHeader>
          <CardContent className="p-8">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="form-mobile space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  اسم المستخدم
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  required
                  className="input-mobile h-12 border-2 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  كلمة المرور
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                  className="input-mobile h-12 border-2 focus:border-blue-500 transition-colors"
                />
              </div>



              <Button
                type="submit"
                disabled={loading}
                className="btn-mobile w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium text-lg shadow-lg transform hover:scale-105 transition-all"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-gray-800 mb-3">أمثلة على أسماء المستخدمين:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">👨‍💼 ممر1:</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">ممر1 / 311</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">📦 المخزن:</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">المخزن / 932</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">👔 الموارد البشرية:</span>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">hr / 237</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* المميزات */}
        <div
          className={`space-y-6 transition-all duration-1000 ${showFeatures ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
        >
          <div className="text-center mb-8">
            <h2 className="text-responsive-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              نظام إدارة متطور
            </h2>
            <p className="text-responsive text-gray-600">حلول شاملة لإدارة المخزون والطلبات مع تحليلات متقدمة</p>
          </div>

          <div className="grid grid-mobile gap-4">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`border-0 shadow-lg bg-white/80 backdrop-blur transform hover:scale-105 transition-all duration-300 hover:shadow-xl`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardContent className="p-6">
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center mb-4 shadow-lg`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* إحصائيات النظام */}
          <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">إحصائيات النظام</h3>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold">99.9%</div>
                  <div className="text-indigo-100">وقت التشغيل</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">24/7</div>
                  <div className="text-indigo-100">دعم مستمر</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">100%</div>
                  <div className="text-indigo-100">أمان البيانات</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
