import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function PurchaseLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <DashboardHeader user={user} />
          <main className="flex-1 overflow-y-auto bg-muted/40">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
