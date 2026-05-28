"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search, FolderTree, Folder, File, ChevronRight, Info, Edit, Trash2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExpenseHead {
  id: number
  head_name: string
  account_code: string | null
  parent_id: number | null
  parent_name: string | null
  is_group: boolean
  level: number
  full_path: string
  type: string
  unit: string | null
  type_name: string | null
  inc_exp_type_id: number | null
  is_active: boolean
  head_type: string | null
  account_category: string | null
}

interface ExpenseType {
  id: number
  name: string
}

type FormData = {
  headName: string
  parentId: string
  isGroup: boolean
  type: string
  unit: string
  incExpTypeId: string
  accountCode: string
  headType: string
  accountCategory: string
  isActive: boolean
}

const EMPTY_FORM: FormData = {
  headName: "",
  parentId: "none",
  isGroup: false,
  type: "Dr",
  unit: "",
  incExpTypeId: "none",
  accountCode: "",
  headType: "",
  accountCategory: "none",
  isActive: true,
}

export default function ExpenseHeadsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([])
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([])
  const [filteredHeads, setFilteredHeads] = useState<ExpenseHead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterLevel, setFilterLevel] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedHead, setSelectedHead] = useState<ExpenseHead | null>(null)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [headsRes, typesRes] = await Promise.allSettled([
        axios.get("/api/finance/expense-heads"),
        axios.get("/api/finance/types"),
      ])

      if (headsRes.status === "fulfilled") {
        setExpenseHeads(headsRes.value.data.expenseHeads || [])
        setFilteredHeads(headsRes.value.data.expenseHeads || [])
      } else {
        console.error("Error fetching expense heads:", headsRes.reason)
        setExpenseHeads([])
        setFilteredHeads([])
      }

      if (typesRes.status === "fulfilled") {
        setExpenseTypes(typesRes.value.data.types || [])
      } else {
        console.error("Error fetching expense types:", typesRes.reason)
        setExpenseTypes([])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({ title: "Error", description: "Failed to load account heads", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = expenseHeads.filter((head) =>
      head.head_name.toLowerCase().includes(search.toLowerCase()) ||
      head.full_path?.toLowerCase().includes(search.toLowerCase()) ||
      head.account_code?.toLowerCase().includes(search.toLowerCase())
    )

    if (filterLevel !== "all") {
      if (filterLevel === "groups") {
        filtered = filtered.filter((h) => h.is_group)
      } else if (filterLevel === "ledgers") {
        filtered = filtered.filter((h) => !h.is_group)
      } else {
        filtered = filtered.filter((h) => h.level === Number.parseInt(filterLevel, 10))
      }
    }

    setFilteredHeads(filtered)
  }, [search, filterLevel, expenseHeads])

  const parentGroups = useMemo(
    () => expenseHeads.filter((head) => head.is_group && head.id !== selectedHead?.id),
    [expenseHeads, selectedHead],
  )

  const resetForm = () => {
    setFormData(EMPTY_FORM)
    setSelectedHead(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (head: ExpenseHead) => {
    setSelectedHead(head)
    setFormData({
      headName: head.head_name || "",
      parentId: head.parent_id ? String(head.parent_id) : "none",
      isGroup: head.is_group,
      type: head.type || "Dr",
      unit: head.unit || "",
      incExpTypeId: head.inc_exp_type_id ? String(head.inc_exp_type_id) : "none",
      accountCode: head.account_code || "",
      headType: head.head_type || "",
      accountCategory: head.account_category || "none",
      isActive: head.is_active,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.headName.trim()) {
      toast({ title: "Validation", description: "Please enter an account head name", variant: "destructive" })
      return
    }

    if (formData.accountCode && !/^[0-9]{4}$/.test(formData.accountCode)) {
      toast({ title: "Validation", description: "Account code must be a 4-digit number", variant: "destructive" })
      return
    }

    const payload = {
      headName: formData.headName.trim(),
      parentId: formData.parentId === "none" ? null : Number(formData.parentId),
      isGroup: formData.isGroup,
      type: formData.type,
      unit: formData.unit || null,
      incExpTypeId: formData.incExpTypeId === "none" ? null : Number(formData.incExpTypeId),
      accountCode: formData.accountCode || null,
      headType: formData.headType || null,
      accountCategory: formData.accountCategory === "none" ? null : formData.accountCategory,
      isActive: formData.isActive,
    }

    try {
      setSaving(true)
      if (selectedHead) {
        await axios.put(`/api/finance/expense-heads/${selectedHead.id}`, payload)
        toast({ title: "Success", description: "Account head updated successfully" })
      } else {
        await axios.post("/api/finance/expense-heads", payload)
        toast({ title: "Success", description: "Account head created successfully" })
      }
      setDialogOpen(false)
      resetForm()
      await fetchData()
    } catch (error) {
      console.error("Error saving account head:", error)
      toast({ title: "Error", description: "Failed to save account head", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this account head?")) return

    try {
      await axios.delete(`/api/finance/expense-heads/${id}`)
      toast({ title: "Success", description: "Account head deleted successfully" })
      await fetchData()
    } catch (error) {
      console.error("Error deleting account head:", error)
      toast({ title: "Error", description: "Failed to delete account head", variant: "destructive" })
    }
  }

  const getIcon = (head: ExpenseHead) => (head.is_group ? <Folder className="h-4 w-4 text-yellow-600" /> : <File className="h-4 w-4 text-blue-600" />)

  const getIndentation = (level: number) => `${level * 24}px`

  return (
    <div className="p-6">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Hierarchical Account Heads / Ledger Groups</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Groups:</strong> Organize related accounts under a parent category.</li>
              <li><strong>Ledgers:</strong> Use these for transaction posting.</li>
              <li><strong>Hierarchy:</strong> Parent groups can be nested.</li>
              <li><strong>Path Display:</strong> Shows the full hierarchy path.</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Expense Heads & Account Groups</h1>
            <p className="text-sm text-muted-foreground">Edit existing account heads or create new ones</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Account Head
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search account heads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Levels</option>
                <option value="groups">Groups Only</option>
                <option value="ledgers">Ledgers Only</option>
                <option value="0">Level 0 (Top)</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Account Heads Hierarchy
            </CardTitle>
            <CardDescription>
              {filteredHeads.length} account heads found • {filteredHeads.filter((h) => h.is_group).length} groups • {filteredHeads.filter((h) => !h.is_group).length} ledger accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[360px]">Account Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          No account heads found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHeads.map((head) => (
                        <TableRow key={head.id}>
                          <TableCell>
                            <div className="flex items-center gap-2" style={{ paddingLeft: getIndentation(head.level) }}>
                              {head.level > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                              {getIcon(head)}
                              <div>
                                <div className="font-medium">{head.head_name}</div>
                                {head.level > 0 && head.full_path && <div className="text-xs text-muted-foreground">{head.full_path}</div>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {head.account_code || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={head.type === "Dr" ? "default" : "secondary"}>
                              {head.type || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {head.is_group ? (
                                <><Folder className="h-3 w-3 mr-1" /> Group</>
                              ) : (
                                <><File className="h-3 w-3 mr-1" /> Ledger</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {head.account_category || head.type_name || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{head.unit || "—"}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">L{head.level}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={head.is_active ? "default" : "secondary"}>
                              {head.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(head)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(head.id)}>
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

        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Account Heads</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{expenseHeads.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Groups</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-yellow-600">{expenseHeads.filter((h) => h.is_group).length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ledger Accounts</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600">{expenseHeads.filter((h) => !h.is_group).length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Max Depth</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{Math.max(...expenseHeads.map((h) => h.level), 0) + 1}</div></CardContent>
          </Card>
        </div>

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedHead ? "Edit Account Head" : "Create Account Head"}</DialogTitle>
            <DialogDescription>Update the account head details below.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core account head settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="headName">Account Head Name *</Label>
                    <Input id="headName" value={formData.headName} onChange={(e) => setFormData({ ...formData, headName: e.target.value })} required />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="parentId">Parent Group</Label>
                    <select
                      id="parentId"
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="none">None (Top Level Account)</option>
                      {parentGroups.map((group) => (
                        <option key={group.id} value={group.id.toString()}>
                          {group.full_path || group.head_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountCode">Account Code</Label>
                    <Input id="accountCode" value={formData.accountCode} onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })} placeholder="e.g. 4001" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Debit/Credit</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="Dr">Debit (Dr)</option>
                      <option value="Cr">Credit (Cr)</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2 flex items-start gap-3 rounded-lg border p-4">
                    <Checkbox
                      id="isGroup"
                      checked={formData.isGroup}
                      onCheckedChange={(checked) => setFormData({ ...formData, isGroup: checked === true, unit: checked === true ? "" : formData.unit })}
                    />
                    <div>
                      <Label htmlFor="isGroup" className="cursor-pointer font-semibold">
                        {formData.isGroup ? "This is a Group/Category" : "This is a Ledger Account"}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Groups organize accounts. Ledgers are used for transactions.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
                <CardDescription>Optional classification and reporting details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit of Measurement</Label>
                    <Input id="unit" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} disabled={formData.isGroup} placeholder={formData.isGroup ? "Not applicable" : "e.g. TON, CFT, BAG"} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incExpTypeId">Expense Type</Label>
                    <select
                      id="incExpTypeId"
                      value={formData.incExpTypeId}
                      onChange={(e) => setFormData({ ...formData, incExpTypeId: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="none">None</option>
                      {expenseTypes.map((type) => (
                        <option key={type.id} value={type.id.toString()}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headType">Head Type</Label>
                    <Input id="headType" value={formData.headType} onChange={(e) => setFormData({ ...formData, headType: e.target.value })} placeholder="e.g. Direct Costs" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountCategory">Account Category</Label>
                    <select
                      id="accountCategory"
                      value={formData.accountCategory}
                      onChange={(e) => setFormData({ ...formData, accountCategory: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="none">None</option>
                      <option value="Current Assets">Current Assets</option>
                      <option value="Fixed Assets">Fixed Assets</option>
                      <option value="Current Liabilities">Current Liabilities</option>
                      <option value="Long-term Liabilities">Long-term Liabilities</option>
                      <option value="Equity">Equity</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Expenses">Expenses</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2 flex items-center gap-3 rounded-lg border p-4">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked === true })}
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : selectedHead ? "Update Account Head" : "Create Account Head"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
