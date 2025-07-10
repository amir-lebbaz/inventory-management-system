"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  LogOut,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Calendar,
  AlertTriangle,
  FileText,
  Bell,
  Edit,
  Trash2,
  Download,
  Star,
  TrendingUp,
  Award,
  Target,
} from "lucide-react"
import { getCurrentUser, logout, saveExpiringItem, type User } from "@/lib/enhanced-auth"
import { cleanupOldData, shouldRunCleanup } from "@/lib/data-cleanup"
import { createBackup, shouldCreateBackup } from "@/lib/backup-system"
import { audioNotifications } from "@/lib/audio-notifications"
import { exportRequestsToPDF } from "@/lib/pdf-export"
import CommunicationPanel from "./communication-panel"
import { SimpleBarChart, SimplePieChart, ActivityChart } from "./charts"

interface Request {
  id: string
  type: string
  item_name: string
  quantity: number
  urgent: boolean
  notes: string
  status: string
  created_at: string
  response_notes: string
  user_department: string
}

interface ExpiringItem {
  id: string
  name: string
  expiry_date: string
  location: string
  notes: string
  department: string
}

interface WorkerStats {
  totalRequests: number
  approvedRequests: number
  pendingRequests: number
  responseTime: number
  satisfaction: number
  streak: number
}

