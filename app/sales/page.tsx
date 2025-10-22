"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectSales() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/sales")
  }, [router])
  return null
}
