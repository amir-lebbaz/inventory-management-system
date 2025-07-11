// نظام تصدير PDF
import jsPDF from "jspdf"
import "jspdf-autotable"
import { addReportNotification } from "./communication"

export interface ExportData {
  title: string
  data: any[]
  columns: string[]
  fileName?: string
}

export const exportToPDF = (exportData: ExportData) => {
  try {
    const doc = new jsPDF()

    // إعداد الخط
    doc.setFont("helvetica")
    doc.setFontSize(16)

    // العنوان
    doc.text(exportData.title, 20, 20)
    doc.setFontSize(10)
    doc.text(`تاريخ التصدير: ${new Date().toLocaleDateString("ar-SA")}`, 20, 30)

    // تحضير بيانات الجدول
    const tableData = exportData.data.map((item) => 
      exportData.columns.map((col) => {
        const value = item[col]
        return value !== undefined && value !== null ? String(value) : "-"
      })
    )

    // إنشاء الجدول
    ;(doc as any).autoTable({
      head: [exportData.columns],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        font: "helvetica",
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontSize: 9,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 40, right: 20, bottom: 20, left: 20 },
    })

    // حفظ الملف
    const fileName = exportData.fileName || `${exportData.title}-${new Date().toISOString().split("T")[0]}.pdf`
    doc.save(fileName)
    
    console.log("تم تصدير PDF بنجاح:", fileName)
    
    // إضافة إشعار
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    if (currentUser.username) {
      addReportNotification(currentUser.username, exportData.title, "PDF")
    }
  } catch (error) {
    console.error("خطأ في تصدير PDF:", error)
    alert("حدث خطأ في تصدير PDF. تأكد من وجود بيانات للتصدير وحاول مرة أخرى.")
  }
}

export const exportToCSV = (exportData: ExportData) => {
  try {
    const rows = [exportData.columns, ...exportData.data.map((item) => exportData.columns.map((col) => item[col]))]
    const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n")
    // إضافة BOM لدعم العربية في Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const fileName = (exportData.fileName?.replace(/\.pdf$/i, "") || exportData.title) + ".csv"
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    console.log("تم تصدير CSV بنجاح:", fileName)
    
    // إضافة إشعار
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    if (currentUser.username) {
      addReportNotification(currentUser.username, exportData.title, "Excel")
    }
  } catch (error) {
    console.error("خطأ في تصدير CSV:", error)
    alert("حدث خطأ في تصدير CSV. تأكد من وجود بيانات للتصدير وحاول مرة أخرى.")
  }
}

export const exportRequestsToPDF = (requests: any[]) => {
  try {
    if (!requests || requests.length === 0) {
      alert("لا توجد بيانات للتصدير")
      return
    }

    const data = requests.map((req) => ({
      التاريخ: new Date(req.created_at || Date.now()).toLocaleDateString("ar-SA"),
      المستخدم: req.user_name || req.from || "غير محدد",
      النوع: req.type === "warehouse" ? "مخزن" : req.type === "hr" ? "موارد بشرية" : "عام",
      السلعة: req.item_name || req.title || "غير محدد",
      الكمية: req.quantity || "-",
      الحالة: req.status || "معلق",
      مستعجل: req.urgent ? "نعم" : "لا",
    }))

    exportToPDF({
      title: "تقرير الطلبات",
      data,
      columns: ["التاريخ", "المستخدم", "النوع", "السلعة", "الكمية", "الحالة", "مستعجل"],
      fileName: "تقرير-الطلبات.pdf",
    })
  } catch (error) {
    console.error("خطأ في تصدير طلبات PDF:", error)
    alert("حدث خطأ في تصدير الطلبات. يرجى المحاولة مرة أخرى.")
  }
}

export const exportRequestsToCSV = (requests: any[]) => {
  try {
    if (!requests || requests.length === 0) {
      alert("لا توجد بيانات للتصدير")
      return
    }
    const data = requests.map((req) => ({
      التاريخ: new Date(req.created_at || Date.now()).toLocaleDateString("ar-SA"),
      المستخدم: req.user_name || req.from || "غير محدد",
      النوع: req.type === "warehouse" ? "مخزن" : req.type === "hr" ? "موارد بشرية" : "عام",
      السلعة: req.item_name || req.title || "غير محدد",
      الكمية: req.quantity || "-",
      الحالة: req.status || "معلق",
      مستعجل: req.urgent ? "نعم" : "لا",
    }))
    exportToCSV({
      title: "تقرير الطلبات",
      data,
      columns: ["التاريخ", "المستخدم", "النوع", "السلعة", "الكمية", "الحالة", "مستعجل"],
      fileName: "تقرير-الطلبات.csv",
    })
  } catch (error) {
    console.error("خطأ في تصدير طلبات CSV:", error)
    alert("حدث خطأ في تصدير الطلبات. يرجى المحاولة مرة أخرى.")
  }
}

export const exportInventoryToPDF = (inventory: any[]) => {
  try {
    if (!inventory || inventory.length === 0) {
      alert("لا توجد بيانات للتصدير")
      return
    }

    const data = inventory.map((item) => ({
      "اسم السلعة": item.name || "غير محدد",
      "الكمية الحالية": item.quantity || 0,
      "الحد الأدنى": item.min_quantity || 0,
      الموقع: item.location || "-",
      الحالة: (item.quantity || 0) <= (item.min_quantity || 0) ? "منخفض" : "طبيعي",
    }))

    exportToPDF({
      title: "تقرير المخزون",
      data,
      columns: ["اسم السلعة", "الكمية الحالية", "الحد الأدنى", "الموقع", "الحالة"],
      fileName: "تقرير-المخزون.pdf",
    })
  } catch (error) {
    console.error("خطأ في تصدير مخزون PDF:", error)
    alert("حدث خطأ في تصدير المخزون. يرجى المحاولة مرة أخرى.")
  }
}

export const exportInventoryToCSV = (inventory: any[]) => {
  try {
    if (!inventory || inventory.length === 0) {
      alert("لا توجد بيانات للتصدير")
      return
    }
    const data = inventory.map((item) => ({
      "اسم السلعة": item.name || "غير محدد",
      "الكمية الحالية": item.quantity || 0,
      "الحد الأدنى": item.min_quantity || 0,
      الموقع: item.location || "-",
      الحالة: (item.quantity || 0) <= (item.min_quantity || 0) ? "منخفض" : "طبيعي",
    }))
    exportToCSV({
      title: "تقرير المخزون",
      data,
      columns: ["اسم السلعة", "الكمية الحالية", "الحد الأدنى", "الموقع", "الحالة"],
      fileName: "تقرير-المخزون.csv",
    })
  } catch (error) {
    console.error("خطأ في تصدير مخزون CSV:", error)
    alert("حدث خطأ في تصدير المخزون. يرجى المحاولة مرة أخرى.")
  }
}
