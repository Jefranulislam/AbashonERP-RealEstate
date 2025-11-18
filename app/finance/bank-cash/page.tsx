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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useBankCashAccounts, useCreateBankCashAccount, useUpdateBankCashAccount, useDeleteBankCashAccount } from "@/lib/hooks/use-finance"
import { useUIStore } from "@/lib/stores/ui-store"
import { bankCashAccountSchema, type BankCashAccountFormData } from "@/lib/validations/finance"
import { useState } from "react"

const DIALOG_ID = "bank-cash-dialog"

export default function BankCashPage() {
  const { data: accounts = [], isLoading } = useBankCashAccounts()
  const createAccount = useCreateBankCashAccount()
  const updateAccount = useUpdateBankCashAccount()
  const deleteAccount = useDeleteBankCashAccount()
  const { dialogs, openDialog, closeDialog } = useUIStore()
  const isOpen = dialogs[DIALOG_ID] || false
  const [editingAccount, setEditingAccount] = useState<any>(null)

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
    if (editingAccount) {
      await updateAccount.mutateAsync({ id: editingAccount.id, data })
      setEditingAccount(null)
    } else {
      await createAccount.mutateAsync(data)
    }
    form.reset()
    closeDialog(DIALOG_ID)
  }

  function handleEdit(account: any) {
    setEditingAccount(account)
    form.reset({
      accountTitle: account.account_title,
      accountNumber: "",
      bankName: "",
      branch: "",
      description: account.description || "",
      isActive: account.is_active ?? true,
    })
    openDialog(DIALOG_ID)
  }

  async function handleDelete(id: number) {
    if (confirm("Are you sure you want to delete this bank/cash account?")) {
      await deleteAccount.mutateAsync(id)
    }
  }

  function handleDialogChange(open: boolean) {
    if (open) {
      openDialog(DIALOG_ID)
    } else {
      closeDialog(DIALOG_ID)
      setEditingAccount(null)
      form.reset()
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bank & Cash Accounts</h1>
        <Dialog open={isOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Edit" : "Add"} Bank/Cash Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="accountTitle">Account Title *</Label>
                <Input
                  id="accountTitle"
                  placeholder="e.g., City Bank - Checking, Cash on Hand"
                  {...form.register("accountTitle")}
                />
                {form.formState.errors.accountTitle && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.accountTitle.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional description"
                  {...form.register("description")}
                />
              </div>
              <Button type="submit" disabled={createAccount.isPending || updateAccount.isPending}>
                {(createAccount.isPending || updateAccount.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAccount ? "Update" : "Save"} Account
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
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No accounts found. Click "Add Account" to create one.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account: any, index: number) => (
                <TableRow key={account.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{account.account_title}</TableCell>
                  <TableCell>{account.description || "-"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${account.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {account.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(account)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(account.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
