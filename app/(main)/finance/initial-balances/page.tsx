"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectToFinanceInitialBalances() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/finance/initial-balances")
  }, [router])
  return null
}
