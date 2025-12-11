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
import { Plus, Search, Trash2, Eye, Edit, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import axios from "axios"

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
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterProject !== "all") params.append("projectId", filterProject)
      if (filterVendor !== "all") params.append("vendorId", filterVendor)

      const response = await axios.get(`/api/purchase/orders?${params.toString()}`)
      setOrders(response.data.orders)
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
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

      setVendors(vendorsRes.data.vendors || [])
      setProjects(projectsRes.data.projects || [])
      setEmployees(employeesRes.data.employees || [])
      setExpenseHeads(expenseHeadsRes.data.expenseHeads || [])
      setRequisitions(requisitionsRes.data.requisitions || [])
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

      await axios.post("/api/purchase/orders", orderData)
      
      setDialogOpen(false)
      resetForm()
      fetchOrders()
    } catch (error) {
      console.error("Error creating purchase order:", error)
      alert("Failed to create purchase order")
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
      const response = await axios.get(`/api/purchase/orders/${order.id}`)
      setSelectedOrder(response.data)
      setViewDialogOpen(true)
    } catch (error) {
      console.error("Error fetching order details:", error)
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
                          {vendor.name}
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
                          {project.name}
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
                          {req.requisition_number}
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
                                    {head.name}
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
                <Button type="submit">Create Purchase Order</Button>
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
                        >
                          <Eye className="h-4 w-4" />
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
