"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { DateField } from "@/components/ui/date-field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/hooks/use-currency"

type ReportType = "customer_ledger" | "ledger_summary" | "seller_ledger" | "location_summary"

const REPORT_LABELS: Record<ReportType, string> = {
  customer_ledger: "Customer Wise Party Ledger",
  ledger_summary: "Customer Party Ledger Summary",
  seller_ledger: "Seller Name Wise Party Ledger",
  location_summary: "Location Wise Party Ledger Summary",
}

interface LedgerRow {
  name: string
  detail?: string
  saleCount: number
  totalAmount: number
  paidAmount: number
  dueAmount: number
}

export default function SalesReportsPage() {
  const { toast } = useToast()
  const { formatAmount } = useCurrency()
  const [reportType, setReportType] = useState<ReportType | "">("")
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    projectId: "",
  })
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [generatedFor, setGeneratedFor] = useState<ReportType | "">("")

  useEffect(() => {
    axios
      .get("/api/projects")
      .then((res) => setProjects(res.data.projects || []))
      .catch(() => {})
  }, [])

  const handleGenerateReport = async () => {
    if (!reportType) {
      toast({ title: "Select a report type", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.fromDate) params.append("fromDate", filters.fromDate)
      if (filters.toDate) params.append("toDate", filters.toDate)
      if (filters.projectId) params.append("projectId", filters.projectId)

      const response = await axios.get(`/api/reports/sales?${params.toString()}`)
      setReportData(response.data)
      setGeneratedFor(reportType)
    } catch (error: any) {
      console.error("Error generating sales report:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Normalize the selected dataset into a common ledger-row shape
  const rows: LedgerRow[] = (() => {
    if (!reportData || !generatedFor) return []
    switch (generatedFor) {
      case "customer_ledger":
      case "ledger_summary":
        return (reportData.customerLedger || []).map((r: any) => ({
          name: r.customerName,
          detail: r.phone,
          saleCount: r.saleCount,
          totalAmount: r.totalAmount,
          paidAmount: r.paidAmount,
          dueAmount: r.dueAmount,
        }))
      case "seller_ledger":
        return (reportData.sellerPerformance || []).map((r: any) => ({
          name: r.sellerName,
          saleCount: r.saleCount,
          totalAmount: r.totalAmount,
          paidAmount: r.paidAmount,
          dueAmount: r.dueAmount,
        }))
      case "location_summary":
        return (reportData.projectLedger || []).map((r: any) => ({
          name: r.projectName,
          detail: r.locationName,
          saleCount: r.saleCount,
          totalAmount: r.totalAmount,
          paidAmount: r.paidAmount,
          dueAmount: r.dueAmount,
        }))
      default:
        return []
    }
  })()

  const nameHeader =
    generatedFor === "seller_ledger" ? "Seller" : generatedFor === "location_summary" ? "Project" : "Customer"
  const detailHeader =
    generatedFor === "location_summary" ? "Location" : generatedFor === "seller_ledger" ? "" : "Phone"

  const totals = rows.reduce(
    (acc, r) => ({
      saleCount: acc.saleCount + (r.saleCount || 0),
      totalAmount: acc.totalAmount + (r.totalAmount || 0),
      paidAmount: acc.paidAmount + (r.paidAmount || 0),
      dueAmount: acc.dueAmount + (r.dueAmount || 0),
    }),
    { saleCount: 0, totalAmount: 0, paidAmount: 0, dueAmount: 0 },
  )

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
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REPORT_LABELS) as ReportType[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {REPORT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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
            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Select
                value={filters.projectId || "all"}
                onValueChange={(v) => setFilters({ ...filters, projectId: v === "all" ? "" : v })}
              >
                <SelectTrigger id="projectId">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerateReport} className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            {loading ? "Generating..." : "Generate Report"}
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reportData && generatedFor && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.summary?.totalSales ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(reportData.summary?.totalRevenue ?? 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatAmount(reportData.summary?.totalPaid ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Collection rate: {reportData.summary?.collectionRate ?? "0%"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatAmount(reportData.summary?.totalDue ?? 0)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{generatedFor ? REPORT_LABELS[generatedFor as ReportType] : "Report Preview"}</CardTitle>
          <CardDescription>
            {generatedFor ? `${rows.length} records` : "Your generated report will appear here"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!reportData || !generatedFor ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Select a report type and click "Generate Report" to view results
            </div>
          ) : rows.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No data found for the selected filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{nameHeader}</TableHead>
                    {detailHeader && <TableHead>{detailHeader}</TableHead>}
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.name || "-"}</TableCell>
                      {detailHeader && <TableCell>{row.detail || "-"}</TableCell>}
                      <TableCell className="text-right">{row.saleCount}</TableCell>
                      <TableCell className="text-right">{formatAmount(row.totalAmount)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatAmount(row.paidAmount)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatAmount(row.dueAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={detailHeader ? 2 : 1} className="text-right">
                      Total:
                    </TableCell>
                    <TableCell className="text-right">{totals.saleCount}</TableCell>
                    <TableCell className="text-right">{formatAmount(totals.totalAmount)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatAmount(totals.paidAmount)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatAmount(totals.dueAmount)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
