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

export default function LedgerPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ledger</h1>
        <Button disabled>Export</Button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This module is under development. View account-wise transaction history and running balances.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <Label>Select Account</Label>
          <Input placeholder="Choose account head" />
        </div>
        <div>
          <Label>From Date</Label>
          <Input type="date" />
        </div>
        <div>
          <Label>To Date</Label>
          <Input type="date" />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Voucher No.</TableHead>
              <TableHead>Particulars</TableHead>
              <TableHead>Debit</TableHead>
              <TableHead>Credit</TableHead>
              <TableHead>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No ledger entries found. This feature will be available soon.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Coming Soon:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Account-wise transaction history</li>
          <li>Running balance calculations</li>
          <li>Date range filtering</li>
          <li>Opening and closing balance display</li>
          <li>Export to PDF and Excel</li>
        </ul>
      </div>
    </div>
  )
}
