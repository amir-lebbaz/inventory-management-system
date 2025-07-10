"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface TransferConfirmationProps {
  show: boolean
}

export default function TransferConfirmation({ show }: TransferConfirmationProps) {
  if (!show) return null

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <strong>تنبيه:</strong> سيتم تحويل هذا الطلب إلى قسم الموارد البشرية وسيظهر في لوحة HR بدلاً من المخزن.
      </AlertDescription>
    </Alert>
  )
}
