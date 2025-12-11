"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { BalanceSheetPDF } from "@/components/pdf/balance-sheet-pdf"
import { printDocument, getCompanySettings } from "@/lib/pdf-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer, Download, Building2, Wallet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function BalanceSheetPage() {
  const { toast } = useToast()
  const [asOnDate, setAsOnDate] = useState(new Date().toISOString().split("T")[0])
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [companySettings, setCompanySettings] = useState<any>(null)

  useEffect(() => {
    loadCompanySettings()
  }, [])

  const loadCompanySettings = async () => {
    const settings = await getCompanySettings()
    setCompanySettings(settings)
  }

  const { data: balanceSheet, isLoading, refetch } = useQuery({
    queryKey: ["balance-sheet", asOnDate],
    queryFn: async () => {
      const response = await axios.get(`/api/accounting/balance-sheet?asOnDate=${asOnDate}`)
      return response.data
    },
    enabled: false,
  })

  const handleGenerateReport = async () => {
    try {
      await refetch()
      toast({ title: "Report generated", description: "Balance sheet has been generated successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate balance sheet", variant: "destructive" })
    }
  }

  const isBalanced = balanceSheet && 
    Math.abs(balanceSheet.totals.totalAssets - balanceSheet.totals.totalLiabilitiesAndEquity) < 0.01

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Balance Sheet</h1>
          <p className="text-sm text-muted-foreground mt-1">Statement of financial position showing assets, liabilities, and equity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!balanceSheet} onClick={() => {
            if (!balanceSheet) return
            setPrintDialogOpen(true)
            setTimeout(() => {
              printDocument('print-balance-sheet-content')
              setPrintDialogOpen(false)
            }, 100)
          }}><Printer className="h-4 w-4 mr-2" />Print</Button>
          <Button variant="outline" size="sm" disabled={!balanceSheet}><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Report Parameters</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2 flex-1 max-w-xs">
              <Label>As on Date</Label>
              <Input type="date" value={asOnDate} onChange={(e) => setAsOnDate(e.target.value)} max={new Date().toISOString().split("T")[0]} />
            </div>
            <Button onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Balance Sheet
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      )}

      {balanceSheet && !isLoading && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center border-b">
              <h2 className="text-2xl font-bold">Balance Sheet</h2>
              <p className="text-sm text-muted-foreground">As on: {new Date(balanceSheet.asOnDate).toLocaleDateString()}</p>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-blue-900">Current Assets</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {balanceSheet.currentAssets.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {balanceSheet.currentAssets.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm">{item.name}</span>
                            <span className="font-mono text-sm font-medium">
                              {item.amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t-2 font-bold">
                        <span>Total Current Assets</span>
                        <span className="font-mono text-blue-600">
                          {balanceSheet.totals.totalCurrentAssets.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No current assets found</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-blue-900">Fixed Assets</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {balanceSheet.fixedAssets.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {balanceSheet.fixedAssets.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm">{item.name}</span>
                            <span className="font-mono text-sm font-medium">
                              {item.amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t-2 font-bold">
                        <span>Total Fixed Assets</span>
                        <span className="font-mono text-blue-600">
                          {balanceSheet.totals.totalFixedAssets.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No fixed assets found</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-400 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">TOTAL ASSETS</span>
                    <span className="text-2xl font-bold font-mono text-blue-600">
                      {balanceSheet.totals.totalAssets.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-red-200">
                <CardHeader className="bg-red-50">
                  <CardTitle className="text-red-900">Current Liabilities</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {balanceSheet.currentLiabilities.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {balanceSheet.currentLiabilities.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm">{item.name}</span>
                            <span className="font-mono text-sm font-medium">
                              {item.amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t-2 font-bold">
                        <span>Total Current Liabilities</span>
                        <span className="font-mono text-red-600">
                          {balanceSheet.totals.totalCurrentLiabilities.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No current liabilities found</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader className="bg-red-50">
                  <CardTitle className="text-red-900">Long-term Liabilities</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {balanceSheet.longTermLiabilities.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {balanceSheet.longTermLiabilities.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm">{item.name}</span>
                            <span className="font-mono text-sm font-medium">
                              {item.amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t font-semibold">
                        <span>Total Long-term Liabilities</span>
                        <span className="font-mono text-red-600">
                          {balanceSheet.totals.totalLongTermLiabilities.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No long-term liabilities found</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-green-900">Owner''s Equity</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {balanceSheet.equity.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{item.name}</span>
                        <span className="font-mono text-sm font-medium">
                          {item.amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t-2 font-bold">
                    <span>Total Equity</span>
                    <span className="font-mono text-green-600">
                      {balanceSheet.totals.totalEquity.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-400 bg-purple-50">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold">Total Liabilities</span>
                      <span className="font-mono text-red-600">
                        {balanceSheet.totals.totalLiabilities.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold">Total Equity</span>
                      <span className="font-mono text-green-600">
                        {balanceSheet.totals.totalEquity.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2">
                      <span className="text-xl font-bold">TOTAL</span>
                      <span className="text-2xl font-bold font-mono text-purple-600">
                        {balanceSheet.totals.totalLiabilitiesAndEquity.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className={`border-2 ${isBalanced ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {isBalanced ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-bold text-green-900 text-lg">Balance Sheet is Balanced </p>
                      <p className="text-sm text-green-700">
                        Total Assets ({balanceSheet.totals.totalAssets.toLocaleString("en-BD")}) = 
                        Total Liabilities + Equity ({balanceSheet.totals.totalLiabilitiesAndEquity.toLocaleString("en-BD")})
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="font-bold text-red-900 text-lg">Balance Sheet is NOT Balanced </p>
                      <p className="text-sm text-red-700">
                        Difference: {Math.abs(balanceSheet.totals.totalAssets - balanceSheet.totals.totalLiabilitiesAndEquity).toLocaleString("en-BD")}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!balanceSheet && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No Balance Sheet Generated</p>
            <p className="text-sm text-muted-foreground mb-4">Select a date and click "Generate Balance Sheet" to view your financial position</p>
          </CardContent>
        </Card>
      )}

      {/* Hidden Print Content */}
      {printDialogOpen && balanceSheet && companySettings && (
        <div className="hidden">
          <div id="print-balance-sheet-content">
            <BalanceSheetPDF
              currentAssets={balanceSheet.currentAssets}
              fixedAssets={balanceSheet.fixedAssets}
              currentLiabilities={balanceSheet.currentLiabilities}
              longTermLiabilities={balanceSheet.longTermLiabilities}
              equity={balanceSheet.equity}
              totals={balanceSheet.totals}
              asOnDate={balanceSheet.asOnDate}
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
