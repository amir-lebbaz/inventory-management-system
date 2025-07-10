// نظام تصدير PDF
import jsPDF from "jspdf"
import "jspdf-autotable"

export interface ExportData {
  title: string
  data: any[]
  columns: string[]
  fileName?: string
}

export const exportToPDF = (exportData: ExportData) => {
  const doc = new jsPDF()

  // إعداد الخط العربي (إذا كان متوفراً)
  doc.setFont("helvetica")
  doc.setFontSize(16)

  // العنوان
  doc.text(exportData.title, 20, 20)
  doc.setFontSize(10)
  doc.text(`تاريخ التصدير: ${new Date().toLocaleDateString("ar-SA")}`, 20, 30)

  // الجدول
  const tableData = exportData.data.map((item) => exportData.columns.map((col) => item[col] || "-"))
  ;(doc as any).autoTable({
    head: [exportData.columns],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  })

  // حفظ الملف
  const fileName = exportData.fileName || `${exportData.title}-${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(fileName)
}

export const exportRequestsToPDF = (requests: any[]) => {
  const data = requests.map((req) => ({
    التاريخ: new Date(req.created_at).toLocaleDateString("ar-SA"),
    القسم: req.user_department,
    النوع: req.type === "warehouse" ? "مخزن" : "موارد بشرية",
    السلعة: req.item_name,
    الكمية: req.quantity || "-",
    الحالة: req.status,
    مستعجل: req.urgent ? "نعم" : "لا",
  }))

  exportToPDF({
    title: "تقرير الطلبات",
    data,
    columns: ["التاريخ", "القسم", "النوع", "السلعة", "الكمية", "الحالة", "مستعجل"],
    fileName: "تقرير-الطلبات.pdf",
  })
}

export const exportInventoryToPDF = (inventory: any[]) => {
  const data = inventory.map((item) => ({
    "اسم السلعة": item.name,
    "الكمية الحالية": item.quantity,
    "الحد الأدنى": item.min_quantity,
    الموقع: item.location || "-",
    الحالة: item.quantity <= item.min_quantity ? "منخفض" : "طبيعي",
  }))

  exportToPDF({
    title: "تقرير المخزون",
    data,
    columns: ["اسم السلعة", "الكمية الحالية", "الحد الأدنى", "الموقع", "الحالة"],
    fileName: "تقرير-المخزون.pdf",
  })
}
