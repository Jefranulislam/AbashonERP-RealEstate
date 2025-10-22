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
import { FileText, Printer, Download, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react"

export default function ProfitLossPage() {
  const [showSampleData, setShowSampleData] = useState(false)
  const [params, setParams] = useState({
    fromDate: "",
    toDate: "",
    projectId: ""
  })

  // Sample data for demonstration
  const sampleIncome = [
    { category: "Project Revenue", items: [
      { name: "Construction Revenue - Project Alpha", amount: 2500000 },
      { name: "Construction Revenue - Project Beta", amount: 1800000 },
      { name: "Consultation Fees", amount: 350000 },
    ]},
    { category: "Service Income", items: [
      { name: "Design Services", amount: 450000 },
      { name: "Project Management Fees", amount: 280000 },
    ]},
    { category: "Other Income", items: [
      { name: "Interest Income", amount: 15000 },
      { name: "Rental Income", amount: 45000 },
    ]},
  ]

  const sampleExpenses = [
    { category: "Direct Costs", items: [
      { name: "Material Purchase", amount: 1200000 },
      { name: "Labor Cost", amount: 850000 },
      { name: "Equipment Rental", amount: 320000 },
      { name: "Subcontractor Payments", amount: 450000 },
    ]},
    { category: "Operating Expenses", items: [
      { name: "Office Rent", amount: 120000 },
      { name: "Utilities", amount: 35000 },
      { name: "Transportation", amount: 85000 },
      { name: "Communication", amount: 25000 },
    ]},
    { category: "Administrative Expenses", items: [
      { name: "Salaries & Wages", amount: 480000 },
      { name: "Employee Benefits", amount: 95000 },
      { name: "Office Supplies", amount: 42000 },
      { name: "Professional Fees", amount: 65000 },
    ]},
    { category: "Financial Expenses", items: [
      { name: "Bank Charges", amount: 12000 },
      { name: "Interest Expense", amount: 38000 },
    ]},
  ]

  const totalIncome = sampleIncome.reduce((total, category) => 
    total + category.items.reduce((sum, item) => sum + item.amount, 0), 0
  )

  const totalExpenses = sampleExpenses.reduce((total, category) => 
    total + category.items.reduce((sum, item) => sum + item.amount, 0), 0
  )

  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : "0.00"

  const handleShowSampleData = () => {
    setShowSampleData(true)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Profit & Loss Statement</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Income statement showing revenue, expenses, and net profit/loss
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
        <div className="space-y-6">
          {/* Report Header */}
          <Card>
            <CardHeader className="text-center border-b">
              <h2 className="text-2xl font-bold">Profit & Loss Statement</h2>
              <p className="text-sm text-muted-foreground">
                For the period: {params.fromDate || "2024-01-01"} to {params.toDate || "2024-12-31"}
              </p>
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ This is sample data for UI demonstration only
              </p>
            </CardHeader>
          </Card>

          {/* Income Section */}
          <Card className="border-green-200">
            <CardHeader className="bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-900">Income</CardTitle>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  ৳{totalIncome.toLocaleString("en-BD")}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {sampleIncome.map((category, catIndex) => (
                <div key={catIndex} className="mb-6 last:mb-0">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase">
                    {category.category}
                  </h3>
                  <div className="space-y-2 pl-4">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex justify-between items-center">
                        <span className="text-sm">{item.name}</span>
                        <span className="font-mono text-sm font-medium">
                          ৳{item.amount.toLocaleString("en-BD")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t font-semibold">
                    <span className="text-sm">Subtotal - {category.category}</span>
                    <span className="font-mono text-sm text-green-600">
                      ৳{category.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString("en-BD")}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Expenses Section */}
          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-900">Expenses</CardTitle>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  ৳{totalExpenses.toLocaleString("en-BD")}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {sampleExpenses.map((category, catIndex) => (
                <div key={catIndex} className="mb-6 last:mb-0">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase">
                    {category.category}
                  </h3>
                  <div className="space-y-2 pl-4">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex justify-between items-center">
                        <span className="text-sm">{item.name}</span>
                        <span className="font-mono text-sm font-medium">
                          ৳{item.amount.toLocaleString("en-BD")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t font-semibold">
                    <span className="text-sm">Subtotal - {category.category}</span>
                    <span className="font-mono text-sm text-red-600">
                      ৳{category.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString("en-BD")}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Net Profit/Loss Summary */}
          <Card className={`border-2 ${netProfit >= 0 ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {netProfit >= 0 ? "Net Profit" : "Net Loss"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span>Total Income</span>
                  <span className="font-mono font-bold text-green-600">
                    ৳{totalIncome.toLocaleString("en-BD")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span>Total Expenses</span>
                  <span className="font-mono font-bold text-red-600">
                    ৳{totalExpenses.toLocaleString("en-BD")}
                  </span>
                </div>
                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">
                      {netProfit >= 0 ? "Net Profit" : "Net Loss"}
                    </span>
                    <span className={`text-3xl font-bold font-mono ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ৳{Math.abs(netProfit).toLocaleString("en-BD")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-sm text-muted-foreground">
                    <span>Profit Margin</span>
                    <span className={`font-semibold ${parseFloat(profitMargin) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {profitMargin}%
                    </span>
                  </div>
                </div>
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
                <span>Automatic calculation from voucher transactions (income & expense)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Comparative analysis (Year-over-Year, Month-over-Month)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Gross profit and EBITDA calculations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Project-wise profit & loss breakdown</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Monthly/Quarterly/Yearly period selection</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Drill-down to transaction details from each line item</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>PDF export and professional printing</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Excel export with formulas and charts</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
