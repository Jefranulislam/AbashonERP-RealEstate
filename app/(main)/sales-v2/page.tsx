"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, Edit, Trash2, Eye, DollarSign, Calendar, AlertTriangle, TrendingUp } from "lucide-react"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/hooks/use-currency"

// Sale status badges
const statusColors: Record<string, string> = {
  'booked': 'bg-blue-100 text-blue-800',
  'agreement_signed': 'bg-purple-100 text-purple-800',
  'in_progress': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-green-100 text-green-800',
  'handed_over': 'bg-emerald-100 text-emerald-800',
  'cancelled': 'bg-red-100 text-red-800',
}

interface Sale {
  id: number
  sale_no: string
  sale_status: string
  customer_id: number
  customer_name: string
  customer_phone: string
  seller_name: string
  project_name: string
  product_name: string
  unit_no: string
  floor_no: string
  base_price: number
  discount_amount: number
  net_price: number
  booking_amount: number
  total_paid: number
  outstanding_amount: number
  booking_date: string
  payment_count: number
  overdue_count: number
}

export default function SalesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { formatAmount } = useCurrency()
  
  // States
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")

  // Fetch sales
  const fetchSales = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)

      const response = await axios.get(`/api/sales-v2?${params.toString()}`)
      setSales(response.data.sales)
    } catch (error) {
      console.error("Error fetching sales:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
  }, [search, statusFilter])

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return

    try {
      await axios.delete(`/api/sales-v2/${id}`)
      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      })
      fetchSales()
    } catch (error: any) {
      console.error("Error deleting sale:", error)
      const errorData = error.response?.data
      const errorMsg = errorData?.details || errorData?.error || "Failed to cancel booking"
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  // Calculate summary stats
  const totalBookings = sales.length
  const totalValue = sales.reduce((sum, s) => sum + (s.net_price || 0), 0)
  const totalPaid = sales.reduce((sum, s) => sum + (s.total_paid || 0), 0)
  const totalOutstanding = sales.reduce((sum, s) => sum + (s.outstanding_amount || 0), 0)
  const overdueBookings = sales.filter(s => s.overdue_count > 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales & Bookings</h1>
          <p className="text-muted-foreground">Manage property bookings and sales</p>
        </div>
        <Button onClick={() => router.push("/sales-v2/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Booking
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatAmount(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatAmount(totalOutstanding)}</div>
          </CardContent>
        </Card>
        <Card className={overdueBookings > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${overdueBookings > 0 ? "text-red-600" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueBookings > 0 ? "text-red-600" : ""}`}>
              {overdueBookings} bookings
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>Click on a booking to view full details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, project, unit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="agreement_signed">Agreement Signed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="handed_over">Handed Over</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <LoadingTable />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking No</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Net Price</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No bookings found. Click "New Booking" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow 
                        key={sale.id} 
                        className={`cursor-pointer hover:bg-muted/50 ${sale.overdue_count > 0 ? 'bg-red-50 hover:bg-red-100' : ''}`}
                        onClick={() => router.push(`/sales-v2/${sale.id}`)}
                      >
                        <TableCell className="font-medium">{sale.sale_no}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sale.customer_name}</div>
                            <div className="text-xs text-muted-foreground">{sale.customer_phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{sale.project_name}</TableCell>
                        <TableCell>
                          {sale.product_name}
                          {sale.unit_no && <span className="text-muted-foreground"> ({sale.unit_no})</span>}
                        </TableCell>
                        <TableCell className="text-right">{formatAmount(sale.net_price)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatAmount(sale.total_paid)}</TableCell>
                        <TableCell className={`text-right ${sale.outstanding_amount > 0 ? 'text-red-600 font-medium' : ''}`}>
                          {formatAmount(sale.outstanding_amount)}
                          {sale.overdue_count > 0 && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              {sale.overdue_count} overdue
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[sale.sale_status] || 'bg-gray-100'}>
                            {sale.sale_status?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => router.push(`/sales-v2/${sale.id}`)} 
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => router.push(`/sales-v2/new?edit=${sale.id}`)} 
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(sale.id)} 
                              title="Cancel"
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
    </div>
  )
}

function LoadingTable() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking No</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Net Price</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Outstanding</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-8 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
              <TableCell><Skeleton className="h-6 w-16" /></TableCell>
              <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
