"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Download, FileText, FileSpreadsheet, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { LedgerReportPDF } from "@/components/pdf/ledger-report-pdf"
import { printDocument, getCompanySettings } from "@/lib/pdf-utils"

export default function LedgerPage() {
  const { toast } = useToast()
  const [selectedExpenseHead, setSelectedExpenseHead] = useState<string>("") 
  const [fromDate, setFromDate] = useState<string>("")  
  const [toDate, setToDate] = useState<string>("")  
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [companySettings, setCompanySettings] = useState<any>(null)  // Fetch expense heads
  const { data: expenseHeads = [], isLoading: expenseHeadsLoading } = useQuery({
    queryKey: ["expense-heads"],
    queryFn: async () => {
      const response = await axios.get("/api/finance/expense-heads")
      return response.data.expenseHeads || []
    },
  })

  // Group expense heads by type (using type_name from the API)
  const incomeHeads = expenseHeads.filter((head: any) => 
    head.type === "Income" || head.type_name === "Income"
  )
  const expenseOnlyHeads = expenseHeads.filter((head: any) => 
    head.type === "Expense" || head.type_name === "Expense"
  )

  // Fetch ledger data
  const { data: ledgerData, isLoading: ledgerLoading, error } = useQuery({
    queryKey: ["ledger", selectedExpenseHead, fromDate, toDate],
    queryFn: async () => {
      if (!selectedExpenseHead) return null
      
      const params = new URLSearchParams({
        expenseHeadId: selectedExpenseHead,
      })
      
      if (fromDate) params.append("fromDate", fromDate)
      if (toDate) params.append("toDate", toDate)
      
      const response = await axios.get(`/api/accounting/ledger?${params.toString()}`)
      return response.data
    },
    enabled: !!selectedExpenseHead,
  })

  // Export to Excel (CSV format)
  const exportToExcel = () => {
    if (!ledgerData || !ledgerData.entries.length) {
      toast({
        title: "No data to export",
        description: "Please select an account and ensure there are ledger entries.",
        variant: "destructive",
      })
      return
    }

    const csvContent = generateCSV()
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    link.setAttribute("href", url)
    link.setAttribute("download", `ledger_${ledgerData.expenseHead.head_name}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export successful",
      description: "Ledger has been exported to Excel format.",
    })
  }

  // Export to PDF
  const exportToPDF = () => {
    if (!ledgerData || !ledgerData.entries.length) {
      toast({
        title: "No data to export",
        description: "Please select an account and ensure there are ledger entries.",
        variant: "destructive",
      })
      return
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const htmlContent = generatePDFContent()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    setTimeout(() => {
      printWindow.print()
    }, 250)

    toast({
      title: "Print dialog opened",
      description: "You can save as PDF from the print dialog.",
    })
  }

  // Load company settings for PDF
  useEffect(() => {
    loadCompanySettings()
  }, [])

  const loadCompanySettings = async () => {
    const settings = await getCompanySettings()
    setCompanySettings(settings)
  }

  // Print ledger
  const printLedger = () => {
    if (!ledgerData || !ledgerData.entries.length) {
      toast({
        title: "No data to print",
        description: "Please select an account and ensure there are ledger entries.",
        variant: "destructive",
      })
      return
    }

    setPrintDialogOpen(true)
    setTimeout(() => {
      printDocument('print-ledger-content')
    }, 100)
  }

  const generateCSV = () => {
    if (!ledgerData) return ""

    const rows = [
      ["Ledger Report"],
      ["Account:", ledgerData.expenseHead.head_name],
      ["Period:", fromDate && toDate ? `${fromDate} to ${toDate}` : "All Time"],
      ["Opening Balance:", ledgerData.openingBalance.toFixed(2)],
      [""],
      ["Date", "Voucher No", "Particulars", "Debit", "Credit", "Balance"],
    ]

    ledgerData.entries.forEach((entry: any) => {
      rows.push([
        new Date(entry.date).toLocaleDateString(),
        entry.voucherNo,
        entry.particulars,
        entry.debit.toFixed(2),
        entry.credit.toFixed(2),
        entry.balance.toFixed(2),
      ])
    })

    rows.push([""])
    rows.push(["Total", "", "", ledgerData.totalDebit.toFixed(2), ledgerData.totalCredit.toFixed(2), ""])
    rows.push(["Closing Balance:", ledgerData.closingBalance.toFixed(2)])

    return rows.map(row => row.join(",")).join("\n")
  }

  const generatePDFContent = () => {
    if (!ledgerData) return ""

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ledger Report - ${ledgerData.expenseHead.head_name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            color: #333;
            font-size: 24px;
          }
          .info {
            margin: 20px 0;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .text-right {
            text-align: right;
          }
          .total-row {
            font-weight: bold;
            background-color: #e8f5e9;
          }
          .balance-positive {
            color: #2e7d32;
          }
          .balance-negative {
            color: #c62828;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #333;
            text-align: center;
            color: #777;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Ledger Report</h1>
          <p>Real Estate ERP System</p>
        </div>
        
        <div class="info">
          <div class="info-row">
            <span class="info-label">Account Head:</span>
            <span>${ledgerData.expenseHead.head_name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Account Type:</span>
            <span>${ledgerData.expenseHead.type}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Period:</span>
            <span>${fromDate && toDate ? `${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}` : "All Time"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Opening Balance:</span>
            <span class="${ledgerData.openingBalance >= 0 ? 'balance-positive' : 'balance-negative'}">
              ৳${Math.abs(ledgerData.openingBalance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              ${ledgerData.openingBalance >= 0 ? 'Cr' : 'Dr'}
            </span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Voucher No</th>
              <th>Particulars</th>
              <th class="text-right">Debit (৳)</th>
              <th class="text-right">Credit (৳)</th>
              <th class="text-right">Balance (৳)</th>
            </tr>
          </thead>
          <tbody>
            ${ledgerData.entries.map((entry: any) => `
              <tr>
                <td>${new Date(entry.date).toLocaleDateString()}</td>
                <td>${entry.voucherNo}</td>
                <td>${entry.particulars}</td>
                <td class="text-right">${entry.debit > 0 ? entry.debit.toLocaleString("en-BD", { minimumFractionDigits: 2 }) : '-'}</td>
                <td class="text-right">${entry.credit > 0 ? entry.credit.toLocaleString("en-BD", { minimumFractionDigits: 2 }) : '-'}</td>
                <td class="text-right ${entry.balance >= 0 ? 'balance-positive' : 'balance-negative'}">
                  ${Math.abs(entry.balance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                  ${entry.balance >= 0 ? 'Cr' : 'Dr'}
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3" class="text-right"><strong>Total:</strong></td>
              <td class="text-right"><strong>${ledgerData.totalDebit.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</strong></td>
              <td class="text-right"><strong>${ledgerData.totalCredit.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</strong></td>
              <td class="text-right"><strong>${Math.abs(ledgerData.closingBalance).toLocaleString("en-BD", { minimumFractionDigits: 2 })} ${ledgerData.closingBalance >= 0 ? 'Cr' : 'Dr'}</strong></td>
            </tr>
            <tr class="total-row">
              <td colspan="5" class="text-right"><strong>Closing Balance:</strong></td>
              <td class="text-right ${ledgerData.closingBalance >= 0 ? 'balance-positive' : 'balance-negative'}">
                <strong>৳${Math.abs(ledgerData.closingBalance).toLocaleString("en-BD", { minimumFractionDigits: 2 })} ${ledgerData.closingBalance >= 0 ? 'Cr' : 'Dr'}</strong>
              </td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>Real Estate ERP System - Ledger Report</p>
        </div>
      </body>
      </html>
    `
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ledger</h1>
          <p className="text-muted-foreground">View account-wise transaction history and running balances</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={printLedger}
            disabled={!ledgerData || !ledgerData.entries.length}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={exportToPDF}
            disabled={!ledgerData || !ledgerData.entries.length}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button
            onClick={exportToExcel}
            disabled={!ledgerData || !ledgerData.entries.length}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select account head and date range to view ledger</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expenseHead">Account Head *</Label>
              <Select
                value={selectedExpenseHead}
                onValueChange={setSelectedExpenseHead}
              >
                <SelectTrigger id="expenseHead">
                  <SelectValue placeholder="Choose account head" />
                </SelectTrigger>
                <SelectContent>
                  {expenseHeadsLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    <>
                      {/* Income Heads Group */}
                      {incomeHeads.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-semibold text-green-700 bg-green-50">
                            💰 Income Accounts
                          </div>
                          {incomeHeads.map((head: any) => (
                            <SelectItem key={head.id} value={head.id.toString()}>
                              <span className="flex items-center gap-2">
                                <span className="text-green-600">↑</span>
                                {head.head_name}
                              </span>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {/* Expense Heads Group */}
                      {expenseOnlyHeads.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-semibold text-red-700 bg-red-50 mt-1">
                            💸 Expense Accounts
                          </div>
                          {expenseOnlyHeads.map((head: any) => (
                            <SelectItem key={head.id} value={head.id.toString()}>
                              <span className="flex items-center gap-2">
                                <span className="text-red-600">↓</span>
                                {head.head_name}
                              </span>
                            </SelectItem>
                          ))}
                        </>
                      )}

                      {incomeHeads.length === 0 && expenseOnlyHeads.length === 0 && (
                        <SelectItem value="none" disabled>No accounts found</SelectItem>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Summary */}
      {ledgerData && (
        <>
          {/* Account Info Card */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{ledgerData.expenseHead.head_name}</CardTitle>
                  <CardDescription className="mt-1">
                    {fromDate && toDate 
                      ? `${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}`
                      : "All Time"
                    }
                  </CardDescription>
                </div>
                <div className={`px-4 py-2 rounded-lg ${
                  (ledgerData.expenseHead.type === "Income" || ledgerData.expenseHead.type_name === "Income")
                    ? "bg-green-100 text-green-700 border border-green-300" 
                    : "bg-red-100 text-red-700 border border-red-300"
                }`}>
                  <div className="text-xs font-medium">Type</div>
                  <div className="text-sm font-bold flex items-center gap-1">
                    {(ledgerData.expenseHead.type === "Income" || ledgerData.expenseHead.type_name === "Income") ? "💰" : "💸"}
                    {ledgerData.expenseHead.type || ledgerData.expenseHead.type_name}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${ledgerData.openingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ৳{Math.abs(ledgerData.openingBalance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                  <span className="text-sm ml-1">{ledgerData.openingBalance >= 0 ? 'Cr' : 'Dr'}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Debit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ৳{ledgerData.totalDebit.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Credit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ৳{ledgerData.totalCredit.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${ledgerData.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ৳{Math.abs(ledgerData.closingBalance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                  <span className="text-sm ml-1">{ledgerData.closingBalance >= 0 ? 'Cr' : 'Dr'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Ledger Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ledger Entries</CardTitle>
          <CardDescription>
            {ledgerData ? `${ledgerData.entries.length} transactions` : "Select an account to view ledger"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedExpenseHead ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Please select an account head to view ledger entries</p>
            </div>
          ) : ledgerLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>Error loading ledger data. Please try again.</p>
            </div>
          ) : !ledgerData || ledgerData.entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No ledger entries found for the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Voucher No</TableHead>
                    <TableHead>Particulars</TableHead>
                    <TableHead className="text-right">Debit (৳)</TableHead>
                    <TableHead className="text-right">Credit (৳)</TableHead>
                    <TableHead className="text-right">Balance (৳)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerData.entries.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{entry.voucherNo}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="text-sm">{entry.particulars}</div>
                        {entry.projectName && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Project: {entry.projectName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {entry.debit > 0 ? entry.debit.toLocaleString("en-BD", { minimumFractionDigits: 2 }) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {entry.credit > 0 ? entry.credit.toLocaleString("en-BD", { minimumFractionDigits: 2 }) : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(entry.balance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                        <span className="text-xs ml-1">{entry.balance >= 0 ? 'Cr' : 'Dr'}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={3} className="text-right font-bold">Total:</TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {ledgerData.totalDebit.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {ledgerData.totalCredit.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${ledgerData.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(ledgerData.closingBalance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      <span className="text-xs ml-1">{ledgerData.closingBalance >= 0 ? 'Cr' : 'Dr'}</span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden Print Content */}
      <div className="hidden">
        {printDialogOpen && ledgerData && ledgerData.entries.length > 0 && companySettings && (
          <div id="print-ledger-content">
            <LedgerReportPDF
              expenseHead={ledgerData.expenseHead}
              entries={ledgerData.entries}
              fromDate={fromDate || new Date().toISOString().split('T')[0]}
              toDate={toDate || new Date().toISOString().split('T')[0]}
              openingBalance={ledgerData.openingBalance || 0}
              closingBalance={ledgerData.closingBalance}
              companyName={companySettings.company_name}
              companyAddress={companySettings.address}
              currencySymbol={companySettings.currency_symbol}
            />
          </div>
        )}
      </div>
    </div>
  )
}
