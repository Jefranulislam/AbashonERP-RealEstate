"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectAssignConstructor() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/assign-constructor")
  }, [router])
  return null
}
