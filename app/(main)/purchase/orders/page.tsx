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
import { Plus, Search, Trash2, Eye, Edit, FileText, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"

interface POItem {
  expenseHeadId: string
  materialType: string
  materialSpecification: string
  unitOfMeasurement: string
  qty: string
  rate: string
  totalPrice: string
}

interface PaymentSchedule {
  paymentType: string
  scheduledAmount: string
  dueDate: string
  description: string
}

export default function PurchaseOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [expenseHeads, setExpenseHeads] = useState<any[]>([])
  const [requisitions, setRequisitions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterProject, setFilterProject] = useState("all")
  const [filterVendor, setFilterVendor] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const [formData, setFormData] = useState({
    vendorId: "",
    projectId: "",
    requisitionId: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    deliveryAddress: "",
    contactPerson: "",
    contactPhone: "",
    paymentTerms: "",
    deliveryTerms: "",
    warranty: "",
    notes: "",
    preparedById: "",
  })
  
  const [items, setItems] = useState<POItem[]>([{
    expenseHeadId: "",
    materialType: "",
    materialSpecification: "",
    unitOfMeasurement: "",
    qty: "",
    rate: "",
    totalPrice: "0"
  }])
  
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([{
    paymentType: "Advance",
    scheduledAmount: "",
    dueDate: new Date().toISOString().split("T")[0],
    description: ""
  }])

  const [discount, setDiscount] = useState("0")
  const [tax, setTax] = useState("0")

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterProject !== "all") params.append("projectId", filterProject)
      if (filterVendor !== "all") params.append("vendorId", filterVendor)

      const response = await axios.get(`/api/purchase/orders?${params.toString()}`)
      setOrders(response.data.orders)
      
      toast({
        title: "Orders Loaded",
        description: `Found ${response.data.orders?.length || 0} purchase orders`,
      })
    } catch (error: any) {
      console.error("Error fetching purchase orders:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load purchase orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const [vendorsRes, projectsRes, employeesRes, expenseHeadsRes, requisitionsRes] = await Promise.all([
        axios.get("/api/vendors"),
        axios.get("/api/projects"),
        axios.get("/api/employees"),
        axios.get("/api/finance/expense-heads"),
        axios.get("/api/purchase/requisitions"),
      ])

      console.log("Fetched vendors:", vendorsRes.data)
      console.log("Fetched projects:", projectsRes.data)
      console.log("Fetched expense heads:", expenseHeadsRes.data)
      console.log("Fetched requisitions:", requisitionsRes.data)

      const vendorsList = Array.isArray(vendorsRes.data) ? vendorsRes.data : vendorsRes.data.vendors || []
      const projectsList = Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data.projects || []
      const employeesList = Array.isArray(employeesRes.data) ? employeesRes.data : employeesRes.data.employees || []
      const expenseHeadsList = Array.isArray(expenseHeadsRes.data) ? expenseHeadsRes.data : expenseHeadsRes.data.expenseHeads || []
      const requisitionsList = Array.isArray(requisitionsRes.data) ? requisitionsRes.data : requisitionsRes.data.requisitions || []

      console.log("Processed vendors:", vendorsList.length, vendorsList[0])
      console.log("Processed projects:", projectsList.length, projectsList[0])
      console.log("Processed expense heads:", expenseHeadsList.length, expenseHeadsList[0])
      console.log("Processed requisitions:", requisitionsList.length, requisitionsList[0])

      setVendors(vendorsList)
      setProjects(projectsList)
      setEmployees(employeesList)
      setExpenseHeads(expenseHeadsList)
      setRequisitions(requisitionsList)
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [search, filterStatus, filterProject, filterVendor])

  useEffect(() => {
    fetchData()
  }, [])

  const calculateItemTotal = (qty: string, rate: string): string => {
    const quantity = parseFloat(qty) || 0
    const rateValue = parseFloat(rate) || 0
    return (quantity * rateValue).toFixed(2)
  }

  const calculateSubtotal = (): number => {
    return items.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0)
  }

  const calculateTotal = (): number => {
    const subtotal = calculateSubtotal()
    const discountValue = parseFloat(discount) || 0
    const taxValue = parseFloat(tax) || 0
    return subtotal - discountValue + taxValue
  }

  const handleItemChange = (index: number, field: keyof POItem, value: string) => {
    const newItems = [...items]
    newItems[index][field] = value as never
    
    if (field === "qty" || field === "rate") {
      newItems[index].totalPrice = calculateItemTotal(newItems[index].qty, newItems[index].rate)
    }
    
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, {
      expenseHeadId: "",
      materialType: "",
      materialSpecification: "",
      unitOfMeasurement: "",
      qty: "",
      rate: "",
      totalPrice: "0"
    }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const addPaymentSchedule = () => {
    setPaymentSchedules([...paymentSchedules, {
      paymentType: "Partial",
      scheduledAmount: "",
      dueDate: new Date().toISOString().split("T")[0],
      description: ""
    }])
  }

  const removePaymentSchedule = (index: number) => {
    if (paymentSchedules.length > 1) {
      setPaymentSchedules(paymentSchedules.filter((_, i) => i !== index))
    }
  }

  const handleScheduleChange = (index: number, field: keyof PaymentSchedule, value: string) => {
    const newSchedules = [...paymentSchedules]
    newSchedules[index][field] = value as never
    setPaymentSchedules(newSchedules)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      
      toast({
        title: "Creating PO...",
        description: "Processing your purchase order",
      })
      
      const orderData = {
        ...formData,
        items: items.map(item => ({
          ...item,
          qty: parseFloat(item.qty),
          rate: parseFloat(item.rate),
          amount: parseFloat(item.totalPrice),
        })),
        paymentSchedules: paymentSchedules.map(schedule => ({
          ...schedule,
          scheduledAmount: parseFloat(schedule.scheduledAmount),
        })),
        subtotal: calculateSubtotal(),
        discount: parseFloat(discount),
        tax: parseFloat(tax),
        totalAmount: calculateTotal(),
      }

      const response = await axios.post("/api/purchase/orders", orderData)
      
      toast({
        title: "Success",
        description: `PO ${response.data.order.po_number} created successfully`,
      })
      
      setDialogOpen(false)
      resetForm()
      fetchOrders()
    } catch (error: any) {
      console.error("Error creating purchase order:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create purchase order",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      vendorId: "",
      projectId: "",
      requisitionId: "",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDeliveryDate: "",
      deliveryAddress: "",
      contactPerson: "",
      contactPhone: "",
      paymentTerms: "",
      deliveryTerms: "",
      warranty: "",
      notes: "",
      preparedById: "",
    })
    setItems([{
      expenseHeadId: "",
      materialType: "",
      materialSpecification: "",
      unitOfMeasurement: "",
      qty: "",
      rate: "",
      totalPrice: "0"
    }])
    setPaymentSchedules([{
      paymentType: "Advance",
      scheduledAmount: "",
      dueDate: new Date().toISOString().split("T")[0],
      description: ""
    }])
    setDiscount("0")
    setTax("0")
  }

  const handleViewOrder = async (order: any) => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/purchase/orders/${order.id}`)
      setSelectedOrder(response.data)
      setViewDialogOpen(true)
    } catch (error) {
      console.error("Error fetching order details:", error)
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditOrder = async (order: any) => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/purchase/orders/${order.id}`)
      setSelectedOrder(response.data)
      setIsEditMode(true)
      setViewDialogOpen(true)
      
      toast({
        title: "Edit Mode",
        description: "You can now edit this purchase order",
      })
    } catch (error) {
      console.error("Error fetching order for edit:", error)
      toast({
        title: "Error",
        description: "Failed to open edit mode",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrder = async (order: any) => {
    if (!confirm(`Are you sure you want to delete PO ${order.po_number}?`)) {
      return
    }

    try {
      setDeleting(true)
      toast({
        title: "Deleting...",
        description: `Removing PO ${order.po_number}`,
      })

      await axios.delete(`/api/purchase/orders/${order.id}`)

      toast({
        title: "Success",
        description: `PO ${order.po_number} has been deleted`,
        variant: "default",
      })

      fetchOrders()
    } catch (error: any) {
      console.error("Error deleting order:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete purchase order",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handlePrintOrder = (order: any) => {
    try {
      setLoading(true)
      toast({
        title: "Preparing Print",
        description: `Generating PDF for PO ${order.po_number}`,
      })

      const printWindow = window.open("", "", "width=900,height=600")
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Failed to open print window. Check popup blocker.",
          variant: "destructive",
        })
        return
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>PO ${order.po_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; }
            .subtitle { font-size: 14px; color: #666; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .detail-box { border: 1px solid #ddd; padding: 10px; }
            .label { font-weight: bold; color: #555; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f5f5f5; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">PURCHASE ORDER</div>
            <div class="subtitle">PO #${order.po_number}</div>
          </div>

          <div class="details">
            <div class="detail-box">
              <div class="label">Vendor</div>
              <div>${order.vendor_name}</div>
              <div class="label" style="margin-top: 10px;">Order Date</div>
              <div>${new Date(order.order_date).toLocaleDateString()}</div>
            </div>
            <div class="detail-box">
              <div class="label">Project</div>
              <div>${order.project_name}</div>
              <div class="label" style="margin-top: 10px;">Expected Delivery</div>
              <div>${new Date(order.expected_delivery_date).toLocaleDateString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Specification</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.items?.map((item: any) => `
                <tr>
                  <td>${item.material_type}</td>
                  <td>${item.material_specification}</td>
                  <td>${item.qty}</td>
                  <td>${item.unit_of_measurement}</td>
                  <td>৳${parseFloat(item.rate).toFixed(2)}</td>
                  <td>৳${parseFloat(item.amount).toFixed(2)}</td>
                </tr>
              `).join('') || '<tr><td colspan="6">No items</td></tr>'}
            </tbody>
          </table>

          <div style="text-align: right; width: 300px; margin-left: auto;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="label">Subtotal:</div>
              <div>৳${parseFloat(order.subtotal || 0).toFixed(2)}</div>
              <div class="label">Tax:</div>
              <div>৳${parseFloat(order.tax || 0).toFixed(2)}</div>
              <div class="label">Discount:</div>
              <div>৳${parseFloat(order.discount || 0).toFixed(2)}</div>
              <div class="total-row">Total:</div>
              <div class="total-row">৳${parseFloat(order.total_amount || 0).toFixed(2)}</div>
            </div>
          </div>

          <div class="footer">
            <p style="font-size: 12px; color: #666;">
              Status: ${order.status} | Payment Status: ${order.payment_status}
            </p>
            <p style="font-size: 12px; color: #999;">
              Printed on ${new Date().toLocaleString()}
            </p>
          </div>

          <script>
            window.print();
            setTimeout(() => window.close(), 100);
          </script>
        </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()

      toast({
        title: "Success",
        description: "Print dialog opened",
      })
    } catch (error) {
      console.error("Error printing order:", error)
      toast({
        title: "Error",
        description: "Failed to prepare print document",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "secondary"
      case "Pending": return "warning"
      case "Approved": return "default"
      case "Partially Delivered": return "info"
      case "Fully Delivered": return "success"
      case "Cancelled": return "destructive"
      default: return "default"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Unpaid": return "destructive"
      case "Partial": return "warning"
      case "Fully Paid": return "success"
      default: return "default"
    }
  }

  return (
    <div className="p-6">
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>How to Use Purchase Orders</AlertTitle>
        <AlertDescription>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Create PO from approved requisitions or create new manually</li>
            <li>Add material items with specifications, quantities, and rates</li>
            <li>Set payment schedules (Advance, Partial, On Delivery, etc.)</li>
            <li>Track order status: Pending → Approved → Partially Delivered → Completed</li>
            <li>View complete PO details including payment schedules and delivery status</li>
          </ol>
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>Create a new purchase order for vendor</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Vendor *</Label>
                  <Select
                    value={formData.vendorId}
                    onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
                    required
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
                <div>
                  <Label>Project *</Label>
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
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Requisition (Optional)</Label>
                  <Select
                    value={formData.requisitionId}
                    onValueChange={(value) => setFormData({ ...formData, requisitionId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Link to requisition" />
                    </SelectTrigger>
                    <SelectContent>
                      {requisitions.map((req) => (
                        <SelectItem key={req.id} value={req.id.toString()}>
                          {req.mpr_no}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Order Date *</Label>
                  <Input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Expected Delivery Date *</Label>
                  <Input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Prepared By *</Label>
                  <Select
                    value={formData.preparedById}
                    onValueChange={(value) => setFormData({ ...formData, preparedById: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Delivery Address *</Label>
                  <Textarea
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Contact Person</Label>
                    <Input
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Contact Phone</Label>
                    <Input
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Order Items *</Label>
                  <Button type="button" onClick={addItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expense Head</TableHead>
                        <TableHead>Material Type</TableHead>
                        <TableHead>Specification</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={item.expenseHeadId}
                              onValueChange={(value) => handleItemChange(index, "expenseHeadId", value)}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {expenseHeads.map((head) => (
                                  <SelectItem key={head.id} value={head.id.toString()}>
                                    {head.head_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.materialType}
                              onChange={(e) => handleItemChange(index, "materialType", e.target.value)}
                              placeholder="e.g., Sand, Steel"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.materialSpecification}
                              onChange={(e) => handleItemChange(index, "materialSpecification", e.target.value)}
                              placeholder="e.g., 20mm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.unitOfMeasurement}
                              onChange={(e) => handleItemChange(index, "unitOfMeasurement", e.target.value)}
                              placeholder="e.g., CFT, Ton"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.qty}
                              onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                              required
                            />
                          </TableCell>
                          <TableCell>{item.totalPrice}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              disabled={items.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">৳ {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Discount:</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tax:</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>৳ {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Schedule */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Payment Schedule *</Label>
                  <Button type="button" onClick={addPaymentSchedule} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Payment
                  </Button>
                </div>
                <div className="space-y-2">
                  {paymentSchedules.map((schedule, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end border p-3 rounded">
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={schedule.paymentType}
                          onValueChange={(value) => handleScheduleChange(index, "paymentType", value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Advance">Advance</SelectItem>
                            <SelectItem value="Partial">Partial</SelectItem>
                            <SelectItem value="Full">Full</SelectItem>
                            <SelectItem value="Due Settlement">Due Settlement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={schedule.scheduledAmount}
                          onChange={(e) => handleScheduleChange(index, "scheduledAmount", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={schedule.dueDate}
                          onChange={(e) => handleScheduleChange(index, "dueDate", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={schedule.description}
                          onChange={(e) => handleScheduleChange(index, "description", e.target.value)}
                          placeholder="Payment notes"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePaymentSchedule(index)}
                        disabled={paymentSchedules.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Payment Terms</Label>
                  <Textarea
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    placeholder="e.g., 30% advance, 70% on delivery"
                  />
                </div>
                <div>
                  <Label>Delivery Terms</Label>
                  <Textarea
                    value={formData.deliveryTerms}
                    onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
                    placeholder="e.g., FOB, CIF"
                  />
                </div>
                <div>
                  <Label>Warranty</Label>
                  <Textarea
                    value={formData.warranty}
                    onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                    placeholder="Warranty terms"
                  />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or instructions"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Purchase Order"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search PO number, vendor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Partially Delivered">Partially Delivered</SelectItem>
                  <SelectItem value="Fully Delivered">Fully Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Project</Label>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vendor</Label>
              <Select value={filterVendor} onValueChange={setFilterVendor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>Track and manage all purchase orders</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchase orders found. Create your first purchase order.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.po_number}</TableCell>
                    <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                    <TableCell>{order.vendor_name}</TableCell>
                    <TableCell>{order.project_name}</TableCell>
                    <TableCell>৳ {parseFloat(order.total_amount).toFixed(2)}</TableCell>
                    <TableCell>৳ {parseFloat(order.total_paid || 0).toFixed(2)}</TableCell>
                    <TableCell>৳ {parseFloat(order.total_due || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getPaymentStatusColor(order.payment_status) as any}>
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(order.status) as any}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewOrder(order)}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditOrder(order)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrintOrder(order)}
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOrder(order)}
                          disabled={deleting}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">PO Number</Label>
                  <p className="font-semibold">{selectedOrder.po_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order Date</Label>
                  <p>{new Date(selectedOrder.order_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vendor</Label>
                  <p>{selectedOrder.vendor_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Project</Label>
                  <p>{selectedOrder.project_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={getStatusColor(selectedOrder.status) as any}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Status</Label>
                  <Badge variant={getPaymentStatusColor(selectedOrder.payment_status) as any}>
                    {selectedOrder.payment_status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Specification</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{item.material_type || item.expense_head_name}</TableCell>
                        <TableCell>{item.material_specification}</TableCell>
                        <TableCell>{item.qty} {item.unit_of_measurement}</TableCell>
                        <TableCell>৳ {parseFloat(item.rate).toFixed(2)}</TableCell>
                        <TableCell>৳ {parseFloat(item.amount).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>৳ {parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>৳ {parseFloat(selectedOrder.discount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>৳ {parseFloat(selectedOrder.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>৳ {parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.payment_schedules && selectedOrder.payment_schedules.length > 0 && (
                <div>
                  <Label>Payment Schedule</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.payment_schedules.map((schedule: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{schedule.payment_type}</TableCell>
                          <TableCell>৳ {parseFloat(schedule.scheduled_amount).toFixed(2)}</TableCell>
                          <TableCell>৳ {parseFloat(schedule.paid_amount || 0).toFixed(2)}</TableCell>
                          <TableCell>৳ {parseFloat(schedule.due_amount || 0).toFixed(2)}</TableCell>
                          <TableCell>{new Date(schedule.due_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={schedule.status === "Paid" ? "success" : schedule.status === "Partial" ? "warning" : "default" as any}>
                              {schedule.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
