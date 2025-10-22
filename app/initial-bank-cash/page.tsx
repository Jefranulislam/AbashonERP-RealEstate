"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectInitialBankCash() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/initial-bank-cash")
  }, [router])
  return null
}
