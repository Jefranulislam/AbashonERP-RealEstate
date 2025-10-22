"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectPurchase() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/purchase/requisitions")
  }, [router])
  return null
}
