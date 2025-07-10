// نظام التواصل بين الأقسام
export interface Message {
  id: string
  from: string
  to: string
  subject: string
  content: string
  priority: "low" | "medium" | "high" | "urgent"
  created_at: string
  read: boolean
  request_id?: string
}

export interface Notification {
  id: string
  user: string
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  created_at: string
  read: boolean
}

export const sendMessage = (message: Omit<Message, "id" | "created_at" | "read">) => {
  const messages = JSON.parse(localStorage.getItem("messages") || "[]")
  const newMessage: Message = {
    ...message,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    read: false,
  }

  messages.push(newMessage)
  localStorage.setItem("messages", JSON.stringify(messages))

  // إضافة إشعار للمستقبل
  addNotification(message.to, {
    title: `رسالة جديدة من ${message.from}`,
    message: message.subject,
    type: message.priority === "urgent" ? "error" : "info",
  })

  return newMessage
}

export const getMessages = (user: string): Message[] => {
  const messages = JSON.parse(localStorage.getItem("messages") || "[]")
  return messages
    .filter((msg: Message) => msg.to === user || msg.from === user)
    .sort((a: Message, b: Message) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export const markMessageAsRead = (messageId: string) => {
  const messages = JSON.parse(localStorage.getItem("messages") || "[]")
  const updatedMessages = messages.map((msg: Message) => (msg.id === messageId ? { ...msg, read: true } : msg))
  localStorage.setItem("messages", JSON.stringify(updatedMessages))
}

export const addNotification = (
  user: string,
  notification: Omit<Notification, "id" | "created_at" | "read" | "user">,
) => {
  const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    user,
    created_at: new Date().toISOString(),
    read: false,
  }

  notifications.push(newNotification)
  localStorage.setItem("notifications", JSON.stringify(notifications))

  return newNotification
}

export const getNotifications = (user: string): Notification[] => {
  const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
  return notifications
    .filter((notif: Notification) => notif.user === user)
    .sort((a: Notification, b: Notification) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export const markNotificationAsRead = (notificationId: string) => {
  const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
  const updatedNotifications = notifications.map((notif: Notification) =>
    notif.id === notificationId ? { ...notif, read: true } : notif,
  )
  localStorage.setItem("notifications", JSON.stringify(updatedNotifications))
}

export const getUnreadCount = (user: string): { messages: number; notifications: number } => {
  const messages = getMessages(user)
  const notifications = getNotifications(user)

  return {
    messages: messages.filter((msg) => !msg.read && msg.to === user).length,
    notifications: notifications.filter((notif) => !notif.read).length,
  }
}
