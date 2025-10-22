"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectToFinanceBankCash() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/finance/bank-cash")
  }, [router])
  return null
}
