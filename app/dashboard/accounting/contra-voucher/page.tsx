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

export default function ContraVoucherPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Contra Voucher</h1>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This module is under development. Contra vouchers are used for cash/bank transfers and withdrawals.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Contra Voucher</CardTitle>
          <CardDescription>Record cash and bank transfers</CardDescription>
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
              <Label>From Account</Label>
              <Input placeholder="Select bank/cash account" />
            </div>
            <div>
              <Label>To Account</Label>
              <Input placeholder="Select bank/cash account" />
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" placeholder="Enter amount" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Enter transfer details" />
            </div>
            <Button disabled>Save Contra Entry</Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Coming Soon:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Cash withdrawals from bank</li>
          <li>Cash deposits to bank</li>
          <li>Bank-to-bank transfers</li>
          <li>Automatic balance updates</li>
          <li>Transfer receipt printing</li>
        </ul>
      </div>
    </div>
  )
}
