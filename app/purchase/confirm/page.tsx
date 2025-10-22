"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectPurchaseConfirm() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/purchase/confirm")
  }, [router])
  return null
}
