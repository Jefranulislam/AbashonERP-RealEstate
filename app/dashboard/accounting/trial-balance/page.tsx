"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Printer, Download, CheckCircle2, AlertCircle } from "lucide-react"

export default function TrialBalancePage() {
  const [showSampleData, setShowSampleData] = useState(false)
  const [params, setParams] = useState({
    fromDate: "",
    toDate: "",
    projectId: ""
  })

  // Sample data for demonstration
  const sampleAccounts = [
    { code: "1000", name: "Cash in Hand", debit: 150000, credit: 0 },
    { code: "1001", name: "Bank Account - AB Bank", debit: 0, credit: 280000 },
    { code: "1002", name: "Bank Account - Dutch Bangla", debit: 450000, credit: 0 },
    { code: "2000", name: "Accounts Payable", debit: 0, credit: 125000 },
    { code: "2001", name: "Advance from Customer", debit: 0, credit: 85000 },
    { code: "3000", name: "Project Revenue", debit: 0, credit: 950000 },
    { code: "3001", name: "Service Income", debit: 0, credit: 180000 },
    { code: "4000", name: "Construction Expenses", debit: 680000, credit: 0 },
    { code: "4001", name: "Material Purchase", debit: 245000, credit: 0 },
    { code: "4002", name: "Labor Cost", debit: 95000, credit: 0 },
  ]

  const totalDebit = sampleAccounts.reduce((sum, acc) => sum + acc.debit, 0)
  const totalCredit = sampleAccounts.reduce((sum, acc) => sum + acc.credit, 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const handleShowSampleData = () => {
    setShowSampleData(true)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Trial Balance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all account balances for a specific period
          </p>
        </div>
        <div className="flex gap-2">
          <Button disabled variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button disabled variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Development Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-yellow-900">Backend API Under Development</p>
            <p className="text-sm text-yellow-800 mt-1">
              The backend calculation endpoint is not yet implemented. 
              Click "Show Sample Report" below to see the UI design with mock data.
            </p>
          </div>
        </div>
      </div>

      {/* Parameters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Project (Optional)</Label>
              <Select 
                value={params.projectId} 
                onValueChange={(value) => setParams({...params, projectId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="1">Project Alpha</SelectItem>
                  <SelectItem value="2">Project Beta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input 
                type="date"
                value={params.fromDate}
                onChange={(e) => setParams({...params, fromDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input 
                type="date"
                value={params.toDate}
                onChange={(e) => setParams({...params, toDate: e.target.value})}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleShowSampleData}>
              <FileText className="h-4 w-4 mr-2" />
              Show Sample Report
            </Button>
            <Button variant="outline" disabled>
              Generate Real Report (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {showSampleData && (
        <Card>
          <CardHeader className="text-center border-b">
            <h2 className="text-2xl font-bold">Trial Balance Report</h2>
            <p className="text-sm text-muted-foreground">
              Period: {params.fromDate || "2024-01-01"} to {params.toDate || "2024-12-31"}
            </p>
            <p className="text-xs text-orange-600 mt-2">
              ⚠️ This is sample data for UI demonstration only
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Account Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead className="text-right w-[150px]">Debit (৳)</TableHead>
                  <TableHead className="text-right w-[150px]">Credit (৳)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleAccounts.map((account, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{account.code}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {account.debit > 0 ? account.debit.toLocaleString("en-BD") : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {account.credit > 0 ? account.credit.toLocaleString("en-BD") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold border-t-2">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right font-mono">
                    {totalDebit.toLocaleString("en-BD")}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {totalCredit.toLocaleString("en-BD")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Balance Check */}
            <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${
              isBalanced ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            }`}>
              {isBalanced ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Trial Balance is Balanced ✓</p>
                    <p className="text-sm text-green-700">
                      Total Debit (৳{totalDebit.toLocaleString("en-BD")}) = Total Credit (৳{totalCredit.toLocaleString("en-BD")})
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">Trial Balance is NOT Balanced ⚠</p>
                    <p className="text-sm text-red-700">
                      Difference: ৳{Math.abs(totalDebit - totalCredit).toLocaleString("en-BD")}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coming Soon Features */}
      {!showSampleData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Planned Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Automatic calculation from all voucher transactions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Period-wise filtering (Monthly, Quarterly, Yearly)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Opening and closing balance display</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Drill-down to ledger details from each account</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>PDF export and print functionality</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Excel export with formulas</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Balance verification alerts and error detection</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
