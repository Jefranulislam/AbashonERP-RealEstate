"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import axios from "axios"

export default function CreditVoucherPage() {
  const [vouchers, setVouchers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [expenseHeads, setExpenseHeads] = useState<any[]>([])
  const [bankCashAccounts, setBankCashAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    projectId: "",
    expenseHeadId: "",
    bankCashId: "",
    billNo: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    particulars: "",
    isConfirmed: false,
  })

  const fetchVouchers = async () => {
    try {
      const response = await axios.get("/api/accounting/vouchers?voucherType=Credit")
      setVouchers(response.data.vouchers)
    } catch (error) {
      console.error("[v0] Error fetching vouchers:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const [projectsRes, expenseHeadsRes, bankCashRes] = await Promise.all([
        axios.get("/api/projects"),
        axios.get("/api/finance/expense-heads"),
        axios.get("/api/finance/bank-cash"),
      ])

      setProjects(projectsRes.data.projects)
      setExpenseHeads(expenseHeadsRes.data.expenseHeads)
      setBankCashAccounts(bankCashRes.data.bankCashAccounts)
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
    }
  }

  useEffect(() => {
    fetchVouchers()
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await axios.post("/api/accounting/vouchers", {
        ...formData,
        voucherType: "Credit",
      })
      fetchVouchers()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("[v0] Error saving voucher:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this voucher?")) return

    try {
      await axios.delete(`/api/accounting/vouchers/${id}`)
      fetchVouchers()
    } catch (error) {
      console.error("[v0] Error deleting voucher:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      projectId: "",
      expenseHeadId: "",
      bankCashId: "",
      billNo: "",
      date: new Date().toISOString().split("T")[0],
      amount: "",
      particulars: "",
      isConfirmed: false,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Voucher</h1>
          <p className="text-muted-foreground">Record income and credit transactions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Credit Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Credit Voucher</DialogTitle>
              <DialogDescription>Fill in the credit voucher information below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project Name *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankCashId">Cash Type *</Label>
                  <Select
                    value={formData.bankCashId}
                    onValueChange={(value) => setFormData({ ...formData, bankCashId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankCashAccounts.map((account) => (
                        <SelectItem key={account.id} value={String(account.id)}>
                          {account.account_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenseHeadId">Head of Account *</Label>
                  <Select
                    value={formData.expenseHeadId}
                    onValueChange={(value) => setFormData({ ...formData, expenseHeadId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select expense head" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseHeads.map((head) => (
                        <SelectItem key={head.id} value={String(head.id)}>
                          {head.head_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billNo">M.R/Bill No</Label>
                  <Input
                    id="billNo"
                    value={formData.billNo}
                    onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="particulars">Particulars</Label>
                <Textarea
                  id="particulars"
                  value={formData.particulars}
                  onChange={(e) => setFormData({ ...formData, particulars: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isConfirmed"
                  checked={formData.isConfirmed}
                  onChange={(e) => setFormData({ ...formData, isConfirmed: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isConfirmed">Confirm?</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Insert</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Vouchers</CardTitle>
          <CardDescription>View and manage all credit vouchers</CardDescription>
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
                    <TableHead>Project Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Head of Account</TableHead>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Voucher No</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No credit vouchers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    vouchers.map((voucher, index) => (
                      <TableRow key={voucher.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{voucher.project_name}</TableCell>
                        <TableCell>{new Date(voucher.date).toLocaleDateString()}</TableCell>
                        <TableCell>{voucher.expense_head_name}</TableCell>
                        <TableCell>{voucher.bill_no || "-"}</TableCell>
                        <TableCell className="font-medium">{voucher.voucher_no}</TableCell>
                        <TableCell>{voucher.bank_cash_name}</TableCell>
                        <TableCell>${Number(voucher.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(voucher.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
