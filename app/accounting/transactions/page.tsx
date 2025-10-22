"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectAccountingTransactions() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/accounting/transactions")
  }, [router])
  return null
}
