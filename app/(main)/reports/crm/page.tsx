"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { DateField } from "@/components/ui/date-field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText } from "lucide-react"

export default function CRMReportsPage() {
  const [reportType, setReportType] = useState("")
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    status: "",
  })

  const handleGenerateReport = () => {
    console.log("Generating CRM report:", reportType, filters)
    // TODO: Implement report generation
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CRM Reports</h1>
        <p className="text-muted-foreground">Generate and view CRM analytics reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate CRM Report</CardTitle>
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
                <SelectItem value="leads_summary">Leads Summary</SelectItem>
                <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                <SelectItem value="source_analysis">Lead Source Analysis</SelectItem>
                <SelectItem value="status_breakdown">Status Breakdown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <DateField
                id="fromDate"
                value={filters.fromDate}
                onChange={(v) => setFilters({ ...filters, fromDate: v })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <DateField
                id="toDate"
                value={filters.toDate}
                onChange={(v) => setFilters({ ...filters, toDate: v })}
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
