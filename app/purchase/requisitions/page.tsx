"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Trash2, Eye, X, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"
import axios from "axios"
import { PurchaseRequisitionPDF } from "@/components/pdf/purchase-requisition-pdf"
import { printDocument, getCompanySettings } from "@/lib/pdf-utils"

export default function PurchaseRequisitionsPage() {
  const [requisitions, setRequisitions] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [expenseHeads, setExpenseHeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [selectedRequisition, setSelectedRequisition] = useState<any>(null)
  const [requisitionItems, setRequisitionItems] = useState<any[]>([])
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [formData, setFormData] = useState({
    projectId: "",
    employeeId: "",
    purposeDescription: "",
    requisitionDate: new Date().toISOString().split("T")[0],
    requiredDate: "",
    comments: "",
    contactPerson: "",
    nb: "",
    remark: "",
  })
  const [items, setItems] = useState([{ expenseHeadId: "", description: "", qty: "", rate: "", totalPrice: "0" }])

  const fetchRequisitions = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await axios.get(`/api/purchase/requisitions?${params.toString()}`)
      setRequisitions(response.data.requisitions)
    } catch (error) {
      console.error("[v0] Error fetching requisitions:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const [projectsRes, employeesRes, expenseHeadsRes] = await Promise.all([
        axios.get("/api/projects"),
        axios.get("/api/employees"),
        axios.get("/api/finance/expense-heads"),
      ])

      setProjects(projectsRes.data.projects)
      setEmployees(employeesRes.data.employees)
      setExpenseHeads(expenseHeadsRes.data.expenseHeads)
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
    }
  }

  useEffect(() => {
    fetchRequisitions()
    fetchData()
    loadCompanySettings()
  }, [search])

  const loadCompanySettings = async () => {
    const settings = await getCompanySettings()
    setCompanySettings(settings)
  }

  const handlePrintRequisition = async (requisition: any) => {
    try {
      const response = await axios.get(`/api/purchase/requisitions/${requisition.id}`)
      setSelectedRequisition(response.data.requisition)
      setRequisitionItems(response.data.items)
      setPrintDialogOpen(true)
      
      // Trigger print after a short delay to ensure content is rendered
      setTimeout(() => {
        printDocument('print-requisition-content')
      }, 100)
    } catch (error) {
      console.error("[v0] Error fetching requisition for print:", error)
      alert("Error loading requisition for printing")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.projectId || !formData.employeeId) {
      alert("Please select both Project and Employee")
      return
    }

    // Validate at least one item with required fields
    const hasValidItems = items.some(
      (item) => item.expenseHeadId && item.description && item.qty && item.rate
    )

    if (!hasValidItems) {
      alert("Please add at least one item with all required fields (Expense Head, Description, Qty, Rate)")
      return
    }

    try {
      await axios.post("/api/purchase/requisitions", {
        ...formData,
        items,
      })
      fetchRequisitions()
      setDialogOpen(false)
      resetForm()
      alert("Requisition submitted successfully!")
    } catch (error) {
      console.error("[v0] Error saving requisition:", error)
      alert("Error submitting requisition. Please try again.")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this requisition?")) return

    try {
      await axios.delete(`/api/purchase/requisitions/${id}`)
      fetchRequisitions()
    } catch (error) {
      console.error("[v0] Error deleting requisition:", error)
    }
  }

  const handleViewRequisition = async (requisition: any) => {
    try {
      const response = await axios.get(`/api/purchase/requisitions/${requisition.id}`)
      setSelectedRequisition(response.data.requisition)
      setRequisitionItems(response.data.items)
      setViewDialogOpen(true)
    } catch (error) {
      console.error("[v0] Error fetching requisition details:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      projectId: "",
      employeeId: "",
      purposeDescription: "",
      requisitionDate: new Date().toISOString().split("T")[0],
      requiredDate: "",
      comments: "",
      contactPerson: "",
      nb: "",
      remark: "",
    })
    setItems([{ expenseHeadId: "", description: "", qty: "", rate: "", totalPrice: "0" }])
  }

  const addItem = () => {
    setItems([...items, { expenseHeadId: "", description: "", qty: "", rate: "", totalPrice: "0" }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Calculate total price
    if (field === "qty" || field === "rate") {
      const qty = Number.parseFloat(newItems[index].qty) || 0
      const rate = Number.parseFloat(newItems[index].rate) || 0
      newItems[index].totalPrice = (qty * rate).toFixed(2)
    }

    setItems(newItems)
  }

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + (Number.parseFloat(item.totalPrice) || 0), 0).toFixed(2)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Requisitions</h1>
          <p className="text-muted-foreground">Manage purchase requisitions and approvals</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Requisition
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] w-[95vw] max-w-[1200px] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Requisition</DialogTitle>
              <DialogDescription>Fill in the requisition information below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project Name *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee Name *</Label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={String(employee.id)}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requisitionDate">Requisition Date *</Label>
                  <Input
                    id="requisitionDate"
                    type="date"
                    value={formData.requisitionDate}
                    onChange={(e) => setFormData({ ...formData, requisitionDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requiredDate">Required Date</Label>
                  <Input
                    id="requiredDate"
                    type="date"
                    value={formData.requiredDate}
                    onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purposeDescription">Purpose/Description</Label>
                <Textarea
                  id="purposeDescription"
                  value={formData.purposeDescription}
                  onChange={(e) => setFormData({ ...formData, purposeDescription: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Items *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
                {items.map((item, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="pt-6">
                      <div className="grid gap-4 md:grid-cols-5">
                        <div className="space-y-2">
                          <Label>Expense Head *</Label>
                          <Select
                            value={item.expenseHeadId}
                            onValueChange={(value) => updateItem(index, "expenseHeadId", value)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
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
                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                            placeholder="Item description"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Qty *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.qty}
                            onChange={(e) => updateItem(index, "qty", e.target.value)}
                            placeholder="0"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rate *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateItem(index, "rate", e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Total</Label>
                          <div className="flex gap-2">
                            <Input value={item.totalPrice} readOnly className="bg-muted" />
                            {items.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex justify-end bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <div className="text-xl font-bold text-blue-900">Total Amount: ৳{getTotalAmount()}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="lg" className="min-w-[200px]">
                  Submit Requisition
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requisitions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requisitions List</CardTitle>
          <CardDescription>View and manage all purchase requisitions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL No.</TableHead>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Requisition Date</TableHead>
                    <TableHead>Required Date</TableHead>
                    <TableHead>MPR NO</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requisitions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No requisitions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    requisitions.map((requisition, index) => (
                      <TableRow key={requisition.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{requisition.project_name}</TableCell>
                        <TableCell>{requisition.employee_name}</TableCell>
                        <TableCell>{new Date(requisition.requisition_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {requisition.required_date ? new Date(requisition.required_date).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="font-medium">{requisition.mpr_no}</TableCell>
                        <TableCell>${Number(requisition.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={requisition.is_confirmed ? "default" : "secondary"}>
                            {requisition.is_confirmed ? "Confirmed" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handlePrintRequisition(requisition)}
                              title="Print"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleViewRequisition(requisition)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(requisition.id)}
                              title="Delete"
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
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-[1200px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Requisition Details</DialogTitle>
            <DialogDescription>MPR NO: {selectedRequisition?.mpr_no}</DialogDescription>
          </DialogHeader>
          {selectedRequisition && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Project</Label>
                  <p className="font-medium">{selectedRequisition.project_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Employee</Label>
                  <p className="font-medium">{selectedRequisition.employee_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requisition Date</Label>
                  <p className="font-medium">{new Date(selectedRequisition.requisition_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Required Date</Label>
                  <p className="font-medium">
                    {selectedRequisition.required_date
                      ? new Date(selectedRequisition.required_date).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Purpose/Description</Label>
                <p className="font-medium">{selectedRequisition.purpose_description || "-"}</p>
              </div>
              <div>
                <Label>Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expense Head</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requisitionItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.expense_head_name}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>${Number(item.rate).toFixed(2)}</TableCell>
                        <TableCell>${Number(item.total_price).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <div className="text-lg font-semibold">
                  Total Amount: ${Number(selectedRequisition.total_amount).toFixed(2)}
                </div>
                <Badge variant={selectedRequisition.is_confirmed ? "default" : "secondary"}>
                  {selectedRequisition.is_confirmed ? "Confirmed" : "Pending"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden Print Dialog */}
      <div className="hidden">
        {printDialogOpen && selectedRequisition && requisitionItems.length > 0 && companySettings && (
          <div id="print-requisition-content">
            <PurchaseRequisitionPDF
              requisition={selectedRequisition}
              items={requisitionItems}
              companyName={companySettings.company_name}
              companyAddress={companySettings.address}
              currencySymbol={companySettings.currency_symbol}
            />
          </div>
        )}
      </div>
    </div>
  )
}
