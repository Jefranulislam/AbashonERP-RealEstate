"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import {
  useBankCashAccounts,
  useExpenseHeads,
  useProjects,
  useInitialBankCash,
  useInitialExpenseHeads,
  useCreateInitialBankCash,
  useCreateInitialExpenseHead,
} from "@/lib/hooks/use-finance"
import { useUIStore } from "@/lib/stores/ui-store"
import {
  initialBankCashSchema,
  initialExpenseHeadSchema,
  type InitialBankCashFormData,
  type InitialExpenseHeadFormData,
} from "@/lib/validations/finance"

const BANK_CASH_DIALOG_ID = "initial-bank-cash-dialog"
const EXPENSE_HEAD_DIALOG_ID = "initial-expense-head-dialog"

export default function InitialBalancesPage() {
  const { data: bankCashAccounts = [] } = useBankCashAccounts()
  const { data: expenseHeads = [] } = useExpenseHeads()
  const { data: projects = [] } = useProjects()
  const { data: initialBankCash = [], isLoading: isLoadingBankCash } = useInitialBankCash()
  const { data: initialExpenseHeads = [], isLoading: isLoadingExpenseHeads } = useInitialExpenseHeads()
  
  const createBankCash = useCreateInitialBankCash()
  const createExpenseHead = useCreateInitialExpenseHead()
  
  const { dialogs, openDialog, closeDialog } = useUIStore()
  const isBankCashOpen = dialogs[BANK_CASH_DIALOG_ID] || false
  const isExpenseHeadOpen = dialogs[EXPENSE_HEAD_DIALOG_ID] || false

  const bankCashForm = useForm<InitialBankCashFormData>({
    resolver: zodResolver(initialBankCashSchema),
    defaultValues: {
      bankCashId: 0,
      initialBalance: 0,
      date: new Date().toISOString().split("T")[0],
      isConfirmed: false,
    },
  })

  const expenseHeadForm = useForm<InitialExpenseHeadFormData>({
    resolver: zodResolver(initialExpenseHeadSchema),
    defaultValues: {
      projectId: 0,
      expenseHeadId: 0,
      initialBalance: 0,
      date: new Date().toISOString().split("T")[0],
      isConfirmed: false,
    },
  })

  async function onBankCashSubmit(data: InitialBankCashFormData) {
    await createBankCash.mutateAsync(data)
    bankCashForm.reset()
    closeDialog(BANK_CASH_DIALOG_ID)
  }

  async function onExpenseHeadSubmit(data: InitialExpenseHeadFormData) {
    await createExpenseHead.mutateAsync(data)
    expenseHeadForm.reset()
    closeDialog(EXPENSE_HEAD_DIALOG_ID)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Initial Balances</h1>
      </div>

      <div className="grid gap-6">
        {/* Bank & Cash Opening Balances */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Bank & Cash Opening Balances</CardTitle>
                <CardDescription>Set initial balances for bank and cash accounts</CardDescription>
              </div>
              <Dialog open={isBankCashOpen} onOpenChange={(open) => open ? openDialog(BANK_CASH_DIALOG_ID) : closeDialog(BANK_CASH_DIALOG_ID)}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Balance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Bank/Cash Initial Balance</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={bankCashForm.handleSubmit(onBankCashSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="bankCashId">Account *</Label>
                      <Select
                        value={bankCashForm.watch("bankCashId")?.toString() || ""}
                        onValueChange={(value) => bankCashForm.setValue("bankCashId", parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankCashAccounts.map((acc: any) => (
                            <SelectItem key={acc.id} value={String(acc.id)}>
                              {acc.account_title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {bankCashForm.formState.errors.bankCashId && (
                        <p className="text-sm text-red-500 mt-1">{bankCashForm.formState.errors.bankCashId.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="initialBalance">Initial Balance *</Label>
                      <Input
                        id="initialBalance"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...bankCashForm.register("initialBalance", { valueAsNumber: true })}
                      />
                      {bankCashForm.formState.errors.initialBalance && (
                        <p className="text-sm text-red-500 mt-1">{bankCashForm.formState.errors.initialBalance.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="date">As of Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        {...bankCashForm.register("date")}
                      />
                      {bankCashForm.formState.errors.date && (
                        <p className="text-sm text-red-500 mt-1">{bankCashForm.formState.errors.date.message}</p>
                      )}
                    </div>
                    <Button type="submit" disabled={createBankCash.isPending}>
                      {createBankCash.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Balance
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Opening Balance (৳)</TableHead>
                    <TableHead>As of Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingBankCash ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : initialBankCash.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No balances set. Add accounts first, then set initial balances.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialBankCash.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.account_title || `Account #${item.bank_cash_id}`}</TableCell>
                        <TableCell>{parseFloat(item.initial_balance).toLocaleString()}</TableCell>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${item.is_confirmed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                            {item.is_confirmed ? "Confirmed" : "Pending"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Expense Heads Opening Balances */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Expense Heads Opening Balances</CardTitle>
                <CardDescription>Set initial balances for expense accounts per project</CardDescription>
              </div>
              <Dialog open={isExpenseHeadOpen} onOpenChange={(open) => open ? openDialog(EXPENSE_HEAD_DIALOG_ID) : closeDialog(EXPENSE_HEAD_DIALOG_ID)}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Balance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Expense Head Initial Balance</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={expenseHeadForm.handleSubmit(onExpenseHeadSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="projectId">Project *</Label>
                      <Select
                        value={expenseHeadForm.watch("projectId")?.toString() || ""}
                        onValueChange={(value) => expenseHeadForm.setValue("projectId", parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((proj: any) => (
                            <SelectItem key={proj.id} value={String(proj.id)}>
                              {proj.project_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {expenseHeadForm.formState.errors.projectId && (
                        <p className="text-sm text-red-500 mt-1">{expenseHeadForm.formState.errors.projectId.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="expenseHeadId">Expense Head *</Label>
                      <Select
                        value={expenseHeadForm.watch("expenseHeadId")?.toString() || ""}
                        onValueChange={(value) => expenseHeadForm.setValue("expenseHeadId", parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select expense head" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseHeads.map((head: any) => (
                            <SelectItem key={head.id} value={String(head.id)}>
                              {head.head_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {expenseHeadForm.formState.errors.expenseHeadId && (
                        <p className="text-sm text-red-500 mt-1">{expenseHeadForm.formState.errors.expenseHeadId.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="expenseInitialBalance">Initial Balance *</Label>
                      <Input
                        id="expenseInitialBalance"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...expenseHeadForm.register("initialBalance", { valueAsNumber: true })}
                      />
                      {expenseHeadForm.formState.errors.initialBalance && (
                        <p className="text-sm text-red-500 mt-1">{expenseHeadForm.formState.errors.initialBalance.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="expenseDate">As of Date *</Label>
                      <Input
                        id="expenseDate"
                        type="date"
                        {...expenseHeadForm.register("date")}
                      />
                      {expenseHeadForm.formState.errors.date && (
                        <p className="text-sm text-red-500 mt-1">{expenseHeadForm.formState.errors.date.message}</p>
                      )}
                    </div>
                    <Button type="submit" disabled={createExpenseHead.isPending}>
                      {createExpenseHead.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Balance
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Expense Head</TableHead>
                    <TableHead>Opening Balance (৳)</TableHead>
                    <TableHead>As of Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingExpenseHeads ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : initialExpenseHeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No balances set. Add expense heads first, then set initial balances.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialExpenseHeads.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.project_name || `Project #${item.project_id}`}</TableCell>
                        <TableCell>{item.head_name || `Head #${item.expense_head_id}`}</TableCell>
                        <TableCell>{parseFloat(item.initial_balance).toLocaleString()}</TableCell>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${item.is_confirmed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                            {item.is_confirmed ? "Confirmed" : "Pending"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
