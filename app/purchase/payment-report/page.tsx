"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectPurchasePaymentReport() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/purchase/payment-report")
  }, [router])
  return null
}
