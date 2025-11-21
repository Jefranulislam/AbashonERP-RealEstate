"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2, Printer, Search, Scale } from "lucide-react"

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

import { journalVoucherSchema, type JournalVoucherFormData } from "@/lib/validations/accounting"
import { useJournalVouchers, useCreateJournalVoucher, useDeleteVoucher } from "@/lib/hooks/use-accounting"
import { useProjects, useExpenseHeads } from "@/lib/hooks/use-finance"
import { useUIStore } from "@/lib/stores/ui-store"

const DIALOG_ID = "journal-voucher-form"

export default function JournalVoucherPage() {
  const [projectFilter, setProjectFilter] = useState<number>()
  const [searchTerm, setSearchTerm] = useState("")

  const { dialogs, openDialog, closeDialog } = useUIStore()
  const isDialogOpen = dialogs[DIALOG_ID] || false

  const { data: vouchers = [], isLoading: vouchersLoading } = useJournalVouchers(projectFilter)
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: expenseHeads = [], isLoading: expenseHeadsLoading } = useExpenseHeads()

  const createVoucher = useCreateJournalVoucher()
  const deleteVoucher = useDeleteVoucher()

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

  const filteredVouchers = vouchers.filter((voucher) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      voucher.voucher_no?.toLowerCase().includes(search) ||
      voucher.project_name?.toLowerCase().includes(search) ||
      voucher.bill_no?.toLowerCase().includes(search)
    )
  })

  async function onSubmit(data: JournalVoucherFormData) {
    try {
      await createVoucher.mutateAsync(data)
      form.reset({
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
      })
      closeDialog(DIALOG_ID)
    } catch (error) {
      // Error handled by mutation
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this journal voucher?")) return
    await deleteVoucher.mutateAsync(id)
  }

  function handlePrint(voucher: any) {
    console.log("Print journal voucher:", voucher)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal Voucher</h1>
          <p className="text-muted-foreground">Record journal entries with debit and credit (Double Entry System)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => open ? openDialog(DIALOG_ID) : closeDialog(DIALOG_ID)}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Journal Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Journal Voucher</DialogTitle>
              <DialogDescription>
                Fill in the journal entry details. Debit and Credit amounts must be equal.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className={`flex items-center justify-center gap-2 p-3 rounded-lg $${
                isBalanced 
                  ? "bg-green-50 border border-green-200" 
                  : "bg-yellow-50 border border-yellow-200"
              }`}>
                <Scale className={`h-5 w-5 ${isBalanced ? "text-green-600" : "text-yellow-600"}`} />
                <span className={`font-medium $${isBalanced ? "text-green-700" : "text-yellow-700"}`}>
                  {isBalanced 
                    ? ` Balanced (Dr: ${drAmount.toLocaleString()} = Cr: ${crAmount.toLocaleString()})` 
                    : ` Not Balanced (Dr: ${drAmount.toLocaleString()}  Cr: ${crAmount.toLocaleString()})`
                  }
                </span>
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="text-lg font-semibold mb-3 text-blue-900 flex items-center gap-2">
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">DEBIT</span>
                  Debit Entry (Dr)
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="drProjectId">Debit Project *</Label>
                    <Select
                      value={form.watch("drProjectId")?.toString()}
                      onValueChange={(value) => form.setValue("drProjectId", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select debit project" />
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
                    {form.formState.errors.drProjectId && (
                      <p className="text-sm text-destructive">{form.formState.errors.drProjectId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="drExpenseHeadId">Debit Head of Account *</Label>
                    <Select
                      value={form.watch("drExpenseHeadId")?.toString()}
                      onValueChange={(value) => form.setValue("drExpenseHeadId", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select debit account" />
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
                    {form.formState.errors.drExpenseHeadId && (
                      <p className="text-sm text-destructive">{form.formState.errors.drExpenseHeadId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="drAmount">Debit Amount *</Label>
                    <Input
                      id="drAmount"
                      type="number"
                      step="0.01"
                      {...form.register("drAmount", { valueAsNumber: true })}
                      placeholder="0.00"
                      className="bg-white"
                    />
                    {form.formState.errors.drAmount && (
                      <p className="text-sm text-destructive">{form.formState.errors.drAmount.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="text-lg font-semibold mb-3 text-green-900 flex items-center gap-2">
                  <span className="bg-green-600 text-white px-2 py-1 rounded text-sm">CREDIT</span>
                  Credit Entry (Cr)
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="crProjectId">Credit Project *</Label>
                    <Select
                      value={form.watch("crProjectId")?.toString()}
                      onValueChange={(value) => form.setValue("crProjectId", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select credit project" />
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
                    {form.formState.errors.crProjectId && (
                      <p className="text-sm text-destructive">{form.formState.errors.crProjectId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="crExpenseHeadId">Credit Head of Account *</Label>
                    <Select
                      value={form.watch("crExpenseHeadId")?.toString()}
                      onValueChange={(value) => form.setValue("crExpenseHeadId", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select credit account" />
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
                    {form.formState.errors.crExpenseHeadId && (
                      <p className="text-sm text-destructive">{form.formState.errors.crExpenseHeadId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="crAmount">Credit Amount *</Label>
                    <Input
                      id="crAmount"
                      type="number"
                      step="0.01"
                      {...form.register("crAmount", { valueAsNumber: true })}
                      placeholder="0.00"
                      className="bg-white"
                    />
                    {form.formState.errors.crAmount && (
                      <p className="text-sm text-destructive">{form.formState.errors.crAmount.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="billNo">Bill/Reference No</Label>
                    <Input
                      id="billNo"
                      {...form.register("billNo")}
                      placeholder="Enter bill or reference number"
                    />
                  </div>

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
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="description">Description/Notes</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Enter journal entry description or narration"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isConfirmed"
                  {...form.register("isConfirmed")}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isConfirmed" className="cursor-pointer">
                  Confirm & Finalize
                </Label>
              </div>

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
                <Button type="submit" disabled={createVoucher.isPending || !isBalanced}>
                  {createVoucher.isPending ? "Creating..." : "Create Journal Entry"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                  placeholder="Search by voucher no, project, bill no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Journal Vouchers</CardTitle>
          <CardDescription>
            All journal entries with double-entry bookkeeping ({filteredVouchers.length} records)
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
                    <TableHead>Bill No</TableHead>
                    <TableHead className="text-right">Debit Amount</TableHead>
                    <TableHead className="text-right">Credit Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No journal vouchers found. Create your first journal entry to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVouchers.map((voucher, index) => (
                      <TableRow key={voucher.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{voucher.voucher_no}</TableCell>
                        <TableCell>{new Date(voucher.date).toLocaleDateString()}</TableCell>
                        <TableCell>{voucher.project_name}</TableCell>
                        <TableCell>{voucher.bill_no || "-"}</TableCell>
                        <TableCell className="text-right font-medium text-blue-600">
                          {Number(voucher.amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {Number(voucher.amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={voucher.is_confirmed ? "default" : "secondary"}>
                            {voucher.is_confirmed ? "Confirmed" : "Pending"}
                          </Badge>
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
