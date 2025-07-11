// نظام التواصل المحسن
export interface Message {
  id: string
  from: string
  to: string
  subject: string
  content: string
  priority: "low" | "medium" | "high" | "urgent"
  created_at: string
  read: boolean
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  created_at: string
  read: boolean
  user: string
}

// إضافة إشعارات خاصة للرسائل الجديدة
export const addMessageNotification = (message: Message) => {
  const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
  
  const notification: Notification = {
    id: Date.now().toString(),
    title: `رسالة جديدة من ${message.from}`,
    message: message.subject,
    type: message.priority === "urgent" ? "error" : message.priority === "high" ? "warning" : "info",
    created_at: new Date().toISOString(),
    read: false,
    user: message.to,
  }
  
  notifications.push(notification)
  localStorage.setItem("notifications", JSON.stringify(notifications))
  
  // إضافة إشعار للرسائل العاجلة
  if (message.priority === "urgent") {
    const urgentNotification: Notification = {
      id: (Date.now() + 1).toString(),
      title: "🚨 رسالة عاجلة!",
      message: `رسالة عاجلة من ${message.from}: ${message.subject}`,
      type: "error",
      created_at: new Date().toISOString(),
      read: false,
      user: message.to,
    }
    notifications.push(urgentNotification)
    localStorage.setItem("notifications", JSON.stringify(notifications))
  }
  
  return notification
}

export const sendMessage = (message: Omit<Message, "id" | "created_at" | "read">) => {
  const messages = JSON.parse(localStorage.getItem("messages") || "[]")
  
  // التحقق من إرسال رسالة لجميع الممرات
  if (message.to === "جميع الممرات") {
    const newMessages: Message[] = []
    
    // إرسال رسالة لكل ممر
    for (let i = 1; i <= 10; i++) {
      const individualMessage: Message = {
        ...message,
        id: (Date.now() + i).toString(),
        to: `ممر${i}`,
        created_at: new Date().toISOString(),
        read: false,
      }
      newMessages.push(individualMessage)
      addMessageNotification(individualMessage)
    }
    
    messages.push(...newMessages)
    localStorage.setItem("messages", JSON.stringify(messages))
    
    return newMessages[0] // إرجاع أول رسالة كمرجع
  }
  
  const newMessage: Message = {
    ...message,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    read: false,
  }

  messages.push(newMessage)
  localStorage.setItem("messages", JSON.stringify(messages))

  // إضافة إشعار للمستقبل
  addMessageNotification(newMessage)

  return newMessage
}

export const getMessages = (userName: string): Message[] => {
  const messages = JSON.parse(localStorage.getItem("messages") || "[]")
  return messages.filter((msg: Message) => msg.to === userName || msg.from === userName)
}

export const markMessageAsRead = (messageId: string) => {
  const messages = JSON.parse(localStorage.getItem("messages") || "[]")
  const updatedMessages = messages.map((msg: Message) =>
    msg.id === messageId ? { ...msg, read: true } : msg
  )
  localStorage.setItem("messages", JSON.stringify(updatedMessages))
}

export const getNotifications = (userName: string): Notification[] => {
  const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
  return notifications.filter((notif: Notification) => notif.user === userName)
}

export const markNotificationAsRead = (notificationId: string) => {
  const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
  const updatedNotifications = notifications.map((notif: Notification) =>
    notif.id === notificationId ? { ...notif, read: true } : notif
  )
  localStorage.setItem("notifications", JSON.stringify(updatedNotifications))
}

export const getUnreadCount = (userName: string) => {
  const messages = getMessages(userName)
  const notifications = getNotifications(userName)
  
  const unreadMessages = messages.filter((msg: Message) => !msg.read && msg.to === userName).length
  const unreadNotifications = notifications.filter((notif: Notification) => !notif.read).length

  return {
    messages: unreadMessages,
    notifications: unreadNotifications,
  }
}

// إضافة إشعارات نظام
export const addSystemNotification = (userName: string, title: string, message: string, type: "info" | "success" | "warning" | "error" = "info") => {
  const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
  
  const notification: Notification = {
    id: Date.now().toString(),
    title,
    message,
    type,
    created_at: new Date().toISOString(),
    read: false,
    user: userName,
  }
  
  notifications.push(notification)
  localStorage.setItem("notifications", JSON.stringify(notifications))
  
  return notification
}

