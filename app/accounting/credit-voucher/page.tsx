"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectAccountingCreditVoucher() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/accounting/credit-voucher")
  }, [router])
  return null
}
