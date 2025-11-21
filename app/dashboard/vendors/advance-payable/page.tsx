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
import { Loader2, Plus, Edit, Trash2, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface AdvancePayable {
  id: number
  project_id: number
  project_name?: string
  vendor_id?: number
  vendor_name?: string
  constructor_id?: number
  constructor_name?: string
  amount: number
  payment_date: string
  payment_type: string
  payment_method?: string
  reference_number?: string
  description?: string
  status: string
  is_active: boolean
  created_at: string
}

interface Project {
  id: number
  project_name: string
}

interface Vendor {
  id: number
  vendor_name: string
}

interface Constructor {
  id: number
  constructor_name: string
}

interface FormData {
  projectId: number | null
  vendorId: number | null
  constructorId: number | null
  amount: string
  paymentDate: string
  paymentType: string
  paymentMethod: string
  referenceNumber: string
  description: string
  status: string
  recipientType: string
}

export default function AdvancePayablePage() {
  const { toast } = useToast()
  const [advancePayables, setAdvancePayables] = useState<AdvancePayable[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [constructors, setConstructors] = useState<Constructor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPaymentType, setFilterPaymentType] = useState<string>("all")
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AdvancePayable | null>(null)
  const [formData, setFormData] = useState<FormData>({
    projectId: null,
    vendorId: null,
    constructorId: null,
    amount: "",
    paymentDate: "",
    paymentType: "Advance",
    paymentMethod: "Cash",
    referenceNumber: "",
    description: "",
    status: "Pending",
    recipientType: "vendor",
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchAdvancePayables()
  }, [selectedProject, filterStatus, filterPaymentType])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [projectsRes, vendorsRes, constructorsRes, advancePayablesRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/vendors"),
        fetch("/api/constructors"),
        fetch("/api/advance-payables"),
      ])

      const [projectsData, vendorsData, constructorsData, advancePayablesData] = await Promise.all([
        projectsRes.json(),
        vendorsRes.json(),
        constructorsRes.json(),
        advancePayablesRes.json(),
      ])

      setProjects(projectsData.projects || [])
      setVendors(vendorsData.vendors || [])
      setConstructors(constructorsData.constructors || [])
      setAdvancePayables(advancePayablesData.advancePayables || [])
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

  const fetchAdvancePayables = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedProject !== "all") params.append("projectId", selectedProject)
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterPaymentType !== "all") params.append("paymentType", filterPaymentType)

      const response = await fetch(`/api/advance-payables?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setAdvancePayables(data.advancePayables || [])
      }
    } catch (error) {
      console.error("Error fetching advance payables:", error)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | number | null) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      }

      // Clear vendor/constructor based on recipient type
      if (field === "recipientType") {
        if (value === "vendor") {
          newData.constructorId = null
        } else {
          newData.vendorId = null
        }
      }

      return newData
    })
  }

  const resetForm = () => {
    setFormData({
      projectId: null,
      vendorId: null,
      constructorId: null,
      amount: "",
      paymentDate: "",
      paymentType: "Advance",
      paymentMethod: "Cash",
      referenceNumber: "",
      description: "",
      status: "Pending",
      recipientType: "vendor",
    })
  }

  const handleCreate = async () => {
    try {
      setSaving(true)

      if (!formData.projectId || !formData.amount || !formData.paymentDate) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      if (!formData.vendorId && !formData.constructorId) {
        toast({
          title: "Validation Error",
          description: "Please select either a vendor or constructor",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/advance-payables", {
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
          description: "Payment record created successfully",
        })
        setOpen(false)
        resetForm()
        fetchData()
      } else {
        throw new Error(data.error || "Failed to create record")
      }
    } catch (error) {
      console.error("Error creating record:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create record",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (record: AdvancePayable) => {
    setSelectedRecord(record)
    setFormData({
      projectId: record.project_id,
      vendorId: record.vendor_id || null,
      constructorId: record.constructor_id || null,
      amount: record.amount.toString(),
      paymentDate: record.payment_date?.split("T")[0] || "",
      paymentType: record.payment_type || "Advance",
      paymentMethod: record.payment_method || "Cash",
      referenceNumber: record.reference_number || "",
      description: record.description || "",
      status: record.status || "Pending",
      recipientType: record.vendor_id ? "vendor" : "constructor",
    })
    setEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedRecord) return

    try {
      setSaving(true)

      const response = await fetch(`/api/advance-payables/${selectedRecord.id}`, {
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
          description: "Payment record updated successfully",
        })
        setEditOpen(false)
        setSelectedRecord(null)
        resetForm()
        fetchData()
      } else {
        throw new Error(data.error || "Failed to update record")
      }
    } catch (error) {
      console.error("Error updating record:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update record",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (record: AdvancePayable) => {
    setSelectedRecord(record)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedRecord) return

    try {
      setSaving(true)

      const response = await fetch(`/api/advance-payables/${selectedRecord.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Payment record deleted successfully",
        })
        setDeleteOpen(false)
        setSelectedRecord(null)
        fetchData()
      } else {
        throw new Error(data.error || "Failed to delete record")
      }
    } catch (error) {
      console.error("Error deleting record:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete record",
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
      case "Paid":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Paid</Badge>
      case "Partial":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Partial</Badge>
      case "Cancelled":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>
    }
  }

  const getPaymentTypeBadge = (type: string) => {
    switch (type) {
      case "Payment":
        return <Badge variant="outline" className="bg-purple-50">Payment</Badge>
      case "Payable":
        return <Badge variant="outline" className="bg-orange-50">Payable</Badge>
      default:
        return <Badge variant="outline" className="bg-blue-50">Advance</Badge>
    }
  }

  const calculateTotalAmount = () => {
    return advancePayables.reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  const renderForm = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Project *</Label>
          <Select
            value={formData.projectId?.toString() || ""}
            onValueChange={(value) => handleInputChange("projectId", value ? parseInt(value) : null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.project_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Recipient Type *</Label>
          <Select
            value={formData.recipientType}
            onValueChange={(value) => handleInputChange("recipientType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vendor">Vendor</SelectItem>
              <SelectItem value="constructor">Constructor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {formData.recipientType === "vendor" ? (
          <div>
            <Label>Vendor *</Label>
            <Select
              value={formData.vendorId?.toString() || ""}
              onValueChange={(value) => handleInputChange("vendorId", value ? parseInt(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id.toString()}>
                    {vendor.vendor_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div>
            <Label>Constructor *</Label>
            <Select
              value={formData.constructorId?.toString() || ""}
              onValueChange={(value) => handleInputChange("constructorId", value ? parseInt(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select constructor" />
              </SelectTrigger>
              <SelectContent>
                {constructors.map((constructor) => (
                  <SelectItem key={constructor.id} value={constructor.id.toString()}>
                    {constructor.constructor_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label>Payment Type</Label>
          <Select value={formData.paymentType} onValueChange={(value) => handleInputChange("paymentType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Advance">Advance</SelectItem>
              <SelectItem value="Payable">Payable</SelectItem>
              <SelectItem value="Payment">Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Amount (৳) *</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => handleInputChange("amount", e.target.value)}
          />
        </div>
        <div>
          <Label>Payment Date *</Label>
          <Input
            type="date"
            value={formData.paymentDate}
            onChange={(e) => handleInputChange("paymentDate", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Payment Method</Label>
          <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange("paymentMethod", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="Online Transfer">Online Transfer</SelectItem>
              <SelectItem value="Mobile Banking">Mobile Banking</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Reference Number</Label>
        <Input
          placeholder="Enter reference/transaction number"
          value={formData.referenceNumber}
          onChange={(e) => handleInputChange("referenceNumber", e.target.value)}
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          placeholder="Enter payment details or notes..."
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Advance/Payable Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Payment Record</DialogTitle>
            </DialogHeader>
            {renderForm()}
            <Button onClick={handleCreate} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Creating..." : "Create Payment"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Payment Record</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <Button onClick={handleUpdate} disabled={saving} className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Updating..." : "Update Payment"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the payment record for ৳{selectedRecord?.amount}. This action cannot be undone.
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
          <strong>✓ Active:</strong> Advance/Payable Management is fully operational. Track all payments to vendors and constructors by project.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <Label>Filter by Project</Label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.project_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Filter by Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Filter by Type</Label>
          <Select value={filterPaymentType} onValueChange={setFilterPaymentType}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Advance">Advance</SelectItem>
              <SelectItem value="Payable">Payable</SelectItem>
              <SelectItem value="Payment">Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-900">Total Amount:</span>
          </div>
          <span className="text-2xl font-bold text-blue-900">৳ {formatAmount(calculateTotalAmount())}</span>
        </div>
        <p className="text-xs text-blue-700 mt-1">
          Showing {advancePayables.length} record{advancePayables.length !== 1 ? 's' : ''}
        </p>
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
                <TableHead>Project Name</TableHead>
                <TableHead>Vendor/Constructor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount (৳)</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advancePayables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No advance/payable records found. Click "Add Payment" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                advancePayables.map((record, index) => (
                  <TableRow key={record.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{record.project_name || "N/A"}</TableCell>
                    <TableCell>{record.vendor_name || record.constructor_name || "N/A"}</TableCell>
                    <TableCell>{getPaymentTypeBadge(record.payment_type)}</TableCell>
                    <TableCell className="font-semibold">৳ {formatAmount(record.amount)}</TableCell>
                    <TableCell>{formatDate(record.payment_date)}</TableCell>
                    <TableCell>{record.payment_method || "N/A"}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(record)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(record)}
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
          <li>✓ Record advance payments to vendors and constructors</li>
          <li>✓ Track payables by project with filtering</li>
          <li>✓ Multiple payment types (Advance, Payable, Payment)</li>
          <li>✓ Multiple payment methods (Cash, Cheque, Bank Transfer, etc.)</li>
          <li>✓ Status tracking (Pending, Paid, Partial, Cancelled)</li>
          <li>✓ Payment history and reconciliation</li>
          <li>✓ Auto-calculation of total amounts</li>
          <li>Coming Soon: Payment reminders and notifications</li>
          <li>Coming Soon: Outstanding balance calculations</li>
          <li>Coming Soon: Export payment reports (PDF/Excel)</li>
        </ul>
      </div>
    </div>
  )
}
