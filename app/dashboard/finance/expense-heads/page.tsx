"use client"

import { useEffect, useState } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Plus, 
  Search, 
  FolderTree, 
  Folder, 
  File, 
  ChevronRight,
  Info,
  Edit,
  Trash2
} from "lucide-react"
import axios from "axios"

interface ExpenseHead {
  id: number
  head_name: string
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
}

export default function ExpenseHeadsPage() {
  const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([])
  const [filteredHeads, setFilteredHeads] = useState<ExpenseHead[]>([])
  const [expenseTypes, setExpenseTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterLevel, setFilterLevel] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    headName: "",
    parentId: "",
    isGroup: false,
    type: "Dr",
    unit: "",
    incExpTypeId: ""
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [headsRes, typesRes] = await Promise.all([
        axios.get("/api/finance/expense-heads"),
        axios.get("/api/initial-expense-heads")
      ])
      
      setExpenseHeads(headsRes.data.expenseHeads || [])
      setFilteredHeads(headsRes.data.expenseHeads || [])
      setExpenseTypes(typesRes.data.expenseTypes || [])
    } catch (error) {
      console.error("Error fetching data:", error)
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
      head.full_path?.toLowerCase().includes(search.toLowerCase())
    )

    if (filterLevel !== "all") {
      if (filterLevel === "groups") {
        filtered = filtered.filter(h => h.is_group)
      } else if (filterLevel === "ledgers") {
        filtered = filtered.filter(h => !h.is_group)
      } else {
        filtered = filtered.filter(h => h.level === parseInt(filterLevel))
      }
    }

    setFilteredHeads(filtered)
  }, [search, filterLevel, expenseHeads])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await axios.post("/api/finance/expense-heads", {
        headName: formData.headName,
        parentId: formData.parentId || null,
        isGroup: formData.isGroup,
        type: formData.type,
        unit: formData.unit || null,
        incExpTypeId: formData.incExpTypeId || null
      })

      alert("Account head created successfully!")
      setDialogOpen(false)
      setFormData({
        headName: "",
        parentId: "",
        isGroup: false,
        type: "Dr",
        unit: "",
        incExpTypeId: ""
      })
      fetchData()
    } catch (error) {
      console.error("Error creating account head:", error)
      alert("Failed to create account head")
    }
  }

  const getIcon = (head: ExpenseHead) => {
    if (head.is_group) {
      return <Folder className="h-4 w-4 text-yellow-600" />
    }
    return <File className="h-4 w-4 text-blue-600" />
  }

  const getIndentation = (level: number) => {
    return `${level * 24}px`
  }

  // Get only parent groups for the parent selector
  const parentGroups = expenseHeads.filter(h => h.is_group)

  return (
    <div className="p-6">
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Hierarchical Account Heads / Ledger Groups</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Groups:</strong> Create account groups (e.g., Construction Material, Labor Cost)</li>
            <li><strong>Sub-accounts:</strong> Add ledger accounts under groups (e.g., Steel, Sand, Bricks under Construction Material)</li>
            <li><strong>Multi-level:</strong> Support unlimited nesting levels for complex structures</li>
            <li><strong>Path Display:</strong> Shows full hierarchy path (e.g., "Construction Material {"> "}Steel")</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Expense Heads & Account Groups</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Account Head
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Account Head / Ledger Group</DialogTitle>
              <DialogDescription>
                Create a new account group or ledger account. Groups can contain sub-accounts.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="isGroup"
                  checked={formData.isGroup}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isGroup: checked as boolean })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="isGroup" className="text-sm font-medium cursor-pointer">
                    This is a Group/Category (not a ledger account)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check this if creating a parent group that will contain sub-accounts
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account Head Name *</Label>
                  <Input
                    placeholder={formData.isGroup ? "e.g., Construction Material" : "e.g., Steel"}
                    value={formData.headName}
                    onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Parent Group</Label>
                  <Select
                    value={formData.parentId}
                    onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (Top Level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (Top Level)</SelectItem>
                      {parentGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.full_path || group.head_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a parent group to nest this account
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dr">Debit (Dr)</SelectItem>
                      <SelectItem value="Cr">Credit (Cr)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Unit of Measurement</Label>
                  <Input
                    placeholder={formData.isGroup ? "Leave empty for groups" : "e.g., TON, CFT, BAG"}
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    disabled={formData.isGroup}
                  />
                </div>

                <div>
                  <Label>Expense Type</Label>
                  <Select
                    value={formData.incExpTypeId}
                    onValueChange={(value) => setFormData({ ...formData, incExpTypeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {expenseTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create {formData.isGroup ? "Group" : "Account"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search account heads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="groups">Groups Only</SelectItem>
                  <SelectItem value="ledgers">Ledgers Only</SelectItem>
                  <SelectItem value="0">Level 0 (Top)</SelectItem>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchical Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Account Heads Hierarchy
          </CardTitle>
          <CardDescription>
            {filteredHeads.length} account heads found • 
            {filteredHeads.filter(h => h.is_group).length} groups • 
            {filteredHeads.filter(h => !h.is_group).length} ledger accounts
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
                    <TableHead className="w-[400px]">Account Name</TableHead>
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
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No account heads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHeads.map((head) => (
                      <TableRow key={head.id}>
                        <TableCell>
                          <div className="flex items-center gap-2" style={{ paddingLeft: getIndentation(head.level) }}>
                            {head.level > 0 && (
                              <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            )}
                            {getIcon(head)}
                            <div>
                              <div className="font-medium">{head.head_name}</div>
                              {head.level > 0 && head.full_path && (
                                <div className="text-xs text-muted-foreground">
                                  {head.full_path}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={head.type === "Dr" ? "default" : "secondary"}>
                            {head.type}
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
                          <span className="text-sm text-muted-foreground">
                            {head.unit || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            L{head.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={head.is_active ? "default" : "secondary"}>
                            {head.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Account Heads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenseHeads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {expenseHeads.filter(h => h.is_group).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ledger Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {expenseHeads.filter(h => !h.is_group).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Max Depth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...expenseHeads.map(h => h.level), 0) + 1}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
