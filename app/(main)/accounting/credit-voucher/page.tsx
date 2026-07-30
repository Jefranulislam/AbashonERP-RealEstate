"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2, Printer, Search, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateField } from "@/components/ui/date-field"
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
import { SortableHeader } from "@/components/ui/sortable-header"
import { formatDateDMY } from "@/lib/utils"

import { creditVoucherSchema, type CreditVoucherFormData } from "@/lib/validations/accounting"
import { useCreditVouchers, useCreateCreditVoucher, useDeleteVoucher } from "@/lib/hooks/use-accounting"
import { useProjects } from "@/lib/hooks/use-finance"
import { useExpenseHeads } from "@/lib/hooks/use-finance"
import { useBankCashAccounts } from "@/lib/hooks/use-finance"
import { useVendors } from "@/lib/hooks/use-finance"
import { useUIStore } from "@/lib/stores/ui-store"
import { useSortable } from "@/lib/hooks/use-sortable"
import { VoucherViewModal } from "@/components/accounting/voucher-view-modal"
import { voucherToViewData, voucherToReceiptData } from "@/lib/voucher-view-mappers"
import { VoucherReceiptPDF } from "@/components/pdf/voucher-receipt-pdf"
import { printDocument, getCompanySettings } from "@/lib/pdf-utils"

const DIALOG_ID = "credit-voucher-form"

export default function CreditVoucherPage() {
  const [projectFilter, setProjectFilter] = useState<number>()
  const [searchTerm, setSearchTerm] = useState("")
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [printData, setPrintData] = useState<any>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewData, setViewData] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)

  // UI State
  const { dialogs, openDialog, closeDialog } = useUIStore()
  const isDialogOpen = dialogs[DIALOG_ID] || false

  // React Query hooks
  const { data: vouchers = [], isLoading: vouchersLoading } = useCreditVouchers(projectFilter)
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: expenseHeads = [], isLoading: expenseHeadsLoading } = useExpenseHeads()
  const { data: bankCashAccounts = [], isLoading: bankCashLoading } = useBankCashAccounts()
  const { data: vendors = [], isLoading: vendorsLoading } = useVendors()

  const createVoucher = useCreateCreditVoucher()
  const deleteVoucher = useDeleteVoucher()

  // React Hook Form
  const form = useForm<CreditVoucherFormData>({
    resolver: zodResolver(creditVoucherSchema),
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

  // Filter vouchers
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

  // Sortable table (Date + Voucher No)
  const { sorted: sortedVouchers, sort, requestSort } = useSortable(
    filteredVouchers,
    {
      date: (v: any) => v.date,
      voucher_no: (v: any) => v.voucher_no,
    },
    { key: "date", direction: "desc" },
  )

  // Calculate total amount
  const totalAmount = sortedVouchers.reduce((sum: number, voucher: any) => sum + Number(voucher.amount), 0)

  // Income/credit heads for the form. If none match (legacy data stores heads as
  // 'Dr'), fall back to the full list so the required dropdown is never empty.
  const creditHeads = (() => {
    const filtered = expenseHeads.filter((head: any) =>
      head.type === 'Cr' || head.type === 'cr' || head.type === 'CR' ||
      head.type_name?.toLowerCase().includes('income') ||
      head.type_name?.toLowerCase().includes('revenue') ||
      head.type_name?.toLowerCase().includes('credit'),
    )
    return filtered.length > 0 ? filtered : expenseHeads
  })()

  // Form submission
  async function onSubmit(data: CreditVoucherFormData) {
    try {
      // Denormalize the selected head name so the voucher always displays a
      // Head of Account even if the FK join later breaks or the head is renamed.
      const head = expenseHeads.find((h: any) => h.id === Number(data.expenseHeadId))
      await createVoucher.mutateAsync({ ...data, accountHeadType: head?.head_name })
      form.reset()
      closeDialog(DIALOG_ID)
    } catch (error) {
      // Error handled by mutation
    }
  }

  // Load company settings for PDF
  useEffect(() => {
    loadCompanySettings()
  }, [])

  const loadCompanySettings = async () => {
    const settings = await getCompanySettings()
    setCompanySettings(settings)
  }

  // Delete handler
  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this credit voucher?")) return
    await deleteVoucher.mutateAsync(id)
  }

  // View handler — open the shared detail modal
  function handleView(voucher: any) {
    setViewData(voucherToViewData(voucher, { documentTitle: "Credit Voucher", partyLabel: "Customer" }))
    setViewOpen(true)
  }

  // Print handler — build the client-facing receipt (no ledger entries)
  function handlePrint(voucher: any) {
    setPrintData(voucherToReceiptData(voucher, { documentTitle: "Credit Voucher", partyLabel: "Customer" }))
    setPrintDialogOpen(true)
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

                {/* Head of Account - only income/credit heads */}
                <div className="space-y-2">
                  <Label htmlFor="expenseHeadId">Head of Account (Income) *</Label>
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
                        creditHeads
                          .map((head: any) => (
                            <SelectItem key={head.id} value={head.id.toString()}>
                              {head.account_code ? `[${head.account_code}] ` : ''}{head.head_name}
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
                  <DateField
                    id="date"
                    value={form.watch("date")}
                    onChange={(v) => form.setValue("date", v)}
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
            View and manage all credit vouchers ({sortedVouchers.length} records)
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
                      <SortableHeader label="Date" sortKey="date" sort={sort} onSort={requestSort} />
                    </TableHead>
                    <TableHead>Head of Account</TableHead>
                    <TableHead>Bill No</TableHead>
                    <TableHead>
                      <SortableHeader label="Voucher No" sortKey="voucher_no" sort={sort} onSort={requestSort} />
                    </TableHead>
                    <TableHead>Made of Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No credit vouchers found. Create your first voucher to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedVouchers.map((voucher, index) => (
                      <TableRow key={voucher.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{voucher.project_name}</TableCell>
                        <TableCell>{formatDateDMY(voucher.date)}</TableCell>
                        <TableCell>{voucher.expense_head_name || "-"}</TableCell>
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
                              onClick={() => handleView(voucher)}
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
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
                  {sortedVouchers.length > 0 && (
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

      {/* View Details Modal */}
      <VoucherViewModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        data={viewData}
        currencySymbol={companySettings?.currency_symbol}
      />

      {/* Print confirmation */}
      {printDialogOpen && (
        <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Print Credit Voucher</DialogTitle>
              <DialogDescription>
                Generate a client-facing payment voucher receipt.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button onClick={executePrint} className="flex-1">
                <Printer className="mr-2 h-4 w-4" /> Print Voucher
              </Button>
              <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Hidden Print Content — client-facing receipt (no ledger entries) */}
      <div className="hidden">
        {printDialogOpen && printData && companySettings && (
          <div id="print-voucher-content">
            <VoucherReceiptPDF
              data={printData}
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
