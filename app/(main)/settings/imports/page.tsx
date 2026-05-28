"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const modules = [
  { key: "vendors", label: "Vendors" },
  { key: "transactions", label: "Transactions (Vouchers)" },
  { key: "sales", label: "Sales" },
  { key: "product_delivery_received", label: "Product Delivery Received" },
  { key: "purchase_requisitions", label: "Purchase Requisitions" },
  { key: "purchase_orders", label: "Purchase Orders" },
]

export default function ImportCenterPage() {
  const { toast } = useToast()
  const [selectedModule, setSelectedModule] = useState("transactions")
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const templateUrl = useMemo(() => `/api/imports/template?module=${selectedModule}`, [selectedModule])

  const upload = async () => {
    if (!file) {
      toast({ title: "No file selected", description: "Please choose a CSV/XLSX file", variant: "destructive" })
      return
    }

    try {
      setIsUploading(true)
      setResult(null)

      const formData = new FormData()
      formData.append("module", selectedModule)
      formData.append("file", file)

      const response = await fetch("/api/imports/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Import failed")
      }

      setResult(data)
      toast({
        title: "Import completed",
        description: `${data.successRows} success, ${data.failedRows} failed`,
      })
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Import Center</h1>
          <p className="text-muted-foreground">Download template, fill Excel/CSV, upload, and migrate module data.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload</CardTitle>
          <CardDescription>Supports CSV and XLSX. Use module template to match required column names.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Available Modules</Label>
            <div className="grid gap-2 md:grid-cols-2">
              {modules.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSelectedModule(m.key)}
                  className={`rounded-md border p-3 text-left transition-colors ${
                    selectedModule === m.key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{m.label}</div>
                  <div className="text-xs text-muted-foreground">Template + upload supported</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Module</Label>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger>
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href={templateUrl}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </a>
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Upload File</Label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button onClick={upload} disabled={isUploading || !file}>
            {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {isUploading ? "Importing..." : "Start Import"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>Total Rows: {result.totalRows}</div>
            <div className="text-green-700">Success Rows: {result.successRows}</div>
            <div className="text-red-700">Failed Rows: {result.failedRows}</div>
            {result.errors?.length > 0 && (
              <div className="mt-3 rounded-md bg-muted p-3">
                <p className="font-medium mb-2">Errors</p>
                <pre className="text-xs whitespace-pre-wrap">
                  {result.errors.map((e: any) => `Row ${e.row}: ${e.message}`).join("\n")}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
