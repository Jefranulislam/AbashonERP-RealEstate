"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function LocationLedgerPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Location Wise Party Ledger Summary</h1>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Project</Label>
              <Input placeholder="Select project" />
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
          <div className="text-sm text-muted-foreground">Report generation coming soon.</div>
        </CardContent>
      </Card>
    </div>
  )
}
