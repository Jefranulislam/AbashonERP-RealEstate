"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import { useBankCashAccounts, useCreateBankCashAccount } from "@/lib/hooks/use-finance"
import { useUIStore } from "@/lib/stores/ui-store"
import { bankCashAccountSchema, type BankCashAccountFormData } from "@/lib/validations/finance"

const DIALOG_ID = "bank-cash-dialog"

export default function BankCashPage() {
  const { data: accounts = [], isLoading } = useBankCashAccounts()
  const createAccount = useCreateBankCashAccount()
  const { dialogs, openDialog, closeDialog } = useUIStore()
  const isOpen = dialogs[DIALOG_ID] || false

  const form = useForm<BankCashAccountFormData>({
    resolver: zodResolver(bankCashAccountSchema),
    defaultValues: {
      accountTitle: "",
      accountNumber: "",
      bankName: "",
      branch: "",
      description: "",
      isActive: true,
    },
  })

  async function onSubmit(data: BankCashAccountFormData) {
    await createAccount.mutateAsync(data)
    form.reset()
    closeDialog(DIALOG_ID)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bank & Cash Accounts</h1>
        <Dialog open={isOpen} onOpenChange={(open) => open ? openDialog(DIALOG_ID) : closeDialog(DIALOG_ID)}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bank/Cash Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="accountTitle">Account Title *</Label>
                <Input
                  id="accountTitle"
                  placeholder="e.g., City Bank - Checking"
                  {...form.register("accountTitle")}
                />
                {form.formState.errors.accountTitle && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.accountTitle.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="Account number"
                  {...form.register("accountNumber")}
                />
              </div>
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  placeholder="Bank name (if applicable)"
                  {...form.register("bankName")}
                />
              </div>
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  placeholder="Branch name"
                  {...form.register("branch")}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional description"
                  {...form.register("description")}
                />
              </div>
              <Button type="submit" disabled={createAccount.isPending}>
                {createAccount.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SL No.</TableHead>
              <TableHead>Account Title</TableHead>
              <TableHead>Bank Name</TableHead>
              <TableHead>Account Number</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No accounts found. Click "Add Account" to create one.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account: any, index: number) => (
                <TableRow key={account.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{account.account_title}</TableCell>
                  <TableCell>{account.bank_name || "-"}</TableCell>
                  <TableCell>{account.account_number || "-"}</TableCell>
                  <TableCell>{account.branch || "-"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${account.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {account.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
