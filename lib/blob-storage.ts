import { put, del, list } from "@vercel/blob"

export interface UploadedFile {
  url: string
  pathname: string
  size: number
  uploadedAt: string
}

export const uploadFile = async (file: File, folder = "general"): Promise<UploadedFile> => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `${folder}/${timestamp}-${file.name}`

    const blob = await put(filename, file, {
      access: "public",
    })

    return {
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw new Error("فشل في رفع الملف")
  }
}

export const deleteFile = async (pathname: string): Promise<void> => {
  try {
    await del(pathname)
  } catch (error) {
    console.error("Error deleting file:", error)
    throw new Error("فشل في حذف الملف")
  }
}

export const listFiles = async (prefix?: string) => {
  try {
    const { blobs } = await list({ prefix })
    return blobs
  } catch (error) {
    console.error("Error listing files:", error)
    throw new Error("فشل في جلب قائمة الملفات")
  }
}

// وظائف مساعدة للتحقق من نوع الملف
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith("image/")
}

export const isPDFFile = (file: File): boolean => {
  return file.type === "application/pdf"
}

export const isValidFileSize = (file: File, maxSizeMB = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || ""
}
