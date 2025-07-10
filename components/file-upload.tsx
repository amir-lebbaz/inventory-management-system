"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, X, FileText, ImageIcon, Loader2, CheckCircle } from "lucide-react"
import { uploadFile, isValidFileSize, type UploadedFile } from "@/lib/blob-storage"

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void
  folder?: string
  acceptedTypes?: string
  maxSizeMB?: number
  multiple?: boolean
  className?: string
}

export default function FileUpload({
  onFileUploaded,
  folder = "general",
  acceptedTypes = "image/*,.pdf,.doc,.docx",
  maxSizeMB = 10,
  multiple = false,
  className = "",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setError("")
    setUploading(true)

    try {
      const fileArray = Array.from(files)

      // التحقق من صحة الملفات
      for (const file of fileArray) {
        if (!isValidFileSize(file, maxSizeMB)) {
          throw new Error(`حجم الملف ${file.name} كبير جداً. الحد الأقصى ${maxSizeMB}MB`)
        }
      }

      // رفع الملفات
      const uploadPromises = fileArray.map((file) => uploadFile(file, folder))
      const results = await Promise.all(uploadPromises)

      setUploadedFiles((prev) => [...prev, ...results])
      results.forEach((result) => onFileUploaded(result))
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء رفع الملف")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase()
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            ) : (
              <Upload className="h-6 w-6 text-gray-400" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              {uploading ? "جاري رفع الملفات..." : "اسحب الملفات هنا أو انقر للاختيار"}
            </p>
            <p className="text-sm text-gray-500 mt-1">الحد الأقصى: {maxSizeMB}MB • الأنواع المدعومة: صور، PDF، Word</p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mx-auto"
          >
            <Upload className="ml-2 h-4 w-4" />
            اختيار الملفات
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-medium mb-3 block">الملفات المرفوعة:</Label>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.pathname)}
                    <div>
                      <p className="text-sm font-medium text-green-800">{file.pathname.split("/").pop()}</p>
                      <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      تم الرفع
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
