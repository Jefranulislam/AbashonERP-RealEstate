"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectReportsCRM() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/reports/crm")
  }, [router])
  return null
}
