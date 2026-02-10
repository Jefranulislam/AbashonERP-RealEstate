"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function PurchasePaymentReportPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Purchase Payment Report</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Payments</CardTitle>
          <CardDescription>Generate vendor-wise payment reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Vendor</Label>
              <Input placeholder="Select vendor" />
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
          <div className="text-sm text-muted-foreground">No data. This feature will be available soon.</div>
        </CardContent>
      </Card>
    </div>
  )
}
