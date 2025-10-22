"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectAccountingContraVoucher() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/accounting/contra-voucher")
  }, [router])
  return null
}
