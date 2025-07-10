// نظام النسخ الاحتياطي
export interface BackupData {
  timestamp: string
  version: string
  data: {
    requests: any[]
    inventory: any[]
    expiringItems: any[]
    users: any[]
    messages: any[]
    notifications: any[]
  }
}

export const createBackup = (): BackupData => {
  const backup: BackupData = {
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    data: {
      requests: JSON.parse(localStorage.getItem("all_requests") || "[]"),
      inventory: JSON.parse(localStorage.getItem("warehouse_inventory") || "[]"),
      expiringItems: JSON.parse(localStorage.getItem("expiring_items") || "[]"),
      users: JSON.parse(localStorage.getItem("users") || "[]"),
      messages: JSON.parse(localStorage.getItem("messages") || "[]"),
      notifications: JSON.parse(localStorage.getItem("notifications") || "[]"),
    },
  }

  // حفظ النسخة الاحتياطية محلياً
  const backups = JSON.parse(localStorage.getItem("backups") || "[]")
  backups.push(backup)

  // الاحتفاظ بآخر 10 نسخ احتياطية فقط
  if (backups.length > 10) {
    backups.splice(0, backups.length - 10)
  }

  localStorage.setItem("backups", JSON.stringify(backups))
  localStorage.setItem("last_backup", new Date().toISOString())

  return backup
}

export const downloadBackup = (backup: BackupData) => {
  const dataStr = JSON.stringify(backup, null, 2)
  const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

  const exportFileDefaultName = `backup-${backup.timestamp.split("T")[0]}.json`

  const linkElement = document.createElement("a")
  linkElement.setAttribute("href", dataUri)
  linkElement.setAttribute("download", exportFileDefaultName)
  linkElement.click()
}

export const restoreBackup = (backup: BackupData): boolean => {
  try {
    localStorage.setItem("all_requests", JSON.stringify(backup.data.requests))
    localStorage.setItem("warehouse_inventory", JSON.stringify(backup.data.inventory))
    localStorage.setItem("expiring_items", JSON.stringify(backup.data.expiringItems))
    localStorage.setItem("users", JSON.stringify(backup.data.users))
    localStorage.setItem("messages", JSON.stringify(backup.data.messages))
    localStorage.setItem("notifications", JSON.stringify(backup.data.notifications))

    return true
  } catch (error) {
    console.error("Error restoring backup:", error)
    return false
  }
}

export const getBackups = (): BackupData[] => {
  return JSON.parse(localStorage.getItem("backups") || "[]")
}

export const shouldCreateBackup = (): boolean => {
  const lastBackup = localStorage.getItem("last_backup")
  if (!lastBackup) return true

  const lastBackupDate = new Date(lastBackup)
  const daysSinceBackup = Math.floor((Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24))

  return daysSinceBackup >= 7 // إنشاء نسخة احتياطية كل أسبوع
}
