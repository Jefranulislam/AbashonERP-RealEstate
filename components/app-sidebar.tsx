"use client"

import * as React from "react"
import {
  Building2,
  Users,
  ShoppingCart,
  DollarSign,
  UserCircle,
  Settings,
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  CreditCard,
  Wallet,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/dashboard",
  },
  {
    title: "CRM",
    icon: Users,
    items: [
      { title: "Leads", url: "/crm/leads" },
      { title: "CRM Reporting", url: "/crm/reports" },
      { title: "Import Leads", url: "/crm/import" },
    ],
  },
  {
    title: "Projects",
    icon: Building2,
    items: [
      { title: "All Projects", url: "/projects" },
      { title: "Project Locations", url: "/projects/locations" },
      { title: "Products", url: "/products" },
    ],
  },
  {
    title: "Customers",
    icon: UserCircle,
    url: "/customers",
  },
  {
    title: "Sales",
    icon: TrendingUp,
    items: [
      { title: "All Sales", url: "/sales" },
      { title: "Sales Reports", url: "/reports/sales" },
    ],
  },
  {
    title: "Vendors",
    icon: Briefcase,
    items: [
      { title: "All Vendors", url: "/vendors" },
      { title: "Constructors", url: "/constructors" },
      { title: "Advance/Payable", url: "/vendors/advance-payable" },
    ],
  },
  {
    title: "Purchase",
    icon: ShoppingCart,
    items: [
      { title: "Requisitions", url: "/purchase/requisitions" },
      { title: "Confirm Requisition", url: "/purchase/confirm" },
      { title: "Purchase Orders", url: "/purchase/orders" },
      { title: "Material Deliveries", url: "/purchase/deliveries" },
      { title: "Payment Transactions", url: "/purchase/payments" },
      { title: "Payment Due Report", url: "/purchase/payment-due-report" },
      { title: "Purchase Reports", url: "/purchase/reports" },
    ],
  },
  {
    title: "Accounting",
    icon: DollarSign,
    items: [
      { title: "Transactions", url: "/accounting/transactions" },
      { title: "Credit Voucher", url: "/accounting/credit-voucher" },
      { title: "Debit Voucher", url: "/accounting/debit-voucher" },
      { title: "Journal Voucher", url: "/accounting/journal-voucher" },
      { title: "Contra Voucher", url: "/accounting/contra-voucher" },
      { title: "Ledger", url: "/accounting/ledger" },
      { title: "Balance Sheet", url: "/accounting/balance-sheet" },
      { title: "Profit & Loss", url: "/accounting/profit-loss" },
      { title: "Trial Balance", url: "/accounting/trial-balance" },
    ],
  },
  {
    title: "Finance Setup",
    icon: Wallet,
    items: [
      { title: "Income/Expense Types", url: "/finance/types" },
      { title: "Income/Expense Heads", url: "/finance/heads" },
      { title: "Bank & Cash", url: "/finance/bank-cash" },
      { title: "Initial Balances", url: "/finance/initial-balances" },
    ],
  },
  {
    title: "Employees",
    icon: Users,
    url: "/dashboard/employees",
  },
  {
    title: "Cheque Manager",
    icon: CreditCard,
    url: "/cheques",
  },
  {
    title: "Settings",
    icon: Settings,
    items: [
      { title: "Company Settings", url: "/settings" },
      { title: "User Management", url: "/settings/users" },
    ],
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold">ERP System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <React.Fragment key={item.title}>
                  {item.items ? (
                    <Collapsible asChild defaultOpen={false} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <a href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <a href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </React.Fragment>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
