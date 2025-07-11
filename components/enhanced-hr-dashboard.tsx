"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  LogOut,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  TrendingUp,
  Search,
  Download,
  AlertTriangle,
  Calendar,
  FileText,
  Package,
  Shield,
  RefreshCw,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { getCurrentUser, logout, getExpiringItems, getInventoryItems } from "@/lib/enhanced-auth"
import { cleanupOldData, shouldRunCleanup } from "@/lib/data-cleanup"
import { createBackup, shouldCreateBackup, downloadBackup } from "@/lib/backup-system"
import { audioNotifications } from "@/lib/audio-notifications"
import { exportRequestsToPDF, exportRequestsToCSV } from "@/lib/pdf-export"
import CommunicationPanel from "./communication-panel"
import DataManagement from "./data-management"
import { SimpleBarChart, SimplePieChart, TrendChart, ActivityChart, AdvancedPieChart } from "./charts"
import { Alert } from "@/components/ui/alert"
import { addRequestNotification } from "@/lib/communication"

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
  updated_at?: string // Added for response time calculation
}

interface Analytics {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  deliveredRequests: number // Added
  urgentRequests: number
  warehouseRequests: number
  hrRequests: number
  avgResponseTime: number
  satisfactionRate: number
  topItems: { name: string; count: number }[]
}

