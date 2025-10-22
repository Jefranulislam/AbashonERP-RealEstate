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
import { FileText, Printer, Download, Building2, Wallet, AlertCircle, CheckCircle2 } from "lucide-react"

export default function BalanceSheetPage() {
  const [showSampleData, setShowSampleData] = useState(false)
  const [asOnDate, setAsOnDate] = useState("")

  // Sample data for demonstration
  const sampleAssets = {
    currentAssets: [
      { name: "Cash in Hand", amount: 350000 },
      { name: "Bank Accounts", amount: 2850000 },
      { name: "Accounts Receivable", amount: 1450000 },
      { name: "Inventory - Raw Materials", amount: 680000 },
      { name: "Prepaid Expenses", amount: 120000 },
      { name: "Advance to Suppliers", amount: 450000 },
    ],
    fixedAssets: [
      { name: "Land", amount: 8500000 },
      { name: "Buildings", amount: 4200000 },
      { name: "Machinery & Equipment", amount: 1850000 },
      { name: "Vehicles", amount: 950000 },
      { name: "Office Equipment", amount: 280000 },
      { name: "Less: Accumulated Depreciation", amount: -850000 },
    ],
  }

  const sampleLiabilities = {
    currentLiabilities: [
      { name: "Accounts Payable", amount: 980000 },
      { name: "Short-term Loans", amount: 1200000 },
      { name: "Accrued Expenses", amount: 165000 },
      { name: "Advance from Customers", amount: 750000 },
      { name: "Provision for Taxes", amount: 320000 },
    ],
    longTermLiabilities: [
      { name: "Long-term Bank Loan", amount: 3500000 },
      { name: "Mortgage Payable", amount: 2800000 },
    ],
  }

  const sampleEquity = [
    { name: "Capital", amount: 8000000 },
    { name: "Retained Earnings", amount: 2125000 },
    { name: "Current Year Profit", amount: 1220000 },
  ]

  const totalCurrentAssets = sampleAssets.currentAssets.reduce((sum, item) => sum + item.amount, 0)
  const totalFixedAssets = sampleAssets.fixedAssets.reduce((sum, item) => sum + item.amount, 0)
  const totalAssets = totalCurrentAssets + totalFixedAssets

  const totalCurrentLiabilities = sampleLiabilities.currentLiabilities.reduce((sum, item) => sum + item.amount, 0)
  const totalLongTermLiabilities = sampleLiabilities.longTermLiabilities.reduce((sum, item) => sum + item.amount, 0)
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities
  
  const totalEquity = sampleEquity.reduce((sum, item) => sum + item.amount, 0)
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01

  const handleShowSampleData = () => {
    setShowSampleData(true)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Balance Sheet</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Statement of financial position showing assets, liabilities, and equity
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
          <div className="flex gap-4 items-end">
            <div className="space-y-2 flex-1 max-w-xs">
              <Label>As on Date</Label>
              <Input 
                type="date"
                value={asOnDate}
                onChange={(e) => setAsOnDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleShowSampleData}>
                <FileText className="h-4 w-4 mr-2" />
                Show Sample Report
              </Button>
              <Button variant="outline" disabled>
                Generate Real Report (Coming Soon)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {showSampleData && (
        <div className="space-y-6">
          {/* Report Header */}
          <Card>
            <CardHeader className="text-center border-b">
              <h2 className="text-2xl font-bold">Balance Sheet</h2>
              <p className="text-sm text-muted-foreground">
                As on: {asOnDate || "December 31, 2024"}
              </p>
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ This is sample data for UI demonstration only
              </p>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            {/* Assets Side */}
            <div className="space-y-6">
              {/* Current Assets */}
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-blue-900">Current Assets</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {sampleAssets.currentAssets.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{item.name}</span>
                        <span className="font-mono text-sm font-medium">
                          ৳{item.amount.toLocaleString("en-BD")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t-2 font-bold">
                    <span>Total Current Assets</span>
                    <span className="font-mono text-blue-600">
                      ৳{totalCurrentAssets.toLocaleString("en-BD")}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Fixed Assets */}
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-blue-900">Fixed Assets</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {sampleAssets.fixedAssets.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className={`text-sm ${item.amount < 0 ? "italic text-muted-foreground" : ""}`}>
                          {item.name}
                        </span>
                        <span className={`font-mono text-sm font-medium ${item.amount < 0 ? "text-red-600" : ""}`}>
                          {item.amount < 0 ? "(" : ""}৳{Math.abs(item.amount).toLocaleString("en-BD")}{item.amount < 0 ? ")" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t-2 font-bold">
                    <span>Total Fixed Assets</span>
                    <span className="font-mono text-blue-600">
                      ৳{totalFixedAssets.toLocaleString("en-BD")}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Total Assets */}
              <Card className="border-2 border-blue-400 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">TOTAL ASSETS</span>
                    <span className="text-2xl font-bold font-mono text-blue-600">
                      ৳{totalAssets.toLocaleString("en-BD")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Liabilities & Equity Side */}
            <div className="space-y-6">
              {/* Current Liabilities */}
              <Card className="border-red-200">
                <CardHeader className="bg-red-50">
                  <CardTitle className="text-red-900">Current Liabilities</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {sampleLiabilities.currentLiabilities.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{item.name}</span>
                        <span className="font-mono text-sm font-medium">
                          ৳{item.amount.toLocaleString("en-BD")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t-2 font-bold">
                    <span>Total Current Liabilities</span>
                    <span className="font-mono text-red-600">
                      ৳{totalCurrentLiabilities.toLocaleString("en-BD")}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Long-term Liabilities */}
              <Card className="border-red-200">
                <CardHeader className="bg-red-50">
                  <CardTitle className="text-red-900">Long-term Liabilities</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {sampleLiabilities.longTermLiabilities.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{item.name}</span>
                        <span className="font-mono text-sm font-medium">
                          ৳{item.amount.toLocaleString("en-BD")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t font-semibold">
                    <span>Total Long-term Liabilities</span>
                    <span className="font-mono text-red-600">
                      ৳{totalLongTermLiabilities.toLocaleString("en-BD")}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Equity */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-green-900">Owner's Equity</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {sampleEquity.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{item.name}</span>
                        <span className="font-mono text-sm font-medium">
                          ৳{item.amount.toLocaleString("en-BD")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t-2 font-bold">
                    <span>Total Equity</span>
                    <span className="font-mono text-green-600">
                      ৳{totalEquity.toLocaleString("en-BD")}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Total Liabilities & Equity */}
              <Card className="border-2 border-purple-400 bg-purple-50">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold">Total Liabilities</span>
                      <span className="font-mono text-red-600">
                        ৳{totalLiabilities.toLocaleString("en-BD")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold">Total Equity</span>
                      <span className="font-mono text-green-600">
                        ৳{totalEquity.toLocaleString("en-BD")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2">
                      <span className="text-xl font-bold">TOTAL</span>
                      <span className="text-2xl font-bold font-mono text-purple-600">
                        ৳{totalLiabilitiesAndEquity.toLocaleString("en-BD")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Balance Check */}
          <Card className={`border-2 ${isBalanced ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {isBalanced ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-bold text-green-900 text-lg">Balance Sheet is Balanced ✓</p>
                      <p className="text-sm text-green-700">
                        Total Assets (৳{totalAssets.toLocaleString("en-BD")}) = 
                        Total Liabilities + Equity (৳{totalLiabilitiesAndEquity.toLocaleString("en-BD")})
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="font-bold text-red-900 text-lg">Balance Sheet is NOT Balanced ⚠</p>
                      <p className="text-sm text-red-700">
                        Difference: ৳{Math.abs(totalAssets - totalLiabilitiesAndEquity).toLocaleString("en-BD")}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
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
                <span>Automatic calculation from all account balances</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Comparative balance sheets (Year-over-Year)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Detailed account grouping and classification</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Working capital and liquidity ratio calculations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Drill-down to account ledgers from each item</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>PDF export with professional formatting</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Excel export with linked formulas</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Graphical representation and trend analysis</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
