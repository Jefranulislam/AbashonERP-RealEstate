"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectConstructors() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/vendors/constructors")
  }, [router])
  return null
}
