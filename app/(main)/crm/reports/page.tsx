"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"
import { FileText, Download, Loader2, Users, TrendingUp, Phone, UserCheck, Clock, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReportData {
  summary: {
    totalLeads: number
    convertedLeads: number
    conversionRate: string
    todayCalls: number
    overdueCalls: number
    upcomingCalls: number
  }
  statusDistribution: { status: string; count: number }[]
  sourceDistribution: { source: string; count: number }[]
  employeePerformance: {
    employeeName: string
    leadCount: number
    convertedCount: number
    conversionRate: string
  }[]
  projectDistribution: { project: string; count: number }[]
  trendData: { date: string; count: number }[]
  qualityMetrics: {
    positive: number
    negative: number
    junk: number
    followup: number
    new: number
    willVisit: number
  }
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#FF6B6B"]

export default function CRMReportsPage() {
  const { toast } = useToast()
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)

  const fetchReport = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append("fromDate", dateRange.from)
      if (dateRange.to) params.append("toDate", dateRange.to)

      const response = await fetch(`/api/reports/crm?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch report")
      
      const data = await response.json()
      setReportData(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch report data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  const exportToCSV = () => {
    if (!reportData) return

    let csvContent = ""
    
    // Status breakdown
    csvContent += "Status Distribution\n"
    csvContent += "Status,Count\n"
    reportData.statusDistribution.forEach(item => {
      csvContent += `${item.status},${item.count}\n`
    })
    csvContent += "\n"

    // Source analysis
    csvContent += "Source Distribution\n"
    csvContent += "Source,Count\n"
    reportData.sourceDistribution.forEach(item => {
      csvContent += `${item.source},${item.count}\n`
    })
    csvContent += "\n"

    // Summary
    csvContent += "Summary\n"
    csvContent += `Total Leads,${reportData.summary.totalLeads}\n`
    csvContent += `Converted Leads,${reportData.summary.convertedLeads}\n`
    csvContent += `Conversion Rate,${reportData.summary.conversionRate}\n`
    csvContent += `Today's Calls,${reportData.summary.todayCalls}\n`
    csvContent += `Overdue Calls,${reportData.summary.overdueCalls}\n`

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `crm_report_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Reports</h1>
          <p className="text-muted-foreground">Analytics and insights for your CRM data</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" disabled={!reportData}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Filter report data by date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">From Date</Label>
              <Input
                id="from"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To Date</Label>
              <Input
                id="to"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
            <Button onClick={fetchReport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reportData ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.totalLeads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Converted</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.convertedLeads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.conversionRate}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Calls</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.todayCalls}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{reportData.summary.overdueCalls}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.upcomingCalls}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Status Breakdown Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Status Distribution</CardTitle>
                <CardDescription>Distribution of leads by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="status"
                      >
                        {reportData.statusDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Source Analysis Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Source Analysis</CardTitle>
                <CardDescription>Number of leads by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.sourceDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="source" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" name="Leads" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          {reportData.trendData && reportData.trendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lead Creation Trend (Last 30 Days)</CardTitle>
                <CardDescription>Daily lead creation over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" name="Leads Created" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Employee Performance */}
          {reportData.employeePerformance && reportData.employeePerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Employee Performance</CardTitle>
                <CardDescription>Lead assignments and conversions by employee</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.employeePerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="employeeName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="leadCount" fill="#8884d8" name="Total Leads" />
                      <Bar dataKey="convertedCount" fill="#82ca9d" name="Converted" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Distribution */}
          {reportData.projectDistribution && reportData.projectDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Leads by Project</CardTitle>
                <CardDescription>Distribution of leads across projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.projectDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="project" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#00C49F" name="Leads" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No report data available</p>
          <Button variant="link" onClick={fetchReport}>
            Generate Report
          </Button>
        </div>
      )}
    </div>
  )
}
