"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/enhanced-auth"
import EnhancedWorkerDashboard from "@/components/enhanced-worker-dashboard"

export default function WorkerPage() {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== "worker") {
      router.push("/")
    }
  }, [router])

  return <EnhancedWorkerDashboard />
}
