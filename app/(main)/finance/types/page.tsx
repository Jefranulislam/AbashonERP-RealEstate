"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectToFinanceTypes() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/finance/types")
  }, [router])
  return null
}
