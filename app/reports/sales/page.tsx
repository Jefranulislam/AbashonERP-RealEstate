"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectReportsSales() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/reports/sales")
  }, [router])
  return null
}
