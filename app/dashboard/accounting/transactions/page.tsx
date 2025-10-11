"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import axios from "axios"

export default function TransactionsPage() {
  const [vouchers, setVouchers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState("all")

  const fetchVouchers = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedProject !== "all") params.append("projectId", selectedProject)

      const response = await axios.get(`/api/accounting/vouchers?${params.toString()}`)
      setVouchers(response.data.vouchers)
    } catch (error) {
      console.error("[v0] Error fetching vouchers:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await axios.get("/api/projects")
      setProjects(response.data.projects)
    } catch (error) {
      console.error("[v0] Error fetching projects:", error)
    }
  }

  useEffect(() => {
    fetchVouchers()
    fetchProjects()
  }, [selectedProject])

  const getVoucherTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Credit: "bg-green-500",
      Debit: "bg-red-500",
      Journal: "bg-blue-500",
      Contra: "bg-purple-500",
    }
    return colors[type] || "bg-gray-500"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">View all accounting transactions</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={String(project.id)}>
                {project.project_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All vouchers and transactions across projects</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL No.</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Head of Account</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Voucher No</TableHead>
                    <TableHead>Voucher Type</TableHead>
                    <TableHead>Amount (Dr)</TableHead>
                    <TableHead>Amount (Cr)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    vouchers.map((voucher, index) => (
                      <TableRow key={voucher.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{voucher.project_name || "-"}</TableCell>
                        <TableCell>{new Date(voucher.date).toLocaleDateString()}</TableCell>
                        <TableCell>{voucher.expense_head_name || "-"}</TableCell>
                        <TableCell>{voucher.bank_cash_name || "-"}</TableCell>
                        <TableCell className="font-medium">{voucher.voucher_no}</TableCell>
                        <TableCell>
                          <Badge className={getVoucherTypeColor(voucher.voucher_type)}>{voucher.voucher_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {voucher.voucher_type === "Debit" ? `$${Number(voucher.amount).toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          {voucher.voucher_type === "Credit" ? `$${Number(voucher.amount).toFixed(2)}` : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
