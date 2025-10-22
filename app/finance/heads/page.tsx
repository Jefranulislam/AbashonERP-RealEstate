"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import { useFinanceTypes, useExpenseHeads, useCreateExpenseHead } from "@/lib/hooks/use-finance"
import { useUIStore } from "@/lib/stores/ui-store"
import { expenseHeadSchema, type ExpenseHeadFormData } from "@/lib/validations/finance"

const DIALOG_ID = "expense-head-dialog"

export default function ExpenseHeadsPage() {
  const { data: heads = [], isLoading } = useExpenseHeads()
  const { data: types = [] } = useFinanceTypes()
  const createHead = useCreateExpenseHead()
  const { dialogs, openDialog, closeDialog } = useUIStore()
  const isOpen = dialogs[DIALOG_ID] || false

  const form = useForm<ExpenseHeadFormData>({
    resolver: zodResolver(expenseHeadSchema),
    defaultValues: {
      headName: "",
      incExpTypeId: undefined,
      description: "",
      isActive: true,
    },
  })

  async function onSubmit(data: ExpenseHeadFormData) {
    await createHead.mutateAsync(data)
    form.reset()
    closeDialog(DIALOG_ID)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Income/Expense Heads</h1>
        <Dialog open={isOpen} onOpenChange={(open) => open ? openDialog(DIALOG_ID) : closeDialog(DIALOG_ID)}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Head
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Income/Expense Head</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="headName">Head Name *</Label>
                <Input
                  id="headName"
                  placeholder="e.g., Salaries, Office Supplies"
                  {...form.register("headName")}
                />
                {form.formState.errors.headName && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.headName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="incExpTypeId">Type</Label>
                <Select
                  value={form.watch("incExpTypeId")?.toString() || ""}
                  onValueChange={(value) => form.setValue("incExpTypeId", value ? parseInt(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type: any) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.incExpTypeId && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.incExpTypeId.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description"
                  {...form.register("description")}
                />
              </div>
              <Button type="submit" disabled={createHead.isPending}>
                {createHead.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Head
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
              <TableHead>Head Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : heads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No heads found. Click "Add Head" to create one.
                </TableCell>
              </TableRow>
            ) : (
              heads.map((head: any, index: number) => (
                <TableRow key={head.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{head.head_name}</TableCell>
                  <TableCell>{head.type_name || "-"}</TableCell>
                  <TableCell>{head.description || "-"}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      Active
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
