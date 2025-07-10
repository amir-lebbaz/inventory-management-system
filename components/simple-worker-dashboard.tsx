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
import { LogOut, Package, Users, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { getCurrentUser, logout, type User } from "@/lib/auth"

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

export default function SimpleWorkerDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [requestType, setRequestType] = useState("")
  const [itemName, setItemName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [urgent, setUrgent] = useState("no")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [requests, setRequests] = useState<Request[]>([])

  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.role !== "worker") {
      router.push("/")
      return
    }
    setUser(currentUser)
    loadRequests(currentUser.department)
  }, [router])

  const loadRequests = (department: string) => {
    // تحميل الطلبات من localStorage
    const savedRequests = localStorage.getItem(`requests_${department}`)
    if (savedRequests) {
      setRequests(JSON.parse(savedRequests))
    }
  }

  const saveRequest = (newRequest: Request) => {
    const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
    const userRequests = JSON.parse(localStorage.getItem(`requests_${user?.department}`) || "[]")

    allRequests.push(newRequest)
    userRequests.push(newRequest)

    localStorage.setItem("all_requests", JSON.stringify(allRequests))
    localStorage.setItem(`requests_${user?.department}`, JSON.stringify(userRequests))

    setRequests(userRequests)
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

      // إرسال الطلب كما هو بدون تحويل تلقائي
      if (requestType === "warehouse") {
        setMessage("تم إرسال الطلب إلى المخزن بنجاح")
      } else {
        setMessage("تم إرسال الطلب إلى الموارد البشرية بنجاح")
      }

      saveRequest(newRequest)

      // إعادة تعيين النموذج
      setRequestType("")
      setItemName("")
      setQuantity("")
      setUrgent("no")
      setNotes("")
    } catch (error) {
      setMessage("حدث خطأ أثناء إرسال الطلب")
    } finally {
      setLoading(false)
    }
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

  if (!user) {
    return <div>جاري التحميل...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">مرحباً، {user.name}</h1>
              <p className="text-gray-600">القسم: {user.department}</p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="new-request" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new-request">طلب جديد</TabsTrigger>
            <TabsTrigger value="my-requests">طلباتي</TabsTrigger>
          </TabsList>

          <TabsContent value="new-request">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  تسجيل طلب جديد
                </CardTitle>
              </CardHeader>
              <CardContent>
                {message && (
                  <Alert className="mb-4">
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>نوع الطلب</Label>
                    <Select value={requestType} onValueChange={setRequestType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الطلب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warehouse">طلب من المخزن</SelectItem>
                        <SelectItem value="hr">طلب من إدارة الموارد البشرية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {requestType && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="itemName">اسم السلعة</Label>
                        <Input
                          id="itemName"
                          value={itemName}
                          onChange={(e) => setItemName(e.target.value)}
                          placeholder="أدخل اسم السلعة"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantity">الكمية المطلوبة</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="أدخل الكمية (اختياري)"
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
                            <SelectItem value="yes">نعم</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">ملاحظات إضافية</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="أضف أي ملاحظات إضافية (اختياري)"
                          rows={3}
                        />
                      </div>

                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "جاري الإرسال..." : "إرسال الطلب"}
                      </Button>
                    </>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  طلباتي السابقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requests.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">لا توجد طلبات سابقة</p>
                  ) : (
                    requests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{request.item_name}</h3>
                            <p className="text-sm text-gray-600">
                              النوع: {request.type === "warehouse" ? "مخزن" : "موارد بشرية"}
                            </p>
                            {request.quantity && <p className="text-sm text-gray-600">الكمية: {request.quantity}</p>}
                          </div>
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
                            {request.urgent && <Badge variant="destructive">مستعجل</Badge>}
                          </div>
                        </div>

                        {request.notes && (
                          <div>
                            <p className="text-sm font-medium">الملاحظات:</p>
                            <p className="text-sm text-gray-600">{request.notes}</p>
                          </div>
                        )}

                        {request.response_notes && (
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm font-medium text-blue-900">رد الإدارة:</p>
                            <p className="text-sm text-blue-800">{request.response_notes}</p>
                          </div>
                        )}

                        <p className="text-xs text-gray-500">
                          تاريخ الطلب: {new Date(request.created_at).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
