"use client"

import { useEffect, useState } from "react"
import { ArrowUpDown, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCurrency } from "@/hooks/use-currency"
import { formatDateDMY } from "@/lib/utils"
import axios from "axios"

export default function TransactionsPage() {
  const [vouchers, setVouchers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState("all")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { formatAmount } = useCurrency()

  const fetchVouchers = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedProject !== "all") params.append("projectId", selectedProject)

      const response = await axios.get(`/api/accounting/vouchers?${params.toString()}`)
      setVouchers(response.data.vouchers)
    } catch (error) {
      console.error("Error fetching vouchers:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await axios.get("/api/projects")
      setProjects(response.data.projects)
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  useEffect(() => {
    fetchVouchers()
    fetchProjects()
  }, [selectedProject])

  // Sort vouchers and calculate totals
  const sortedVouchers = [...vouchers].sort((a: any, b: any) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
  })

  // Calculate total debit and credit amounts
  const totalDebit = sortedVouchers.reduce((sum: number, voucher: any) => 
    sum + (voucher.voucher_type === "Debit" ? Number(voucher.amount) : 0), 0)
  const totalCredit = sortedVouchers.reduce((sum: number, voucher: any) => 
    sum + (voucher.voucher_type === "Credit" ? Number(voucher.amount) : 0), 0)

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
          <h1 className="text-3xl font-bold tracking-tight">Transactions DR/CR</h1>
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
                    <TableHead className="w-[60px]">SL</TableHead>
                    <TableHead className="w-[110px]">
                      <Button
                        variant="ghost"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="h-8 px-2"
                      >
                        Date (D-M-Y)
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[120px]">Voucher No</TableHead>
                    <TableHead className="w-[80px]">Type</TableHead>
                    <TableHead>Account Head</TableHead>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead className="text-right w-[130px]">Amount (Dr)</TableHead>
                    <TableHead className="text-right w-[130px]">Amount (Cr)</TableHead>
                    <TableHead className="text-center w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedVouchers.map((voucher, index) => (
                      <TableRow key={voucher.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{formatDateDMY(voucher.date)}</TableCell>
                        <TableCell className="font-medium">{voucher.voucher_no}</TableCell>
                        <TableCell>
                          <Badge className={getVoucherTypeColor(voucher.voucher_type)}>
                            {voucher.voucher_type === "Debit" ? "Dr" : voucher.voucher_type === "Credit" ? "Cr" : voucher.voucher_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={voucher.account_head_type || voucher.expense_head_name || "-"}>
                          {voucher.account_head_type || voucher.expense_head_name || "-"}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={voucher.vendor_display_name || voucher.vendor_name || "-"}>
                          {voucher.vendor_display_name || voucher.vendor_name || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {voucher.voucher_type === "Debit" ? formatAmount(voucher.amount) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {voucher.voucher_type === "Credit" ? formatAmount(voucher.amount) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedVoucher(voucher)
                              setDetailsOpen(true)
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {sortedVouchers.length > 0 && (
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={6} className="text-right">Total:</TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        {formatAmount(totalDebit)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatAmount(totalCredit)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedVoucher && (
            <div className="space-y-6">
              {/* Header Info Section */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Voucher No</p>
                    <p className="text-lg font-bold">{selectedVoucher.voucher_no}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date (D-M-Y)</p>
                    <p className="text-lg font-semibold">{formatDateDMY(selectedVoucher.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</p>
                    <Badge className={`${getVoucherTypeColor(selectedVoucher.voucher_type)} text-sm px-3 py-1`}>
                      {selectedVoucher.voucher_type === "Debit" ? "Debit (Dr)" : selectedVoucher.voucher_type === "Credit" ? "Credit (Cr)" : selectedVoucher.voucher_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Head of Account</p>
                    <p className="text-base font-medium">{selectedVoucher.account_head_type || selectedVoucher.expense_head_name || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="border rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Description</p>
                <p className="text-sm whitespace-pre-wrap">{selectedVoucher.particulars || selectedVoucher.description || "-"}</p>
              </div>

              {/* Details Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b">
                  <p className="text-sm font-semibold">Transaction Details</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-center">Rate</TableHead>
                      <TableHead className="text-center">Inventory</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Memo/Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">{selectedVoucher.vendor_display_name || selectedVoucher.vendor_name || "-"}</TableCell>
                      <TableCell className="text-center">{selectedVoucher.qty || "-"}</TableCell>
                      <TableCell className="text-center">{selectedVoucher.rate || "-"}</TableCell>
                      <TableCell className="text-center">{selectedVoucher.inventory || "-"}</TableCell>
                      <TableCell className={`text-right font-bold ${selectedVoucher.voucher_type === "Debit" ? "text-red-600" : "text-green-600"}`}>
                        {formatAmount(selectedVoucher.amount)}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm text-muted-foreground truncate" title={selectedVoucher.memo || "-"}>
                          {selectedVoucher.memo || "-"}
                        </p>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project</p>
                  <p>{selectedVoucher.project_name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Method</p>
                  <p>{selectedVoucher.bank_cash_name || "-"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
