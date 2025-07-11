"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Send,
  MessageSquare,
  Bell,
  Mail,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Archive,
  Filter,
  Search,
  Plus,
  Download,
  RefreshCw,
} from "lucide-react"
import { sendMessage, getMessages, markMessageAsRead, getNotifications, markNotificationAsRead, getUnreadCount, addCommunicationNotification } from "@/lib/communication"
import { audioNotifications } from "@/lib/audio-notifications"

interface CommunicationPanelProps {
  userRole: string
  userName: string
}

export default function CommunicationPanel({ userRole, userName }: CommunicationPanelProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState({
    to: "",
    subject: "",
    content: "",
    priority: "medium",
  })
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [filterPriority, setFilterPriority] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadMessages()
    loadNotifications()
    
    // تحديث كل 30 ثانية
    const interval = setInterval(() => {
      loadMessages()
      loadNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [userName])

  const loadMessages = () => {
    const userMessages = getMessages(userName)
    setMessages(userMessages)
  }

  const loadNotifications = () => {
    const userNotifications = getNotifications(userName)
    setNotifications(userNotifications)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      if (!newMessage.to || !newMessage.subject || !newMessage.content) {
        setMessage("يرجى ملء جميع الحقول المطلوبة")
        return
      }

      const sentMessage = sendMessage({
      from: userName,
      to: newMessage.to,
      subject: newMessage.subject,
      content: newMessage.content,
        priority: newMessage.priority as any,
      })

      // إضافة إشعار إرسال الرسالة
      addCommunicationNotification(userName, "sent", newMessage.to)

      // إعادة تعيين النموذج
      setNewMessage({
        to: "",
        subject: "",
        content: "",
        priority: "medium",
      })

      setMessage("تم إرسال الرسالة بنجاح! 🎉")
      
      // تشغيل صوت النجاح
      audioNotifications.playSuccessSound()
      
      // إعادة تحميل الرسائل
      loadMessages()
    } catch (error) {
      setMessage("حدث خطأ أثناء إرسال الرسالة")
      console.error("Error sending message:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewMessage = (message: any) => {
    setSelectedMessage(message)
    setShowMessageDialog(true)
    
    // تحديد الرسالة كمقروءة
    if (!message.read && message.to === userName) {
      markMessageAsRead(message.id)
      loadMessages()
    }
  }

  const handleMarkNotificationAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId)
    loadNotifications()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "عاجل"
      case "high":
        return "مهم"
      case "medium":
        return "عادي"
      case "low":
        return "منخفض"
      default:
        return "غير محدد"
    }
  }

  const getStatusIcon = (read: boolean) => {
    return read ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-yellow-500" />
  }

  const filteredMessages = messages.filter((msg) => {
    const matchesPriority = filterPriority === "all" || msg.priority === filterPriority
    const matchesSearch = searchTerm === "" || 
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.to.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesPriority && matchesSearch
  })

  const unreadCount = getUnreadCount(userName)

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        setMessage("تم نسخ النص إلى الحافظة")
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
          setMessage("تم نسخ النص إلى الحافظة")
        } catch (err) {
          setMessage("فشل في نسخ النص")
        }
        document.body.removeChild(textArea)
      }
    } catch (error) {
      setMessage("فشل في نسخ النص")
      console.error("Copy error:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">الرسائل الجديدة</p>
                <p className="text-2xl font-bold text-blue-800">{unreadCount.messages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600">الإشعارات الجديدة</p>
                <p className="text-2xl font-bold text-green-800">{unreadCount.notifications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600">إجمالي الرسائل</p>
                <p className="text-2xl font-bold text-purple-800">{messages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="compose" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            إرسال رسالة
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            الرسائل ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            الإشعارات ({notifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                إرسال رسالة جديدة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-4">
                {message && (
                  <Alert variant={message.includes("نجاح") ? "default" : "destructive"}>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <label className="text-sm font-medium">إلى:</label>
                    <Select value={newMessage.to} onValueChange={(value) => setNewMessage({ ...newMessage, to: value })}>
                        <SelectTrigger>
                        <SelectValue placeholder="اختر المستلم" />
                        </SelectTrigger>
                        <SelectContent>
                        {userRole === "warehouse" && (
                          <>
                            <SelectItem value="جميع الممرات">جميع الممرات</SelectItem>
                            {Array.from({ length: 10 }, (_, i) => (
                              <SelectItem key={`warehouse-mمر${i + 1}`} value={`ممر${i + 1}`}>
                                ممر{i + 1}
                              </SelectItem>
                            ))}
                            <SelectItem value="hr">الموارد البشرية</SelectItem>
                          </>
                        )}
                        {userRole === "hr" && (
                          <>
                            <SelectItem value="جميع الممرات">جميع الممرات</SelectItem>
                            {Array.from({ length: 10 }, (_, i) => (
                              <SelectItem key={`hr-mمر${i + 1}`} value={`ممر${i + 1}`}>
                                ممر{i + 1}
                            </SelectItem>
                          ))}
                            <SelectItem value="المخزن">المخزن</SelectItem>
                          </>
                        )}
                        {userRole === "worker" && (
                          <>
                            <SelectItem value="المخزن">المخزن</SelectItem>
                            <SelectItem value="hr">الموارد البشرية</SelectItem>
                          </>
                        )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                    <label className="text-sm font-medium">الأولوية:</label>
                    <Select value={newMessage.priority} onValueChange={(value) => setNewMessage({ ...newMessage, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="low">منخفضة</SelectItem>
                        <SelectItem value="medium">عادية</SelectItem>
                        <SelectItem value="high">مهمة</SelectItem>
                        <SelectItem value="urgent">عاجلة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                </div>

                    <div className="space-y-2">
                  <label className="text-sm font-medium">الموضوع:</label>
                      <Input
                        value={newMessage.subject}
                        onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                    placeholder="أدخل موضوع الرسالة"
                    required
                      />
                    </div>

                    <div className="space-y-2">
                  <label className="text-sm font-medium">المحتوى:</label>
                      <Textarea
                        value={newMessage.content}
                        onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                    placeholder="أدخل محتوى الرسالة"
                        rows={4}
                    required
                      />
                    </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="ml-2 h-4 w-4" />
                      إرسال الرسالة
                    </>
                  )}
                    </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  الرسائل
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="البحث في الرسائل..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48"
                  />
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأولويات</SelectItem>
                      <SelectItem value="urgent">عاجل</SelectItem>
                      <SelectItem value="high">مهم</SelectItem>
                      <SelectItem value="medium">عادي</SelectItem>
                      <SelectItem value="low">منخفض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد رسائل</p>
                  </div>
                ) : (
                <div className="space-y-3">
                  {filteredMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                        msg.read ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"
                      }`}
                      onClick={() => handleViewMessage(msg)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{msg.subject}</h3>
                            <Badge className={getPriorityColor(msg.priority)}>
                              {getPriorityText(msg.priority)}
                            </Badge>
                            {!msg.read && msg.to === userName && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                جديد
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{msg.content.substring(0, 100)}...</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>من: {msg.from}</span>
                            <span>إلى: {msg.to}</span>
                            {getStatusIcon(msg.read)}
                        </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent>
                {notifications.length === 0 ? (
                <div className="text-center py-8">
                    <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد إشعارات</p>
                  </div>
                ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border-2 ${
                        notification.read ? "bg-gray-50 border-gray-200" : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                            {!notification.read && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                جديد
                          </Badge>
                          )}
                        </div>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                        </div>
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="outline"
                            onClick={() => handleMarkNotificationAsRead(notification.id)}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نافذة عرض الرسالة */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الرسالة</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p><strong>من:</strong> {selectedMessage.from}</p>
                  <p><strong>إلى:</strong> {selectedMessage.to}</p>
                  <p><strong>الأولوية:</strong> 
                    <Badge className={`ml-2 ${getPriorityColor(selectedMessage.priority)}`}>
                      {getPriorityText(selectedMessage.priority)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p><strong>الحالة:</strong> {selectedMessage.read ? "مقروءة" : "غير مقروءة"}</p>
                  <p><strong>التاريخ:</strong> {new Date(selectedMessage.created_at).toLocaleString("ar-SA")}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">الموضوع:</h3>
                <p className="text-gray-700">{selectedMessage.subject}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">المحتوى:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
