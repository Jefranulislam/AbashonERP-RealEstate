"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectVendorsAdvancePayable() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/vendors/advance-payable")
  }, [router])
  return null
}
