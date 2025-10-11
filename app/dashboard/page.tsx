import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { sql } from "@/lib/db"
import { Users, Building2, TrendingUp, ShoppingCart, DollarSign, FileText } from "lucide-react"

async function getDashboardStats() {
  try {
    const [leadsCount] = await sql`SELECT COUNT(*) as count FROM crm_leads WHERE is_active = true`
    const [customersCount] = await sql`SELECT COUNT(*) as count FROM customers WHERE is_active = true`
    const [projectsCount] = await sql`SELECT COUNT(*) as count FROM projects WHERE is_active = true`
    const [salesCount] = await sql`SELECT COUNT(*) as count FROM sales WHERE is_active = true`
    const [requisitionsCount] =
      await sql`SELECT COUNT(*) as count FROM purchase_requisitions WHERE is_confirmed = false`
    const [vendorsCount] = await sql`SELECT COUNT(*) as count FROM vendors WHERE is_active = true`

    return {
      leads: Number(leadsCount.count) || 0,
      customers: Number(customersCount.count) || 0,
      projects: Number(projectsCount.count) || 0,
      sales: Number(salesCount.count) || 0,
      pendingRequisitions: Number(requisitionsCount.count) || 0,
      vendors: Number(vendorsCount.count) || 0,
    }
  } catch (error) {
    console.error("[v0] Error fetching dashboard stats:", error)
    return {
      leads: 0,
      customers: 0,
      projects: 0,
      sales: 0,
      pendingRequisitions: 0,
      vendors: 0,
    }
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const cards = [
    {
      title: "Active Leads",
      value: stats.leads,
      description: "Total active CRM leads",
      icon: Users,
      href: "/dashboard/crm/leads",
    },
    {
      title: "Customers",
      value: stats.customers,
      description: "Total registered customers",
      icon: Users,
      href: "/dashboard/customers",
    },
    {
      title: "Projects",
      value: stats.projects,
      description: "Active projects",
      icon: Building2,
      href: "/dashboard/projects",
    },
    {
      title: "Sales",
      value: stats.sales,
      description: "Total sales transactions",
      icon: TrendingUp,
      href: "/dashboard/sales",
    },
    {
      title: "Pending Requisitions",
      value: stats.pendingRequisitions,
      description: "Awaiting confirmation",
      icon: ShoppingCart,
      href: "/dashboard/purchase/requisitions",
    },
    {
      title: "Vendors",
      value: stats.vendors,
      description: "Active vendors",
      icon: FileText,
      href: "/dashboard/vendors",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your ERP system overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <a key={card.title} href={card.href}>
              <Card className="transition-colors hover:bg-accent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            </a>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across all modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">New lead added</p>
                  <p className="text-sm text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Sale completed</p>
                  <p className="text-sm text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Purchase requisition submitted</p>
                  <p className="text-sm text-muted-foreground">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <a
                href="/dashboard/crm/leads"
                className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Add New Lead</span>
              </a>
              <a
                href="/dashboard/sales"
                className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Record Sale</span>
              </a>
              <a
                href="/dashboard/purchase/requisitions"
                className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="text-sm font-medium">Create Requisition</span>
              </a>
              <a
                href="/dashboard/accounting/transactions"
                className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">View Transactions</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