export default function EnhancedHRDashboard() {
  const [requests, setRequests] = useState<Request[]>([])
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([])
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [responseNotes, setResponseNotes] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [analytics, setAnalytics] = useState<Analytics>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    deliveredRequests: 0, // Added
    urgentRequests: 0,
    warehouseRequests: 0,
    hrRequests: 0,
    avgResponseTime: 0,
    satisfactionRate: 0,
    topItems: [],
  })
  const [loading, setLoading] = useState(false)
  const [expiringItems, setExpiringItems] = useState<any[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])

  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== "hr") {
      router.push("/")
      return
    }
    fetchRequests()
    loadExpiringItems()
    loadInventoryItems()

    // تشغيل التنظيف التلقائي إذا لزم الأمر
    if (shouldRunCleanup()) {
      cleanupOldData()
    }

    // إنشاء نسخة احتياطية إذا لزم الأمر
    if (shouldCreateBackup()) {
      createBackup()
      audioNotifications.playSuccessSound()
    }

    // إضافة مستمع لتحديث الطلبات
    const handleStorageChange = () => {
      fetchRequests()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [router])

  useEffect(() => {
    filterRequests()
  }, [searchTerm, filterStatus, filterType, requests])

  useEffect(() => {
    calculateAnalytics()
  }, [filteredRequests])

  const fetchRequests = () => {
    const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
    console.log('إجمالي الطلبات المحفوظة:', allRequests.length)
    console.log('تفاصيل الطلبات:', allRequests)
    setRequests(allRequests)
  }

  const loadExpiringItems = () => {
    const items = getExpiringItems()
    setExpiringItems(items)
  }

  const loadInventoryItems = () => {
    const items = getInventoryItems()
    setInventoryItems(items)
  }

  const filterRequests = () => {
    let filtered = requests

    console.log('تصفية الطلبات - إجمالي الطلبات:', requests.length)
    console.log('حالة التصفية:', filterStatus, 'نوع التصفية:', filterType)

    if (filterStatus !== "all") {
      filtered = filtered.filter((req) => req.status === filterStatus)
      console.log('بعد تصفية الحالة:', filtered.length)
    }

    if (filterType !== "all") {
      filtered = filtered.filter((req) => req.type === filterType)
      console.log('بعد تصفية النوع:', filtered.length)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.notes.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      console.log('بعد البحث:', filtered.length)
    }

    console.log('الطلبات المصفاة النهائية:', filtered)
    setFilteredRequests(filtered)
  }

  const calculateAnalytics = () => {
    const totalRequests = filteredRequests.length
    const pendingRequests = filteredRequests.filter((req) => req.status === "pending").length
    const approvedRequests = filteredRequests.filter((req) => req.status === "approved").length
    const rejectedRequests = filteredRequests.filter((req) => req.status === "rejected").length
    const deliveredRequests = filteredRequests.filter((req) => req.status === "delivered").length
    const urgentRequests = filteredRequests.filter((req) => req.urgent).length
    const warehouseRequests = filteredRequests.filter((req) => req.type === "warehouse").length
    const hrRequests = filteredRequests.filter((req) => req.type === "hr").length

    console.log('إحصائيات الطلبات:', {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      deliveredRequests,
      urgentRequests,
      warehouseRequests,
      hrRequests
    })

    // حساب متوسط وقت الاستجابة
    const responseTimes = filteredRequests
      .filter((req) => req.status !== "pending")
      .map((req) => {
        const created = new Date(req.created_at)
        const updated = new Date(req.updated_at || req.created_at)
        return (updated.getTime() - created.getTime()) / (1000 * 60 * 60) // بالساعات
      })

    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0

    // حساب معدل الرضا
    const satisfactionRate = totalRequests > 0 
      ? Math.round((approvedRequests / totalRequests) * 100)
      : 0

    // أكثر السلع طلباً
    const itemCounts: { [key: string]: number } = {}
    filteredRequests.forEach((req) => {
      itemCounts[req.item_name] = (itemCounts[req.item_name] || 0) + 1
    })
    const topItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    setAnalytics({
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      deliveredRequests,
      urgentRequests,
      warehouseRequests,
      hrRequests,
      avgResponseTime,
      satisfactionRate,
      topItems,
    })
  }

  const handleUpdateRequest = () => {
    if (!selectedRequest) return

    setLoading(true)
    try {
      let updatedRequest = { ...selectedRequest, status: newStatus, response_notes: responseNotes }

      if (newStatus === "transfer_to_hr") {
        updatedRequest = {
          ...updatedRequest,
          type: "hr",
          status: "pending",
          response_notes: `${responseNotes}\n\n[تم تحويل الطلب من المخزن إلى الموارد البشرية - السلعة غير متوفرة حالياً]`,
        }
      }

      const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
      const updatedRequests = allRequests.map((req: Request) => (req.id === selectedRequest.id ? updatedRequest : req))
      localStorage.setItem("all_requests", JSON.stringify(updatedRequests))

      const userRequests = JSON.parse(localStorage.getItem(`requests_${selectedRequest.user_name}`) || "[]")
      const updatedUserRequests = userRequests.map((req: Request) =>
        req.id === selectedRequest.id ? updatedRequest : req,
      )
      localStorage.setItem(`requests_${selectedRequest.user_name}`, JSON.stringify(updatedUserRequests))

      // إضافة إشعار للمستخدم عن تحديث طلبه
      addRequestNotification(selectedRequest.user_name, selectedRequest.type === "warehouse" ? "المخزن" : "الموارد البشرية", newStatus)

      fetchRequests()
      setSelectedRequest(null)
      setResponseNotes("")
      setNewStatus("")

      // تشغيل صوت النجاح
      audioNotifications.playSuccessSound()
    } catch (error) {
      console.error("Error updating request:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    logout()
    router.push("/")
  }

  const handleExportPDF = () => {
    exportRequestsToPDF(filteredRequests)
  }

  const handleExportCSV = () => {
    exportRequestsToCSV(filteredRequests)
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

  const expiringSoon = expiringItems.filter((item) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    )
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  })

  const chartData = useMemo(() => {
    const months = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ]

    return {
      statusChart: {
        labels: ["قيد الانتظار", "تم القبول", "مرفوض", "تم التوصيل"],
        data: [analytics.pendingRequests, analytics.approvedRequests, analytics.rejectedRequests, analytics.deliveredRequests],
        colors: ["#FCD34D", "#10B981", "#EF4444", "#3B82F6"],
      },
      typeChart: {
        labels: ["مخزن", "موارد بشرية"],
        data: [analytics.warehouseRequests, analytics.hrRequests],
        colors: ["#3B82F6", "#8B5CF6"],
      },
      monthlyChart: {
        labels: months,
        data: months.map(() => Math.floor(Math.random() * 20) + 5),
        colors: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"],
      },
      topItemsChart: {
        labels: analytics.topItems.map(item => item.name),
        data: analytics.topItems.map(item => item.count),
        colors: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"],
      }
    }
  }, [analytics])

  if (!getCurrentUser()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50" dir="rtl">
      <header className="bg-white/90 backdrop-blur-lg shadow-xl border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg sm:text-xl shadow-lg">
                👔
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  لوحة إدارة الموارد البشرية
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">إدارة شاملة ومتقدمة للطلبات والتقارير</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50 bg-transparent"
              >
                <Download className="ml-2 h-4 w-4" />
                تصدير PDF
              </Button>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
              >
                <Download className="ml-2 h-4 w-4" />
                تصدير Excel
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

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-10">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">نظرة عامة</TabsTrigger>
            <TabsTrigger value="requests" className="text-xs sm:text-sm">الطلبات</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">الإحصائيات</TabsTrigger>
            <TabsTrigger value="communication" className="text-xs sm:text-sm">التواصل</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-4 sm:space-y-6">
              {/* إحصائيات سريعة */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                        <p className="text-xs sm:text-sm opacity-90">إجمالي الطلبات</p>
                        <p className="text-lg sm:text-2xl font-bold">{analytics.totalRequests}</p>
                </div>
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

                <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                  <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                        <p className="text-xs sm:text-sm opacity-90">قيد الانتظار</p>
                        <p className="text-lg sm:text-2xl font-bold">{analytics.pendingRequests}</p>
                </div>
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                        <p className="text-xs sm:text-sm opacity-90">مقبولة</p>
                        <p className="text-lg sm:text-2xl font-bold">{analytics.approvedRequests}</p>
                </div>
                      <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

                <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                  <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                        <p className="text-xs sm:text-sm opacity-90">مرفوضة</p>
                        <p className="text-lg sm:text-2xl font-bold">{analytics.rejectedRequests}</p>
                </div>
                      <XCircle className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* تنبيهات مهمة */}
              {analytics.urgentRequests > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div className="text-red-800">
                    <p className="font-medium">تنبيه: {analytics.urgentRequests} طلب مستعجل يحتاج إلى مراجعة فورية</p>
                      </div>
                </Alert>
            )}

            {expiringSoon.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <div className="text-orange-800">
                    <p className="font-medium">تنبيه: {expiringSoon.length} سلعة قريبة من انتهاء الصلاحية</p>
                      </div>
                </Alert>
              )}

              {/* السلع قريبة الانتهاء */}
              {expiringSoon.length > 0 && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      سلع قريبة من انتهاء الصلاحية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3">
                      {expiringSoon.slice(0, 5).map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200"
                        >
                          <div>
                            <p className="font-medium text-red-900">{item.name}</p>
                            <p className="text-sm text-red-700">الموقع: {item.location || "غير محدد"}</p>
                            </div>
                          <div className="text-right">
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              {new Date(item.expiry_date).toLocaleDateString("ar-SA")}
                          </Badge>
                            <p className="text-xs text-red-600 mt-1">
                              {Math.ceil(
                                (new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                              )}{" "}
                              يوم متبقي
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    إدارة الطلبات
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="البحث في الطلبات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/70"
                    />
                  </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        onClick={fetchRequests}
                        variant="outline"
                        className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-40 bg-white/20 border-white/30 text-white">
                          <SelectValue placeholder="الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                        <SelectItem value="approved">موافق عليه</SelectItem>
                        <SelectItem value="rejected">مرفوض</SelectItem>
                        <SelectItem value="in_progress">قيد التحضير</SelectItem>
                        <SelectItem value="delivered">تم التوصيل</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full sm:w-40 bg-white/20 border-white/30 text-white">
                      <SelectValue placeholder="النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأنواع</SelectItem>
                      <SelectItem value="warehouse">مخزن</SelectItem>
                      <SelectItem value="hr">موارد بشرية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">التاريخ</TableHead>
                        <TableHead className="text-xs sm:text-sm">المستخدم</TableHead>
                        <TableHead className="text-xs sm:text-sm">النوع</TableHead>
                        <TableHead className="text-xs sm:text-sm">السلعة</TableHead>
                        <TableHead className="text-xs sm:text-sm">الكمية</TableHead>
                        <TableHead className="text-xs sm:text-sm">الحالة</TableHead>
                        <TableHead className="text-xs sm:text-sm">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => {
                        console.log('عرض طلب في الجدول:', request)
                        return (
                        <TableRow key={request.id} className="hover:bg-gray-50">
                            <TableCell className="text-xs sm:text-sm">
                            {new Date(request.created_at).toLocaleDateString("ar-SA")}
                          </TableCell>
                            <TableCell className="font-medium text-xs sm:text-sm">{request.user_name}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                request.type === "warehouse"
                                  ? "bg-blue-100 text-blue-800 border-blue-200"
                                  : "bg-purple-100 text-purple-800 border-purple-200"
                              }
                            >
                              {request.type === "warehouse" ? "📦 مخزن" : "👔 موارد بشرية"}
                            </Badge>
                          </TableCell>
                            <TableCell className="font-medium text-xs sm:text-sm">{request.item_name}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{request.quantity || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(request.status)}
                                <span className="text-xs sm:text-sm">{getStatusText(request.status)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {request.urgent && (
                                <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">⚡ مستعجل</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                                <Button
                                  size="sm"
                                onClick={() => setSelectedRequest(request)}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                مراجعة
                                </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* نافذة مراجعة الطلب */}
            <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                  <DialogTitle>مراجعة الطلب</DialogTitle>
                                </DialogHeader>
                                {selectedRequest && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                        <p><strong>المستخدم:</strong> {selectedRequest.user_name}</p>
                        <p><strong>النوع:</strong> {selectedRequest.type === "warehouse" ? "مخزن" : "موارد بشرية"}</p>
                        <p><strong>السلعة:</strong> {selectedRequest.item_name}</p>
                        <p><strong>الكمية:</strong> {selectedRequest.quantity || "-"}</p>
                        {selectedRequest.urgent && <p><strong>مستعجل:</strong> نعم</p>}
                                      </div>
                                      <div>
                        <p><strong>التاريخ:</strong> {new Date(selectedRequest.created_at).toLocaleDateString("ar-SA")}</p>
                        <p><strong>الحالة الحالية:</strong> {getStatusText(selectedRequest.status)}</p>
                        {selectedRequest.notes && (
                          <p><strong>ملاحظات المستخدم:</strong> {selectedRequest.notes}</p>
                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                      <Label>تغيير الحالة</Label>
                                      <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة الجديدة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">قيد الانتظار</SelectItem>
                                          <SelectItem value="approved">موافق عليه</SelectItem>
                                          <SelectItem value="rejected">مرفوض</SelectItem>
                                          <SelectItem value="in_progress">قيد التحضير</SelectItem>
                                          <SelectItem value="delivered">تم التوصيل</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>ملاحظات الرد</Label>
                                      <Textarea
                                        value={responseNotes}
                                        onChange={(e) => setResponseNotes(e.target.value)}
                        placeholder="أدخل ملاحظات الرد..."
                        rows={3}
                                      />
                                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleUpdateRequest} disabled={loading} className="flex-1">
                        {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
                      </Button>
                      <Button onClick={() => setSelectedRequest(null)} variant="outline" className="flex-1">
                        إلغاء
                                    </Button>
                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* إحصائيات سريعة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-600">إجمالي الطلبات</p>
                        <p className="text-2xl font-bold text-blue-800">{analytics.totalRequests}</p>
                      </div>
                </div>
              </CardContent>
            </Card>

                <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-yellow-600" />
                      <div>
                        <p className="text-sm text-yellow-600">قيد الانتظار</p>
                        <p className="text-2xl font-bold text-yellow-800">{analytics.pendingRequests}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm text-green-600">تم القبول</p>
                        <p className="text-2xl font-bold text-green-800">{analytics.approvedRequests}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="text-sm text-red-600">مرفوض</p>
                        <p className="text-2xl font-bold text-red-800">{analytics.rejectedRequests}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* إحصائيات إضافية */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-purple-600">طلبات عاجلة</p>
                        <p className="text-2xl font-bold text-purple-800">{analytics.urgentRequests}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Package className="h-8 w-8 text-indigo-600" />
                      <div>
                        <p className="text-sm text-indigo-600">طلبات المخزن</p>
                        <p className="text-2xl font-bold text-indigo-800">{analytics.warehouseRequests}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-teal-600" />
                      <div>
                        <p className="text-sm text-teal-600">طلبات HR</p>
                        <p className="text-2xl font-bold text-teal-800">{analytics.hrRequests}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="text-sm text-orange-600">معدل الرضا</p>
                        <p className="text-2xl font-bold text-orange-800">{analytics.satisfactionRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* الرسوم البيانية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SimpleBarChart title="الطلبات حسب الحالة" data={{
                  labels: ["قيد الانتظار", "تم القبول", "مرفوض", "تم التوصيل"],
                  data: [analytics.pendingRequests, analytics.approvedRequests, analytics.rejectedRequests, analytics.deliveredRequests],
                  colors: ["#FCD34D", "#10B981", "#EF4444", "#3B82F6"],
                }} />
                <SimplePieChart title="الطلبات حسب النوع" data={{
                  labels: ["مخزن", "موارد بشرية"],
                  data: [analytics.warehouseRequests, analytics.hrRequests],
                  colors: ["#3B82F6", "#8B5CF6"],
                }} />
              </div>

              {/* رسم بياني متقدم للأنشطة */}
              <ActivityChart title="أكثر السلع طلباً" data={{
                labels: analytics.topItems.map(item => item.name),
                data: analytics.topItems.map(item => item.count),
                colors: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"],
              }} />

              {/* إحصائيات الأداء */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      أداء الاستجابة
                  </CardTitle>
                </CardHeader>
                  <CardContent>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">متوسط وقت الاستجابة:</span>
                        <span className="font-semibold">{analytics.avgResponseTime} ساعة</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">معدل الرضا:</span>
                        <span className="font-semibold text-green-600">{analytics.satisfactionRate}%</span>
                          </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">الطلبات العاجلة:</span>
                        <span className="font-semibold text-orange-600">{analytics.urgentRequests}</span>
                          </div>
                  </div>
                </CardContent>
              </Card>

                <Card>
                  <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      تحليل الأداء
                  </CardTitle>
                </CardHeader>
                  <CardContent>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">نسبة القبول:</span>
                        <span className="font-semibold text-green-600">
                          {analytics.totalRequests > 0 ? Math.round((analytics.approvedRequests / analytics.totalRequests) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">نسبة الرفض:</span>
                        <span className="font-semibold text-red-600">
                          {analytics.totalRequests > 0 ? Math.round((analytics.rejectedRequests / analytics.totalRequests) * 100) : 0}%
                        </span>
                          </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">نسبة التوصيل:</span>
                        <span className="font-semibold text-blue-600">
                          {analytics.totalRequests > 0 ? Math.round((analytics.deliveredRequests / analytics.totalRequests) * 100) : 0}%
                        </span>
                          </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="communication">
            <CommunicationPanel userRole="hr" userName="مدير الموارد البشرية" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
