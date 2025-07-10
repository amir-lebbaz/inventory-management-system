"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { getCurrentUser, logout, saveInventoryItem, getInventoryItems } from "@/lib/enhanced-auth"
import { cleanupOldData, shouldRunCleanup } from "@/lib/data-cleanup"
import CommunicationPanel from "./communication-panel"
import DataManagement from "./data-management"
import { SimpleBarChart, SimplePieChart, TrendChart } from "./charts"

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

interface InventoryItem {
  id: string
  name: string
  quantity: number
  min_quantity: number
  location: string
  notes: string
  created_at: string
}

export default function EnhancedWarehouseDashboard() {
  const [requests, setRequests] = useState<Request[]>([])
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([])
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [responseNotes, setResponseNotes] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDepartment, setFilterDepartment] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [showTransferWarning, setShowTransferWarning] = useState(false)

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
  }, [requests, filterStatus, filterDepartment, searchTerm])

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

    if (filterDepartment !== "all") {
      filtered = filtered.filter((req) => req.user_department === filterDepartment)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.user_department.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredRequests(filtered)
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

      const userRequests = JSON.parse(localStorage.getItem(`requests_${selectedRequest.user_department}`) || "[]")
      const updatedUserRequests = userRequests.map((req: Request) =>
        req.id === selectedRequest.id ? updatedRequest : req,
      )
      localStorage.setItem(`requests_${selectedRequest.user_department}`, JSON.stringify(updatedUserRequests))

      fetchRequests()
      setSelectedRequest(null)
      setResponseNotes("")
      setNewStatus("")
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

    setNewItemName("")
    setNewItemQuantity("")
    setNewItemMinQuantity("")
    setNewItemLocation("")
    setNewItemNotes("")
    setShowInventoryDialog(false)
  }

  const handleEditItem = () => {
    if (!editingItem) return

    saveInventoryItem(editingItem)
    loadInventory()
    setEditingItem(null)
  }

  const handleDeleteItem = (itemId: string) => {
    const items = getInventoryItems()
    const filteredItems = items.filter((item: InventoryItem) => item.id !== itemId)
    localStorage.setItem("warehouse_inventory", JSON.stringify(filteredItems))
    loadInventory()
    setShowDeleteConfirm(null)
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

  // إحصائيات للرسوم البيانية
  const getChartData = () => {
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
      departmentChart: {
        labels: Object.keys(departmentCounts),
        data: Object.values(departmentCounts),
        colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"],
      },
      trendChart: {
        labels: Object.keys(monthlyData),
        data: Object.values(monthlyData),
        colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
      },
    }
  }

  const departments = [...new Set(requests.map((req) => req.user_department))]
  const pendingRequests = requests.filter((r) => r.status === "pending").length
  const lowStockItems = inventory.filter((item) => item.quantity <= item.min_quantity).length
  const totalItems = inventory.length
  const chartData = getChartData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50" dir="rtl">
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl">
                📦
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  لوحة إدارة المخزن
                </h1>
                <p className="text-gray-600">إدارة الطلبات والمخزون</p>
              </div>
            </div>
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
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">طلبات معلقة</p>
                  <p className="text-3xl font-bold">{pendingRequests}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">إجمالي السلع</p>
                  <p className="text-3xl font-bold">{totalItems}</p>
                </div>
                <Package className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">مخزون منخفض</p>
                  <p className="text-3xl font-bold">{lowStockItems}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">إجمالي الطلبات</p>
                  <p className="text-3xl font-bold">{requests.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm border">
            <TabsTrigger value="requests" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              إدارة الطلبات
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              إدارة المخزون
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              الإحصائيات
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

          <TabsContent value="requests">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  طلبات المخزن
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
                        <SelectItem value="in_progress">قيد التحضير</SelectItem>
                        <SelectItem value="delivered">تم التوصيل</SelectItem>
                        <SelectItem value="rejected">مرفوض</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
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
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>القسم</TableHead>
                      <TableHead>السلعة</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{request.user_department}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {request.item_name}
                            {request.urgent && (
                              <Badge className="bg-red-100 text-red-800 border-red-200">⚡ مستعجل</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{request.quantity || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            <Badge
                              variant={
                                request.status === "delivered"
                                  ? "default"
                                  : request.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {getStatusText(request.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString("ar-SA")}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-blue-50 hover:border-blue-300 bg-transparent"
                                onClick={() => {
                                  setSelectedRequest(request)
                                  setNewStatus(request.status)
                                  setResponseNotes(request.response_notes || "")
                                }}
                              >
                                تحديث
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>تحديث الطلب</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                  <p>
                                    <strong>القسم:</strong> {selectedRequest?.user_department}
                                  </p>
                                  <p>
                                    <strong>السلعة:</strong> {selectedRequest?.item_name}
                                  </p>
                                  <p>
                                    <strong>الكمية:</strong> {selectedRequest?.quantity || "-"}
                                  </p>
                                  {selectedRequest?.notes && (
                                    <p>
                                      <strong>ملاحظات العامل:</strong> {selectedRequest.notes}
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label>الحالة الجديدة</Label>
                                  <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">⏳ قيد الانتظار</SelectItem>
                                      <SelectItem value="in_progress">🔄 قيد التحضير</SelectItem>
                                      <SelectItem value="delivered">✅ تم التوصيل</SelectItem>
                                      <SelectItem value="rejected">❌ مرفوض</SelectItem>
                                      <SelectItem value="transfer_to_hr">🔄 تحويل إلى الموارد البشرية</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>ملاحظات الرد</Label>
                                  <Textarea
                                    value={responseNotes}
                                    onChange={(e) => setResponseNotes(e.target.value)}
                                    placeholder="أضف ملاحظات للعامل..."
                                    rows={3}
                                  />
                                </div>

                                {showTransferWarning && (
                                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-orange-800">
                                      <AlertTriangle className="h-4 w-4" />
                                      <span className="text-sm font-medium">
                                        سيتم تحويل هذا الطلب إلى قسم الموارد البشرية
                                      </span>
                                    </div>
                                  </div>
                                )}

                                <Button onClick={handleUpdateRequest} disabled={loading} className="w-full">
                                  {loading
                                    ? "جاري التحديث..."
                                    : newStatus === "transfer_to_hr"
                                      ? "تحويل إلى الموارد البشرية"
                                      : "تحديث الطلب"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredRequests.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">لا توجد طلبات</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Archive className="h-5 w-5" />
                    إدارة المخزون
                  </div>
                  <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <Plus className="ml-2 h-4 w-4" />
                        إضافة سلعة
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إضافة سلعة جديدة للمخزون</DialogTitle>
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
                            placeholder="موقع السلعة في المخزن"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ملاحظات</Label>
                          <Textarea
                            value={newItemNotes}
                            onChange={(e) => setNewItemNotes(e.target.value)}
                            placeholder="ملاحظات إضافية"
                            rows={2}
                          />
                        </div>
                        <Button onClick={handleAddInventoryItem} className="w-full">
                          إضافة السلعة
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inventory.map((item) => (
                    <Card key={item.id} className="border-2 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          <div className="flex items-center gap-1">
                            {item.quantity <= item.min_quantity && (
                              <Badge className="bg-red-100 text-red-800 border-red-200">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                منخفض
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingItem(item)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowDeleteConfirm(item.id)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">الكمية:</span>
                            <span className="font-medium">{item.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">الحد الأدنى:</span>
                            <span className="font-medium">{item.min_quantity}</span>
                          </div>
                          {item.location && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">الموقع:</span>
                              <span className="font-medium">{item.location}</span>
                            </div>
                          )}
                          {item.notes && <div className="mt-2 p-2 bg-gray-50 rounded text-xs">{item.notes}</div>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {inventory.length === 0 && (
                  <div className="text-center py-12">
                    <Archive className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">لا توجد سلع في المخزون</p>
                    <p className="text-gray-400 text-sm">ابدأ بإضافة السلع الأولى</p>
                  </div>
                )}
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
                      <Label>الملاحظات</Label>
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

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleBarChart title="الطلبات حسب الحالة" data={chartData.statusChart} />
              <SimplePieChart title="الطلبات حسب القسم" data={chartData.departmentChart} />
              <TrendChart title="اتجاه الطلبات الشهرية" data={chartData.trendChart} />
            </div>
          </TabsContent>

          <TabsContent value="communication">
            <CommunicationPanel userRole="warehouse" userName="أمين المخزن" />
          </TabsContent>

          <TabsContent value="data-management">
            <DataManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
