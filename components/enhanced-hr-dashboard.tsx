"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { getCurrentUser, logout, getExpiringItems, getInventoryItems } from "@/lib/enhanced-auth"
import { cleanupOldData, shouldRunCleanup } from "@/lib/data-cleanup"
import { createBackup, shouldCreateBackup, downloadBackup } from "@/lib/backup-system"
import { audioNotifications } from "@/lib/audio-notifications"
import { exportRequestsToPDF } from "@/lib/pdf-export"
import CommunicationPanel from "./communication-panel"
import DataManagement from "./data-management"
import { SimpleBarChart, SimplePieChart, TrendChart, ActivityChart, AdvancedPieChart } from "./charts"

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

interface Analytics {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  topItems: { item: string; count: number }[]
  departmentStats: { department: string; count: number }[]
  urgentRequests: number
  warehouseRequests: number
  hrRequests: number
  avgResponseTime: number
  satisfactionRate: number
}

export default function EnhancedHRDashboard() {
  const [requests, setRequests] = useState<Request[]>([])
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([])
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [responseNotes, setResponseNotes] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDepartment, setFilterDepartment] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [analytics, setAnalytics] = useState<Analytics>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    topItems: [],
    departmentStats: [],
    urgentRequests: 0,
    warehouseRequests: 0,
    hrRequests: 0,
    avgResponseTime: 0,
    satisfactionRate: 0,
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
  }, [router])

  useEffect(() => {
    filterRequests()
    calculateAnalytics()
  }, [requests, filterStatus, filterDepartment, filterType, searchTerm])

  const fetchRequests = () => {
    const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
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

    if (filterStatus !== "all") {
      filtered = filtered.filter((req) => req.status === filterStatus)
    }

    if (filterDepartment !== "all") {
      filtered = filtered.filter((req) => req.user_department === filterDepartment)
    }

    if (filterType !== "all") {
      filtered = filtered.filter((req) => req.type === filterType)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.user_department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.notes.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredRequests(filtered)
  }

  const calculateAnalytics = () => {
    const total = requests.length
    const pending = requests.filter((r) => r.status === "pending").length
    const approved = requests.filter((r) => r.status === "approved" || r.status === "delivered").length
    const rejected = requests.filter((r) => r.status === "rejected").length
    const urgent = requests.filter((r) => r.urgent).length
    const warehouse = requests.filter((r) => r.type === "warehouse").length
    const hr = requests.filter((r) => r.type === "hr").length

    // حساب متوسط وقت الاستجابة (محاكاة)
    const avgResponseTime = total > 0 ? Math.floor(Math.random() * 12) + 2 : 0

    // حساب معدل الرضا (محاكاة)
    const satisfactionRate = approved > 0 ? Math.min(98, 75 + (approved / total) * 23) : 0

    // Top requested items
    const itemCounts: { [key: string]: number } = {}
    requests.forEach((req) => {
      itemCounts[req.item_name] = (itemCounts[req.item_name] || 0) + 1
    })
    const topItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([item, count]) => ({ item, count }))

    // Department statistics
    const deptCounts: { [key: string]: number } = {}
    requests.forEach((req) => {
      deptCounts[req.user_department] = (deptCounts[req.user_department] || 0) + 1
    })
    const departmentStats = Object.entries(deptCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([department, count]) => ({ department, count }))

    setAnalytics({
      totalRequests: total,
      pendingRequests: pending,
      approvedRequests: approved,
      rejectedRequests: rejected,
      topItems,
      departmentStats,
      urgentRequests: urgent,
      warehouseRequests: warehouse,
      hrRequests: hr,
      avgResponseTime,
      satisfactionRate: Math.round(satisfactionRate),
    })
  }

  const handleUpdateRequest = () => {
    if (!selectedRequest) return

    setLoading(true)
    try {
      const updatedRequest = { ...selectedRequest, status: newStatus, response_notes: responseNotes }

      const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
      const updatedRequests = allRequests.map((req: Request) => (req.id === selectedRequest.id ? updatedRequest : req))
      localStorage.setItem("all_requests", JSON.stringify(updatedRequests))

      const userRequests = JSON.parse(localStorage.getItem(`requests_${selectedRequest.user_department}`) || "[]")
      const updatedUserRequests = userRequests.map((req: Request) =>
        req.id === selectedRequest.id ? updatedRequest : req,
      )
      localStorage.setItem(`requests_${selectedRequest.user_department}`, JSON.stringify(updatedUserRequests))

      fetchRequests()
      setSelectedRequest(null)
      setResponseNotes("")
      setNewStatus("")
      audioNotifications.playSuccessSound()
    } catch (error) {
      console.error("Error updating request:", error)
      audioNotifications.playErrorSound()
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
    audioNotifications.playSuccessSound()
  }

  const handleCreateBackup = () => {
    const backup = createBackup()
    downloadBackup(backup)
    audioNotifications.playSuccessSound()
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

  // إحصائيات للرسوم البيانية المتقدمة
  const getAdvancedChartData = () => {
    const statusCounts = requests.reduce(
      (acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const departmentCounts = requests.reduce(
      (acc, req) => {
        acc[req.user_department] = (acc[req.user_department] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const monthlyData = requests.reduce(
      (acc, req) => {
        const month = new Date(req.created_at).toLocaleDateString("ar-SA", { month: "short", year: "2-digit" })
        acc[month] = (acc[month] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const urgencyData = {
      عادي: requests.filter((r) => !r.urgent).length,
      مستعجل: requests.filter((r) => r.urgent).length,
    }

    const typeData = {
      مخزن: requests.filter((r) => r.type === "warehouse").length,
      "موارد بشرية": requests.filter((r) => r.type === "hr").length,
    }

    const weeklyData = requests.reduce(
      (acc, req) => {
        const week = `الأسبوع ${Math.ceil(new Date(req.created_at).getDate() / 7)}`
        acc[week] = (acc[week] || 0) + 1
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
      departmentChart: {
        labels: Object.keys(departmentCounts),
        data: Object.values(departmentCounts),
        colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"],
      },
      monthlyChart: {
        labels: Object.keys(monthlyData),
        data: Object.values(monthlyData),
        colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
      },
      urgencyChart: {
        labels: Object.keys(urgencyData),
        data: Object.values(urgencyData),
        colors: ["#10B981", "#EF4444"],
      },
      typeChart: {
        labels: Object.keys(typeData),
        data: Object.values(typeData),
        colors: ["#3B82F6", "#8B5CF6"],
      },
      weeklyChart: {
        labels: Object.keys(weeklyData),
        data: Object.values(weeklyData),
        colors: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"],
      },
    }
  }

  const departments = [...new Set(requests.map((req) => req.user_department))]
  const chartData = getAdvancedChartData()
  const lowStockItems = inventoryItems.filter((item) => item.quantity <= item.min_quantity)
  const expiringSoon = expiringItems.filter((item) => {
    const expiryDate = new Date(item.expiry_date)
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays >= 0
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50" dir="rtl">
      <header className="bg-white/90 backdrop-blur-lg shadow-xl border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                👔
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  لوحة إدارة الموارد البشرية
                </h1>
                <p className="text-gray-600">إدارة شاملة ومتقدمة للطلبات والتقارير</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateBackup}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
              >
                <Shield className="ml-2 h-4 w-4" />
                نسخة احتياطية
              </Button>
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
        {/* إحصائيات متقدمة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 transform hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">إجمالي الطلبات</p>
                  <p className="text-3xl font-bold">{analytics.totalRequests}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 transform hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">قيد الانتظار</p>
                  <p className="text-3xl font-bold">{analytics.pendingRequests}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 transform hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">مكتملة</p>
                  <p className="text-3xl font-bold">{analytics.approvedRequests}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 transform hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100">مستعجلة</p>
                  <p className="text-3xl font-bold">{analytics.urgentRequests}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 transform hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">معدل الرضا</p>
                  <p className="text-3xl font-bold">{analytics.satisfactionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* تنبيهات مهمة */}
        {(lowStockItems.length > 0 || expiringSoon.length > 0 || analytics.pendingRequests > 10) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {lowStockItems.length > 0 && (
              <Card className="border-orange-200 bg-orange-50 transform hover:scale-105 transition-transform">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="h-5 w-5" />
                    تنبيه: مخزون منخفض ({lowStockItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lowStockItems.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{item.name}</span>
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">{item.quantity} متبقي</Badge>
                      </div>
                    ))}
                    {lowStockItems.length > 3 && (
                      <p className="text-xs text-orange-700">و {lowStockItems.length - 3} سلع أخرى...</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {expiringSoon.length > 0 && (
              <Card className="border-red-200 bg-red-50 transform hover:scale-105 transition-transform">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <Calendar className="h-5 w-5" />
                    سلع قريبة الانتهاء ({expiringSoon.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expiringSoon.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{item.name}</span>
                        <Badge className="bg-red-100 text-red-800 border-red-200">{item.department}</Badge>
                      </div>
                    ))}
                    {expiringSoon.length > 3 && (
                      <p className="text-xs text-red-700">و {expiringSoon.length - 3} سلع أخرى...</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {analytics.pendingRequests > 10 && (
              <Card className="border-blue-200 bg-blue-50 transform hover:scale-105 transition-transform">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Clock className="h-5 w-5" />
                    طلبات كثيرة معلقة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-700">
                    لديك {analytics.pendingRequests} طلب معلق. يُنصح بمراجعتها قريباً.
                  </p>
                  <p className="text-xs text-blue-600 mt-2">متوسط وقت الاستجابة: {analytics.avgResponseTime} ساعة</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm border">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              التحليلات المتقدمة
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              إدارة الطلبات
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              مراقبة المخزون
            </TabsTrigger>
            <TabsTrigger
              value="communication"
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
            >
              التواصل
            </TabsTrigger>
            <TabsTrigger
              value="data-management"
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
            >
              إدارة البيانات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* الرسوم البيانية المتقدمة */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AdvancedPieChart title="توزيع الطلبات حسب الحالة" data={chartData.statusChart} />
                <SimpleBarChart title="الطلبات حسب القسم" data={chartData.departmentChart} />
                <TrendChart title="الاتجاه الشهري للطلبات" data={chartData.monthlyChart} />
                <ActivityChart title="تحليل الأولوية" data={chartData.urgencyChart} />
                <SimplePieChart title="توزيع أنواع الطلبات" data={chartData.typeChart} />
                <SimpleBarChart title="النشاط الأسبوعي" data={chartData.weeklyChart} />
              </div>

              {/* إحصائيات تفصيلية متقدمة */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
                  <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      أكثر السلع طلباً
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {analytics.topItems.map((item, index) => (
                        <div
                          key={item.item}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-800">{item.item}</span>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1">
                            {item.count} طلب
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
                  <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      أداء الأقسام
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {analytics.departmentStats.map((dept, index) => (
                        <div
                          key={dept.department}
                          className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <span className="font-medium text-gray-800">{dept.department}</span>
                            </div>
                            <Badge className="bg-violet-100 text-violet-800 border-violet-200">{dept.count} طلب</Badge>
                          </div>
                          <div className="w-full bg-violet-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${(dept.count / analytics.totalRequests) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
                  <CardHeader className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      مؤشرات الأداء
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-blue-900">متوسط وقت الاستجابة</span>
                          <span className="text-2xl font-bold text-blue-800">{analytics.avgResponseTime}س</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                            style={{ width: `${Math.min(((24 - analytics.avgResponseTime) / 24) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-green-900">معدل الرضا</span>
                          <span className="text-2xl font-bold text-green-800">{analytics.satisfactionRate}%</span>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                            style={{ width: `${analytics.satisfactionRate}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-orange-900">الطلبات المستعجلة</span>
                          <span className="text-2xl font-bold text-orange-800">{analytics.urgentRequests}</span>
                        </div>
                        <div className="text-xs text-orange-700">
                          {analytics.totalRequests > 0
                            ? `${((analytics.urgentRequests / analytics.totalRequests) * 100).toFixed(1)}% من إجمالي الطلبات`
                            : "لا توجد طلبات"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  جميع الطلبات
                </CardTitle>
                <div className="flex gap-4 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <Input
                      placeholder="البحث في الطلبات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
                        <SelectValue />
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
                  </div>
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
                      <SelectValue placeholder="القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأقسام</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
                      <SelectValue placeholder="النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأنواع</SelectItem>
                      <SelectItem value="warehouse">مخزن</SelectItem>
                      <SelectItem value="hr">موارد بشرية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>القسم</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>السلعة</TableHead>
                        <TableHead>الكمية</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الأولوية</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id} className="hover:bg-gray-50">
                          <TableCell className="text-sm">
                            {new Date(request.created_at).toLocaleDateString("ar-SA")}
                          </TableCell>
                          <TableCell className="font-medium">{request.user_department}</TableCell>
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
                          <TableCell className="font-medium">{request.item_name}</TableCell>
                          <TableCell>{request.quantity || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(request.status)}
                              <span className="text-sm">{getStatusText(request.status)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {request.urgent && (
                              <Badge className="bg-red-100 text-red-800 border-red-200">⚡ مستعجل</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRequest(request)
                                    setNewStatus(request.status)
                                    setResponseNotes(request.response_notes || "")
                                  }}
                                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                                >
                                  إدارة
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>إدارة الطلب</DialogTitle>
                                </DialogHeader>
                                {selectedRequest && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                      <div>
                                        <Label className="text-sm font-medium text-gray-600">السلعة</Label>
                                        <p className="font-medium">{selectedRequest.item_name}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-gray-600">القسم</Label>
                                        <p className="font-medium">{selectedRequest.user_department}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-gray-600">الكمية</Label>
                                        <p className="font-medium">{selectedRequest.quantity || "-"}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-gray-600">التاريخ</Label>
                                        <p className="font-medium">
                                          {new Date(selectedRequest.created_at).toLocaleDateString("ar-SA")}
                                        </p>
                                      </div>
                                    </div>

                                    {selectedRequest.notes && (
                                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <Label className="text-sm font-medium text-blue-900">ملاحظات الطالب:</Label>
                                        <p className="text-blue-800 mt-1">{selectedRequest.notes}</p>
                                      </div>
                                    )}

                                    <div className="space-y-2">
                                      <Label>تحديث الحالة</Label>
                                      <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger>
                                          <SelectValue />
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
                                        placeholder="أضف ملاحظات للرد على الطلب..."
                                        rows={4}
                                      />
                                    </div>

                                    <Button
                                      onClick={handleUpdateRequest}
                                      disabled={loading}
                                      className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                                    >
                                      {loading ? "جاري التحديث..." : "تحديث الطلب"}
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    مخزون منخفض ({lowStockItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {lowStockItems.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">جميع السلع في المستوى الطبيعي</p>
                      </div>
                    ) : (
                      lowStockItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-200"
                        >
                          <div>
                            <p className="font-medium text-orange-900">{item.name}</p>
                            <p className="text-sm text-orange-700">الموقع: {item.location || "غير محدد"}</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              {item.quantity} متبقي
                            </Badge>
                            <p className="text-xs text-orange-600 mt-1">الحد الأدنى: {item.min_quantity}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
                <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    سلع قريبة الانتهاء ({expiringSoon.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {expiringSoon.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">لا توجد سلع قريبة الانتهاء</p>
                      </div>
                    ) : (
                      expiringSoon.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200"
                        >
                          <div>
                            <p className="font-medium text-red-900">{item.name}</p>
                            <p className="text-sm text-red-700">القسم: {item.department}</p>
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
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="communication">
            <CommunicationPanel userRole="hr" userName="مدير الموارد البشرية" />
          </TabsContent>

          <TabsContent value="data-management">
            <DataManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