export default function EnhancedWorkerDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [requestType, setRequestType] = useState("")
  const [itemName, setItemName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [urgent, setUrgent] = useState("no")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [requests, setRequests] = useState<Request[]>([])
  const [workerStats, setWorkerStats] = useState<WorkerStats>({
    totalRequests: 0,
    approvedRequests: 0,
    pendingRequests: 0,
    responseTime: 0,
    satisfaction: 0,
    streak: 0,
  })

  // حالات التعديل والحذف
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // حالات السلع قريبة الانتهاء
  const [expiringItemName, setExpiringItemName] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [itemLocation, setItemLocation] = useState("")
  const [expiringNotes, setExpiringNotes] = useState("")
  const [showExpiringDialog, setShowExpiringDialog] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.role !== "worker") {
      router.push("/")
      return
    }
    setUser(currentUser)
    loadRequests(currentUser.department)
    calculateWorkerStats(currentUser.department)

    // تشغيل التنظيف التلقائي إذا لزم الأمر
    if (shouldRunCleanup()) {
      cleanupOldData()
    }

    // إنشاء نسخة احتياطية إذا لزم الأمر
    if (shouldCreateBackup()) {
      createBackup()
    }
  }, [router])

  const loadRequests = (department: string) => {
    const savedRequests = localStorage.getItem(`requests_${department}`)
    if (savedRequests) {
      setRequests(JSON.parse(savedRequests))
    }
  }

  const calculateWorkerStats = (department: string) => {
    const userRequests = JSON.parse(localStorage.getItem(`requests_${department}`) || "[]")
    const total = userRequests.length
    const approved = userRequests.filter((r: Request) => r.status === "approved" || r.status === "delivered").length
    const pending = userRequests.filter((r: Request) => r.status === "pending").length

    // حساب متوسط وقت الاستجابة (محاكاة)
    const avgResponseTime = userRequests.length > 0 ? Math.floor(Math.random() * 24) + 1 : 0

    // حساب معدل الرضا (محاكاة)
    const satisfaction = approved > 0 ? Math.min(95, 70 + (approved / total) * 25) : 0

    // حساب السلسلة (عدد الطلبات المتتالية المقبولة)
    let streak = 0
    for (let i = userRequests.length - 1; i >= 0; i--) {
      if (userRequests[i].status === "approved" || userRequests[i].status === "delivered") {
        streak++
      } else {
        break
      }
    }

    setWorkerStats({
      totalRequests: total,
      approvedRequests: approved,
      pendingRequests: pending,
      responseTime: avgResponseTime,
      satisfaction: Math.round(satisfaction),
      streak,
    })
  }

  const saveRequest = (newRequest: Request) => {
    const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
    const userRequests = JSON.parse(localStorage.getItem(`requests_${user?.department}`) || "[]")

    allRequests.push(newRequest)
    userRequests.push(newRequest)

    localStorage.setItem("all_requests", JSON.stringify(allRequests))
    localStorage.setItem(`requests_${user?.department}`, JSON.stringify(userRequests))

    setRequests(userRequests)
    calculateWorkerStats(user?.department || "")

    // تشغيل صوت النجاح
    audioNotifications.playSuccessSound()
  }

  const updateRequest = (updatedRequest: Request) => {
    const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
    const userRequests = JSON.parse(localStorage.getItem(`requests_${user?.department}`) || "[]")

    const updatedAllRequests = allRequests.map((req: Request) => (req.id === updatedRequest.id ? updatedRequest : req))
    const updatedUserRequests = userRequests.map((req: Request) =>
      req.id === updatedRequest.id ? updatedRequest : req,
    )

    localStorage.setItem("all_requests", JSON.stringify(updatedAllRequests))
    localStorage.setItem(`requests_${user?.department}`, JSON.stringify(updatedUserRequests))

    setRequests(updatedUserRequests)
    calculateWorkerStats(user?.department || "")
  }

  const deleteRequest = (requestId: string) => {
    const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
    const userRequests = JSON.parse(localStorage.getItem(`requests_${user?.department}`) || "[]")

    const filteredAllRequests = allRequests.filter((req: Request) => req.id !== requestId)
    const filteredUserRequests = userRequests.filter((req: Request) => req.id !== requestId)

    localStorage.setItem("all_requests", JSON.stringify(filteredAllRequests))
    localStorage.setItem(`requests_${user?.department}`, JSON.stringify(filteredUserRequests))

    setRequests(filteredUserRequests)
    setShowDeleteConfirm(null)
    calculateWorkerStats(user?.department || "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setMessage("")

    try {
      const newRequest: Request = {
        id: Date.now().toString(),
        type: requestType,
        item_name: itemName,
        quantity: Number.parseInt(quantity) || 1,
        urgent: urgent === "yes",
        notes,
        status: "pending",
        created_at: new Date().toISOString(),
        response_notes: "",
        user_department: user.department,
      }

      saveRequest(newRequest)

      if (requestType === "warehouse") {
        setMessage("✅ تم إرسال الطلب إلى المخزن بنجاح")
      } else {
        setMessage("✅ تم إرسال الطلب إلى الموارد البشرية بنجاح")
      }

      // تشغيل صوت للطلب الجديد
      if (urgent === "yes") {
        audioNotifications.playUrgentRequestSound()
      } else {
        audioNotifications.playNewRequestSound()
      }

      // إعادة تعيين النموذج
      setRequestType("")
      setItemName("")
      setQuantity("")
      setUrgent("no")
      setNotes("")
    } catch (error) {
      setMessage("❌ حدث خطأ أثناء إرسال الطلب")
      audioNotifications.playErrorSound()
    } finally {
      setLoading(false)
    }
  }

  const handleEditRequest = () => {
    if (!editingRequest) return

    updateRequest(editingRequest)
    setEditingRequest(null)
    setMessage("✅ تم تحديث الطلب بنجاح")
    audioNotifications.playSuccessSound()
  }

  const handleAddExpiringItem = () => {
    if (!user || !expiringItemName || !expiryDate) return

    const expiringItem: ExpiringItem = {
      id: Date.now().toString(),
      name: expiringItemName,
      expiry_date: expiryDate,
      location: itemLocation,
      notes: expiringNotes,
      department: user.department,
    }

    saveExpiringItem(expiringItem)

    setExpiringItemName("")
    setExpiryDate("")
    setItemLocation("")
    setExpiringNotes("")
    setShowExpiringDialog(false)
    setMessage("✅ تم إضافة السلعة قريبة الانتهاء بنجاح")
    audioNotifications.playSuccessSound()
  }

  const handleExportPDF = () => {
    exportRequestsToPDF(requests)
    audioNotifications.playSuccessSound()
  }

  const handleSignOut = () => {
    logout()
    router.push("/")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "approved":
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "in_progress":
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "قيد الانتظار"
      case "approved":
        return "موافق عليه"
      case "rejected":
        return "مرفوض"
      case "in_progress":
        return "قيد التحضير"
      case "delivered":
        return "تم التوصيل"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved":
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // إحصائيات للرسوم البيانية
  const getChartData = () => {
    const statusCounts = requests.reduce(
      (acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const typeCounts = requests.reduce(
      (acc, req) => {
        const type = req.type === "warehouse" ? "مخزن" : "موارد بشرية"
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const monthlyData = requests.reduce(
      (acc, req) => {
        const month = new Date(req.created_at).toLocaleDateString("ar-SA", { month: "short" })
        acc[month] = (acc[month] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      statusChart: {
        labels: Object.keys(statusCounts).map(getStatusText),
        data: Object.values(statusCounts),
        colors: ["#FCD34D", "#10B981", "#EF4444", "#3B82F6", "#8B5CF6"],
      },
      typeChart: {
        labels: Object.keys(typeCounts),
        data: Object.values(typeCounts),
        colors: ["#3B82F6", "#8B5CF6"],
      },
      monthlyChart: {
        labels: Object.keys(monthlyData),
        data: Object.values(monthlyData),
        colors: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"],
      },
    }
  }

  const chartData = getChartData()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" dir="rtl">
      <header className="bg-white/90 backdrop-blur-lg shadow-xl border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                {user.avatar}
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  مرحباً، {user.name}
                </h1>
                <p className="text-gray-600 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {user.department}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <Bell className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">{workerStats.pendingRequests} طلب معلق</span>
              </div>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50 bg-transparent"
              >
                <Download className="ml-2 h-4 w-4" />
                تصدير PDF
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
              >
                <LogOut className="ml-2 h-4 w-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* إحصائيات الأداء الشخصي */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 transform hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">إجمالي الطلبات</p>
                  <p className="text-3xl font-bold">{workerStats.totalRequests}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 transform hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">معدل القبول</p>
                  <p className="text-3xl font-bold">
                    {workerStats.totalRequests > 0
                      ? Math.round((workerStats.approvedRequests / workerStats.totalRequests) * 100)
                      : 0}
                    %
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 transform hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">معدل الرضا</p>
                  <p className="text-3xl font-bold">{workerStats.satisfaction}%</p>
                </div>
                <Star className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 transform hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">السلسلة الناجحة</p>
                  <p className="text-3xl font-bold">{workerStats.streak}</p>
                </div>
                <Award className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رسالة التحفيز */}
        {workerStats.streak >= 5 && (
          <Alert className="mb-8 border-green-200 bg-green-50">
            <Award className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              🎉 ممتاز! لديك {workerStats.streak} طلبات متتالية مقبولة. استمر في الأداء الرائع!
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="new-request" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm border">
            <TabsTrigger value="new-request" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              طلب جديد
            </TabsTrigger>
            <TabsTrigger
              value="my-requests"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              طلباتي
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              إحصائياتي
            </TabsTrigger>
            <TabsTrigger
              value="communication"
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
            >
              التواصل
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-request">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      تسجيل طلب جديد
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {message && (
                      <Alert className="mb-4 border-green-200 bg-green-50">
                        <AlertDescription className="text-green-800">{message}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">نوع الطلب</Label>
                        <Select value={requestType} onValueChange={setRequestType} required>
                          <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                            <SelectValue placeholder="اختر نوع الطلب" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="warehouse">📦 طلب من المخزن</SelectItem>
                            <SelectItem value="hr">👔 طلب من إدارة الموارد البشرية</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {requestType && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="itemName" className="text-sm font-medium">
                              اسم السلعة
                            </Label>
                            <Input
                              id="itemName"
                              value={itemName}
                              onChange={(e) => setItemName(e.target.value)}
                              placeholder="أدخل اسم السلعة"
                              required
                              className="h-12 border-2 focus:border-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="quantity" className="text-sm font-medium">
                                الكمية المطلوبة
                              </Label>
                              <Input
                                id="quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="الكمية"
                                min="1"
                                className="h-12 border-2 focus:border-blue-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">مستعجل؟</Label>
                              <Select value={urgent} onValueChange={setUrgent}>
                                <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="no">لا</SelectItem>
                                  <SelectItem value="yes">⚡ نعم - مستعجل</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="notes" className="text-sm font-medium">
                              ملاحظات إضافية
                            </Label>
                            <Textarea
                              id="notes"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="أضف أي ملاحظات إضافية (اختياري)"
                              rows={3}
                              className="resize-none border-2 focus:border-blue-500"
                            />
                          </div>

                          <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium text-lg shadow-lg transform hover:scale-105 transition-all"
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                جاري الإرسال...
                              </>
                            ) : (
                              <>
                                <Plus className="ml-2 h-5 w-5" />
                                إرسال الطلب
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* نصائح سريعة */}
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      نصائح للنجاح
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-900">كن واضحاً</p>
                          <p className="text-xs text-green-700">اكتب اسم السلعة بوضوح</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">حدد الكمية</p>
                          <p className="text-xs text-blue-700">اذكر الكمية المطلوبة بدقة</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-purple-900">استخدم المستعجل بحكمة</p>
                          <p className="text-xs text-purple-700">فقط للحالات الضرورية</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* السلع قريبة الانتهاء */}
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      سلع قريبة الانتهاء
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-600 mb-4">أضف السلع التي تقترب من تاريخ انتهاء الصلاحية للتذكير</p>
                    <Dialog open={showExpiringDialog} onOpenChange={setShowExpiringDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg">
                          <Plus className="ml-2 h-4 w-4" />
                          إضافة سلعة
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>إضافة سلعة قريبة الانتهاء</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>اسم السلعة</Label>
                            <Input
                              value={expiringItemName}
                              onChange={(e) => setExpiringItemName(e.target.value)}
                              placeholder="أدخل اسم السلعة"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>تاريخ انتهاء الصلاحية</Label>
                            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>الموقع</Label>
                            <Input
                              value={itemLocation}
                              onChange={(e) => setItemLocation(e.target.value)}
                              placeholder="مكان السلعة"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>ملاحظات</Label>
                            <Textarea
                              value={expiringNotes}
                              onChange={(e) => setExpiringNotes(e.target.value)}
                              placeholder="ملاحظات إضافية"
                              rows={2}
                            />
                          </div>
                          <Button onClick={handleAddExpiringItem} className="w-full">
                            إضافة السلعة
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="my-requests">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    طلباتي السابقة
                  </div>
                  <Button
                    onClick={handleExportPDF}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Download className="ml-2 h-4 w-4" />
                    تصدير PDF
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {requests.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">لا توجد طلبات سابقة</p>
                      <p className="text-gray-400 text-sm">ابدأ بإنشاء طلبك الأول</p>
                    </div>
                  ) : (
                    requests.map((request) => (
                      <div
                        key={request.id}
                        className="border-2 border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-lg transition-all transform hover:scale-[1.02]"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{request.item_name}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              {request.type === "warehouse" ? "📦" : "👔"}
                              {request.type === "warehouse" ? "مخزن" : "موارد بشرية"}
                            </p>
                            {request.quantity && (
                              <p className="text-sm text-gray-600 mt-1">الكمية: {request.quantity}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            <Badge className={`${getStatusColor(request.status)} border`}>
                              {getStatusText(request.status)}
                            </Badge>
                            {request.urgent && (
                              <Badge className="bg-red-100 text-red-800 border-red-200">⚡ مستعجل</Badge>
                            )}
                          </div>
                        </div>

                        {request.notes && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-1">الملاحظات:</p>
                            <p className="text-sm text-gray-600">{request.notes}</p>
                          </div>
                        )}

                        {request.response_notes && (
                          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                              <Bell className="h-4 w-4" />
                              رد الإدارة:
                            </p>
                            <p className="text-sm text-blue-800">{request.response_notes}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(request.created_at).toLocaleDateString("ar-SA")}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>#{request.id.slice(-6)}</span>
                            {request.status === "pending" && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingRequest(request)}
                                  className="h-7 px-2 text-xs hover:bg-blue-50"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowDeleteConfirm(request.id)}
                                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* نافذة تعديل الطلب */}
            <Dialog open={!!editingRequest} onOpenChange={() => setEditingRequest(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>تعديل الطلب</DialogTitle>
                </DialogHeader>
                {editingRequest && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>اسم السلعة</Label>
                      <Input
                        value={editingRequest.item_name}
                        onChange={(e) => setEditingRequest({ ...editingRequest, item_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الكمية</Label>
                      <Input
                        type="number"
                        value={editingRequest.quantity}
                        onChange={(e) =>
                          setEditingRequest({ ...editingRequest, quantity: Number.parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>مستعجل؟</Label>
                      <Select
                        value={editingRequest.urgent ? "yes" : "no"}
                        onValueChange={(value) => setEditingRequest({ ...editingRequest, urgent: value === "yes" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">لا</SelectItem>
                          <SelectItem value="yes">⚡ نعم - مستعجل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>الملاحظات</Label>
                      <Textarea
                        value={editingRequest.notes}
                        onChange={(e) => setEditingRequest({ ...editingRequest, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleEditRequest} className="w-full">
                      حفظ التعديلات
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* نافذة تأكيد الحذف */}
            <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>تأكيد الحذف</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-gray-600">هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => showDeleteConfirm && deleteRequest(showDeleteConfirm)}
                      className="flex-1 bg-red-500 hover:bg-red-600"
                    >
                      حذف
                    </Button>
                    <Button onClick={() => setShowDeleteConfirm(null)} variant="outline" className="flex-1">
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SimpleBarChart title="طلباتي حسب الحالة" data={chartData.statusChart} />
                <SimplePieChart title="طلباتي حسب النوع" data={chartData.typeChart} />
              </div>
              <ActivityChart title="نشاطي الشهري" data={chartData.monthlyChart} />
            </div>
          </TabsContent>

          <TabsContent value="communication">
            <CommunicationPanel userRole={user.role} userName={user.name} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
