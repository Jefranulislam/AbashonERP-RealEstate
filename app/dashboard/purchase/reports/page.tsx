"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function PurchaseReportsPage() {
  const [reportType, setReportType] = useState("all")

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Purchase Reports</h1>
        <div className="flex gap-2">
          <Button disabled variant="outline">Print</Button>
          <Button disabled>Export</Button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This module is under development. Generate comprehensive purchase reports and analysis.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
            <CardDescription>Select criteria for your purchase report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Purchases</SelectItem>
                    <SelectItem value="by-vendor">By Vendor</SelectItem>
                    <SelectItem value="by-project">By Project</SelectItem>
                    <SelectItem value="by-date">By Date Range</SelectItem>
                  </SelectContent>
                </Select>
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
            <Button disabled className="mt-4">Generate Report</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">৳ 0.00</div>
              <p className="text-sm text-muted-foreground mt-1">This period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Requisitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">0</div>
              <p className="text-sm text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approved Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">0</div>
              <p className="text-sm text-muted-foreground mt-1">This period</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Coming Soon:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Vendor-wise purchase analysis</li>
          <li>Project-wise purchase tracking</li>
          <li>Monthly/yearly comparison reports</li>
          <li>Top vendors and items report</li>
          <li>Purchase trend analysis</li>
        </ul>
      </div>
    </div>
  )
}
