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
import { Plus, Search, Eye, FileText, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import axios from "axios"

export default function MaterialDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterProject, setFilterProject] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null)
  const [selectedPO, setSelectedPO] = useState<any>(null)

  const [formData, setFormData] = useState({
    purchaseOrderId: "",
    deliveryDate: new Date().toISOString().split("T")[0],
    deliveryTime: new Date().toTimeString().split(" ")[0].substring(0, 5),
    deliverySlipNumber: "",
    vehicleNumber: "",
    driverName: "",
    driverPhone: "",
    receivedBy: "",
    storageLocation: "",
    qualityStatus: "Pending",
    qualityCheckedBy: "",
    qualityRemarks: "",
    deliveryNotes: "",
  })

  const [deliveryItems, setDeliveryItems] = useState<any[]>([])

  const fetchDeliveries = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterProject !== "all") params.append("projectId", filterProject)

      const response = await axios.get(`/api/purchase/deliveries?${params.toString()}`)
      setDeliveries(response.data.deliveries)
    } catch (error) {
      console.error("Error fetching deliveries:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const [posRes, projectsRes, employeesRes] = await Promise.all([
        axios.get("/api/purchase/orders?status=Approved"),
        axios.get("/api/projects"),
        axios.get("/api/employees"),
      ])

      setPurchaseOrders(posRes.data.orders)
      setProjects(projectsRes.data.projects)
      setEmployees(employeesRes.data.employees)
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  useEffect(() => {
    fetchDeliveries()
  }, [search, filterStatus, filterProject])

  useEffect(() => {
    fetchData()
  }, [])

  const handlePOChange = async (poId: string) => {
    setFormData({ ...formData, purchaseOrderId: poId })
    
    try {
      const response = await axios.get(`/api/purchase/orders/${poId}`)
      setSelectedPO(response.data)
      
      // Initialize delivery items from PO items
      const items = response.data.items.map((item: any) => ({
        poItemId: item.id,
        expenseHeadName: item.expense_head_name,
        materialType: item.material_type,
        materialSpecification: item.material_specification,
        unitOfMeasurement: item.unit_of_measurement,
        orderedQty: item.qty,
        previouslyDeliveredQty: item.delivered_qty || 0,
        remainingQty: item.remaining_qty || item.qty,
        deliveredQty: "",
        acceptedQty: "",
        rejectedQty: "",
        shortageQty: "",
        excessQty: "",
      }))
      setDeliveryItems(items)
    } catch (error) {
      console.error("Error fetching PO details:", error)
    }
  }

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...deliveryItems]
    newItems[index][field] = value

    const delivered = parseFloat(newItems[index].deliveredQty) || 0
    const accepted = parseFloat(newItems[index].acceptedQty) || 0
    const rejected = parseFloat(newItems[index].rejectedQty) || 0
    const ordered = parseFloat(newItems[index].orderedQty) || 0

    // Auto-calculate shortage/excess
    if (field === "deliveredQty") {
      if (delivered < ordered) {
        newItems[index].shortageQty = (ordered - delivered).toFixed(2)
        newItems[index].excessQty = "0"
      } else if (delivered > ordered) {
        newItems[index].excessQty = (delivered - ordered).toFixed(2)
        newItems[index].shortageQty = "0"
      } else {
        newItems[index].shortageQty = "0"
        newItems[index].excessQty = "0"
      }
    }

    // Auto-set accepted = delivered - rejected
    if (field === "deliveredQty" || field === "rejectedQty") {
      newItems[index].acceptedQty = (delivered - rejected).toFixed(2)
    }

    setDeliveryItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const deliveryData = {
        ...formData,
        items: deliveryItems.map(item => ({
          purchaseOrderItemId: item.poItemId,
          deliveredQty: parseFloat(item.deliveredQty),
          acceptedQty: parseFloat(item.acceptedQty),
          rejectedQty: parseFloat(item.rejectedQty) || 0,
          shortageQty: parseFloat(item.shortageQty) || 0,
          excessQty: parseFloat(item.excessQty) || 0,
        })),
      }

      await axios.post("/api/purchase/deliveries", deliveryData)

      setDialogOpen(false)
      resetForm()
      fetchDeliveries()
    } catch (error) {
      console.error("Error recording delivery:", error)
      alert("Failed to record delivery")
    }
  }

  const resetForm = () => {
    setFormData({
      purchaseOrderId: "",
      deliveryDate: new Date().toISOString().split("T")[0],
      deliveryTime: new Date().toTimeString().split(" ")[0].substring(0, 5),
      deliverySlipNumber: "",
      vehicleNumber: "",
      driverName: "",
      driverPhone: "",
      receivedBy: "",
      storageLocation: "",
      qualityStatus: "Pending",
      qualityCheckedBy: "",
      qualityRemarks: "",
      deliveryNotes: "",
    })
    setDeliveryItems([])
    setSelectedPO(null)
  }

  const handleViewDelivery = async (delivery: any) => {
    try {
      const response = await axios.get(`/api/purchase/deliveries/${delivery.id}`)
      setSelectedDelivery(response.data)
      setViewDialogOpen(true)
    } catch (error) {
      console.error("Error fetching delivery details:", error)
    }
  }

  const getQualityStatusColor = (status: string) => {
    switch (status) {
      case "Approved": return "success"
      case "Rejected": return "destructive"
      case "Partially Approved": return "warning"
      case "Pending": return "secondary"
      default: return "default"
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Material Deliveries</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Delivery
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Material Delivery</DialogTitle>
              <DialogDescription>Record delivery details and quality check</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Purchase Order Selection */}
              <div>
                <Label>Purchase Order *</Label>
                <Select
                  value={formData.purchaseOrderId}
                  onValueChange={handlePOChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purchase order" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders.map((po) => (
                      <SelectItem key={po.id} value={po.id.toString()}>
                        {po.po_number} - {po.vendor_name} (৳{parseFloat(po.total_amount).toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPO && (
                <>
                  {/* PO Summary */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label className="text-muted-foreground">Vendor</Label>
                          <p className="font-medium">{selectedPO.vendor_name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Project</Label>
                          <p className="font-medium">{selectedPO.project_name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Order Date</Label>
                          <p>{new Date(selectedPO.order_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Expected Delivery</Label>
                          <p>{new Date(selectedPO.expected_delivery_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Information */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Delivery Date *</Label>
                      <Input
                        type="date"
                        value={formData.deliveryDate}
                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Delivery Time *</Label>
                      <Input
                        type="time"
                        value={formData.deliveryTime}
                        onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Delivery Slip Number *</Label>
                      <Input
                        value={formData.deliverySlipNumber}
                        onChange={(e) => setFormData({ ...formData, deliverySlipNumber: e.target.value })}
                        placeholder="e.g., DS-2025-001"
                        required
                      />
                    </div>
                  </div>

                  {/* Vehicle & Driver Information */}
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label>Vehicle Number</Label>
                      <Input
                        value={formData.vehicleNumber}
                        onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                        placeholder="e.g., DHK-1234"
                      />
                    </div>
                    <div>
                      <Label>Driver Name</Label>
                      <Input
                        value={formData.driverName}
                        onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Driver Phone</Label>
                      <Input
                        value={formData.driverPhone}
                        onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Received By *</Label>
                      <Select
                        value={formData.receivedBy}
                        onValueChange={(value) => setFormData({ ...formData, receivedBy: value })}
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

                  {/* Delivery Items */}
                  <div>
                    <Label>Delivery Items *</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Specification</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Ordered</TableHead>
                            <TableHead>Previously Delivered</TableHead>
                            <TableHead>Remaining</TableHead>
                            <TableHead>Delivered Now *</TableHead>
                            <TableHead>Rejected</TableHead>
                            <TableHead>Accepted</TableHead>
                            <TableHead>Shortage</TableHead>
                            <TableHead>Excess</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deliveryItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {item.materialType || item.expenseHeadName}
                              </TableCell>
                              <TableCell>{item.materialSpecification}</TableCell>
                              <TableCell>{item.unitOfMeasurement}</TableCell>
                              <TableCell>{item.orderedQty}</TableCell>
                              <TableCell>{item.previouslyDeliveredQty}</TableCell>
                              <TableCell className="font-semibold">{item.remainingQty}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.deliveredQty}
                                  onChange={(e) => handleItemChange(index, "deliveredQty", e.target.value)}
                                  className="w-24"
                                  required
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.rejectedQty}
                                  onChange={(e) => handleItemChange(index, "rejectedQty", e.target.value)}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell className="font-semibold">{item.acceptedQty}</TableCell>
                              <TableCell className="text-red-600">{item.shortageQty}</TableCell>
                              <TableCell className="text-green-600">{item.excessQty}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Quality Check */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Quality Status *</Label>
                      <Select
                        value={formData.qualityStatus}
                        onValueChange={(value) => setFormData({ ...formData, qualityStatus: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                          <SelectItem value="Partially Approved">Partially Approved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quality Checked By</Label>
                      <Select
                        value={formData.qualityCheckedBy}
                        onValueChange={(value) => setFormData({ ...formData, qualityCheckedBy: value })}
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
                    <div>
                      <Label>Storage Location *</Label>
                      <Input
                        value={formData.storageLocation}
                        onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                        placeholder="e.g., Warehouse A, Shelf 3"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Quality Remarks</Label>
                    <Textarea
                      value={formData.qualityRemarks}
                      onChange={(e) => setFormData({ ...formData, qualityRemarks: e.target.value })}
                      placeholder="Quality inspection notes"
                    />
                  </div>

                  <div>
                    <Label>Delivery Notes</Label>
                    <Textarea
                      value={formData.deliveryNotes}
                      onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                      placeholder="Additional delivery notes"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Truck className="mr-2 h-4 w-4" />
                      Record Delivery
                    </Button>
                  </div>
                </>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search delivery number, PO..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label>Quality Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Partially Approved">Partially Approved</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Material Deliveries</CardTitle>
          <CardDescription>Track all material deliveries and quality checks</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No deliveries recorded yet. Record your first material delivery.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delivery Number</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Delivery Slip</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Quality Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">{delivery.delivery_number}</TableCell>
                    <TableCell>
                      {new Date(delivery.delivery_date).toLocaleDateString()}
                      {" "}
                      {delivery.delivery_time}
                    </TableCell>
                    <TableCell>{delivery.po_number}</TableCell>
                    <TableCell>{delivery.vendor_name}</TableCell>
                    <TableCell>{delivery.project_name}</TableCell>
                    <TableCell>{delivery.delivery_slip_number}</TableCell>
                    <TableCell>{delivery.vehicle_number || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getQualityStatusColor(delivery.quality_status) as any}>
                        {delivery.quality_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDelivery(delivery)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
            <DialogTitle>Delivery Details</DialogTitle>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Delivery Number</Label>
                  <p className="font-semibold">{selectedDelivery.delivery_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Delivery Date & Time</Label>
                  <p>
                    {new Date(selectedDelivery.delivery_date).toLocaleDateString()}
                    {" "}
                    {selectedDelivery.delivery_time}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">PO Number</Label>
                  <p>{selectedDelivery.po_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Delivery Slip</Label>
                  <p>{selectedDelivery.delivery_slip_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vehicle</Label>
                  <p>{selectedDelivery.vehicle_number || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Driver</Label>
                  <p>
                    {selectedDelivery.driver_name || "-"}
                    {selectedDelivery.driver_phone && ` (${selectedDelivery.driver_phone})`}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Received By</Label>
                  <p>{selectedDelivery.received_by_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Storage Location</Label>
                  <p>{selectedDelivery.storage_location}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quality Status</Label>
                  <Badge variant={getQualityStatusColor(selectedDelivery.quality_status) as any}>
                    {selectedDelivery.quality_status}
                  </Badge>
                </div>
                {selectedDelivery.quality_checked_by_name && (
                  <div>
                    <Label className="text-muted-foreground">Quality Checked By</Label>
                    <p>{selectedDelivery.quality_checked_by_name}</p>
                  </div>
                )}
              </div>

              {selectedDelivery.quality_remarks && (
                <div>
                  <Label className="text-muted-foreground">Quality Remarks</Label>
                  <p className="text-sm mt-1">{selectedDelivery.quality_remarks}</p>
                </div>
              )}

              {selectedDelivery.delivery_notes && (
                <div>
                  <Label className="text-muted-foreground">Delivery Notes</Label>
                  <p className="text-sm mt-1">{selectedDelivery.delivery_notes}</p>
                </div>
              )}

              <div>
                <Label>Delivered Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Specification</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead>Accepted</TableHead>
                      <TableHead>Rejected</TableHead>
                      <TableHead>Shortage</TableHead>
                      <TableHead>Excess</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDelivery.items?.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{item.material_type || item.expense_head_name}</TableCell>
                        <TableCell>{item.material_specification}</TableCell>
                        <TableCell>{item.unit_of_measurement}</TableCell>
                        <TableCell>{item.delivered_qty}</TableCell>
                        <TableCell className="text-green-600 font-medium">{item.accepted_qty}</TableCell>
                        <TableCell className="text-red-600">{item.rejected_qty || 0}</TableCell>
                        <TableCell className="text-orange-600">{item.shortage_qty || 0}</TableCell>
                        <TableCell className="text-blue-600">{item.excess_qty || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
