"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectToCRMImport() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/crm/import")
  }, [router])

  return null
}
