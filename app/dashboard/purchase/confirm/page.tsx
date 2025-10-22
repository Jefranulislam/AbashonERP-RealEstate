"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

export default function PurchaseConfirmPage() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Confirm Purchase Requisitions</h1>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This module is under development. Review and approve pending purchase requisitions.
        </p>
      </div>

      <div className="mb-4">
        <Label>Search Requisitions</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by requisition number or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Req. No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No pending requisitions found. This feature will be available soon.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Coming Soon:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Review requisition details</li>
          <li>Approve or reject requisitions</li>
          <li>Multi-level approval workflow</li>
          <li>Convert to purchase order</li>
          <li>Email notifications to vendors</li>
        </ul>
      </div>
    </div>
  )
}
