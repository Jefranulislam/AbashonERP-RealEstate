"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectAccountingBalanceSheet() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/accounting/balance-sheet")
  }, [router])
  return null
}
