"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectInitialExpenseHead() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/initial-expense-head")
  }, [router])
  return null
}
