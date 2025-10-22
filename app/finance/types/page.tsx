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
import { useFinanceTypes, useCreateFinanceType } from "@/lib/hooks/use-finance"
import { useUIStore } from "@/lib/stores/ui-store"
import { financeTypeSchema, type FinanceTypeFormData } from "@/lib/validations/finance"

const DIALOG_ID = "finance-type-dialog"

export default function FinanceTypesPage() {
  const { data: types = [], isLoading } = useFinanceTypes()
  const createType = useCreateFinanceType()
  const { dialogs, openDialog, closeDialog } = useUIStore()
  const isOpen = dialogs[DIALOG_ID] || false

  const form = useForm<FinanceTypeFormData>({
    resolver: zodResolver(financeTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  })

  async function onSubmit(data: FinanceTypeFormData) {
    await createType.mutateAsync(data)
    form.reset()
    closeDialog(DIALOG_ID)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Income/Expense Types</h1>
        <Dialog open={isOpen} onOpenChange={(open) => open ? openDialog(DIALOG_ID) : closeDialog(DIALOG_ID)}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Income/Expense Type</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Type Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Revenue, Operating Expense"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
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
              <Button type="submit" disabled={createType.isPending}>
                {createType.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Type
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
              <TableHead>Type Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : types.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No types found. Click "Add Type" to create one.
                </TableCell>
              </TableRow>
            ) : (
              types.map((type: any, index: number) => (
                <TableRow key={type.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{type.name}</TableCell>
                  <TableCell>{type.description || "-"}</TableCell>
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
