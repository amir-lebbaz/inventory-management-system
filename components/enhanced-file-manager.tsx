"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Filter, Download, Trash2, FolderOpen, FileText, ImageIcon, Calendar, HardDrive } from "lucide-react"
import { listFiles, deleteFile, type UploadedFile } from "@/lib/blob-storage"
import ImageGallery from "./image-gallery"
import FileUpload from "./file-upload"

interface FileStats {
  totalFiles: number
  totalSize: number
  imageFiles: number
  documentFiles: number
  requestFiles: number
  inventoryFiles: number
}

export default function EnhancedFileManager() {
  const [files, setFiles] = useState<any[]>([])
  const [filteredFiles, setFilteredFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [stats, setStats] = useState<FileStats>({
    totalFiles: 0,
    totalSize: 0,
    imageFiles: 0,
    documentFiles: 0,
    requestFiles: 0,
    inventoryFiles: 0,
  })
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [])

  useEffect(() => {
    filterFiles()
    calculateStats()
  }, [files, searchTerm, filterType])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const fileList = await listFiles()
      setFiles(fileList)
    } catch (error) {
      console.error("Error loading files:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterFiles = () => {
    let filtered = files

    if (searchTerm) {
      filtered = filtered.filter((file) => file.pathname.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (filterType !== "all") {
      filtered = filtered.filter((file) => {
        const extension = file.pathname.split(".").pop()?.toLowerCase()
        switch (filterType) {
          case "images":
            return ["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")
          case "documents":
            return ["pdf", "doc", "docx", "txt"].includes(extension || "")
          case "requests":
            return file.pathname.includes("requests/")
          case "inventory":
            return file.pathname.includes("inventory/")
          default:
            return true
        }
      })
    }

    setFilteredFiles(filtered)
  }

  const calculateStats = () => {
    const totalFiles = files.length
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)

    const imageFiles = files.filter((file) => {
      const extension = file.pathname.split(".").pop()?.toLowerCase()
      return ["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")
    }).length

    const documentFiles = files.filter((file) => {
      const extension = file.pathname.split(".").pop()?.toLowerCase()
      return ["pdf", "doc", "docx", "txt"].includes(extension || "")
    }).length

    const requestFiles = files.filter((file) => file.pathname.includes("requests/")).length
    const inventoryFiles = files.filter((file) => file.pathname.includes("inventory/")).length

    setStats({
      totalFiles,
      totalSize,
      imageFiles,
      documentFiles,
      requestFiles,
      inventoryFiles,
    })
  }

  const handleDeleteFile = async (pathname: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الملف؟")) return

    try {
      await deleteFile(pathname)
      await loadFiles()
    } catch (error) {
      console.error("Error deleting file:", error)
      alert("فشل في حذف الملف")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (pathname: string) => {
    const extension = pathname.split(".").pop()?.toLowerCase()
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />
    }
    return <FileText className="h-4 w-4 text-gray-500" />
  }

  const convertToUploadedFile = (file: any): UploadedFile => ({
    url: file.url,
    pathname: file.pathname,
    size: file.size,
    uploadedAt: file.uploadedAt || new Date().toISOString(),
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات الملفات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">إجمالي الملفات</p>
                <p className="text-2xl font-bold">{stats.totalFiles}</p>
              </div>
              <HardDrive className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">الحجم الإجمالي</p>
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">الصور</p>
                <p className="text-2xl font-bold">{stats.imageFiles}</p>
              </div>
              <ImageIcon className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">المستندات</p>
                <p className="text-2xl font-bold">{stats.documentFiles}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات البحث والفلترة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>إدارة الملفات</span>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600">رفع ملفات جديدة</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>رفع ملفات جديدة</DialogTitle>
                </DialogHeader>
                <FileUpload
                  onFileUploaded={() => {
                    loadFiles()
                    setShowUploadDialog(false)
                  }}
                  folder="general"
                  multiple={true}
                />
              </DialogContent>
            </Dialog>
          </CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="البحث في الملفات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">جميع الملفات</option>
                <option value="images">الصور</option>
                <option value="documents">المستندات</option>
                <option value="requests">ملفات الطلبات</option>
                <option value="inventory">ملفات المخزون</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="grid" className="space-y-4">
            <TabsList>
              <TabsTrigger value="grid">عرض الشبكة</TabsTrigger>
              <TabsTrigger value="list">عرض القائمة</TabsTrigger>
            </TabsList>

            <TabsContent value="grid">
              <ImageGallery
                files={filteredFiles.map(convertToUploadedFile)}
                onFileDeleted={loadFiles}
                showDeleteButton={true}
              />
            </TabsContent>

            <TabsContent value="list">
              <div className="space-y-2">
                {filteredFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.pathname)}
                      <div>
                        <p className="font-medium">{file.pathname.split("/").pop()}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(file.uploadedAt || Date.now()).toLocaleDateString("ar-SA")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {file.pathname.includes("requests/")
                          ? "طلب"
                          : file.pathname.includes("inventory/")
                            ? "مخزون"
                            : "عام"}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => window.open(file.url, "_blank")}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFile(file.pathname)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {filteredFiles.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد ملفات</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
