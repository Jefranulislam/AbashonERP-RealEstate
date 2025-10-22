"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"

export default function IncomeExpenseHeadsPage() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [heads, setHeads] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [formData, setFormData] = useState({
    headName: "",
    incExpTypeId: "",
    description: "",
    isActive: true,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchHeads()
    fetchTypes()
  }, [])

  async function fetchTypes() {
    try {
      const res = await fetch("/api/finance/types")
      const data = await res.json()
      if (res.ok) {
        setTypes(data.types || [])
      }
    } catch (err) {
      console.error("Failed to fetch types:", err)
    }
  }

  async function fetchHeads() {
    setLoading(true)
    try {
      const res = await fetch("/api/finance/expense-heads")
      const data = await res.json()
      if (res.ok) {
        setHeads(data.expenseHeads || [])
      } else {
        toast({ title: "Error", description: data.error || "Failed to fetch heads", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.headName.trim()) {
      toast({ title: "Error", description: "Head name is required", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/finance/expense-heads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headName: formData.headName,
          incExpTypeId: formData.incExpTypeId ? parseInt(formData.incExpTypeId) : null,
          description: formData.description,
          isActive: formData.isActive,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Success", description: "Head created successfully" })
        setOpen(false)
        setFormData({ headName: "", incExpTypeId: "", description: "", isActive: true })
        fetchHeads()
      } else {
        toast({ title: "Error", description: data.error || "Failed to create head", variant: "destructive" })
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
        <h1 className="text-3xl font-bold">Income/Expense Heads</h1>
        <Dialog open={open} onOpenChange={setOpen}>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Head Name *</Label>
                <Input
                  placeholder="e.g., Salary, Rent, Utilities"
                  value={formData.headName}
                  onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.incExpTypeId}
                  onValueChange={(value) => setFormData({ ...formData, incExpTypeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
            {loading ? (
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
              heads.map((head, index) => (
                <TableRow key={head.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{head.head_name}</TableCell>
                  <TableCell>{head.type_name || "-"}</TableCell>
                  <TableCell className="max-w-md truncate">{head.description || "-"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${head.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {head.is_active ? "Active" : "Inactive"}
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
