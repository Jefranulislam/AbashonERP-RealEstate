"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Plus, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Cheque {
  id: number
  customer_id: number
  customer_name?: string
  cheque_number: string
  bank_name: string
  branch_name?: string
  cheque_amount: number
  cheque_date: string
  received_date?: string
  submitted_date?: string
  cleared_date?: string
  is_submitted: boolean
  status: string
  remarks?: string
  created_at: string
}

interface Customer {
  id: number
  customer_name: string
}

interface ChequeFormData {
  customerId: number | null
  chequeNumber: string
  bankName: string
  branchName: string
  chequeAmount: string
  chequeDate: string
  receivedDate: string
  submittedDate: string
  clearedDate: string
  status: string
  remarks: string
}

export default function ChequesPage() {
  const { toast } = useToast()
  const [cheques, setCheques] = useState<Cheque[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null)
  const [formData, setFormData] = useState<ChequeFormData>({
    customerId: null,
    chequeNumber: "",
    bankName: "",
    branchName: "",
    chequeAmount: "",
    chequeDate: "",
    receivedDate: "",
    submittedDate: "",
    clearedDate: "",
    status: "Pending",
    remarks: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCheques()
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, filterStatus])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [customersRes, chequesRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/cheques"),
      ])

      const customersData = await customersRes.json()
      const chequesData = await chequesRes.json()

      setCustomers(customersData.customers || [])
      setCheques(chequesData.cheques || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCheques = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (filterStatus !== "all") params.append("status", filterStatus)

      const response = await fetch(`/api/cheques?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setCheques(data.cheques || [])
      }
    } catch (error) {
      console.error("Error fetching cheques:", error)
    }
  }

  const handleInputChange = (field: keyof ChequeFormData, value: string | number | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const resetForm = () => {
    setFormData({
      customerId: null,
      chequeNumber: "",
      bankName: "",
      branchName: "",
      chequeAmount: "",
      chequeDate: "",
      receivedDate: "",
      submittedDate: "",
      clearedDate: "",
      status: "Pending",
      remarks: "",
    })
  }

  const handleCreateCheque = async () => {
    try {
      setSaving(true)

      if (!formData.chequeNumber || !formData.chequeAmount || !formData.chequeDate) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/cheques", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Cheque record created successfully",
        })
        setOpen(false)
        resetForm()
        fetchData()
      } else {
        throw new Error(data.error || "Failed to create cheque")
      }
    } catch (error) {
      console.error("Error creating cheque:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create cheque",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditCheque = (cheque: Cheque) => {
    setSelectedCheque(cheque)
    setFormData({
      customerId: cheque.customer_id,
      chequeNumber: cheque.cheque_number,
      bankName: cheque.bank_name || "",
      branchName: cheque.branch_name || "",
      chequeAmount: cheque.cheque_amount.toString(),
      chequeDate: cheque.cheque_date?.split("T")[0] || "",
      receivedDate: cheque.received_date?.split("T")[0] || "",
      submittedDate: cheque.submitted_date?.split("T")[0] || "",
      clearedDate: cheque.cleared_date?.split("T")[0] || "",
      status: cheque.status || "Pending",
      remarks: cheque.remarks || "",
    })
    setEditOpen(true)
  }

  const handleUpdateCheque = async () => {
    if (!selectedCheque) return

    try {
      setSaving(true)

      const response = await fetch(`/api/cheques/${selectedCheque.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Cheque updated successfully",
        })
        setEditOpen(false)
        setSelectedCheque(null)
        resetForm()
        fetchData()
      } else {
        throw new Error(data.error || "Failed to update cheque")
      }
    } catch (error) {
      console.error("Error updating cheque:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update cheque",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCheque = (cheque: Cheque) => {
    setSelectedCheque(cheque)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedCheque) return

    try {
      setSaving(true)

      const response = await fetch(`/api/cheques/${selectedCheque.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Cheque deleted successfully",
        })
        setDeleteOpen(false)
        setSelectedCheque(null)
        fetchData()
      } else {
        throw new Error(data.error || "Failed to delete cheque")
      }
    } catch (error) {
      console.error("Error deleting cheque:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete cheque",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Cleared":
        return <Badge className="bg-green-100 text-green-800 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Cleared</Badge>
      case "Submitted":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Submitted</Badge>
      case "Bounced":
        return <Badge className="bg-red-100 text-red-800 border-red-300"><XCircle className="h-3 w-3 mr-1" />Bounced</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>
    }
  }

  const renderForm = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Customer</Label>
          <Select
            value={formData.customerId?.toString() || ""}
            onValueChange={(value) => handleInputChange("customerId", value ? parseInt(value) : null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.customer_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Cheque Number *</Label>
          <Input
            placeholder="Enter cheque number"
            value={formData.chequeNumber}
            onChange={(e) => handleInputChange("chequeNumber", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Bank Name</Label>
          <Input
            placeholder="Enter bank name"
            value={formData.bankName}
            onChange={(e) => handleInputChange("bankName", e.target.value)}
          />
        </div>
        <div>
          <Label>Branch Name</Label>
          <Input
            placeholder="Enter branch name"
            value={formData.branchName}
            onChange={(e) => handleInputChange("branchName", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cheque Amount (৳) *</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={formData.chequeAmount}
            onChange={(e) => handleInputChange("chequeAmount", e.target.value)}
          />
        </div>
        <div>
          <Label>Cheque Date *</Label>
          <Input
            type="date"
            value={formData.chequeDate}
            onChange={(e) => handleInputChange("chequeDate", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Received Date</Label>
          <Input
            type="date"
            value={formData.receivedDate}
            onChange={(e) => handleInputChange("receivedDate", e.target.value)}
          />
        </div>
        <div>
          <Label>Submitted Date</Label>
          <Input
            type="date"
            value={formData.submittedDate}
            onChange={(e) => handleInputChange("submittedDate", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cleared Date</Label>
          <Input
            type="date"
            value={formData.clearedDate}
            onChange={(e) => handleInputChange("clearedDate", e.target.value)}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Cleared">Cleared</SelectItem>
              <SelectItem value="Bounced">Bounced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Remarks</Label>
        <Textarea
          placeholder="Enter any additional notes..."
          value={formData.remarks}
          onChange={(e) => handleInputChange("remarks", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cheques Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Cheque
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Cheque</DialogTitle>
            </DialogHeader>
            {renderForm()}
            <Button onClick={handleCreateCheque} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Creating..." : "Create Cheque"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Cheque</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <Button onClick={handleUpdateCheque} disabled={saving} className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Updating..." : "Update Cheque"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete cheque #{selectedCheque?.cheque_number}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-green-800">
          <strong>✓ Active:</strong> Cheques Management is fully operational. Track customer cheque receipts, submission status, and clearances.
        </p>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <Label>Search Cheques</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by cheque number, customer, or bank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <Label>Filter by Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Cleared">Cleared</SelectItem>
              <SelectItem value="Bounced">Bounced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SL No.</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Cheque Number</TableHead>
                <TableHead>Bank Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Amount (৳)</TableHead>
                <TableHead>Cheque Date</TableHead>
                <TableHead>Received Date</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cheques.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground">
                    No cheques found. Click "Add Cheque" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                cheques.map((cheque, index) => (
                  <TableRow key={cheque.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{cheque.customer_name || "N/A"}</TableCell>
                    <TableCell>{cheque.cheque_number}</TableCell>
                    <TableCell>{cheque.bank_name || "N/A"}</TableCell>
                    <TableCell>{cheque.branch_name || "N/A"}</TableCell>
                    <TableCell className="font-semibold">৳ {formatAmount(cheque.cheque_amount)}</TableCell>
                    <TableCell>{formatDate(cheque.cheque_date)}</TableCell>
                    <TableCell>{formatDate(cheque.received_date)}</TableCell>
                    <TableCell>{formatDate(cheque.submitted_date)}</TableCell>
                    <TableCell>{getStatusBadge(cheque.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEditCheque(cheque)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCheque(cheque)}
                          className="text-red-600 hover:text-red-700"
                        >
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

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Features:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>✓ Record customer cheque receipts with bank details</li>
          <li>✓ Track cheque submission to bank</li>
          <li>✓ Mark cheques as Pending, Submitted, Cleared, or Bounced</li>
          <li>✓ Search and filter cheques by status</li>
          <li>✓ Full CRUD operations (Create, Read, Update, Delete)</li>
          <li>Coming Soon: Cheque clearance reminders and notifications</li>
          <li>Coming Soon: Export cheque reports for accounting</li>
          <li>Coming Soon: Link cheques to sales invoices</li>
        </ul>
      </div>
    </div>
  )
}
