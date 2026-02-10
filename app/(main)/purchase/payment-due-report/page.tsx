"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Search, AlertCircle, Clock, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import axios from "axios"

export default function PaymentDueReportPage() {
  const [pendingPayments, setPendingPayments] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterVendor, setFilterVendor] = useState("all")
  const [filterProject, setFilterProject] = useState("all")
  const [filterUrgency, setFilterUrgency] = useState("all")

  const fetchPendingPayments = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/purchase/orders")
      
      // Process orders to extract pending payment schedules
      const allPendingPayments: any[] = []
      
      // Fetch all order details in parallel for better performance
      const orderDetailsPromises = response.data.orders.map((order: any) => 
        axios.get(`/api/purchase/orders/${order.id}`).catch(err => ({ data: null, error: err }))
      )
      const orderDetailsResponses = await Promise.all(orderDetailsPromises)
      
      for (let i = 0; i < orderDetailsResponses.length; i++) {
        const detailResponse = orderDetailsResponses[i]
        if (!detailResponse.data) continue
        const orderDetail = detailResponse.data
        
        if (orderDetail.payment_schedules) {
          for (const schedule of orderDetail.payment_schedules) {
            if (schedule.status !== "Paid" && parseFloat(schedule.due_amount) > 0) {
              allPendingPayments.push({
                ...schedule,
                po_number: orderDetail.po_number,
                vendor_name: orderDetail.vendor_name,
                vendor_id: orderDetail.vendor_id,
                project_name: orderDetail.project_name,
                project_id: orderDetail.project_id,
                order_date: orderDetail.order_date,
                total_amount: orderDetail.total_amount,
              })
            }
          }
        }
      }
      
      // Sort by due date
      allPendingPayments.sort((a, b) => 
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      )
      
      setPendingPayments(allPendingPayments)
    } catch (error) {
      console.error("Error fetching pending payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const [vendorsRes, projectsRes] = await Promise.all([
        axios.get("/api/vendors"),
        axios.get("/api/projects"),
      ])

      setVendors(vendorsRes.data.vendors)
      setProjects(projectsRes.data.projects)
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  useEffect(() => {
    fetchPendingPayments()
    fetchData()
  }, [])

  const getUrgencyLevel = (dueDate: string): "overdue" | "due-soon" | "upcoming" => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "overdue"
    if (diffDays <= 7) return "due-soon"
    return "upcoming"
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "overdue": return "destructive"
      case "due-soon": return "warning"
      case "upcoming": return "default"
      default: return "secondary"
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "overdue": return <AlertCircle className="h-4 w-4" />
      case "due-soon": return <Clock className="h-4 w-4" />
      case "upcoming": return <CheckCircle className="h-4 w-4" />
      default: return null
    }
  }

  const filteredPayments = pendingPayments.filter((payment) => {
    const urgency = getUrgencyLevel(payment.due_date)
    
    if (search && !(
      payment.po_number?.toLowerCase().includes(search.toLowerCase()) ||
      payment.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
      payment.project_name?.toLowerCase().includes(search.toLowerCase())
    )) return false

    if (filterVendor !== "all" && payment.vendor_id?.toString() !== filterVendor) return false
    if (filterProject !== "all" && payment.project_id?.toString() !== filterProject) return false
    if (filterUrgency !== "all" && urgency !== filterUrgency) return false

    return true
  })

  const calculateTotalDue = () => {
    return filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.due_amount || 0), 0)
  }

  const getOverdueCount = () => {
    return filteredPayments.filter(p => getUrgencyLevel(p.due_date) === "overdue").length
  }

  const getDueSoonCount = () => {
    return filteredPayments.filter(p => getUrgencyLevel(p.due_date) === "due-soon").length
  }

  const exportToExcel = () => {
    // Create CSV content
    const headers = ["PO Number", "Vendor", "Project", "Payment Type", "Scheduled Amount", "Paid Amount", "Due Amount", "Due Date", "Days", "Status"]
    const rows = filteredPayments.map(payment => {
      const today = new Date()
      const due = new Date(payment.due_date)
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      return [
        payment.po_number,
        payment.vendor_name,
        payment.project_name,
        payment.payment_type,
        parseFloat(payment.scheduled_amount).toFixed(2),
        parseFloat(payment.paid_amount || 0).toFixed(2),
        parseFloat(payment.due_amount).toFixed(2),
        new Date(payment.due_date).toLocaleDateString(),
        diffDays,
        payment.status,
      ].join(",")
    })

    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payment-due-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Due Report</h1>
          <p className="text-muted-foreground mt-1">Track pending vendor payments and due dates</p>
        </div>
        <Button onClick={exportToExcel}>
          <Download className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPayments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Due Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳ {calculateTotalDue().toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700">Overdue Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getOverdueCount()}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700">Due Within 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getDueSoonCount()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {getOverdueCount() > 0 && (
        <Card className="mb-6 border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-700 mb-1">Overdue Payments Alert</h3>
                <p className="text-sm text-red-600">
                  You have {getOverdueCount()} overdue payment(s) totaling ৳{" "}
                  {filteredPayments
                    .filter(p => getUrgencyLevel(p.due_date) === "overdue")
                    .reduce((sum, p) => sum + parseFloat(p.due_amount || 0), 0)
                    .toFixed(2)}
                  . Please review and process immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search PO, vendor, project..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
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
              <Label>Urgency</Label>
              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="due-soon">Due Within 7 Days</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
          <CardDescription>All outstanding vendor payments sorted by due date</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending payments found. All payments are up to date!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Urgency</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Scheduled Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Due Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment, index) => {
                  const urgency = getUrgencyLevel(payment.due_date)
                  const today = new Date()
                  const due = new Date(payment.due_date)
                  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                  return (
                    <TableRow 
                      key={index}
                      className={
                        urgency === "overdue" ? "bg-red-50" :
                        urgency === "due-soon" ? "bg-yellow-50" : ""
                      }
                    >
                      <TableCell>
                        <Badge variant={getUrgencyColor(urgency) as any} className="gap-1">
                          {getUrgencyIcon(urgency)}
                          {urgency === "overdue" ? "Overdue" :
                           urgency === "due-soon" ? "Due Soon" : "Upcoming"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{payment.po_number}</TableCell>
                      <TableCell>{payment.vendor_name}</TableCell>
                      <TableCell>{payment.project_name}</TableCell>
                      <TableCell>{payment.payment_type}</TableCell>
                      <TableCell>৳ {parseFloat(payment.scheduled_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-green-600">
                        ৳ {parseFloat(payment.paid_amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="font-bold text-red-600">
                        ৳ {parseFloat(payment.due_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>{new Date(payment.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={
                          diffDays < 0 ? "text-red-600 font-bold" :
                          diffDays <= 7 ? "text-yellow-600 font-semibold" : ""
                        }>
                          {diffDays < 0 ? `${Math.abs(diffDays)} days ago` :
                           diffDays === 0 ? "Today" :
                           diffDays === 1 ? "Tomorrow" :
                           `in ${diffDays} days`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "Pending" ? "secondary" : "default" as any}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Vendor-wise Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Vendor-wise Due Summary</CardTitle>
          <CardDescription>Total pending amounts grouped by vendor</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Pending Payments</TableHead>
                <TableHead>Total Due Amount</TableHead>
                <TableHead>Overdue Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => {
                const vendorPayments = filteredPayments.filter(p => p.vendor_id === vendor.id)
                if (vendorPayments.length === 0) return null

                const totalDue = vendorPayments.reduce((sum, p) => sum + parseFloat(p.due_amount || 0), 0)
                const overdueCount = vendorPayments.filter(p => getUrgencyLevel(p.due_date) === "overdue").length

                return (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>{vendorPayments.length}</TableCell>
                    <TableCell className="font-bold">৳ {totalDue.toFixed(2)}</TableCell>
                    <TableCell>
                      {overdueCount > 0 && (
                        <Badge variant="destructive">{overdueCount} overdue</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
