"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectAccountingLedger() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/accounting/ledger")
  }, [router])
  return null
}
