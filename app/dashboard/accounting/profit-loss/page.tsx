"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { ProfitLossPDF } from "@/components/pdf/profit-loss-pdf"
import { printDocument, getCompanySettings } from "@/lib/pdf-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Printer, Download, Loader2, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfitLossPage() {
  const { toast } = useToast()
  const currentYear = new Date().getFullYear()
  const [params, setParams] = useState({
    fromDate: `${currentYear}-01-01`,
    toDate: new Date().toISOString().split("T")[0],
    projectId: ""
  })
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [companySettings, setCompanySettings] = useState<any>(null)

  useEffect(() => {
    loadCompanySettings()
  }, [])

  const loadCompanySettings = async () => {
    const settings = await getCompanySettings()
    setCompanySettings(settings)
  }

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await axios.get("/api/projects")
      return response.data.projects || []
    },
  })

  const { data: profitLoss, isLoading, refetch } = useQuery({
    queryKey: ["profit-loss", params],
    queryFn: async () => {
      const query = new URLSearchParams()
      query.append("fromDate", params.fromDate)
      query.append("toDate", params.toDate)
      if (params.projectId && params.projectId !== "all") {
        query.append("projectId", params.projectId)
      }
      const response = await axios.get(`/api/accounting/profit-loss?${query.toString()}`)
      return response.data
    },
    enabled: false,
  })

  const handleGenerateReport = async () => {
    if (!params.fromDate || !params.toDate) {
      toast({ title: "Error", description: "Please select both from and to dates", variant: "destructive" })
      return
    }
    try {
      await refetch()
      toast({ title: "Report generated", description: "Profit & loss statement has been generated successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate profit & loss statement", variant: "destructive" })
    }
  }

  const exportToExcel = () => {
    if (!profitLoss) {
      toast({ title: "No data", description: "Please generate the report first", variant: "destructive" })
      return
    }
    const csv = generateCSV(profitLoss)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `profit_loss_${params.fromDate}_to_${params.toDate}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast({ title: "Export successful", description: "Profit & loss statement exported to Excel format" })
  }

  const handlePrint = () => {
    if (!profitLoss) {
      toast({ title: "No data", description: "Please generate the report first", variant: "destructive" })
      return
    }
    setPrintDialogOpen(true)
    setTimeout(() => {
      printDocument('print-profit-loss-content')
      setPrintDialogOpen(false)
    }, 100)
  }

  const generateCSV = (data: any) => {
    let csv = "Profit & Loss Statement\n"
    csv += `Period: ${data.fromDate} to ${data.toDate}\n`
    if (data.projectName) csv += `Project: ${data.projectName}\n`
    csv += "\n"
    
    csv += "INCOME\n"
    data.income.forEach((category: any) => {
      csv += `${category.category}\n`
      category.items.forEach((item: any) => {
        csv += `${item.name},${item.amount}\n`
      })
      csv += `Subtotal,${category.subtotal}\n\n`
    })
    csv += `Total Income,${data.totals.totalIncome}\n\n`
    
    csv += "EXPENSES\n"
    data.expenses.forEach((category: any) => {
      csv += `${category.category}\n`
      category.items.forEach((item: any) => {
        csv += `${item.name},${item.amount}\n`
      })
      csv += `Subtotal,${category.subtotal}\n\n`
    })
    csv += `Total Expenses,${data.totals.totalExpenses}\n\n`
    
    csv += `Net Profit/Loss,${data.totals.netProfit}\n`
    csv += `Profit Margin,${data.totals.profitMargin}%\n`
    
    return csv
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Profit & Loss Statement</h1>
          <p className="text-sm text-muted-foreground mt-1">Income statement showing revenue, expenses, and net profit/loss</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={!profitLoss}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel} disabled={!profitLoss}>
            <Download className="h-4 w-4 mr-2" />Export Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Report Parameters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Project (Optional)</Label>
              <Select value={params.projectId} onValueChange={(value) => setParams({...params, projectId: value})}>
                <SelectTrigger><SelectValue placeholder="All Projects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>{project.project_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From Date *</Label>
              <Input type="date" value={params.fromDate} onChange={(e) => setParams({...params, fromDate: e.target.value})} max={params.toDate || new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-2">
              <Label>To Date *</Label>
              <Input type="date" value={params.toDate} onChange={(e) => setParams({...params, toDate: e.target.value})} min={params.fromDate} max={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
          <Button onClick={handleGenerateReport} disabled={isLoading} className="mt-4">
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Generate Profit & Loss Statement
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      )}

      {profitLoss && !isLoading && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center border-b">
              <h2 className="text-2xl font-bold">Profit & Loss Statement</h2>
              <p className="text-sm text-muted-foreground">For the period: {new Date(profitLoss.fromDate).toLocaleDateString()} to {new Date(profitLoss.toDate).toLocaleDateString()}</p>
              {profitLoss.projectName && <p className="text-sm font-semibold text-primary mt-1">Project: {profitLoss.projectName}</p>}
            </CardHeader>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-900">Income</CardTitle>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {profitLoss.totals.totalIncome.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {profitLoss.income.length > 0 ? (
                profitLoss.income.map((category: any, catIndex: number) => (
                  <div key={catIndex} className="mb-6 last:mb-0">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase">{category.category}</h3>
                    <div className="space-y-2 pl-4">
                      {category.items.map((item: any, itemIndex: number) => (
                        <div key={itemIndex} className="flex justify-between items-center">
                          <span className="text-sm">{item.name}</span>
                          <span className="font-mono text-sm font-medium">{item.amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t font-semibold">
                      <span className="text-sm">Subtotal - {category.category}</span>
                      <span className="font-mono text-sm text-green-600">{category.subtotal.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No income transactions found for this period</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-900">Expenses</CardTitle>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {profitLoss.totals.totalExpenses.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {profitLoss.expenses.length > 0 ? (
                profitLoss.expenses.map((category: any, catIndex: number) => (
                  <div key={catIndex} className="mb-6 last:mb-0">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase">{category.category}</h3>
                    <div className="space-y-2 pl-4">
                      {category.items.map((item: any, itemIndex: number) => (
                        <div key={itemIndex} className="flex justify-between items-center">
                          <span className="text-sm">{item.name}</span>
                          <span className="font-mono text-sm font-medium">{item.amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t font-semibold">
                      <span className="text-sm">Subtotal - {category.category}</span>
                      <span className="font-mono text-sm text-red-600">{category.subtotal.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No expense transactions found for this period</p>
              )}
            </CardContent>
          </Card>

          <Card className={`border-2 ${profitLoss.totals.netProfit >= 0 ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
            <CardHeader><CardTitle className="text-center text-2xl">{profitLoss.totals.netProfit >= 0 ? "Net Profit" : "Net Loss"}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span>Total Income</span>
                  <span className="font-mono font-bold text-green-600">{profitLoss.totals.totalIncome.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span>Total Expenses</span>
                  <span className="font-mono font-bold text-red-600">{profitLoss.totals.totalExpenses.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{profitLoss.totals.netProfit >= 0 ? "Net Profit" : "Net Loss"}</span>
                    <span className={`text-3xl font-bold font-mono ${profitLoss.totals.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {Math.abs(profitLoss.totals.netProfit).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-sm text-muted-foreground">
                    <span>Profit Margin</span>
                    <span className={`font-semibold ${profitLoss.totals.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {profitLoss.totals.profitMargin.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!profitLoss && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No Profit & Loss Statement Generated</p>
            <p className="text-sm text-muted-foreground mb-4">Select dates and click "Generate" to view your profit & loss statement</p>
          </CardContent>
        </Card>
      )}

      {/* Hidden Print Content */}
      {printDialogOpen && profitLoss && companySettings && (
        <div className="hidden">
          <div id="print-profit-loss-content">
            <ProfitLossPDF
              revenue={profitLoss.income}
              expenses={profitLoss.expenses}
              totals={profitLoss.totals}
              fromDate={profitLoss.fromDate}
              toDate={profitLoss.toDate}
              projectName={profitLoss.projectName}
              companyName={companySettings.company_name}
              companyAddress={companySettings.address}
              currencySymbol={companySettings.currency_symbol}
            />
          </div>
        </div>
      )}
    </div>
  )
}
