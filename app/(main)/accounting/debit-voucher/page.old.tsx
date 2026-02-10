"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DebitVoucherPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Debit Voucher</h1>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This module is under development. Debit vouchers are used to record expenses and payments made by the company.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Debit Voucher</CardTitle>
          <CardDescription>Record expense payments and debit transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Voucher Date</Label>
                <Input type="date" placeholder="Select date" />
              </div>
              <div>
                <Label>Voucher Number</Label>
                <Input placeholder="Auto-generated" disabled />
              </div>
            </div>
            <div>
              <Label>Account Head</Label>
              <Input placeholder="Select expense head" />
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" placeholder="Enter amount" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Enter payment details" />
            </div>
            <Button disabled>Save Voucher</Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Coming Soon:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Create and manage debit vouchers</li>
          <li>Link to expense heads and bank accounts</li>
          <li>Multiple payment line items support</li>
          <li>Voucher approval workflow</li>
          <li>Print and export vouchers</li>
        </ul>
      </div>
    </div>
  )
}
