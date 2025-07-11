"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
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
import { exportRequestsToPDF, exportRequestsToCSV } from "@/lib/pdf-export"
import CommunicationPanel from "./communication-panel"
import { SimpleBarChart, SimplePieChart, ActivityChart } from "./charts"
import { addRequestNotification, addActivityNotification } from "@/lib/communication"

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
  user_name: string
}

interface ExpiringItem {
  id: string
  name: string
  expiry_date: string
  location: string
  notes: string
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
    loadRequests(currentUser.username)
    calculateWorkerStats(currentUser.username)

    // تشغيل التنظيف التلقائي إذا لزم الأمر
    if (shouldRunCleanup()) {
      cleanupOldData()
    }

    // إنشاء نسخة احتياطية إذا لزم الأمر
    if (shouldCreateBackup()) {
      createBackup()
    }
  }, [router])

  const loadRequests = (username: string) => {
    const savedRequests = localStorage.getItem(`requests_${username}`)
    if (savedRequests) {
      setRequests(JSON.parse(savedRequests))
    } else {
      // إذا لم تكن هناك طلبات محفوظة للمستخدم، ابحث في all_requests
      const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
      const userRequests = allRequests.filter((req: Request) => req.user_name === username)
      setRequests(userRequests)
      // حفظ الطلبات للمستخدم
      if (userRequests.length > 0) {
        localStorage.setItem(`requests_${username}`, JSON.stringify(userRequests))
      }
    }
  }

  const calculateWorkerStats = (username: string) => {
    const userRequests = JSON.parse(localStorage.getItem(`requests_${username}`) || "[]")
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
    const userRequests = JSON.parse(localStorage.getItem(`requests_${user?.username}`) || "[]")

    allRequests.push(newRequest)
    userRequests.push(newRequest)

    localStorage.setItem("all_requests", JSON.stringify(allRequests))
    localStorage.setItem(`requests_${user?.username}`, JSON.stringify(userRequests))

    console.log('تم حفظ الطلب في all_requests:', allRequests.length)
    console.log('تم حفظ الطلب في user_requests:', userRequests.length)

    setRequests(userRequests)
    calculateWorkerStats(user?.username || "")

    // تشغيل صوت النجاح
    audioNotifications.playSuccessSound()
  }

  const updateRequest = (updatedRequest: Request) => {
    const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
    const userRequests = JSON.parse(localStorage.getItem(`requests_${user?.username}`) || "[]")

    const updatedAllRequests = allRequests.map((req: Request) => (req.id === updatedRequest.id ? updatedRequest : req))
    const updatedUserRequests = userRequests.map((req: Request) =>
      req.id === updatedRequest.id ? updatedRequest : req,
    )

    localStorage.setItem("all_requests", JSON.stringify(updatedAllRequests))
    localStorage.setItem(`requests_${user?.username}`, JSON.stringify(updatedUserRequests))

    setRequests(updatedUserRequests)
    calculateWorkerStats(user?.username || "")
  }

  const deleteRequest = (requestId: string) => {
    const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
    const userRequests = JSON.parse(localStorage.getItem(`requests_${user?.username}`) || "[]")

    const updatedAllRequests = allRequests.filter((req: Request) => req.id !== requestId)
    const updatedUserRequests = userRequests.filter((req: Request) => req.id !== requestId)

    localStorage.setItem("all_requests", JSON.stringify(updatedAllRequests))
    localStorage.setItem(`requests_${user?.username}`, JSON.stringify(updatedUserRequests))

    setRequests(updatedUserRequests)
    calculateWorkerStats(user?.username || "")
    setShowDeleteConfirm(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      if (!itemName.trim()) {
        setMessage("يرجى إدخال اسم السلعة")
        return
      }

      const newRequest: Request = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: requestType,
        item_name: itemName,
        quantity: Number.parseInt(quantity) || 1,
        urgent: urgent === "yes",
        notes: notes,
        status: "pending",
        created_at: new Date().toISOString(),
        response_notes: "",
        user_name: user?.username || "",
      }

      console.log('إنشاء طلب جديد:', newRequest)

      saveRequest(newRequest)

      // إضافة إشعار للطلب الجديد
      addRequestNotification(user?.username || "", requestType === "warehouse" ? "المخزن" : "الموارد البشرية", "pending")
      
      // إضافة إشعار نشاط
      addActivityNotification(user?.username || "", "request_created", `تم إنشاء طلب جديد: ${itemName}`)

      // تحديث فوري للطلبات
      setTimeout(() => {
        loadRequests(user?.username || "")
      }, 100)

      // إعادة تعيين النموذج
      setRequestType("")
      setItemName("")
      setQuantity("")
      setUrgent("no")
      setNotes("")
      setMessage("تم إرسال الطلب بنجاح! 🎉")

      // تشغيل صوت النجاح
      audioNotifications.playSuccessSound()
    } catch (error) {
      setMessage("حدث خطأ أثناء إرسال الطلب")
      console.error("Error submitting request:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditRequest = () => {
    if (!editingRequest) return

    try {
    updateRequest(editingRequest)
      
      // إضافة إشعار تحديث الطلب
      addActivityNotification(user?.username || "", "request_updated", `تم تحديث طلب: ${editingRequest.item_name}`)
      
    setEditingRequest(null)
      setMessage("تم تحديث الطلب بنجاح!")
      
      // تشغيل صوت النجاح
    audioNotifications.playSuccessSound()
    } catch (error) {
      setMessage("حدث خطأ أثناء تحديث الطلب")
      console.error("Error updating request:", error)
    }
  }

  const handleAddExpiringItem = () => {
    if (!expiringItemName.trim() || !expiryDate) {
      setMessage("يرجى إدخال اسم السلعة وتاريخ انتهاء الصلاحية")
      return
    }

    const newExpiringItem = {
      name: expiringItemName,
      expiry_date: expiryDate,
      location: itemLocation,
      notes: expiringNotes,
    }

    saveExpiringItem(newExpiringItem)
    setExpiringItemName("")
    setExpiryDate("")
    setItemLocation("")
    setExpiringNotes("")
    setShowExpiringDialog(false)
    setMessage("تم إضافة السلعة قريبة الانتهاء بنجاح!")
  }

  const handleExportPDF = () => {
    exportRequestsToPDF(requests)
  }

  const handleExportCSV = () => {
    exportRequestsToCSV(requests)
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

  const chartData = useMemo(() => {
    const pendingCount = workerStats.pendingRequests || 0
    const approvedCount = workerStats.approvedRequests || 0
    const rejectedCount = Math.max(0, (workerStats.totalRequests || 0) - approvedCount - pendingCount)
    
    const warehouseCount = requests.filter((r) => r.type === "warehouse").length || 0
    const hrCount = requests.filter((r) => r.type === "hr").length || 0

    return {
      statusChart: {
        labels: ["قيد الانتظار", "موافق عليه", "مرفوض"],
        data: [pendingCount, approvedCount, rejectedCount],
        colors: ["#FCD34D", "#10B981", "#EF4444"],
      },
      typeChart: {
        labels: ["مخزن", "موارد بشرية"],
        data: [warehouseCount, hrCount],
        colors: ["#3B82F6", "#8B5CF6"],
      },
    }
  }, [workerStats, requests])

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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg sm:text-xl shadow-lg">
                {user.avatar}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  مرحباً، {user.name}
                </h1>
                <p className="text-gray-600 flex items-center gap-2 text-sm sm:text-base">
                  <Package className="h-4 w-4" />
                  {user.username}
                </p>
              </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent w-full sm:w-auto"
              >
                <LogOut className="ml-2 h-4 w-4" />
                تسجيل الخروج
              </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <Tabs defaultValue="new-request" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-10">
            <TabsTrigger value="new-request" className="text-xs sm:text-sm">طلب جديد</TabsTrigger>
            <TabsTrigger value="my-requests" className="text-xs sm:text-sm">طلباتي</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">الإحصائيات</TabsTrigger>
            <TabsTrigger value="communication" className="text-xs sm:text-sm">التواصل</TabsTrigger>
          </TabsList>

          <TabsContent value="new-request">
            <div className="space-y-4 sm:space-y-6">
              {/* إحصائيات سريعة */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                        <p className="text-xs sm:text-sm opacity-90">إجمالي الطلبات</p>
                        <p className="text-lg sm:text-2xl font-bold">{workerStats.totalRequests}</p>
                </div>
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                        <p className="text-xs sm:text-sm opacity-90">الطلبات المقبولة</p>
                        <p className="text-lg sm:text-2xl font-bold">{workerStats.approvedRequests}</p>
                </div>
                      <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

                <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                  <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                        <p className="text-xs sm:text-sm opacity-90">قيد الانتظار</p>
                        <p className="text-lg sm:text-2xl font-bold">{workerStats.pendingRequests}</p>
                </div>
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                        <p className="text-xs sm:text-sm opacity-90">معدل الرضا</p>
                        <p className="text-lg sm:text-2xl font-bold">{workerStats.satisfaction}%</p>
                </div>
                      <Star className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

              {/* نموذج الطلب الجديد */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
              طلب جديد
                    </div>
                    <Dialog open={showExpiringDialog} onOpenChange={setShowExpiringDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                          <AlertTriangle className="ml-2 h-4 w-4" />
                          إضافة سلعة قريبة الانتهاء
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
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
                            <Input
                              type="date"
                              value={expiryDate}
                              onChange={(e) => setExpiryDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>الموقع</Label>
                            <Input
                              value={itemLocation}
                              onChange={(e) => setItemLocation(e.target.value)}
                              placeholder="أدخل موقع السلعة"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>ملاحظات</Label>
                            <Textarea
                              value={expiringNotes}
                              onChange={(e) => setExpiringNotes(e.target.value)}
                              placeholder="أدخل ملاحظات إضافية"
                              rows={3}
                            />
                          </div>
                          <Button onClick={handleAddExpiringItem} className="w-full">
                            إضافة السلعة
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    </CardTitle>
                  </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    {message && (
                    <Alert className="mb-4">
                      <AlertDescription>{message}</AlertDescription>
                      </Alert>
                    )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>نوع الطلب</Label>
                        <Select value={requestType} onValueChange={setRequestType}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع الطلب" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="warehouse">📦 طلب من المخزن</SelectItem>
                            <SelectItem value="hr">👔 طلب من الموارد البشرية</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                          <div className="space-y-2">
                        <Label>اسم السلعة</Label>
                            <Input
                              value={itemName}
                              onChange={(e) => setItemName(e.target.value)}
                          placeholder="أدخل اسم السلعة المطلوبة"
                              required
                            />
                      </div>
                          </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                        <Label>الكمية</Label>
                              <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                          placeholder="أدخل الكمية المطلوبة"
                                min="1"
                              />
                            </div>

                            <div className="space-y-2">
                        <Label>مستعجل؟</Label>
                              <Select value={urgent} onValueChange={setUrgent}>
                          <SelectTrigger>
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
                      <Label>ملاحظات إضافية</Label>
                            <Textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                        placeholder="أدخل أي ملاحظات إضافية أو تفاصيل..."
                              rows={3}
                            />
                          </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                              <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                          جاري إرسال الطلب...
                              </>
                            ) : (
                              <>
                          <Plus className="ml-2 h-4 w-4" />
                                إرسال الطلب
                              </>
                            )}
                          </Button>
                    </form>
                  </CardContent>
                </Card>
            </div>
          </TabsContent>

          <TabsContent value="my-requests">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    طلباتي السابقة
                  </div>
                  <div className="flex gap-2">
                  <Button
                    onClick={handleExportPDF}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 w-full sm:w-auto"
                  >
                    <Download className="ml-2 h-4 w-4" />
                    تصدير PDF
                  </Button>
                    <Button
                      onClick={handleExportCSV}
                      className="bg-white/20 hover:bg-white/30 text-blue-700 border-white/30 w-full sm:w-auto"
                    >
                      <Download className="ml-2 h-4 w-4" />
                      تصدير Excel
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {requests.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">لا توجد طلبات سابقة</p>
                      <p className="text-gray-400 text-sm">ابدأ بإنشاء طلبك الأول</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requests.map((request) => (
                      <div
                        key={request.id}
                          className="border-2 border-gray-200 rounded-xl p-4 sm:p-6 bg-white shadow-sm hover:shadow-lg transition-all transform hover:scale-[1.02]"
                      >
                          <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                            <div className="flex-1">
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

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 gap-2">
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
                      ))}
                    </div>
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
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <SimpleBarChart title="طلباتي حسب الحالة" data={chartData.statusChart} />
                <SimplePieChart title="طلباتي حسب النوع" data={chartData.typeChart} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="communication">
            <CommunicationPanel userRole={user.role} userName={user.username} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
