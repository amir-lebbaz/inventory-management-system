"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Send, Bell, CheckCircle, Volume2, VolumeX } from "lucide-react"
import {
  sendMessage,
  getMessages,
  markMessageAsRead,
  getNotifications,
  markNotificationAsRead,
  getUnreadCount,
  type Message,
  type Notification,
} from "@/lib/communication"
import { audioNotifications } from "@/lib/audio-notifications"

interface CommunicationPanelProps {
  userRole: string
  userName: string
}

export default function CommunicationPanel({ userRole, userName }: CommunicationPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState({ messages: 0, notifications: 0 })
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(audioNotifications.isAudioEnabled())

  // نموذج الرسالة الجديدة
  const [newMessage, setNewMessage] = useState({
    to: "",
    subject: "",
    content: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  })

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000) // تحديث كل 5 ثوان
    return () => clearInterval(interval)
  }, [])

  const loadData = () => {
    const userMessages = getMessages(userName)
    const userNotifications = getNotifications(userName)
    const counts = getUnreadCount(userName)

    setMessages(userMessages)
    setNotifications(userNotifications)
    setUnreadCount(counts)

    // تشغيل الصوت للرسائل الجديدة
    if (audioEnabled && counts.messages > unreadCount.messages) {
      audioNotifications.playMessageSound()
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.to || !newMessage.subject || !newMessage.content) return

    const message = sendMessage({
      from: userName,
      to: newMessage.to,
      subject: newMessage.subject,
      content: newMessage.content,
      priority: newMessage.priority,
    })

    if (newMessage.priority === "urgent") {
      audioNotifications.playUrgentRequestSound()
    }

    setNewMessage({ to: "", subject: "", content: "", priority: "medium" })
    setShowNewMessageDialog(false)
    loadData()
  }

  const handleMarkMessageAsRead = (messageId: string) => {
    markMessageAsRead(messageId)
    loadData()
  }

  const handleMarkNotificationAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId)
    loadData()
  }

  const toggleAudio = () => {
    const newState = !audioEnabled
    setAudioEnabled(newState)
    audioNotifications.setEnabled(newState)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "🚨 عاجل"
      case "high":
        return "⚠️ مهم"
      case "medium":
        return "📋 عادي"
      case "low":
        return "📝 منخفض"
      default:
        return priority
    }
  }

  const getRecipientOptions = () => {
    const options = []
    if (userRole !== "hr") options.push({ value: "مدير الموارد البشرية", label: "👔 مدير الموارد البشرية" })
    if (userRole !== "warehouse") options.push({ value: "أمين المخزن", label: "📦 أمين المخزن" })
    if (userRole === "hr") {
      options.push({ value: "جميع العمال", label: "👥 جميع العمال" })
      options.push({ value: "أمين المخزن", label: "📦 أمين المخزن" })
    }
    return options
  }

  return (
    <div className="space-y-6">
      {/* شريط التحكم */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              مركز التواصل
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={toggleAudio} variant="ghost" size="sm" className="text-white hover:bg-white/20">
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Send className="ml-2 h-4 w-4" />
                    رسالة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إرسال رسالة جديدة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>المستقبل</Label>
                      <Select
                        value={newMessage.to}
                        onValueChange={(value) => setNewMessage({ ...newMessage, to: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المستقبل" />
                        </SelectTrigger>
                        <SelectContent>
                          {getRecipientOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>الأولوية</Label>
                      <Select
                        value={newMessage.priority}
                        onValueChange={(value: any) => setNewMessage({ ...newMessage, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">📝 منخفض</SelectItem>
                          <SelectItem value="medium">📋 عادي</SelectItem>
                          <SelectItem value="high">⚠️ مهم</SelectItem>
                          <SelectItem value="urgent">🚨 عاجل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>الموضوع</Label>
                      <Input
                        value={newMessage.subject}
                        onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                        placeholder="موضوع الرسالة"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المحتوى</Label>
                      <Textarea
                        value={newMessage.content}
                        onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                        placeholder="اكتب رسالتك هنا..."
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleSendMessage} className="w-full">
                      <Send className="ml-2 h-4 w-4" />
                      إرسال الرسالة
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">الرسائل</div>
                <div className="text-sm text-blue-700">
                  {unreadCount.messages} غير مقروءة من {messages.length}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Bell className="h-8 w-8 text-orange-600" />
              <div>
                <div className="font-medium text-orange-900">الإشعارات</div>
                <div className="text-sm text-orange-700">
                  {unreadCount.notifications} غير مقروءة من {notifications.length}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm border">
          <TabsTrigger value="messages" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
            الرسائل ({unreadCount.messages})
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            الإشعارات ({unreadCount.notifications})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                الرسائل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">لا توجد رسائل</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                        message.read ? "bg-white" : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">
                            {message.from === userName ? `إلى: ${message.to}` : `من: ${message.from}`}
                          </div>
                          <Badge className={getPriorityColor(message.priority)}>
                            {getPriorityText(message.priority)}
                          </Badge>
                          {!message.read && message.to === userName && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">جديد</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleDateString("ar-SA")}
                        </div>
                      </div>
                      <h4 className="font-medium text-gray-800 mb-2">{message.subject}</h4>
                      <p className="text-gray-600 text-sm mb-3">{message.content}</p>
                      {!message.read && message.to === userName && (
                        <Button
                          onClick={() => handleMarkMessageAsRead(message.id)}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          <CheckCircle className="ml-1 h-3 w-3" />
                          تم القراءة
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">لا توجد إشعارات</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                        notification.read ? "bg-white" : "bg-orange-50 border-orange-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">{notification.title}</div>
                          <Badge
                            className={
                              notification.type === "error"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : notification.type === "warning"
                                  ? "bg-orange-100 text-orange-800 border-orange-200"
                                  : notification.type === "success"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-blue-100 text-blue-800 border-blue-200"
                            }
                          >
                            {notification.type === "error"
                              ? "خطأ"
                              : notification.type === "warning"
                                ? "تحذير"
                                : notification.type === "success"
                                  ? "نجاح"
                                  : "معلومات"}
                          </Badge>
                          {!notification.read && (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">جديد</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString("ar-SA")}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{notification.message}</p>
                      {!notification.read && (
                        <Button
                          onClick={() => handleMarkNotificationAsRead(notification.id)}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          <CheckCircle className="ml-1 h-3 w-3" />
                          تم القراءة
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
