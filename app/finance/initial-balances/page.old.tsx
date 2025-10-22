"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"

export default function InitialBalancesPage() {
  const [loading, setLoading] = useState(false)
  const [bankCashAccounts, setBankCashAccounts] = useState<any[]>([])
  const [expenseHeads, setExpenseHeads] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [initialBankCash, setInitialBankCash] = useState<any[]>([])
  const [initialExpenseHeads, setInitialExpenseHeads] = useState<any[]>([])
  
  const [openBankCash, setOpenBankCash] = useState(false)
  const [openExpenseHead, setOpenExpenseHead] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [bankCashForm, setBankCashForm] = useState({
    bankCashId: "",
    initialBalance: "",
    date: new Date().toISOString().split("T")[0],
    isConfirmed: false,
  })
  
  const [expenseHeadForm, setExpenseHeadForm] = useState({
    projectId: "",
    expenseHeadId: "",
    initialBalance: "",
    date: new Date().toISOString().split("T")[0],
    isConfirmed: false,
  })
  
  const { toast } = useToast()

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [bankRes, headRes, projRes, initBankRes, initHeadRes] = await Promise.all([
        fetch("/api/finance/bank-cash"),
        fetch("/api/finance/expense-heads"),
        fetch("/api/projects"),
        fetch("/api/initial-bank-cash"),
        fetch("/api/initial-expense-heads"),
      ])

      const [bankData, headData, projData, initBankData, initHeadData] = await Promise.all([
        bankRes.json(),
        headRes.json(),
        projRes.json(),
        initBankRes.json(),
        initHeadRes.json(),
      ])

      if (bankRes.ok) setBankCashAccounts(bankData.bankCashAccounts || [])
      if (headRes.ok) setExpenseHeads(headData.expenseHeads || [])
      if (projRes.ok) setProjects(projData.projects || [])
      if (initBankRes.ok) setInitialBankCash(initBankData.initialBankCash || [])
      if (initHeadRes.ok) setInitialExpenseHeads(initHeadData.initialExpenseHeads || [])
    } catch (err) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleBankCashSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bankCashForm.bankCashId || !bankCashForm.initialBalance) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/initial-bank-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankCashId: parseInt(bankCashForm.bankCashId),
          initialBalance: parseFloat(bankCashForm.initialBalance),
          date: bankCashForm.date,
          isConfirmed: bankCashForm.isConfirmed,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Success", description: "Initial balance set successfully" })
        setOpenBankCash(false)
        setBankCashForm({
          bankCashId: "",
          initialBalance: "",
          date: new Date().toISOString().split("T")[0],
          isConfirmed: false,
        })
        fetchAll()
      } else {
        toast({ title: "Error", description: data.error || "Failed to set balance", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function handleExpenseHeadSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!expenseHeadForm.projectId || !expenseHeadForm.expenseHeadId || !expenseHeadForm.initialBalance) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/initial-expense-heads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: parseInt(expenseHeadForm.projectId),
          expenseHeadId: parseInt(expenseHeadForm.expenseHeadId),
          initialBalance: parseFloat(expenseHeadForm.initialBalance),
          date: expenseHeadForm.date,
          isConfirmed: expenseHeadForm.isConfirmed,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Success", description: "Initial balance set successfully" })
        setOpenExpenseHead(false)
        setExpenseHeadForm({
          projectId: "",
          expenseHeadId: "",
          initialBalance: "",
          date: new Date().toISOString().split("T")[0],
          isConfirmed: false,
        })
        fetchAll()
      } else {
        toast({ title: "Error", description: data.error || "Failed to set balance", variant: "destructive" })
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
        <h1 className="text-3xl font-bold">Initial Balances</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Bank & Cash Opening Balances</CardTitle>
                <CardDescription>Set initial balances for bank and cash accounts</CardDescription>
              </div>
              <Dialog open={openBankCash} onOpenChange={setOpenBankCash}>
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
                  <form onSubmit={handleBankCashSubmit} className="space-y-4">
                    <div>
                      <Label>Account *</Label>
                      <Select
                        value={bankCashForm.bankCashId}
                        onValueChange={(value) => setBankCashForm({ ...bankCashForm, bankCashId: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankCashAccounts.map((acc) => (
                            <SelectItem key={acc.id} value={String(acc.id)}>
                              {acc.account_title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Initial Balance *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={bankCashForm.initialBalance}
                        onChange={(e) => setBankCashForm({ ...bankCashForm, initialBalance: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>As of Date *</Label>
                      <Input
                        type="date"
                        value={bankCashForm.date}
                        onChange={(e) => setBankCashForm({ ...bankCashForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                  {loading ? (
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
                    initialBankCash.map((item) => (
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

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Expense Heads Opening Balances</CardTitle>
                <CardDescription>Set initial balances for expense accounts per project</CardDescription>
              </div>
              <Dialog open={openExpenseHead} onOpenChange={setOpenExpenseHead}>
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
                  <form onSubmit={handleExpenseHeadSubmit} className="space-y-4">
                    <div>
                      <Label>Project *</Label>
                      <Select
                        value={expenseHeadForm.projectId}
                        onValueChange={(value) => setExpenseHeadForm({ ...expenseHeadForm, projectId: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((proj) => (
                            <SelectItem key={proj.id} value={String(proj.id)}>
                              {proj.project_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Expense Head *</Label>
                      <Select
                        value={expenseHeadForm.expenseHeadId}
                        onValueChange={(value) => setExpenseHeadForm({ ...expenseHeadForm, expenseHeadId: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select expense head" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseHeads.map((head) => (
                            <SelectItem key={head.id} value={String(head.id)}>
                              {head.head_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Initial Balance *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={expenseHeadForm.initialBalance}
                        onChange={(e) => setExpenseHeadForm({ ...expenseHeadForm, initialBalance: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>As of Date *</Label>
                      <Input
                        type="date"
                        value={expenseHeadForm.date}
                        onChange={(e) => setExpenseHeadForm({ ...expenseHeadForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                  {loading ? (
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
                    initialExpenseHeads.map((item) => (
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
