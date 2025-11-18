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
import { useFinanceTypes, useCreateFinanceType, useUpdateFinanceType, useDeleteFinanceType } from "@/lib/hooks/use-finance"
import { useUIStore } from "@/lib/stores/ui-store"
import { financeTypeSchema, type FinanceTypeFormData } from "@/lib/validations/finance"
import { useState } from "react"

const DIALOG_ID = "finance-type-dialog"

export default function FinanceTypesPage() {
  const { data: types = [], isLoading } = useFinanceTypes()
  const createType = useCreateFinanceType()
  const updateType = useUpdateFinanceType()
  const deleteType = useDeleteFinanceType()
  const { dialogs, openDialog, closeDialog } = useUIStore()
  const isOpen = dialogs[DIALOG_ID] || false
  const [editingType, setEditingType] = useState<any>(null)

  const form = useForm<FinanceTypeFormData>({
    resolver: zodResolver(financeTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  })

  async function onSubmit(data: FinanceTypeFormData) {
    if (editingType) {
      await updateType.mutateAsync({ id: editingType.id, data })
      setEditingType(null)
    } else {
      await createType.mutateAsync(data)
    }
    form.reset()
    closeDialog(DIALOG_ID)
  }

  function handleEdit(type: any) {
    setEditingType(type)
    form.reset({
      name: type.name,
      description: type.description || "",
      isActive: type.is_active ?? true,
    })
    openDialog(DIALOG_ID)
  }

  async function handleDelete(id: number) {
    if (confirm("Are you sure you want to delete this finance type?")) {
      await deleteType.mutateAsync(id)
    }
  }

  function handleDialogChange(open: boolean) {
    if (open) {
      openDialog(DIALOG_ID)
    } else {
      closeDialog(DIALOG_ID)
      setEditingType(null)
      form.reset()
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Income/Expense Types</h1>
        <Dialog open={isOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingType ? "Edit" : "Add"} Income/Expense Type</DialogTitle>
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
              <Button type="submit" disabled={createType.isPending || updateType.isPending}>
                {(createType.isPending || updateType.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingType ? "Update" : "Save"} Type
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
            ) : types.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
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
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(type)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(type.id)}
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
