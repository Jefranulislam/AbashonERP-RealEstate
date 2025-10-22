"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectVendors() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/vendors")
  }, [router])
  return null
}
