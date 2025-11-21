"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2, Printer, Search, ArrowRightLeft, Banknote, Building2 } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"

import { contraVoucherSchema, type ContraVoucherFormData } from "@/lib/validations/accounting"
import { useContraVouchers, useCreateContraVoucher, useDeleteVoucher } from "@/lib/hooks/use-accounting"
import { useProjects, useBankCashAccounts } from "@/lib/hooks/use-finance"
import { useUIStore } from "@/lib/stores/ui-store"

const DIALOG_ID = "contra-voucher-form"

export default function ContraVoucherPage() {
  const [projectFilter, setProjectFilter] = useState<number>()
  const [searchTerm, setSearchTerm] = useState("")

  // UI State
  const { dialogs, openDialog, closeDialog } = useUIStore()
  const isDialogOpen = dialogs[DIALOG_ID] || false

  // React Query hooks
  const { data: vouchers = [], isLoading: vouchersLoading } = useContraVouchers(projectFilter)
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: bankCashAccounts = [], isLoading: bankCashLoading } = useBankCashAccounts()

  const createVoucher = useCreateContraVoucher()
  const deleteVoucher = useDeleteVoucher()

  // React Hook Form
  const form = useForm<ContraVoucherFormData>({
    resolver: zodResolver(contraVoucherSchema),
    defaultValues: {
      projectId: 0,
      drBankCashId: 0,
      crBankCashId: 0,
      amount: 0,
      chequeNumber: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      isConfirmed: false,
    },
  })

  // Watch for account selections to determine transfer type
  const drAccountId = form.watch("drBankCashId")
  const crAccountId = form.watch("crBankCashId")
  
  const drAccount = bankCashAccounts.find((acc: any) => acc.id === Number(drAccountId))
  const crAccount = bankCashAccounts.find((acc: any) => acc.id === Number(crAccountId))

  // Determine transfer type based on account types
  const getTransferType = () => {
    if (!drAccount || !crAccount) return null
    
    const drIsBank = drAccount.account_title?.toLowerCase().includes("bank")
    const crIsBank = crAccount.account_title?.toLowerCase().includes("bank")
    
    if (drIsBank && !crIsBank) return "Bank Withdrawal"
    if (!drIsBank && crIsBank) return "Bank Deposit"
    if (drIsBank && crIsBank) return "Bank Transfer"
    return "Cash Transfer"
  }

  // Filter vouchers by search term
  const filteredVouchers = vouchers.filter((voucher) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      voucher.voucher_no?.toLowerCase().includes(search) ||
      voucher.project_name?.toLowerCase().includes(search) ||
      voucher.dr_bank_cash_name?.toLowerCase().includes(search) ||
      voucher.cr_bank_cash_name?.toLowerCase().includes(search) ||
      voucher.cheque_number?.toLowerCase().includes(search)
    )
  })

  // Form submission
  async function onSubmit(data: ContraVoucherFormData) {
    try {
      await createVoucher.mutateAsync(data)
      form.reset({
        projectId: 0,
        drBankCashId: 0,
        crBankCashId: 0,
        amount: 0,
        chequeNumber: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        isConfirmed: false,
      })
      closeDialog(DIALOG_ID)
    } catch (error) {
      // Error handled by mutation
    }
  }

  // Delete handler
  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this contra voucher?")) return
    await deleteVoucher.mutateAsync(id)
  }

  // Print handler
  function handlePrint(voucher: any) {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const transferType = voucher.dr_bank_cash_name?.toLowerCase().includes("bank") && 
                        voucher.cr_bank_cash_name?.toLowerCase().includes("bank")
      ? "Bank Transfer"
      : voucher.dr_bank_cash_name?.toLowerCase().includes("bank")
      ? "Bank Withdrawal"
      : "Bank Deposit"

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contra Voucher - ${voucher.voucher_no}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .voucher-info { margin-bottom: 20px; }
            .transfer-details { border: 2px solid #333; padding: 20px; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
            .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 8px; }
            .label { font-weight: bold; width: 150px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CONTRA VOUCHER</h1>
            <p>${transferType}</p>
          </div>
          
          <div class="voucher-info">
            <table>
              <tr>
                <td class="label">Voucher No:</td>
                <td>${voucher.voucher_no}</td>
                <td class="label">Date:</td>
                <td>${new Date(voucher.date).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td class="label">Project:</td>
                <td colspan="3">${voucher.project_name}</td>
              </tr>
            </table>
          </div>

          <div class="transfer-details">
            <h3>Transfer Details</h3>
            <table>
              <tr>
                <td class="label">From Account:</td>
                <td>${voucher.dr_bank_cash_name}</td>
              </tr>
              <tr>
                <td class="label">To Account:</td>
                <td>${voucher.cr_bank_cash_name}</td>
              </tr>
              <tr>
                <td class="label">Amount:</td>
                <td class="amount">৳${Number(voucher.amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}</td>
              </tr>
              ${voucher.cheque_number ? `
              <tr>
                <td class="label">Cheque No:</td>
                <td>${voucher.cheque_number}</td>
              </tr>
              ` : ""}
              ${voucher.description ? `
              <tr>
                <td class="label">Description:</td>
                <td>${voucher.description}</td>
              </tr>
              ` : ""}
            </table>
          </div>

          <div class="footer">
            <table style="width: 100%;">
              <tr>
                <td style="width: 33%; text-align: center;">
                  <div style="border-top: 1px solid #000; display: inline-block; width: 150px; margin-top: 50px;">
                    Prepared By
                  </div>
                </td>
                <td style="width: 33%; text-align: center;">
                  <div style="border-top: 1px solid #000; display: inline-block; width: 150px; margin-top: 50px;">
                    Approved By
                  </div>
                </td>
                <td style="width: 33%; text-align: center;">
                  <div style="border-top: 1px solid #000; display: inline-block; width: 150px; margin-top: 50px;">
                    Received By
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contra Voucher</h1>
          <p className="text-muted-foreground">Manage cash and bank transfers between accounts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => open ? openDialog(DIALOG_ID) : closeDialog(DIALOG_ID)}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Contra Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Contra Voucher</DialogTitle>
              <DialogDescription>
                Record cash/bank transfers, withdrawals, or deposits. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Transfer Type Badge */}
              {getTransferType() && (
                <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                  <Badge variant="secondary" className="text-lg">
                    {getTransferType()}
                  </Badge>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* Project Name */}
                <div className="space-y-2 md:col-span-2">
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

                {/* From Account (Debit) */}
                <div className="space-y-2">
                  <Label htmlFor="drBankCashId" className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    From Account (Debit) *
                  </Label>
                  <Select
                    value={form.watch("drBankCashId")?.toString()}
                    onValueChange={(value) => form.setValue("drBankCashId", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source account" />
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
                  {form.formState.errors.drBankCashId && (
                    <p className="text-sm text-destructive">{form.formState.errors.drBankCashId.message}</p>
                  )}
                </div>

                {/* To Account (Credit) */}
                <div className="space-y-2">
                  <Label htmlFor="crBankCashId" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    To Account (Credit) *
                  </Label>
                  <Select
                    value={form.watch("crBankCashId")?.toString()}
                    onValueChange={(value) => form.setValue("crBankCashId", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination account" />
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
                  {form.formState.errors.crBankCashId && (
                    <p className="text-sm text-destructive">{form.formState.errors.crBankCashId.message}</p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Transfer Amount *</Label>
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

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Transfer Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    {...form.register("date")}
                  />
                  {form.formState.errors.date && (
                    <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
                  )}
                </div>

                {/* Cheque Number */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="chequeNumber">Cheque Number (if applicable)</Label>
                  <Input
                    id="chequeNumber"
                    {...form.register("chequeNumber")}
                    placeholder="Enter cheque number"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description/Notes</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Enter transfer details, purpose, or reference"
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
                  Confirm & Finalize (Transfer is completed)
                </Label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset()
                    closeDialog(DIALOG_ID)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createVoucher.isPending}>
                  {createVoucher.isPending ? "Creating..." : "Create Contra Entry"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Withdrawals</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vouchers.filter((v: any) => 
                v.dr_bank_cash_name?.toLowerCase().includes("bank") && 
                !v.cr_bank_cash_name?.toLowerCase().includes("bank")
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Cash withdrawn from bank</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Deposits</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vouchers.filter((v: any) => 
                !v.dr_bank_cash_name?.toLowerCase().includes("bank") && 
                v.cr_bank_cash_name?.toLowerCase().includes("bank")
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Cash deposited to bank</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Transfers</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vouchers.filter((v: any) => 
                v.dr_bank_cash_name?.toLowerCase().includes("bank") && 
                v.cr_bank_cash_name?.toLowerCase().includes("bank")
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Transfers between banks</p>
          </CardContent>
        </Card>
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
                  placeholder="Search by voucher no, accounts, cheque..."
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
          <CardTitle>Contra Vouchers</CardTitle>
          <CardDescription>
            All cash and bank transfer records ({filteredVouchers.length} entries)
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
                    <TableHead>Voucher No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>From Account</TableHead>
                    <TableHead>To Account</TableHead>
                    <TableHead>Transfer Type</TableHead>
                    <TableHead>Cheque No</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        No contra vouchers found. Create your first transfer entry to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVouchers.map((voucher, index) => {
                      const drIsBank = voucher.dr_bank_cash_name?.toLowerCase().includes("bank")
                      const crIsBank = voucher.cr_bank_cash_name?.toLowerCase().includes("bank")
                      const transferType = drIsBank && crIsBank 
                        ? "Bank Transfer" 
                        : drIsBank 
                        ? "Withdrawal" 
                        : "Deposit"
                      
                      return (
                        <TableRow key={voucher.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{voucher.voucher_no}</TableCell>
                          <TableCell>{new Date(voucher.date).toLocaleDateString()}</TableCell>
                          <TableCell>{voucher.project_name}</TableCell>
                          <TableCell>{voucher.dr_bank_cash_name}</TableCell>
                          <TableCell>{voucher.cr_bank_cash_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{transferType}</Badge>
                          </TableCell>
                          <TableCell>{voucher.cheque_number || "-"}</TableCell>
                          <TableCell className="text-right font-medium">
                            ৳{Number(voucher.amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePrint(voucher)}
                                title="Print Receipt"
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
                      )
                    })
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
