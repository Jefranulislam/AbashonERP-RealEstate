"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectAccountingProfitLoss() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/accounting/profit-loss")
  }, [router])
  return null
}
