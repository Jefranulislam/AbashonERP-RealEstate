"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Settings {
  id?: number
  company_name: string
  invoice_prefix: string
  address: string
  payment_methods: string
  lead_status: string
  lead_source: string
  print_on_company_pad: string
  currency_code: string
  currency_symbol: string
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    company_name: "",
    invoice_prefix: "",
    address: "",
    payment_methods: "",
    lead_status: "",
    lead_source: "",
    print_on_company_pad: "No",
    currency_code: "BDT",
    currency_symbol: "৳",
  })

  // Load existing settings
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/settings")
      const data = await response.json()

      if (data.settings) {
        setSettings({
          company_name: data.settings.company_name || "",
          invoice_prefix: data.settings.invoice_prefix || "",
          address: data.settings.address || "",
          payment_methods: data.settings.payment_methods || "",
          lead_status: data.settings.lead_status || "",
          lead_source: data.settings.lead_source || "",
          print_on_company_pad: data.settings.print_on_company_pad ? "Yes" : "No",
          currency_code: data.settings.currency_code || "BDT",
          currency_symbol: data.settings.currency_symbol || "৳",
        })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    field: keyof Settings,
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Settings saved successfully",
        })
      } else {
        throw new Error(data.error || "Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Company Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Company Information</CardTitle>
          <CardDescription>Basic company settings used across the ERP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <Input
                placeholder="Company name"
                value={settings.company_name}
                onChange={(e) => handleInputChange("company_name", e.target.value)}
              />
            </div>
            <div>
              <Label>Invoice Prefix</Label>
              <Input
                placeholder="e.g., ADDL"
                value={settings.invoice_prefix}
                onChange={(e) => handleInputChange("invoice_prefix", e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Textarea
                placeholder="Address"
                value={settings.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>
            <div>
              <Label>Payment Methods (comma separated)</Label>
              <Input
                placeholder="Cheque, Cash, Online Transfer"
                value={settings.payment_methods}
                onChange={(e) => handleInputChange("payment_methods", e.target.value)}
              />
            </div>
            <div>
              <Label>Lead Status (CSV)</Label>
              <Input
                placeholder="Positive, Negative, Junk, Followup"
                value={settings.lead_status}
                onChange={(e) => handleInputChange("lead_status", e.target.value)}
              />
            </div>
            <div>
              <Label>Lead Source (CSV)</Label>
              <Input
                placeholder="Self, Facebook, Youtube"
                value={settings.lead_source}
                onChange={(e) => handleInputChange("lead_source", e.target.value)}
              />
            </div>
            <div>
              <Label>Print on Company Pad</Label>
              <Input
                placeholder="Yes/No"
                value={settings.print_on_company_pad}
                onChange={(e) => handleInputChange("print_on_company_pad", e.target.value)}
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Select
                value={settings.currency_code}
                onValueChange={(value) => {
                  const currencies: { [key: string]: string } = {
                    BDT: "৳",
                    USD: "$",
                    EUR: "€",
                    GBP: "£",
                    INR: "₹",
                  }
                  handleInputChange("currency_code", value)
                  handleInputChange("currency_symbol", currencies[value] || "৳")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BDT">BDT - Bangladesh Taka (৳)</SelectItem>
                  <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                  <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Notes:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Lead Status and Lead Source values are used by CRM</li>
          <li>Invoice Prefix is used by Sales module</li>
          <li>Settings affect many modules across the ERP</li>
        </ul>
      </div>
    </div>
  )
}
