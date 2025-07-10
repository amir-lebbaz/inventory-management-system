"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, Trash2, RefreshCw, AlertTriangle, CheckCircle, HardDrive, Calendar } from "lucide-react"
import {
  cleanupOldData,
  shouldRunCleanup,
  getDataStats,
  DATA_RETENTION_DAYS,
  type CleanupStats,
} from "@/lib/data-cleanup"

export default function DataManagement() {
  const [dataStats, setDataStats] = useState<any>(null)
  const [cleanupStats, setCleanupStats] = useState<CleanupStats | null>(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [showCleanupAlert, setShowCleanupAlert] = useState(false)

  useEffect(() => {
    loadDataStats()
    setShowCleanupAlert(shouldRunCleanup())
  }, [])

  const loadDataStats = () => {
    const stats = getDataStats()
    setDataStats(stats)
  }

  const handleCleanup = async () => {
    setIsCleaningUp(true)

    // محاكاة عملية التنظيف
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const stats = cleanupOldData()
    setCleanupStats(stats)
    setIsCleaningUp(false)
    setShowCleanupAlert(false)
    loadDataStats()
  }

  const formatDate = (dateString: string) => {
    if (dateString === "لم يتم التنظيف بعد") return dateString
    return new Date(dateString).toLocaleDateString("ar-SA")
  }

  return (
    <div className="space-y-6">
      {/* تنبيه التنظيف */}
      {showCleanupAlert && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span>يُنصح بتشغيل عملية تنظيف البيانات لتوفير مساحة التخزين</span>
              <Button
                onClick={handleCleanup}
                disabled={isCleaningUp}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isCleaningUp ? "جاري التنظيف..." : "تنظيف الآن"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* نتائج التنظيف */}
      {cleanupStats && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-medium">تم تنظيف البيانات بنجاح!</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>حُذف {cleanupStats.deletedRequests} طلب قديم</div>
                <div>حُذف {cleanupStats.deletedExpiringItems} عنصر منتهي الصلاحية</div>
                <div>تم توفير {cleanupStats.totalSpaceSaved} من المساحة</div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* إحصائيات البيانات */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              إحصائيات البيانات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {dataStats && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-800 font-medium">إجمالي الطلبات</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">{dataStats.totalRequests}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-orange-800 font-medium">السلع منتهية الصلاحية</span>
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                    {dataStats.totalExpiringItems}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-800 font-medium">سلع المخزون</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {dataStats.totalInventoryItems}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* معلومات التخزين */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              معلومات التخزين
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {dataStats && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">الحجم المقدر</span>
                  <Badge variant="outline">{dataStats.estimatedSizeKB} KB</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-red-800 font-medium">طلبات قديمة</span>
                  <Badge className="bg-red-100 text-red-800 border-red-200">{dataStats.oldRequestsCount}</Badge>
                </div>
                <div className="text-center pt-4">
                  <Button
                    onClick={handleCleanup}
                    disabled={isCleaningUp}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                  >
                    {isCleaningUp ? (
                      <>
                        <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                        جاري التنظيف...
                      </>
                    ) : (
                      <>
                        <Trash2 className="ml-2 h-4 w-4" />
                        تنظيف البيانات القديمة
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* إعدادات التنظيف */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              إعدادات التنظيف
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-purple-800 font-medium mb-1">فترة الاحتفاظ</div>
                <div className="text-purple-600 text-sm">{DATA_RETENTION_DAYS} يوم</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-blue-800 font-medium mb-1">آخر تنظيف</div>
                <div className="text-blue-600 text-sm">{dataStats && formatDate(dataStats.lastCleanup)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-700 text-sm">
                  يتم حذف الطلبات المكتملة والسلع منتهية الصلاحية تلقائياً بعد {DATA_RETENTION_DAYS} يوم
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
