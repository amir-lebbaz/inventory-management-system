"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LogOut, Package, Clock, CheckCircle, XCircle, AlertCircle, Filter } from "lucide-react"

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

export default function WarehouseDashboard() {
  const [requests, setRequests] = useState<Request[]>([])
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([])
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [responseNotes, setResponseNotes] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDepartment, setFilterDepartment] = useState("all")
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    filterRequests()
  }, [requests, filterStatus, filterDepartment])

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("requests")
      .select(`
        *,
        profiles (name, department)
      `)
      .eq("type", "warehouse")
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

    setFilteredRequests(filtered)
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
              <h1 className="text-2xl font-bold text-gray-900">لوحة إدارة المخزن</h1>
              <p className="text-gray-600">إدارة طلبات العمال</p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              طلبات المخزن
            </CardTitle>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Label>فلترة حسب الحالة:</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
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
                <Label>فلترة حسب القسم:</Label>
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
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم العامل</TableHead>
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
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.profiles.name}</TableCell>
                    <TableCell>{request.profiles.department}</TableCell>
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
      </main>
    </div>
  )
}
