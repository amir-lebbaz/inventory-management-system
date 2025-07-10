"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/enhanced-auth"
import EnhancedWarehouseDashboard from "@/components/enhanced-warehouse-dashboard"

export default function WarehousePage() {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== "warehouse") {
      router.push("/")
    }
  }, [router])

  return <EnhancedWarehouseDashboard />
}
