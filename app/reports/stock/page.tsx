"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectReportsStock() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/reports/stock")
  }, [router])
  return null
}
