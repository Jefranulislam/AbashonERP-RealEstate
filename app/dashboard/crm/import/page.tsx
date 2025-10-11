"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Upload, Download } from "lucide-react"
import { toast } from "sonner"

export default function ImportLeadsPage() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file to import")
      return
    }

    // TODO: Implement file upload and import logic
    console.log("[v0] Importing file:", file.name)
    toast.success("Import functionality will be implemented")
  }

  const handleDownloadSample = () => {
    // TODO: Generate and download sample Excel file
    console.log("[v0] Downloading sample file")
    toast.info("Sample file download will be implemented")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Leads</h1>
        <p className="text-muted-foreground">Import leads from Excel file</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Download Sample File</CardTitle>
          <CardDescription>Download the Excel template to see the required format</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDownloadSample} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Sample Excel File
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Leads File</CardTitle>
          <CardDescription>Select an Excel file containing leads data to import</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Excel File</Label>
            <input
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
          </div>

          <Button onClick={handleImport} className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Import Leads
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
