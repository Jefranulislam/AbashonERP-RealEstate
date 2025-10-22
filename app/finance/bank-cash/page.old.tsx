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

export default function BankCashPage() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [formData, setFormData] = useState({
    accountTitle: "",
    accountNumber: "",
    bankName: "",
    branch: "",
    description: "",
    isActive: true,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchAccounts()
  }, [])

  async function fetchAccounts() {
    setLoading(true)
    try {
      const res = await fetch("/api/finance/bank-cash")
      const data = await res.json()
      if (res.ok) {
        setAccounts(data.bankCashAccounts || [])
      } else {
        toast({ title: "Error", description: data.error || "Failed to fetch accounts", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.accountTitle.trim()) {
      toast({ title: "Error", description: "Account title is required", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/finance/bank-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Success", description: "Account created successfully" })
        setOpen(false)
        setFormData({
          accountTitle: "",
          accountNumber: "",
          bankName: "",
          branch: "",
          description: "",
          isActive: true,
        })
        fetchAccounts()
      } else {
        toast({ title: "Error", description: data.error || "Failed to create account", variant: "destructive" })
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
        <h1 className="text-3xl font-bold">Bank & Cash Accounts</h1>
        <Dialog open={open} onOpenChange={setOpen}>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Account Title *</Label>
                <Input
                  placeholder="e.g., City Bank - Checking"
                  value={formData.accountTitle}
                  onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input
                  placeholder="Account number"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>Bank Name</Label>
                <Input
                  placeholder="Bank name (if applicable)"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                />
              </div>
              <div>
                <Label>Branch</Label>
                <Input
                  placeholder="Branch name"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
            {loading ? (
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
              accounts.map((account, index) => (
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
