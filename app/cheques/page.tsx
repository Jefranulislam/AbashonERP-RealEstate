"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectCheques() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/cheques")
  }, [router])
  return null
}
