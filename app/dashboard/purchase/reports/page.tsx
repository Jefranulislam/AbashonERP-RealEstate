"use client"

import { useState, useEffect } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, Printer, Info, TrendingUp, TrendingDown, Package, DollarSign, Truck } from "lucide-react"
import axios from "axios"
import * as XLSX from "xlsx"

interface ReportData {
  payments: any[]
  deliveries: any[]
  paymentDue: any[]
  orders: any[]
  projects: any[]
  vendors: any[]
}

export default function PurchaseReportsPage() {
  const [reportType, setReportType] = useState("summary")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData>({
    payments: [],
    deliveries: [],
    paymentDue: [],
    orders: [],
    projects: [],
    vendors: []
  })
  const [filters, setFilters] = useState({
    projectId: "all",
    vendorId: "all",
    startDate: "",
    endDate: "",
    status: "all"
  })
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalDue: 0,
    deliveriesCompleted: 0,
    deliveriesPending: 0
  })

  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [ordersRes, paymentsRes, deliveriesRes, projectsRes, vendorsRes] = await Promise.all([
        axios.get("/api/purchase/orders"),
        axios.get("/api/purchase/payments"),
        axios.get("/api/purchase/deliveries"),
        axios.get("/api/projects"),
        axios.get("/api/vendors")
      ])

      const orders = ordersRes.data.orders || []
      const payments = paymentsRes.data.payments || []
      const deliveries = deliveriesRes.data.deliveries || []

      // Calculate payment due from orders
      const paymentDue = orders.filter((order: any) => {
        const due = parseFloat(order.total_due || 0)
        return due > 0
      })

      // Calculate stats
      const totalAmount = orders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.total_amount || 0), 0)
      const totalPaid = orders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.total_paid || 0), 0)
      const totalDue = orders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.total_due || 0), 0)
      
      const completedDeliveries = deliveries.filter((d: any) => 
        d.quality_status === "Accepted" || d.quality_status === "OK"
      ).length
      const pendingDeliveries = deliveries.filter((d: any) => 
        d.quality_status === "Pending"
      ).length

      setData({
        payments,
        deliveries,
        paymentDue,
        orders,
        projects: projectsRes.data.projects || [],
        vendors: vendorsRes.data.vendors || []
      })

      setStats({
        totalOrders: orders.length,
        totalAmount,
        totalPaid,
        totalDue,
        deliveriesCompleted: completedDeliveries,
        deliveriesPending: pendingDeliveries
      })
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [])

  // Filter data based on selected filters
  const getFilteredData = (dataArray: any[]) => {
    return dataArray.filter((item: any) => {
      const matchProject = filters.projectId === "all" || 
        item.project_id?.toString() === filters.projectId
      const matchVendor = filters.vendorId === "all" || 
        item.vendor_id?.toString() === filters.vendorId
      const matchDate = (!filters.startDate || new Date(item.created_at || item.delivery_date || item.payment_date) >= new Date(filters.startDate)) &&
        (!filters.endDate || new Date(item.created_at || item.delivery_date || item.payment_date) <= new Date(filters.endDate))
      
      return matchProject && matchVendor && matchDate
    })
  }

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()
    
    // Summary Sheet
    const summaryData = [
      ["Purchase Report Summary"],
      ["Generated:", new Date().toLocaleDateString()],
      [""],
      ["Total Orders:", stats.totalOrders],
      ["Total Amount:", `৳${stats.totalAmount.toFixed(2)}`],
      ["Total Paid:", `৳${stats.totalPaid.toFixed(2)}`],
      ["Total Due:", `৳${stats.totalDue.toFixed(2)}`],
      ["Deliveries Completed:", stats.deliveriesCompleted],
      ["Deliveries Pending:", stats.deliveriesPending],
    ]
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary")

    // Payment Transactions Sheet
    const paymentsData = getFilteredData(data.payments).map((p: any) => ({
      "Transaction No": p.transaction_number,
      "PO Number": p.po_number,
      "Vendor": p.vendor_name,
      "Project": p.project_name,
      "Payment Date": new Date(p.payment_date).toLocaleDateString(),
      "Amount": parseFloat(p.amount).toFixed(2),
      "Payment Type": p.payment_type,
      "Payment Method": p.payment_method,
      "Reference": p.reference_number || "N/A"
    }))
    const paymentsWs = XLSX.utils.json_to_sheet(paymentsData)
    XLSX.utils.book_append_sheet(wb, paymentsWs, "Payments")

    // Material Deliveries Sheet
    const deliveriesData = getFilteredData(data.deliveries).map((d: any) => ({
      "Delivery No": d.delivery_number,
      "PO Number": d.po_number,
      "Material": d.material_type,
      "Delivery Date": new Date(d.delivery_date).toLocaleDateString(),
      "Ordered Qty": d.ordered_qty,
      "Delivered Qty": d.delivered_qty,
      "Accepted Qty": d.accepted_qty,
      "Rejected Qty": d.rejected_qty,
      "Quality Status": d.quality_status,
      "Storage Location": d.storage_location || "N/A"
    }))
    const deliveriesWs = XLSX.utils.json_to_sheet(deliveriesData)
    XLSX.utils.book_append_sheet(wb, deliveriesWs, "Deliveries")

    // Payment Due Sheet
    const paymentDueData = getFilteredData(data.paymentDue).map((o: any) => ({
      "PO Number": o.po_number,
      "Vendor": o.vendor_name,
      "Project": o.project_name,
      "Order Date": new Date(o.order_date).toLocaleDateString(),
      "Total Amount": parseFloat(o.total_amount).toFixed(2),
      "Paid Amount": parseFloat(o.total_paid || 0).toFixed(2),
      "Due Amount": parseFloat(o.total_due || 0).toFixed(2),
      "Payment Status": o.payment_status,
      "Status": o.status
    }))
    const paymentDueWs = XLSX.utils.json_to_sheet(paymentDueData)
    XLSX.utils.book_append_sheet(wb, paymentDueWs, "Payment Due")

    XLSX.writeFile(wb, `Purchase_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Purchase Report - Complete Overview</AlertTitle>
        <AlertDescription>
          <p className="mt-2">This comprehensive report combines:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><strong>Payment Transactions:</strong> All vendor payments made</li>
            <li><strong>Payment Due:</strong> Outstanding payments for purchase orders</li>
            <li><strong>Material Deliveries:</strong> Delivered materials with quality status</li>
            <li><strong>Summary Analytics:</strong> Financial and delivery statistics</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Purchase Reports</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={exportToExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Filter data by project, vendor, date range, and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label>Project</Label>
              <Select value={filters.projectId} onValueChange={(value) => setFilters({...filters, projectId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {data.projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vendor</Label>
              <Select value={filters.vendorId} onValueChange={(value) => setFilters({...filters, vendorId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {data.vendors.map((vendor: any) => (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.vendor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input 
                type="date" 
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input 
                type="date" 
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setFilters({
                  projectId: "all",
                  vendorId: "all",
                  startDate: "",
                  endDate: "",
                  status: "all"
                })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Purchase orders created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total purchase value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{stats.totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{data.payments.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Due</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">৳{stats.totalDue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{data.paymentDue.length} pending payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Report Data */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="payments">Payment Transactions</TabsTrigger>
          <TabsTrigger value="deliveries">Material Deliveries</TabsTrigger>
          <TabsTrigger value="due">Payment Due</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
              <CardDescription>Overview of purchase activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Financial Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Purchase Orders:</span>
                      <span className="font-medium">{stats.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Order Value:</span>
                      <span className="font-medium">৳{stats.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount Paid:</span>
                      <span className="font-medium text-green-600">৳{stats.totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount Due:</span>
                      <span className="font-medium text-red-600">৳{stats.totalDue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span>Payment Progress:</span>
                      <span className="font-medium">
                        {stats.totalAmount > 0 ? ((stats.totalPaid / stats.totalAmount) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Delivery Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Deliveries:</span>
                      <span className="font-medium">{data.deliveries.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed Deliveries:</span>
                      <span className="font-medium text-green-600">{stats.deliveriesCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Quality Check:</span>
                      <span className="font-medium text-yellow-600">{stats.deliveriesPending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Transactions:</span>
                      <span className="font-medium">{data.payments.length}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span>Delivery Rate:</span>
                      <span className="font-medium">
                        {data.deliveries.length > 0 ? ((stats.deliveriesCompleted / data.deliveries.length) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions ({getFilteredData(data.payments).length})</CardTitle>
              <CardDescription>All vendor payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction No</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredData(data.payments).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No payment transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredData(data.payments).map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.transaction_number}</TableCell>
                        <TableCell>{payment.po_number}</TableCell>
                        <TableCell>{payment.vendor_name}</TableCell>
                        <TableCell>{payment.project_name}</TableCell>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">৳{parseFloat(payment.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.payment_type}</Badge>
                        </TableCell>
                        <TableCell>{payment.payment_method}</TableCell>
                        <TableCell className="text-xs">{payment.reference_number || "N/A"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries">
          <Card>
            <CardHeader>
              <CardTitle>Material Deliveries ({getFilteredData(data.deliveries).length})</CardTitle>
              <CardDescription>All material delivery records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Delivery No</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Material Type</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Ordered</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Accepted</TableHead>
                    <TableHead>Rejected</TableHead>
                    <TableHead>Quality Status</TableHead>
                    <TableHead>Storage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredData(data.deliveries).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
                        No deliveries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredData(data.deliveries).map((delivery: any) => (
                      <TableRow key={delivery.id}>
                        <TableCell className="font-medium">{delivery.delivery_number}</TableCell>
                        <TableCell>{delivery.po_number}</TableCell>
                        <TableCell>{delivery.material_type}</TableCell>
                        <TableCell>{new Date(delivery.delivery_date).toLocaleDateString()}</TableCell>
                        <TableCell>{delivery.ordered_qty} {delivery.unit_of_measurement}</TableCell>
                        <TableCell>{delivery.delivered_qty} {delivery.unit_of_measurement}</TableCell>
                        <TableCell className="text-green-600">{delivery.accepted_qty}</TableCell>
                        <TableCell className="text-red-600">{delivery.rejected_qty}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              delivery.quality_status === "Accepted" || delivery.quality_status === "OK" ? "default" :
                              delivery.quality_status === "Rejected" ? "destructive" :
                              "secondary"
                            }
                          >
                            {delivery.quality_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{delivery.storage_location || "N/A"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="due">
          <Card>
            <CardHeader>
              <CardTitle>Payment Due ({getFilteredData(data.paymentDue).length})</CardTitle>
              <CardDescription>Outstanding payments for purchase orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredData(data.paymentDue).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No pending payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredData(data.paymentDue).map((order: any) => {
                      const dueAmount = parseFloat(order.total_due || 0)
                      const isOverdue = order.payment_status === "Overdue"
                      
                      return (
                        <TableRow key={order.id} className={isOverdue ? "bg-red-50" : ""}>
                          <TableCell className="font-medium">{order.po_number}</TableCell>
                          <TableCell>{order.vendor_name}</TableCell>
                          <TableCell>{order.project_name}</TableCell>
                          <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                          <TableCell>৳{parseFloat(order.total_amount).toLocaleString()}</TableCell>
                          <TableCell className="text-green-600">৳{parseFloat(order.total_paid || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-bold text-red-600">৳{dueAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                order.payment_status === "Paid" ? "default" :
                                order.payment_status === "Overdue" ? "destructive" :
                                "secondary"
                              }
                            >
                              {order.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.status}</Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
              <div>
                <Label>To Date</Label>
                <Input type="date" />
              </div>
            </div>
            <Button disabled className="mt-4">Generate Report</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-blue-600">
                    ৳ {stats.totalPurchases.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">All time</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Requisitions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-yellow-600">{stats.pendingRequisitions}</div>
                  <p className="text-sm text-muted-foreground mt-1">Awaiting approval</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approved Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-600">{stats.approvedOrders}</div>
                  <p className="text-sm text-muted-foreground mt-1">Confirmed</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Coming Soon:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Vendor-wise purchase analysis</li>
          <li>Project-wise purchase tracking</li>
          <li>Monthly/yearly comparison reports</li>
          <li>Top vendors and items report</li>
          <li>Purchase trend analysis</li>
        </ul>
      </div>
    </div>
  )
}
