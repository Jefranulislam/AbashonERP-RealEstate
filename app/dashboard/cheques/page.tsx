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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"

interface Cheque {
  id: number
  customer_id: number
  customer_name?: string
  cheque_number: string
  bank_name: string
  branch_name?: string
  amount: number
  cheque_date: string
  received_date: string
  submitted_date?: string
  is_submitted: boolean
  remarks?: string
}

interface Customer {
  id: number
  customer_name: string
}

export default function ChequesPage() {
  const [cheques, setCheques] = useState<Cheque[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSubmitted, setFilterSubmitted] = useState<string>("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const customersRes = await fetch("/api/customers")
      const customersData = await customersRes.json()
      setCustomers(customersData.customers || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount).replace("BDT", "৳")
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cheques Management</h1>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This module is under development. The API endpoints and
          functionality will be added soon. This page manages cheque receipts from customers,
          tracking submission status and bank details.
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
          <Select value={filterSubmitted} onValueChange={setFilterSubmitted}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SL No.</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Cheque Number</TableHead>
                <TableHead>Bank Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Cheque Date</TableHead>
                <TableHead>Received Date</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  No cheques found. This feature will be available soon.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Coming Soon:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Record customer cheque receipts with bank details</li>
          <li>Track cheque submission to bank</li>
          <li>Mark cheques as cleared or bounced</li>
          <li>Cheque clearance reminders and notifications</li>
          <li>Export cheque reports for accounting</li>
          <li>Link cheques to sales invoices</li>
        </ul>
      </div>
    </div>
  )
}
