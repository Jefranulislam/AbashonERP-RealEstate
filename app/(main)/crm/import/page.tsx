"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react"
import { useImportLeads } from "@/lib/hooks/use-crm"
import { useToast } from "@/hooks/use-toast"
import type { CreateLeadInput } from "@/lib/validations/crm"

interface ParsedLead extends CreateLeadInput {
  rowIndex: number
  errors?: string[]
}

const EXPECTED_COLUMNS = [
  "Customer Name",
  "Phone",
  "WhatsApp",
  "Email",
  "Profession",
  "Lead Status",
  "Lead Source",
  "Project Name",
  "NID",
  "Father/Husband Name",
  "Mailing Address",
  "Permanent Address",
  "Birth Date",
  "Next Call Date",
]

export default function CRMImportPage() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)

  const importLeads = useImportLeads()

  const parseCSV = useCallback((text: string): ParsedLead[] => {
    const lines = text.split("\n").filter(line => line.trim())
    if (lines.length < 2) {
      setParseErrors(["File must contain headers and at least one data row"])
      return []
    }

    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""))
    const errors: string[] = []
    const leads: ParsedLead[] = []

    // Validate headers
    const missingHeaders = ["Customer Name", "Phone"].filter(
      required => !headers.some(h => h.toLowerCase() === required.toLowerCase())
    )
    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(", ")}`)
    }

    // Map headers to field names
    const headerMap: Record<string, keyof CreateLeadInput> = {
      "customer name": "customerName",
      "phone": "phone",
      "whatsapp": "whatsapp",
      "email": "email",
      "profession": "profession",
      "lead status": "leadsStatus",
      "lead source": "leadSource",
      "project name": "projectName",
      "nid": "nid",
      "father/husband name": "fatherOrHusbandName",
      "mailing address": "mailingAddress",
      "permanent address": "permanentAddress",
      "birth date": "birthDate",
      "next call date": "nextCallDate",
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""))
      const lead: ParsedLead = {
        rowIndex: i + 1,
        customerName: "",
        phone: "",
      }
      const rowErrors: string[] = []

      headers.forEach((header, index) => {
        const fieldName = headerMap[header.toLowerCase()]
        if (fieldName && values[index]) {
          (lead as any)[fieldName] = values[index]
        }
      })

      // Validate required fields
      if (!lead.customerName) {
        rowErrors.push("Missing Customer Name")
      }
      if (!lead.phone) {
        rowErrors.push("Missing Phone")
      }

      if (rowErrors.length > 0) {
        lead.errors = rowErrors
      }

      leads.push(lead)
    }

    setParseErrors(errors)
    return leads
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    setParsedLeads([])
    setParseErrors([])

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const leads = parseCSV(text)
      setParsedLeads(leads)
    }
    reader.readAsText(selectedFile)
  }

  const handleImport = async () => {
    const validLeads = parsedLeads.filter(lead => !lead.errors || lead.errors.length === 0)
    if (validLeads.length === 0) {
      toast({
        title: "No Valid Leads",
        description: "Please fix errors in your data before importing",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    try {
      // Remove rowIndex and errors before sending
      const leadsToImport = validLeads.map(({ rowIndex, errors, ...lead }) => lead)
      await importLeads.mutateAsync(leadsToImport)
      toast({
        title: "Import Successful",
        description: `${validLeads.length} leads imported successfully`,
      })
      setFile(null)
      setParsedLeads([])
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import leads",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = EXPECTED_COLUMNS.join(",") + "\nJohn Doe,01712345678,01712345678,john@email.com,Business,New,Website,Project A,,,,,,2024-01-15"
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "leads_import_template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const validCount = parsedLeads.filter(l => !l.errors || l.errors.length === 0).length
  const invalidCount = parsedLeads.filter(l => l.errors && l.errors.length > 0).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Leads</h1>
        <p className="text-muted-foreground">Bulk import leads from a CSV file</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Upload a CSV file with lead information. Required columns: Customer Name, Phone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 rounded-md bg-muted p-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <span className="text-sm">{file.name}</span>
              </div>
            )}

            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Import Instructions</CardTitle>
            <CardDescription>Follow these guidelines for successful import</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• File must be in CSV format</li>
              <li>• First row should contain column headers</li>
              <li>• Required columns: <strong>Customer Name</strong>, <strong>Phone</strong></li>
              <li>• Dates should be in YYYY-MM-DD format</li>
              <li>• Use the template for correct column order</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Parse Errors */}
      {parseErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-4">
              {parseErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Table */}
      {parsedLeads.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview ({parsedLeads.length} rows)</CardTitle>
                <CardDescription>
                  <span className="text-green-600">{validCount} valid</span>
                  {invalidCount > 0 && (
                    <span className="text-destructive"> • {invalidCount} with errors</span>
                  )}
                </CardDescription>
              </div>
              <Button onClick={handleImport} disabled={isImporting || validCount === 0}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {validCount} Leads
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Lead Status</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedLeads.map((lead) => (
                    <TableRow key={lead.rowIndex} className={lead.errors?.length ? "bg-red-50" : ""}>
                      <TableCell>{lead.rowIndex}</TableCell>
                      <TableCell>
                        {lead.errors?.length ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </TableCell>
                      <TableCell>{lead.customerName || "-"}</TableCell>
                      <TableCell>{lead.phone || "-"}</TableCell>
                      <TableCell>{lead.email || "-"}</TableCell>
                      <TableCell>{lead.leadsStatus || "-"}</TableCell>
                      <TableCell className="text-destructive text-sm">
                        {lead.errors?.join(", ") || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
