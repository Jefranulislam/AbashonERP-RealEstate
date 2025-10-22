"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2, Printer, Search, AlertCircle } from "lucide-react"

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
import { Skeleton } from "@/components/ui/skeleton"

import { journalVoucherSchema, type JournalVoucherFormData } from "@/lib/validations/accounting"
import { useJournalVouchers, useCreateJournalVoucher, useDeleteVoucher } from "@/lib/hooks/use-accounting"
import { useProjects } from "@/lib/hooks/use-finance"
import { useExpenseHeads } from "@/lib/hooks/use-finance"
import { useUIStore } from "@/lib/stores/ui-store"

const DIALOG_ID = "journal-voucher-form"

export default function JournalVoucherPage() {
  const [projectFilter, setProjectFilter] = useState<number>()
  const [searchTerm, setSearchTerm] = useState("")

  // UI State
  const { dialogs, openDialog, closeDialog } = useUIStore()
  const isDialogOpen = dialogs[DIALOG_ID] || false

  // React Query hooks
  const { data: vouchers = [], isLoading: vouchersLoading } = useJournalVouchers(projectFilter)
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: expenseHeads = [], isLoading: expenseHeadsLoading } = useExpenseHeads()

  const createVoucher = useCreateJournalVoucher()
  const deleteVoucher = useDeleteVoucher()

  // React Hook Form
  const form = useForm<JournalVoucherFormData>({
    resolver: zodResolver(journalVoucherSchema),
    defaultValues: {
      drProjectId: 0,
      drExpenseHeadId: 0,
      drAmount: 0,
      crProjectId: 0,
      crExpenseHeadId: 0,
      crAmount: 0,
      billNo: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      isConfirmed: false,
    },
  })

  const drAmount = form.watch("drAmount")
  const crAmount = form.watch("crAmount")
  const isBalanced = drAmount === crAmount && drAmount > 0

  // Auto-sync amounts when one changes
  useEffect(() => {
    if (drAmount > 0 && crAmount === 0) {
      form.setValue("crAmount", drAmount)
    }
  }, [drAmount, form])

  useEffect(() => {
    if (crAmount > 0 && drAmount === 0) {
      form.setValue("drAmount", crAmount)
    }
  }, [crAmount, form])

  // Filter vouchers by search term
  const filteredVouchers = vouchers.filter((voucher) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      voucher.voucher_no?.toLowerCase().includes(search) ||
      voucher.project_name?.toLowerCase().includes(search) ||
      voucher.expense_head_name?.toLowerCase().includes(search) ||
      voucher.bill_no?.toLowerCase().includes(search)
    )
  })

  // Form submission
  async function onSubmit(data: CreditVoucherFormData) {
    try {
      await createVoucher.mutateAsync(data)
      form.reset()
      closeDialog(DIALOG_ID)
    } catch (error) {
      // Error handled by mutation
    }
  }

  // Delete handler
  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this credit voucher?")) return
    await deleteVoucher.mutateAsync(id)
  }

  // Print handler (placeholder)
  function handlePrint(voucher: any) {
    console.log("Print voucher:", voucher)
    // TODO: Implement print functionality
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Voucher</h1>
          <p className="text-muted-foreground">Record income and credit transactions (Receipts)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => open ? openDialog(DIALOG_ID) : closeDialog(DIALOG_ID)}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Credit Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Credit Voucher</DialogTitle>
              <DialogDescription>
                Fill in the credit voucher information below. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Project Name */}
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project Name *</Label>
                  <Select
                    value={form.watch("projectId")?.toString()}
                    onValueChange={(value) => form.setValue("projectId", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        projects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.project_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.projectId && (
                    <p className="text-sm text-destructive">{form.formState.errors.projectId.message}</p>
                  )}
                </div>

                {/* Cash Type */}
                <div className="space-y-2">
                  <Label htmlFor="bankCashId">Cash Type *</Label>
                  <Select
                    value={form.watch("bankCashId")?.toString()}
                    onValueChange={(value) => form.setValue("bankCashId", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankCashLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        bankCashAccounts.map((account: any) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.account_title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.bankCashId && (
                    <p className="text-sm text-destructive">{form.formState.errors.bankCashId.message}</p>
                  )}
                </div>

                {/* Head of Account */}
                <div className="space-y-2">
                  <Label htmlFor="expenseHeadId">Head of Account *</Label>
                  <Select
                    value={form.watch("expenseHeadId")?.toString()}
                    onValueChange={(value) => form.setValue("expenseHeadId", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select income head" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseHeadsLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        expenseHeads.map((head: any) => (
                          <SelectItem key={head.id} value={head.id.toString()}>
                            {head.head_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.expenseHeadId && (
                    <p className="text-sm text-destructive">{form.formState.errors.expenseHeadId.message}</p>
                  )}
                </div>

                {/* M.R/Bill No */}
                <div className="space-y-2">
                  <Label htmlFor="billNo">M.R/Bill No</Label>
                  <Input
                    id="billNo"
                    {...form.register("billNo")}
                    placeholder="Enter bill number"
                  />
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    {...form.register("date")}
                  />
                  {form.formState.errors.date && (
                    <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    {...form.register("amount", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {form.formState.errors.amount && (
                    <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                  )}
                </div>
              </div>

              {/* Particulars */}
              <div className="space-y-2">
                <Label htmlFor="particulars">Particulars</Label>
                <Textarea
                  id="particulars"
                  {...form.register("particulars")}
                  placeholder="Enter transaction details"
                  rows={3}
                />
              </div>

              {/* Confirm Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isConfirmed"
                  {...form.register("isConfirmed")}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isConfirmed" className="cursor-pointer">
                  Confirm? (Mark as verified)
                </Label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeDialog(DIALOG_ID)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createVoucher.isPending}>
                  {createVoucher.isPending ? "Saving..." : "Insert"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="projectFilter">Filter by Project</Label>
              <Select
                value={projectFilter?.toString() || "all"}
                onValueChange={(value) => setProjectFilter(value === "all" ? undefined : parseInt(value))}
              >
                <SelectTrigger id="projectFilter">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by voucher no, project, etc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Vouchers</CardTitle>
          <CardDescription>
            View and manage all credit vouchers ({filteredVouchers.length} records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vouchersLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
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
                    <TableHead>Made of Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No credit vouchers found. Create your first voucher to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVouchers.map((voucher, index) => (
                      <TableRow key={voucher.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{voucher.project_name}</TableCell>
                        <TableCell>{new Date(voucher.date).toLocaleDateString()}</TableCell>
                        <TableCell>{voucher.expense_head_name}</TableCell>
                        <TableCell>{voucher.bill_no || "-"}</TableCell>
                        <TableCell className="font-medium">{voucher.voucher_no}</TableCell>
                        <TableCell>{voucher.bank_cash_name}</TableCell>
                        <TableCell className="text-right font-medium">
                          ৳{Number(voucher.amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePrint(voucher)}
                              title="Print"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(voucher.id)}
                              title="Delete"
                              disabled={deleteVoucher.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
