"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/enhanced-auth"
import EnhancedHRDashboard from "@/components/enhanced-hr-dashboard"

export default function HRPage() {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== "hr") {
      router.push("/")
    }
  }, [router])

  return <EnhancedHRDashboard />
}
