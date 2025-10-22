"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectAccountingJournalVoucher() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/accounting/journal-voucher")
  }, [router])
  return null
}
