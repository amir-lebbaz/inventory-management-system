"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LogOut, Users, BarChart3, Clock, CheckCircle, XCircle, AlertCircle, Filter, TrendingUp } from "lucide-react"
import { Label } from "@/components/ui/label"

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
  profiles: {
    name: string
    department: string
  }
}

interface Analytics {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  topItems: { item: string; count: number }[]
  departmentStats: { department: string; count: number }[]
}

export default function HRDashboard() {
  const [requests, setRequests] = useState<Request[]>([])
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([])
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [responseNotes, setResponseNotes] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDepartment, setFilterDepartment] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [analytics, setAnalytics] = useState<Analytics>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    topItems: [],
    departmentStats: [],
  })
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    filterRequests()
    calculateAnalytics()
  }, [requests, filterStatus, filterDepartment, filterType])

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("requests")
      .select(`
        *,
        profiles (name, department)
      `)
      .order("created_at", { ascending: false })

    if (data) setRequests(data)
  }

  const filterRequests = () => {
    let filtered = requests

    if (filterStatus !== "all") {
      filtered = filtered.filter((req) => req.status === filterStatus)
    }

    if (filterDepartment !== "all") {
      filtered = filtered.filter((req) => req.profiles.department === filterDepartment)
    }

    if (filterType !== "all") {
      filtered = filtered.filter((req) => req.type === filterType)
    }

    setFilteredRequests(filtered)
  }

  const calculateAnalytics = () => {
    const total = requests.length
    const pending = requests.filter((r) => r.status === "pending").length
    const approved = requests.filter((r) => r.status === "approved" || r.status === "delivered").length
    const rejected = requests.filter((r) => r.status === "rejected").length

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
      deptCounts[req.profiles.department] = (deptCounts[req.profiles.department] || 0) + 1
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
    })
  }

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          status: newStatus,
          response_notes: responseNotes,
        })
        .eq("id", selectedRequest.id)

      if (error) throw error

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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
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

  const departments = [...new Set(requests.map((req) => req.profiles.department))]

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">لوحة إدارة الموارد البشرية</h1>
              <p className="text-gray-600">إدارة وتحليل جميع الطلبات</p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
            <TabsTrigger value="requests">إدارة الطلبات</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalRequests}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{analytics.pendingRequests}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">موافق عليها</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{analytics.approvedRequests}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">مرفوضة</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{analytics.rejectedRequests}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    أكثر السلع طلباً
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="font-medium">{item.item}</span>
                        <Badge variant="secondary">{item.count} طلب</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    إحصائيات الأقسام
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.departmentStats.map((dept, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="font-medium">{dept.department}</span>
                        <Badge variant="outline">{dept.count} طلب</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  جميع الطلبات
                </CardTitle>
                <div className="flex gap-4 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Label>الحالة:</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                        <SelectItem value="approved">موافق عليه</SelectItem>
                        <SelectItem value="in_progress">قيد التحضير</SelectItem>
                        <SelectItem value="delivered">تم التوصيل</SelectItem>
                        <SelectItem value="rejected">مرفوض</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label>القسم:</Label>
                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
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

                  <div className="flex items-center gap-2">
                    <Label>النوع:</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأنواع</SelectItem>
                        <SelectItem value="warehouse">مخزن</SelectItem>
                        <SelectItem value="hr">موارد بشرية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العامل</TableHead>
                      <TableHead>القسم</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>السلعة</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.profiles.name}</TableCell>
                        <TableCell>{request.profiles.department}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.type === "warehouse" ? "مخزن" : "موارد بشرية"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {request.item_name}
                            {request.urgent && (
                              <Badge variant="destructive" className="text-xs">
                                مستعجل
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{request.quantity || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            <Badge
                              variant={
                                request.status === "approved" || request.status === "delivered"
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
                                onClick={() => {
                                  setSelectedRequest(request)
                                  setNewStatus(request.status)
                                  setResponseNotes(request.response_notes || "")
                                }}
                              >
                                تحديث
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>تحديث الطلب</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p>
                                    <strong>العامل:</strong> {selectedRequest?.profiles.name}
                                  </p>
                                  <p>
                                    <strong>القسم:</strong> {selectedRequest?.profiles.department}
                                  </p>
                                  <p>
                                    <strong>النوع:</strong>{" "}
                                    {selectedRequest?.type === "warehouse" ? "مخزن" : "موارد بشرية"}
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
                                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                                      <SelectItem value="approved">موافق عليه</SelectItem>
                                      <SelectItem value="in_progress">قيد التحضير</SelectItem>
                                      <SelectItem value="delivered">تم التوصيل</SelectItem>
                                      <SelectItem value="rejected">مرفوض</SelectItem>
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

                                <Button onClick={handleUpdateRequest} disabled={loading} className="w-full">
                                  {loading ? "جاري التحديث..." : "تحديث الطلب"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredRequests.length === 0 && <p className="text-center text-gray-500 py-8">لا توجد طلبات</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
