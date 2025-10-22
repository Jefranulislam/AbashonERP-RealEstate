"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectPurchaseReports() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/purchase/reports")
  }, [router])
  return null
}
