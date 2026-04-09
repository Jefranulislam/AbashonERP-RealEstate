"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2, Printer, Edit, Search, ArrowUpDown } from "lucide-react"

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
import { formatDateDMY } from "@/lib/utils"

import { debitVoucherSchema, type DebitVoucherFormData } from "@/lib/validations/accounting"
import { useDebitVouchers, useCreateDebitVoucher, useDeleteVoucher } from "@/lib/hooks/use-accounting"
import { useProjects } from "@/lib/hooks/use-finance"
import { useExpenseHeads } from "@/lib/hooks/use-finance"
import { useBankCashAccounts } from "@/lib/hooks/use-finance"
import { useVendors } from "@/lib/hooks/use-finance"
import { useUIStore } from "@/lib/stores/ui-store"
import { AccountingVoucherPDF } from "@/components/pdf/accounting-voucher-pdf"
import { printDocument, getCompanySettings } from "@/lib/pdf-utils"

const DIALOG_ID = "debit-voucher-form"

export default function DebitVoucherPage() {
  const [projectFilter, setProjectFilter] = useState<number>()
  const [searchTerm, setSearchTerm] = useState("")
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // UI State
  const { dialogs, openDialog, closeDialog } = useUIStore()
  const isDialogOpen = dialogs[DIALOG_ID] || false

  // React Query hooks
  const { data: vouchers = [], isLoading: vouchersLoading } = useDebitVouchers(projectFilter)
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: expenseHeads = [], isLoading: expenseHeadsLoading } = useExpenseHeads()
  const { data: bankCashAccounts = [], isLoading: bankCashLoading } = useBankCashAccounts()
  const { data: vendors = [], isLoading: vendorsLoading } = useVendors()

  const createVoucher = useCreateDebitVoucher()
  const deleteVoucher = useDeleteVoucher()

  // React Hook Form
  const form = useForm<DebitVoucherFormData>({
    resolver: zodResolver(debitVoucherSchema),
    defaultValues: {
      projectId: 0,
      expenseHeadId: 0,
      bankCashId: 0,
      billNo: "",
      date: new Date().toISOString().split("T")[0],
      amount: 0,
      particulars: "",
      isConfirmed: false,
      vendorId: 0,
      qty: "",
      rate: "",
      inventory: "",
      memo: "",
    },
  })

  // Filter and sort vouchers
  const filteredVouchers = vouchers.filter((voucher: any) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      voucher.voucher_no?.toLowerCase().includes(search) ||
      voucher.project_name?.toLowerCase().includes(search) ||
      voucher.expense_head_name?.toLowerCase().includes(search) ||
      voucher.bill_no?.toLowerCase().includes(search)
    )
  }).sort((a: any, b: any) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
  })

  // Calculate total amount
  const totalAmount = filteredVouchers.reduce((sum: number, voucher: any) => sum + Number(voucher.amount), 0)

  // Load company settings for PDF
  useEffect(() => {
    loadCompanySettings()
  }, [])

  const loadCompanySettings = async () => {
    const settings = await getCompanySettings()
    setCompanySettings(settings)
  }

  // Form submission
  async function onSubmit(data: DebitVoucherFormData) {
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
    if (!confirm("Are you sure you want to delete this debit voucher?")) return
    await deleteVoucher.mutateAsync(id)
  }

  // Edit handler (placeholder)
  function handleEdit(voucher: any) {
    console.log("Edit voucher:", voucher)
    // TODO: Implement edit functionality
  }

  // Print handler
  function handlePrint(voucher: any) {
    // Transform voucher data to match PDF component structure
    const voucherForPDF = {
      voucher_no: voucher.voucher_no,
      voucher_date: voucher.date,
      voucher_type: 'debit' as const,
      total_amount: voucher.amount,
      narration: voucher.particulars,
      created_by: voucher.created_by_name,
    }

    // Create entries array (debit voucher has one debit and one credit entry)
    const entries = [
      {
        ledger_name: voucher.expense_head_name,
        head_type: 'Expense',
        debit: voucher.amount,
        credit: 0,
        narration: voucher.particulars,
      },
      {
        ledger_name: voucher.bank_cash_name,
        head_type: 'Bank/Cash',
        debit: 0,
        credit: voucher.amount,
        narration: voucher.particulars,
      },
    ]

    setSelectedVoucher({ 
      voucher: voucherForPDF, 
      entries,
      originalVoucher: voucher // Keep original data for professional templates
    })
    setPrintDialogOpen(true)
    // Don't auto-print, let user choose mode first
  }

  // Convert amount to words (simple implementation)
  function convertToWords(amount: number): string {
    const formatter = new Intl.NumberFormat('en-BD')
    return `${formatter.format(amount)} Taka Only`
  }

  // Handle print function
  function executePrint() {
    const contentId = 'print-voucher-content'
    setTimeout(() => {
      printDocument(contentId)
    }, 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debit Voucher</h1>
          <p className="text-muted-foreground">Record expenses and debit transactions (Payments)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => open ? openDialog(DIALOG_ID) : closeDialog(DIALOG_ID)}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Debit Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Insert/Add New Debit Voucher</DialogTitle>
              <DialogDescription>
                Fill in the debit voucher information below. All fields marked with * are required.
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

                {/* Head of Accounts */}
                <div className="space-y-2">
                  <Label htmlFor="expenseHeadId">Head of Accounts *</Label>
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

                {/* Vendor Name */}
                <div className="space-y-2">
                  <Label htmlFor="vendorId">Vendor Name</Label>
                  <Select
                    value={form.watch("vendorId")?.toString() ?? ""}
                    onValueChange={(value) => form.setValue("vendorId", value === "none" ? 0 : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Vendor --</SelectItem>
                      {vendorsLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        vendors.map((vendor: any) => (
                          <SelectItem key={vendor.id} value={vendor.id.toString()}>
                            {vendor.vendor_name} (ID: {vendor.id})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    {...form.register("qty")}
                    placeholder="e.g., 100, 5 Ton"
                  />
                </div>

                {/* Rate */}
                <div className="space-y-2">
                  <Label htmlFor="rate">Rate</Label>
                  <Input
                    id="rate"
                    {...form.register("rate")}
                    placeholder="e.g., 480"
                  />
                </div>

                {/* Inventory */}
                <div className="space-y-2">
                  <Label htmlFor="inventory">Inventory</Label>
                  <Input
                    id="inventory"
                    {...form.register("inventory")}
                    placeholder="Stock quantity"
                  />
                </div>
              </div>

              {/* Particulars */}
              <div className="space-y-2">
                <Label htmlFor="particulars">Particulars / Description</Label>
                <Textarea
                  id="particulars"
                  {...form.register("particulars")}
                  placeholder="Enter transaction details"
                  rows={3}
                />
              </div>

              {/* Memo / Notes */}
              <div className="space-y-2">
                <Label htmlFor="memo">Memo / Notes</Label>
                <Textarea
                  id="memo"
                  {...form.register("memo")}
                  placeholder="Additional notes or comments"
                  rows={2}
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
          <CardTitle>Filtering Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="projectFilter">Filter by Project Name</Label>
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
          <CardTitle>Debit Vouchers</CardTitle>
          <CardDescription>
            View and manage all debit vouchers ({filteredVouchers.length} records)
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
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="h-8 px-2"
                      >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
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
                        No debit vouchers found. Create your first voucher to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVouchers.map((voucher: any, index: number) => (
                      <TableRow key={voucher.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{voucher.project_name}</TableCell>
                        <TableCell>{formatDateDMY(voucher.date)}</TableCell>
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
                              onClick={() => handleEdit(voucher)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
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
                  {filteredVouchers.length > 0 && (
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={7} className="text-right">Total:</TableCell>
                      <TableCell className="text-right font-bold">
                        ৳{totalAmount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
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

      {/* Hidden Print Content */}
      <div className="hidden">
        {/* Print Mode Selection Dialog */}
        {printDialogOpen && (
          <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Choose Print Format</DialogTitle>
                <DialogDescription>
                  Select how you want to print this debit voucher
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="font-semibold">📊 Accountant Voucher</div>
                  <div className="text-sm text-muted-foreground">
                    Internal accounting voucher with debit/credit entries
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={executePrint} className="flex-1">
                    🖨️ Print Voucher
                  </Button>
                  <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Accountant View - Traditional Voucher */}
        {printDialogOpen && selectedVoucher && companySettings && (
          <div id="print-voucher-content">
            <AccountingVoucherPDF
              voucher={selectedVoucher.voucher}
              entries={selectedVoucher.entries}
              companyName={companySettings.company_name}
              companyAddress={companySettings.address}
              currencySymbol={companySettings.currency_symbol}
              companyLogo={companySettings.company_logo}
              footerImage={companySettings.footer_image}
              backgroundImage={companySettings.background_image}
            />
          </div>
        )}
      </div>
    </div>
  )
}
