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
      { title: "Leads", url: "/dashboard/crm/leads" },
      { title: "CRM Reporting", url: "/dashboard/crm/reports" },
      { title: "Import Leads", url: "/dashboard/crm/import" },
    ],
  },
  {
    title: "Projects",
    icon: Building2,
    items: [
      { title: "All Projects", url: "/dashboard/projects" },
      { title: "Project Locations", url: "/dashboard/projects/locations" },
      { title: "Products", url: "/dashboard/projects/products" },
    ],
  },
  {
    title: "Customers",
    icon: UserCircle,
    url: "/dashboard/customers",
  },
  {
    title: "Sales",
    icon: TrendingUp,
    items: [
      { title: "All Sales", url: "/dashboard/sales" },
      { title: "Sales Reports", url: "/dashboard/sales/reports" },
    ],
  },
  {
    title: "Vendors",
    icon: Briefcase,
    items: [
      { title: "All Vendors", url: "/dashboard/vendors" },
      { title: "Constructors", url: "/dashboard/vendors/constructors" },
      { title: "Advance/Payable", url: "/dashboard/vendors/advance-payable" },
    ],
  },
  {
    title: "Purchase",
    icon: ShoppingCart,
    items: [
      { title: "Requisitions", url: "/dashboard/purchase/requisitions" },
      { title: "Confirm Requisition", url: "/dashboard/purchase/confirm" },
      { title: "Purchase Reports", url: "/dashboard/purchase/reports" },
    ],
  },
  {
    title: "Accounting",
    icon: DollarSign,
    items: [
      { title: "Transactions", url: "/dashboard/accounting/transactions" },
      { title: "Credit Voucher", url: "/dashboard/accounting/credit-voucher" },
      { title: "Debit Voucher", url: "/dashboard/accounting/debit-voucher" },
      { title: "Journal Voucher", url: "/dashboard/accounting/journal-voucher" },
      { title: "Contra Voucher", url: "/dashboard/accounting/contra-voucher" },
      { title: "Ledger", url: "/dashboard/accounting/ledger" },
      { title: "Balance Sheet", url: "/dashboard/accounting/balance-sheet" },
      { title: "Profit & Loss", url: "/dashboard/accounting/profit-loss" },
      { title: "Trial Balance", url: "/dashboard/accounting/trial-balance" },
    ],
  },
  {
    title: "Finance Setup",
    icon: Wallet,
    items: [
      { title: "Income/Expense Types", url: "/dashboard/finance/types" },
      { title: "Income/Expense Heads", url: "/dashboard/finance/heads" },
      { title: "Bank & Cash", url: "/dashboard/finance/bank-cash" },
      { title: "Initial Balances", url: "/dashboard/finance/initial-balances" },
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
    url: "/dashboard/cheques",
  },
  {
    title: "Settings",
    icon: Settings,
    items: [
      { title: "Company Settings", url: "/dashboard/settings" },
      { title: "User Management", url: "/dashboard/settings/users" },
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
