"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Printer, Download, CheckCircle2, AlertCircle, Loader2, Scale } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export default function TrialBalancePage() {
  const { toast } = useToast()
  const currentYear = new Date().getFullYear()
  const [params, setParams] = useState({
    fromDate: `${currentYear}-01-01`,
    toDate: new Date().toISOString().split("T")[0],
    projectId: ""
  })

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await axios.get("/api/projects")
      return response.data.projects || []
    },
  })

  const { data: trialBalance, isLoading, refetch } = useQuery({
    queryKey: ["trial-balance", params],
    queryFn: async () => {
      const query = new URLSearchParams()
      query.append("fromDate", params.fromDate)
      query.append("toDate", params.toDate)
      if (params.projectId && params.projectId !== "all") {
        query.append("projectId", params.projectId)
      }
      const response = await axios.get(`/api/accounting/trial-balance?${query.toString()}`)
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
      toast({ title: "Report generated", description: "Trial balance has been generated successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate trial balance", variant: "destructive" })
    }
  }

  const exportToExcel = () => {
    if (!trialBalance) {
      toast({ title: "No data", description: "Please generate the report first", variant: "destructive" })
      return
    }
    const csv = generateCSV(trialBalance)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `trial_balance_${params.fromDate}_to_${params.toDate}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast({ title: "Export successful", description: "Trial balance exported to Excel format" })
  }

  const generateCSV = (data: any) => {
    let csv = "Trial Balance\n"
    csv += `Period: ${data.fromDate} to ${data.toDate}\n`
    if (data.projectName) csv += `Project: ${data.projectName}\n`
    csv += "\n"
    csv += "Account Name,Account Type,Debit,Credit\n"
    
    data.accounts.forEach((account: any) => {
      csv += `${account.accountName},${account.accountType},${account.debit},${account.credit}\n`
    })
    
    csv += `\nTotal,,${data.totals.totalDebit},${data.totals.totalCredit}\n`
    csv += `\nBalance Status,${data.totals.isBalanced ? "BALANCED" : "NOT BALANCED"}\n`
    csv += `Difference,,${data.totals.difference}\n`
    
    return csv
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Trial Balance</h1>
          <p className="text-sm text-muted-foreground mt-1">View all account balances for a specific period</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={!trialBalance}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel} disabled={!trialBalance}>
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
            Generate Trial Balance
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      )}

      {trialBalance && !isLoading && (
        <Card>
          <CardHeader className="text-center border-b">
            <h2 className="text-2xl font-bold">Trial Balance Report</h2>
            <p className="text-sm text-muted-foreground">Period: {new Date(trialBalance.fromDate).toLocaleDateString()} to {new Date(trialBalance.toDate).toLocaleDateString()}</p>
            {trialBalance.projectName && <p className="text-sm font-semibold text-primary mt-1">Project: {trialBalance.projectName}</p>}
          </CardHeader>
          <CardContent className="p-6">
            {trialBalance.accounts.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead className="w-[120px]">Type</TableHead>
                      <TableHead className="text-right w-[180px]">Debit ()</TableHead>
                      <TableHead className="text-right w-[180px]">Credit ()</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialBalance.accounts.map((account: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{account.accountName}</TableCell>
                        <TableCell>
                          <Badge variant={account.accountType === "Income" ? "default" : account.accountType === "Expense" ? "destructive" : "secondary"}>
                            {account.accountType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-blue-600">
                          {account.debit > 0 ? account.debit.toLocaleString("en-BD", { minimumFractionDigits: 2 }) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          {account.credit > 0 ? account.credit.toLocaleString("en-BD", { minimumFractionDigits: 2 }) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold border-t-2">
                      <TableCell colSpan={2} className="text-lg">TOTAL</TableCell>
                      <TableCell className="text-right font-mono text-lg text-blue-600">
                        {trialBalance.totals.totalDebit.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-lg text-green-600">
                        {trialBalance.totals.totalCredit.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${trialBalance.totals.isBalanced ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  {trialBalance.totals.isBalanced ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <div className="flex-1">
                        <p className="font-bold text-green-900 text-lg">Trial Balance is Balanced </p>
                        <p className="text-sm text-green-700">
                          Total Debit ({trialBalance.totals.totalDebit.toLocaleString("en-BD")}) = Total Credit ({trialBalance.totals.totalCredit.toLocaleString("en-BD")})
                        </p>
                      </div>
                      <Scale className="h-8 w-8 text-green-600" />
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-6 w-6 text-red-600" />
                      <div className="flex-1">
                        <p className="font-bold text-red-900 text-lg">Trial Balance is NOT Balanced </p>
                        <p className="text-sm text-red-700">
                          Difference: {trialBalance.totals.difference.toLocaleString("en-BD")} 
                          (Debit: {trialBalance.totals.totalDebit.toLocaleString("en-BD")} | Credit: {trialBalance.totals.totalCredit.toLocaleString("en-BD")})
                        </p>
                      </div>
                      <Scale className="h-8 w-8 text-red-600" />
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg font-semibold text-muted-foreground">No account balances found</p>
                <p className="text-sm text-muted-foreground mt-2">There are no transactions in the selected period</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!trialBalance && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No Trial Balance Generated</p>
            <p className="text-sm text-muted-foreground mb-4">Select dates and click "Generate" to view your trial balance</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
