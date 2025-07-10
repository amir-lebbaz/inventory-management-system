// نظام تنظيف البيانات التلقائي - كل عامين
export const DATA_RETENTION_DAYS = 730 // الاحتفاظ بالبيانات لمدة عامين

export interface CleanupStats {
  deletedRequests: number
  deletedExpiringItems: number
  totalSpaceSaved: string
}

export const cleanupOldData = (): CleanupStats => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - DATA_RETENTION_DAYS)

  let deletedRequests = 0
  let deletedExpiringItems = 0

  // تنظيف الطلبات القديمة
  const allRequests = JSON.parse(localStorage.getItem("all_requests") || "[]")
  const filteredRequests = allRequests.filter((request: any) => {
    const requestDate = new Date(request.created_at)
    if (requestDate < cutoffDate && request.status === "delivered") {
      deletedRequests++
      return false
    }
    return true
  })
  localStorage.setItem("all_requests", JSON.stringify(filteredRequests))

  // تنظيف السلع منتهية الصلاحية القديمة
  const expiringItems = JSON.parse(localStorage.getItem("expiring_items") || "[]")
  const filteredExpiringItems = expiringItems.filter((item: any) => {
    const itemDate = new Date(item.created_at)
    const expiryDate = new Date(item.expiry_date)
    if (itemDate < cutoffDate || expiryDate < new Date()) {
      deletedExpiringItems++
      return false
    }
    return true
  })
  localStorage.setItem("expiring_items", JSON.stringify(filteredExpiringItems))

  // تنظيف طلبات المستخدمين
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("requests_")) {
      const userRequests = JSON.parse(localStorage.getItem(key) || "[]")
      const filteredUserRequests = userRequests.filter((request: any) => {
        const requestDate = new Date(request.created_at)
        return !(requestDate < cutoffDate && request.status === "delivered")
      })
      localStorage.setItem(key, JSON.stringify(filteredUserRequests))
    }
  })

  // حفظ آخر تنظيف
  localStorage.setItem("last_cleanup", new Date().toISOString())

  return {
    deletedRequests,
    deletedExpiringItems,
    totalSpaceSaved: `${((deletedRequests + deletedExpiringItems) * 0.5).toFixed(1)} KB`,
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
