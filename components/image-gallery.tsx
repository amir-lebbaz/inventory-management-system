"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, Trash2, Calendar } from "lucide-react"
import { deleteFile, type UploadedFile } from "@/lib/blob-storage"

interface ImageGalleryProps {
  files: UploadedFile[]
  onFileDeleted?: (pathname: string) => void
  showDeleteButton?: boolean
  className?: string
}

export default function ImageGallery({
  files,
  onFileDeleted,
  showDeleteButton = false,
  className = "",
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<UploadedFile | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (file: UploadedFile) => {
    if (!confirm("هل أنت متأكد من حذف هذا الملف؟")) return

    setDeleting(file.pathname)
    try {
      await deleteFile(file.pathname)
      onFileDeleted?.(file.pathname)
    } catch (error) {
      console.error("Error deleting file:", error)
      alert("فشل في حذف الملف")
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = (file: UploadedFile) => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.pathname.split("/").pop() || "file"
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isImage = (file: UploadedFile) => {
    const extension = file.pathname.split(".").pop()?.toLowerCase()
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")
  }

  if (files.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>لا توجد ملفات مرفوعة</p>
      </div>
    )
  }

  return (
    <>
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {files.map((file, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              {isImage(file) ? (
                <div className="relative">
                  <img
                    src={file.url || "/placeholder.svg"}
                    alt={file.pathname.split("/").pop()}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                    <Button variant="secondary" size="sm" onClick={() => setSelectedImage(file)} className="mr-2">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold text-lg">
                        {file.pathname.split(".").pop()?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{file.pathname.split("/").pop()}</p>
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium truncate">{file.pathname.split("/").pop()}</h3>
                  <Badge variant="outline" className="text-xs">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>

                <div className="flex items-center text-xs text-gray-500 mb-3">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(file.uploadedAt).toLocaleDateString("ar-SA")}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(file)} className="flex-1">
                    <Download className="h-3 w-3 mr-1" />
                    تحميل
                  </Button>

                  {showDeleteButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(file)}
                      disabled={deleting === file.pathname}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      {deleting === file.pathname ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* معاينة الصورة */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.pathname.split("/").pop()}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <img
                src={selectedImage.url || "/placeholder.svg"}
                alt={selectedImage.pathname.split("/").pop()}
                className="w-full max-h-96 object-contain rounded-lg"
              />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>الحجم: {(selectedImage.size / 1024 / 1024).toFixed(2)} MB</span>
                <span>تاريخ الرفع: {new Date(selectedImage.uploadedAt).toLocaleDateString("ar-SA")}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
