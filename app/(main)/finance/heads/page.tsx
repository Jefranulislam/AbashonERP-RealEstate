"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectToFinanceHeads() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/finance/heads")
  }, [router])
  return null
}
