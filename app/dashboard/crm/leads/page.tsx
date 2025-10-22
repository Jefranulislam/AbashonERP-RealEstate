"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectToCRMLeads() {
  const router = useRouter()

  useEffect(() => {
    // replace so browser history doesn't keep the old path
    router.replace("/crm/leads")
  }, [router])

  return null
}
