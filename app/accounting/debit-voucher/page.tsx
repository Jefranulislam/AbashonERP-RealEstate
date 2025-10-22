"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectAccountingDebitVoucher() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/accounting/debit-voucher")
  }, [router])
  return null
}
