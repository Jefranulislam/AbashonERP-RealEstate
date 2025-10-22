"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, Download, AlertCircle, CheckCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useImportLeads } from "@/lib/hooks/use-crm"
import type { CreateLeadInput } from "@/lib/validations/crm"

export default function ImportLeadsPage() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [leads, setLeads] = useState<CreateLeadInput[]>([])
  const [preview, setPreview] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{imported: number, failed: number, errors?: any[]} | null>(null)
  const importLeads = useImportLeads()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreview(false)
      setResult(null)
      
      // Parse CSV file
      if (selectedFile.name.endsWith('.csv')) {
        parseCsvFile(selectedFile)
      } else {
        toast({
          title: "Invalid file",
          description: "Please upload a CSV file",
          variant: "destructive",
        })
      }
    }
  }

  const parseCsvFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').map(line => line.trim()).filter(line => line)
      
      if (lines.length < 2) {
        toast({
          title: "Invalid file",
          description: "File must contain header row and at least one data row",
          variant: "destructive",
        })
        return
      }

      // Parse CSV (simple comma-separated parsing)
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const dataRows = lines.slice(1)

      const parsedLeads: CreateLeadInput[] = dataRows.map((row, index) => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
        const lead: any = {}

        headers.forEach((header, i) => {
          const value = values[i] || ''
          // Map CSV headers to lead fields
          switch (header.toLowerCase()) {
            case 'customer name':
            case 'customername':
              lead.customerName = value
              break
            case 'profession':
              lead.profession = value
              break
            case 'phone':
            case 'phone number':
              lead.phone = value
              break
            case 'whatsapp':
              lead.whatsapp = value
              break
            case 'email':
              lead.email = value
              break
            case 'nid':
              lead.nid = value
              break
            case 'lead status':
            case 'leadsstatus':
            case 'status':
              lead.leadsStatus = value
              break
            case 'lead source':
            case 'leadsource':
            case 'source':
              lead.leadSource = value
              break
            case 'project name':
            case 'projectname':
            case 'project':
              lead.projectName = value
              break
            case 'next call date':
            case 'nextcalldate':
              lead.nextCallDate = value
              break
            case 'father/husband name':
            case 'fatherorhusband name':
              lead.fatherOrHusbandName = value
              break
            case 'mailing address':
            case 'mailingaddress':
              lead.mailingAddress = value
              break
            case 'permanent address':
            case 'permanentaddress':
              lead.permanentAddress = value
              break
            case 'birth date':
            case 'birthdate':
              lead.birthDate = value
              break
          }
        })

        return lead as CreateLeadInput
      })

      setLeads(parsedLeads)
      setPreview(true)
      toast({
        title: "File parsed",
        description: `Found ${parsedLeads.length} leads in the file`,
      })
    }

    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      })
    }

    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (leads.length === 0) {
      toast({
        title: "No data",
        description: "Please upload a file with leads",
        variant: "destructive",
      })
      return
    }

    setImporting(true)
    try {
      const response = await importLeads.mutateAsync(leads)
      setResult(response)
      toast({
        title: "Import completed",
        description: `Successfully imported ${response.imported} leads. ${response.failed} failed.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import leads",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadSample = () => {
    const csvContent = `Customer Name,Profession,Phone,WhatsApp,Email,NID,Lead Status,Lead Source,Project Name,Next Call Date,Father/Husband Name,Mailing Address,Permanent Address,Birth Date
John Doe,Engineer,01712345678,01712345678,john@example.com,1234567890,New,Facebook,Project A,2025-10-20,Mr. Doe Senior,123 Main St,456 Oak Ave,1990-01-15
Jane Smith,Doctor,01812345678,01812345678,jane@example.com,0987654321,Followup,Website,Project B,2025-10-21,Mr. Smith,789 Park Rd,321 Elm St,1985-05-20`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leads_import_sample.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast({
      title: "Download started",
      description: "Sample CSV file is being downloaded",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Leads</h1>
        <p className="text-muted-foreground">Import leads from CSV file</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Download Sample File</CardTitle>
          <CardDescription>Download the CSV template to see the required format</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDownloadSample} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Sample CSV File
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Leads File</CardTitle>
          <CardDescription>Select a CSV file containing leads data to import</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">CSV File</Label>
            <input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
          </div>

          {preview && leads.length > 0 && (
            <div className="flex items-center gap-2 p-4 border rounded-md bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800 dark:text-green-200">
                Ready to import {leads.length} leads. Review the preview below and click Import to proceed.
              </p>
            </div>
          )}

          {preview && leads.length > 0 && (
            <div className="border rounded-md p-4 max-h-96 overflow-auto">
              <h3 className="font-semibold mb-2">Preview (First 5 rows)</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.slice(0, 5).map((lead, index) => (
                    <TableRow key={index}>
                      <TableCell>{lead.customerName}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.email || "-"}</TableCell>
                      <TableCell>{lead.leadsStatus || "-"}</TableCell>
                      <TableCell>{lead.leadSource || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Button 
            onClick={handleImport} 
            className="w-full"
            disabled={!preview || leads.length === 0 || importing}
          >
            <Upload className="mr-2 h-4 w-4" />
            {importing ? "Importing..." : "Import Leads"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2 p-4 border rounded-md bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Successfully imported: {result.imported}</strong>
                </p>
              </div>
              
              {result.failed > 0 && (
                <div className="flex items-center gap-2 p-4 border rounded-md bg-red-50 dark:bg-red-950">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Failed: {result.failed}</strong>
                  </p>
                </div>
              )}
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="border rounded-md p-4 max-h-96 overflow-auto">
                <h3 className="font-semibold mb-2">Errors</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell>{error.row}</TableCell>
                        <TableCell className="text-destructive">{error.error}</TableCell>
                        <TableCell className="text-xs">{JSON.stringify(error.data)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