// إضافة إشعارات للطلبات
export const addRequestNotification = (userName: string, requestType: string, status: string) => {
  let title = ""
  let message = ""
  let type: "info" | "success" | "warning" | "error" = "info"
  
  switch (status) {
    case "approved":
      title = "✅ تم قبول طلبك"
      message = `تم قبول طلبك من ${requestType} بنجاح`
      type = "success"
      break
    case "rejected":
      title = "❌ تم رفض طلبك"
      message = `تم رفض طلبك من ${requestType}`
      type = "error"
      break
    case "in_progress":
      title = "⏳ جاري معالجة طلبك"
      message = `جاري معالجة طلبك من ${requestType}`
      type = "warning"
      break
    case "delivered":
      title = "🎉 تم توصيل طلبك"
      message = `تم توصيل طلبك من ${requestType} بنجاح`
      type = "success"
      break
    default:
      title = "📋 تحديث طلبك"
      message = `تم تحديث حالة طلبك من ${requestType}`
      type = "info"
  }
  
  return addSystemNotification(userName, title, message, type)
}

// إضافة إشعارات للمخزون
export const addInventoryNotification = (userName: string, itemName: string, action: "added" | "updated" | "low_stock") => {
  let title = ""
  let message = ""
  let type: "info" | "success" | "warning" | "error" = "info"
  
  switch (action) {
    case "added":
      title = "📦 تم إضافة سلعة جديدة"
      message = `تم إضافة ${itemName} إلى المخزون`
      type = "success"
      break
    case "updated":
      title = "✏️ تم تحديث المخزون"
      message = `تم تحديث كمية ${itemName} في المخزون`
      type = "info"
      break
    case "low_stock":
      title = "⚠️ تنبيه: مخزون منخفض"
      message = `المخزون من ${itemName} منخفض ويحتاج إلى إعادة طلب`
      type = "warning"
      break
  }
  
  return addSystemNotification(userName, title, message, type)
}

// إضافة إشعارات للأنشطة المهمة
export const addActivityNotification = (userName: string, activity: string, details: string) => {
  let title = ""
  let type: "info" | "success" | "warning" | "error" = "info"
  
  switch (activity) {
    case "login":
      title = "🔐 تم تسجيل الدخول"
      type = "success"
      break
    case "logout":
      title = "👋 تم تسجيل الخروج"
      type = "info"
      break
    case "request_created":
      title = "📝 تم إنشاء طلب جديد"
      type = "success"
      break
    case "request_updated":
      title = "✏️ تم تحديث الطلب"
      type = "info"
      break
    case "inventory_low":
      title = "⚠️ تنبيه: مخزون منخفض"
      type = "warning"
      break
    case "item_expiring":
      title = "⏰ تنبيه: سلعة قريبة الانتهاء"
      type = "warning"
      break
    case "backup_created":
      title = "💾 تم إنشاء نسخة احتياطية"
      type = "success"
      break
    case "data_cleaned":
      title = "🧹 تم تنظيف البيانات القديمة"
      type = "info"
      break
    default:
      title = "📢 إشعار جديد"
      type = "info"
  }
  
  return addSystemNotification(userName, title, details, type)
}

// إضافة إشعارات للتقارير
export const addReportNotification = (userName: string, reportType: string, format: "PDF" | "Excel") => {
  const title = `📊 تم تصدير التقرير`
  const message = `تم تصدير تقرير ${reportType} بصيغة ${format} بنجاح`
  
  return addSystemNotification(userName, title, message, "success")
}

// إضافة إشعارات للتواصل
export const addCommunicationNotification = (userName: string, messageType: "received" | "sent", sender: string) => {
  let title = ""
  let message = ""
  
  if (messageType === "received") {
    title = "📨 رسالة جديدة"
    message = `استلمت رسالة جديدة من ${sender}`
  } else {
    title = "📤 تم إرسال الرسالة"
    message = `تم إرسال رسالتك إلى ${sender} بنجاح`
  }
  
  return addSystemNotification(userName, title, message, "info")
}
