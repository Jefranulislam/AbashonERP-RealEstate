"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText } from "lucide-react"

export default function SalesReportsPage() {
  const [reportType, setReportType] = useState("")
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    projectId: "",
  })

  const handleGenerateReport = () => {
    console.log("[v0] Generating sales report:", reportType, filters)
    // TODO: Implement report generation
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
        <p className="text-muted-foreground">Generate and view sales analytics reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Sales Report</CardTitle>
          <CardDescription>Select report type and filters to generate reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer_ledger">Customer Wise Party Ledger</SelectItem>
                <SelectItem value="ledger_summary">Customer Party Ledger Summary</SelectItem>
                <SelectItem value="seller_ledger">Seller Name Wise Party Ledger</SelectItem>
                <SelectItem value="location_summary">Location Wise Party Ledger Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <input
                id="fromDate"
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <input
                id="toDate"
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={handleGenerateReport} className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
          <CardDescription>Your generated report will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Select a report type and click "Generate Report" to view results
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
