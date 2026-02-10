"use client"

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

export default function InitialBankCashPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Initial Bank & Cash Balances</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Initial Bank/Cash</CardTitle>
          <CardDescription>Set opening balances for bank and cash accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Bank/Cash Name</Label>
              <Input placeholder="Select account" />
            </div>
            <div>
              <Label>Opening Balance</Label>
              <Input type="number" placeholder="Enter balance" />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" />
            </div>
          </div>
          <div className="mt-4">
            <Button disabled>Insert Opening Balance</Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Coming Soon:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Insert initial bank and cash balances</li>
          <li>Import opening balances</li>
          <li>Link to ledger and bank reconciliation</li>
        </ul>
      </div>
    </div>
  )
}
