"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectPurchaseOrders() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/purchase/orders")
  }, [router])
  return null
}
