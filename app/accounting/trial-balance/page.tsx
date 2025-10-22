"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectAccountingTrialBalance() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/accounting/trial-balance")
  }, [router])
  return null
}
