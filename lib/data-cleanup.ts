// نظام تنظيف البيانات التلقائي - كل عامين
export const DATA_RETENTION_DAYS = 730 // الاحتفاظ بالبيانات لمدة عامين

import { addActivityNotification } from "./communication"

export interface CleanupStats {
  deletedRequests: number
  deletedExpiringItems: number
  totalSpaceSaved: string
}

export const cleanupOldData = () => {
  try {
    const currentDate = new Date()
    const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // تنظيف الطلبات القديمة (أكثر من 30 يوم)
    const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
    const filteredRequests = allRequests.filter((request: any) => {
      const requestDate = new Date(request.created_at)
      return requestDate > thirtyDaysAgo
    })

    if (allRequests.length !== filteredRequests.length) {
      localStorage.setItem("all_requests", JSON.stringify(filteredRequests))
      console.log(`تم حذف ${allRequests.length - filteredRequests.length} طلب قديم`)
    }

    // تنظيف الإشعارات القديمة (أكثر من 7 أيام)
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
    const sevenDaysAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    const filteredNotifications = notifications.filter((notification: any) => {
      const notificationDate = new Date(notification.created_at)
      return notificationDate > sevenDaysAgo
    })

    if (notifications.length !== filteredNotifications.length) {
      localStorage.setItem("notifications", JSON.stringify(filteredNotifications))
      console.log(`تم حذف ${notifications.length - filteredNotifications.length} إشعار قديم`)
    }

    // تنظيف الرسائل القديمة (أكثر من 14 يوم)
    const messages = JSON.parse(localStorage.getItem("messages") || "[]")
    const fourteenDaysAgo = new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000)
    const filteredMessages = messages.filter((message: any) => {
      const messageDate = new Date(message.created_at)
      return messageDate > fourteenDaysAgo
    })

    if (messages.length !== filteredMessages.length) {
      localStorage.setItem("messages", JSON.stringify(filteredMessages))
      console.log(`تم حذف ${messages.length - filteredMessages.length} رسالة قديمة`)
    }

    // إضافة إشعار
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    if (currentUser.username) {
      const deletedCount = (allRequests.length - filteredRequests.length) + 
                          (notifications.length - filteredNotifications.length) + 
                          (messages.length - filteredMessages.length)
      
      if (deletedCount > 0) {
        addActivityNotification(currentUser.username, "data_cleaned", `تم تنظيف ${deletedCount} عنصر قديم من النظام`)
      }
    }

    console.log("تم تنظيف البيانات القديمة بنجاح")
  } catch (error) {
    console.error("خطأ في تنظيف البيانات:", error)
  }
}

export const shouldRunCleanup = (): boolean => {
  const lastCleanup = localStorage.getItem("last_cleanup")
  if (!lastCleanup) return true

  const lastCleanupDate = new Date(lastCleanup)
  const daysSinceCleanup = Math.floor((Date.now() - lastCleanupDate.getTime()) / (1000 * 60 * 60 * 24))

  return daysSinceCleanup >= 30 // تشغيل التنظيف كل شهر
}

export const getDataStats = () => {
  const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
  const expiringItems = JSON.parse(localStorage.getItem("expiring_items") || "[]")
  const inventoryItems = JSON.parse(localStorage.getItem("warehouse_inventory") || "[]")

  const totalItems = allRequests.length + expiringItems.length + inventoryItems.length
  const estimatedSize = totalItems * 0.5 // تقدير تقريبي بالكيلوبايت

  const oldRequests = allRequests.filter((req: any) => {
    const requestDate = new Date(req.created_at)
    const daysDiff = Math.floor((Date.now() - requestDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff > DATA_RETENTION_DAYS && req.status === "delivered"
  }).length

  return {
    totalRequests: allRequests.length,
    totalExpiringItems: expiringItems.length,
    totalInventoryItems: inventoryItems.length,
    estimatedSizeKB: estimatedSize.toFixed(1),
    oldRequestsCount: oldRequests,
    lastCleanup: localStorage.getItem("last_cleanup") || "لم يتم التنظيف بعد",
  }
}
