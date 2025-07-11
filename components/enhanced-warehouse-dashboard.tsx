"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LogOut,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Plus,
  Search,
  BarChart3,
  AlertTriangle,
  Archive,
  Edit,
  Trash2,
  Download,
  TrendingUp,
  AlertCircle as AlertCircleIcon,
} from "lucide-react"
import { getCurrentUser, logout, saveInventoryItem, getInventoryItems } from "@/lib/enhanced-auth"
import { cleanupOldData, shouldRunCleanup } from "@/lib/data-cleanup"
import { audioNotifications } from "@/lib/audio-notifications"
import { exportRequestsToPDF, exportInventoryToPDF, exportRequestsToCSV, exportInventoryToCSV } from "@/lib/pdf-export"
import CommunicationPanel from "./communication-panel"
import DataManagement from "./data-management"
import { SimpleBarChart, SimplePieChart, TrendChart } from "./charts"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { addRequestNotification, addInventoryNotification } from "@/lib/communication"

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

interface InventoryItem {
  id: string
  name: string
  quantity: number
  min_quantity: number
  location: string
  notes: string
  created_at: string
}

interface WarehouseStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  totalItems: number
  lowStockItems: number
  urgentRequests: number
  avgResponseTime: number
}

export default function EnhancedWarehouseDashboard() {
  const [requests, setRequests] = useState<Request[]>([])
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([])
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [responseNotes, setResponseNotes] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [showTransferWarning, setShowTransferWarning] = useState(false)
  const [warehouseStats, setWarehouseStats] = useState<WarehouseStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalItems: 0,
    lowStockItems: 0,
    urgentRequests: 0,
    avgResponseTime: 0,
  })

  // إدارة المخزون
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [showInventoryDialog, setShowInventoryDialog] = useState(false)
  const [newItemName, setNewItemName] = useState("")
  const [newItemQuantity, setNewItemQuantity] = useState("")
  const [newItemMinQuantity, setNewItemMinQuantity] = useState("")
  const [newItemLocation, setNewItemLocation] = useState("")
  const [newItemNotes, setNewItemNotes] = useState("")

  // حالات التعديل والحذف
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== "warehouse") {
      router.push("/")
      return
    }
    fetchRequests()
    loadInventory()

    // تشغيل التنظيف التلقائي إذا لزم الأمر
    if (shouldRunCleanup()) {
      cleanupOldData()
    }
  }, [router])

  useEffect(() => {
    filterRequests()
    calculateWarehouseStats()
  }, [requests, inventory])

  useEffect(() => {
    setShowTransferWarning(newStatus === "transfer_to_hr")
  }, [newStatus])

  const fetchRequests = () => {
    const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
    const warehouseRequests = allRequests.filter((req: Request) => req.type === "warehouse")
    setRequests(warehouseRequests)
  }

  const loadInventory = () => {
    const items = getInventoryItems()
    setInventory(items)
  }

  const filterRequests = () => {
    let filtered = requests

    if (filterStatus !== "all") {
      filtered = filtered.filter((req) => req.status === filterStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.notes.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredRequests(filtered)
  }

  const calculateWarehouseStats = () => {
    const total = requests.length
    const pending = requests.filter((req) => req.status === "pending").length
    const approved = requests.filter((req) => req.status === "approved" || req.status === "delivered").length
    const rejected = requests.filter((req) => req.status === "rejected").length
    const urgent = requests.filter((req) => req.urgent).length
    const totalItems = inventory.length
    const lowStock = inventory.filter((item) => item.quantity <= item.min_quantity).length

    // حساب متوسط وقت الاستجابة (محاكاة)
    const avgResponseTime = total > 0 ? Math.floor(Math.random() * 24) + 1 : 0

    setWarehouseStats({
      totalRequests: total,
      pendingRequests: pending,
      approvedRequests: approved,
      rejectedRequests: rejected,
      totalItems,
      lowStockItems: lowStock,
      urgentRequests: urgent,
      avgResponseTime,
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
      addRequestNotification(selectedRequest.user_name, "المخزن", newStatus)

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

  const handleAddInventoryItem = () => {
    if (!newItemName || !newItemQuantity) return

    const item: InventoryItem = {
      id: Date.now().toString(),
      name: newItemName,
      quantity: Number.parseInt(newItemQuantity),
      min_quantity: Number.parseInt(newItemMinQuantity) || 5,
      location: newItemLocation,
      notes: newItemNotes,
      created_at: new Date().toISOString(),
    }

    saveInventoryItem(item)
    loadInventory()

    // إضافة إشعار للمخزون
    addInventoryNotification("مدير المخزن", newItemName, "added")

    setNewItemName("")
    setNewItemQuantity("")
    setNewItemMinQuantity("")
    setNewItemLocation("")
    setNewItemNotes("")
    setShowInventoryDialog(false)

    // تشغيل صوت النجاح
    audioNotifications.playSuccessSound()
  }

  const handleEditItem = () => {
    if (!editingItem) return

    const updatedInventory = inventory.map((item) => (item.id === editingItem.id ? editingItem : item))
    localStorage.setItem("inventory_items", JSON.stringify(updatedInventory))
    setInventory(updatedInventory)

    // إضافة إشعار لتحديث المخزون
    addInventoryNotification("مدير المخزن", editingItem.name, "updated")

    setEditingItem(null)

    // تشغيل صوت النجاح
    audioNotifications.playSuccessSound()
  }

  const handleDeleteItem = (itemId: string) => {
    const updatedInventory = inventory.filter((item) => item.id !== itemId)
    localStorage.setItem("inventory_items", JSON.stringify(updatedInventory))
    setInventory(updatedInventory)
    setShowDeleteConfirm(null)
  }

  const handleSignOut = () => {
    logout()
    router.push("/")
  }

  const handleExportPDF = () => {
    exportRequestsToPDF(filteredRequests)
  }

  const handleExportInventoryPDF = () => {
    exportInventoryToPDF(inventory)
  }

  const handleExportCSV = () => {
    exportRequestsToCSV(filteredRequests)
  }
  const handleExportInventoryCSV = () => {
    exportInventoryToCSV(inventory)
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
    const months = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ]

    return {
      statusChart: {
        labels: ["قيد الانتظار", "موافق عليه", "مرفوض"],
        data: [warehouseStats.pendingRequests, warehouseStats.approvedRequests, warehouseStats.rejectedRequests],
        colors: ["#FCD34D", "#10B981", "#EF4444"],
      },
      inventoryChart: {
        labels: ["متوفر", "منخفض"],
        data: [inventory.filter((item) => item.quantity > item.min_quantity).length, warehouseStats.lowStockItems],
        colors: ["#10B981", "#F59E0B"],
      },
      monthlyChart: {
        labels: months,
        data: months.map(() => Math.floor(Math.random() * 15) + 5),
        colors: ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#EF4444"],
      }
    }
  }, [warehouseStats, inventory])

  if (!getCurrentUser()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50" dir="rtl">
      <header className="bg-white/90 backdrop-blur-lg shadow-xl border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-green-600 rounded-full flex items-center justify-center text-white text-lg sm:text-xl shadow-lg">
                📦
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  لوحة إدارة المخزن
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">إدارة شاملة للمخزون والطلبات</p>
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
            <TabsTrigger value="inventory" className="text-xs sm:text-sm">المخزون</TabsTrigger>
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
                        <p className="text-lg sm:text-2xl font-bold">{warehouseStats.totalRequests}</p>
                </div>
                      <Package className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

                <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                  <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                        <p className="text-xs sm:text-sm opacity-90">قيد الانتظار</p>
                        <p className="text-lg sm:text-2xl font-bold">{warehouseStats.pendingRequests}</p>
                </div>
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                        <p className="text-xs sm:text-sm opacity-90">السلع المتوفرة</p>
                        <p className="text-lg sm:text-2xl font-bold">{warehouseStats.totalItems}</p>
                </div>
                      <Archive className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

                <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                  <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                        <p className="text-xs sm:text-sm opacity-90">منخفض المخزون</p>
                        <p className="text-lg sm:text-2xl font-bold">{warehouseStats.lowStockItems}</p>
                </div>
                      <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

              {/* تنبيهات مهمة */}
              {warehouseStats.urgentRequests > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div className="text-red-800">
                    <p className="font-medium">تنبيه: {warehouseStats.urgentRequests} طلب مستعجل يحتاج إلى مراجعة فورية</p>
                  </div>
                </Alert>
              )}

              {warehouseStats.lowStockItems > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <div className="text-orange-800">
                    <p className="font-medium">تنبيه: {warehouseStats.lowStockItems} سلعة منخفضة المخزون تحتاج إلى إعادة طلب</p>
                  </div>
                </Alert>
              )}

              {/* الرسوم البيانية */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <SimpleBarChart title="الطلبات حسب الحالة" data={chartData.statusChart} />
                <SimplePieChart title="حالة المخزون" data={chartData.inventoryChart} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-t-lg">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
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
                        <TableHead className="text-xs sm:text-sm">السلعة</TableHead>
                        <TableHead className="text-xs sm:text-sm">الكمية</TableHead>
                        <TableHead className="text-xs sm:text-sm">الحالة</TableHead>
                        <TableHead className="text-xs sm:text-sm">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-gray-50">
                          <TableCell className="text-xs sm:text-sm">
                            {new Date(request.created_at).toLocaleDateString("ar-SA")}
                        </TableCell>
                          <TableCell className="font-medium text-xs sm:text-sm">{request.user_name}</TableCell>
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
                      ))}
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
                          <SelectItem value="transfer_to_hr">تحويل إلى الموارد البشرية</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                    {showTransferWarning && (
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertCircleIcon className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          سيتم تحويل هذا الطلب إلى الموارد البشرية مع إضافة ملاحظة توضح أن السلعة غير متوفرة حالياً
                        </AlertDescription>
                      </Alert>
                    )}

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

          <TabsContent value="inventory">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Archive className="h-5 w-5" />
                    إدارة المخزون
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleExportInventoryPDF}
                      variant="outline"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      <Download className="ml-2 h-4 w-4" />
                      تصدير PDF
                    </Button>
                    <Button
                      onClick={handleExportInventoryCSV}
                      variant="outline"
                      className="bg-white/20 hover:bg-white/30 text-blue-700 border-white/30"
                    >
                      <Download className="ml-2 h-4 w-4" />
                      تصدير Excel
                    </Button>
                  <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <Plus className="ml-2 h-4 w-4" />
                        إضافة سلعة
                      </Button>
                    </DialogTrigger>
                      <DialogContent className="max-w-md">
                      <DialogHeader>
                          <DialogTitle>إضافة سلعة جديدة</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>اسم السلعة</Label>
                          <Input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="أدخل اسم السلعة"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>الكمية الحالية</Label>
                            <Input
                              type="number"
                              value={newItemQuantity}
                              onChange={(e) => setNewItemQuantity(e.target.value)}
                              placeholder="الكمية"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>الحد الأدنى</Label>
                            <Input
                              type="number"
                              value={newItemMinQuantity}
                              onChange={(e) => setNewItemMinQuantity(e.target.value)}
                              placeholder="الحد الأدنى"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>الموقع</Label>
                          <Input
                            value={newItemLocation}
                            onChange={(e) => setNewItemLocation(e.target.value)}
                              placeholder="أدخل موقع السلعة"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ملاحظات</Label>
                          <Textarea
                            value={newItemNotes}
                            onChange={(e) => setNewItemNotes(e.target.value)}
                              placeholder="أدخل ملاحظات إضافية"
                              rows={3}
                          />
                        </div>
                        <Button onClick={handleAddInventoryItem} className="w-full">
                          إضافة السلعة
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">اسم السلعة</TableHead>
                        <TableHead className="text-xs sm:text-sm">الكمية الحالية</TableHead>
                        <TableHead className="text-xs sm:text-sm">الحد الأدنى</TableHead>
                        <TableHead className="text-xs sm:text-sm">الموقع</TableHead>
                        <TableHead className="text-xs sm:text-sm">الحالة</TableHead>
                        <TableHead className="text-xs sm:text-sm">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                  {inventory.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-xs sm:text-sm">{item.name}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{item.quantity}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{item.min_quantity}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{item.location || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                item.quantity <= item.min_quantity
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : "bg-green-100 text-green-800 border-green-200"
                              }
                            >
                              {item.quantity <= item.min_quantity ? "منخفض" : "طبيعي"}
                              </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingItem(item)}
                                className="h-7 px-2 text-xs"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowDeleteConfirm(item.id)}
                                className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* نافذة تعديل السلعة */}
            <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>تعديل السلعة</DialogTitle>
                </DialogHeader>
                {editingItem && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>اسم السلعة</Label>
                      <Input
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>الكمية الحالية</Label>
                        <Input
                          type="number"
                          value={editingItem.quantity}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, quantity: Number.parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الحد الأدنى</Label>
                        <Input
                          type="number"
                          value={editingItem.min_quantity}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, min_quantity: Number.parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>الموقع</Label>
                      <Input
                        value={editingItem.location}
                        onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ملاحظات</Label>
                      <Textarea
                        value={editingItem.notes}
                        onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleEditItem} className="w-full">
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
                  <p className="text-gray-600">هل أنت متأكد من حذف هذه السلعة؟ لا يمكن التراجع عن هذا الإجراء.</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => showDeleteConfirm && handleDeleteItem(showDeleteConfirm)}
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

          <TabsContent value="communication">
            <CommunicationPanel userRole="warehouse" userName="مدير المخزن" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
