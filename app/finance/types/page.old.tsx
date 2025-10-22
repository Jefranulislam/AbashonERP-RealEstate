"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"

export default function IncomeExpenseTypesPage() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [types, setTypes] = useState<any[]>([])
  const [formData, setFormData] = useState({ name: "", isActive: true })
  const { toast } = useToast()

  useEffect(() => {
    fetchTypes()
  }, [])

  async function fetchTypes() {
    setLoading(true)
    try {
      const res = await fetch("/api/finance/types")
      const data = await res.json()
      if (res.ok) {
        setTypes(data.types || [])
      } else {
        toast({ title: "Error", description: data.error || "Failed to fetch types", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Type name is required", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/finance/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Success", description: "Type created successfully" })
        setOpen(false)
        setFormData({ name: "", isActive: true })
        fetchTypes()
      } else {
        toast({ title: "Error", description: data.error || "Failed to create type", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Income/Expense Types</h1>
        <Dialog open={open} onOpenChange={setOpen}>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Type Name *</Label>
                <Input
                  placeholder="e.g., Income, Expense, Administrative"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
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
              types.map((type, index) => (
                <TableRow key={type.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{type.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${type.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {type.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(type.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
