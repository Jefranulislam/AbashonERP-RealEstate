"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
import { Loader2, Upload, X, ShieldAlert } from "lucide-react"

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
  product_types: string
  company_logo?: string
  footer_image?: string
  background_image?: string
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
    product_types: "Residential,Commercial,Apartment,Studio,Parking,Gas Line,Others",
    company_logo: "",
    footer_image: "",
    background_image: "",
  })

  // Load existing settings
  useEffect(() => {
    fetchSettings()
    fetchAdminAccess()
    fetchProjects()
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
          product_types: data.settings.product_types || "Residential,Commercial,Apartment,Studio,Parking,Gas Line,Others",
          company_logo: data.settings.company_logo || "",
          footer_image: data.settings.footer_image || "",
          background_image: data.settings.background_image || "",
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

  const [uploading, setUploading] = useState<{[key: string]: boolean}>({})
  const [isAdminActionsEnabled, setIsAdminActionsEnabled] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [actionResult, setActionResult] = useState("")

  const fetchAdminAccess = async () => {
    try {
      const response = await fetch("/api/settings/admin-actions")
      const data = await response.json()
      setIsAdminActionsEnabled(Boolean(data?.isAdmin))
    } catch (error) {
      setIsAdminActionsEnabled(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      setProjects([])
    }
  }

  const runAdminAction = async (action: "delete_all_vouchers" | "delete_project_vouchers" | "cancel_all_sale_payments") => {
    if (confirmText !== "CONFIRM DELETE") {
      toast({
        title: "Confirmation required",
        description: 'Type "CONFIRM DELETE" first',
        variant: "destructive",
      })
      return
    }

    if (action === "delete_project_vouchers" && !selectedProjectId) {
      toast({
        title: "Project required",
        description: "Select a project for project-wise voucher deletion",
        variant: "destructive",
      })
      return
    }

    try {
      setActionLoading(action)
      setActionResult("")

      const response = await fetch("/api/settings/admin-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          projectId: selectedProjectId ? Number(selectedProjectId) : undefined,
          confirmText,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Action failed")
      }

      const details = data.details ? JSON.stringify(data.details, null, 2) : ""
      setActionResult(`${data.message}\n${details}`.trim())
      setConfirmText("")

      toast({
        title: "Action completed",
        description: data.message,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Action failed"
      setActionResult(`Error: ${message}`)
      toast({
        title: "Action failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = (height * maxWidth) / width
            width = maxWidth
          } else {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }

        canvas.width = width
        canvas.height = height
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file) // Return original if compression fails
            }
          }, 'image/jpeg', quality)
        }
      }

      img.onerror = () => {
        resolve(file) // Return original if processing fails
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (field: 'company_logo' | 'footer_image' | 'background_image', file: File) => {
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PNG, JPG, SVG, or WebP files. PNG recommended for transparency.",
        variant: "destructive",
      })
      return
    }

    // Recommend PNG for transparency
    if (field !== 'company_logo' && file.type !== 'image/png' && file.type !== 'image/svg+xml') {
      toast({
        title: "Consider PNG format",
        description: "PNG files work best for transparent backgrounds in PDFs",
        variant: "default",
      })
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setUploading(prev => ({ ...prev, [field]: true }))

    try {
      // Compress image on client side
      const compressedFile = await compressImage(file, 800, 0.8)
      console.log(`Compressed ${file.name}: ${Math.round(file.size/1024)}KB → ${Math.round(compressedFile.size/1024)}KB`)

      // Upload to local storage (fallback while WordPress permissions are being fixed)
      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('imageType', field)

      const response = await fetch('/api/upload-media-local', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success && result.url) {
        // Update settings with WordPress URL
        setSettings((prev) => ({
          ...prev,
          [field]: result.url,
        }))

        toast({
          title: "Image uploaded successfully",
          description: `${field.replace('_', ' ')} saved locally in project`,
        })
      } else {
        throw new Error(result.error || 'Upload failed')
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload image",
        variant: "destructive",
      })
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }))
    }
  }

  const handleRemoveImage = (field: 'company_logo' | 'footer_image' | 'background_image') => {
    setSettings((prev) => ({
      ...prev,
      [field]: '',
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
        <Button variant="outline" asChild>
          <Link href="/settings/imports">Open Import Center</Link>
        </Button>
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
            <div className="col-span-2">
              <Label>Product Types (comma separated)</Label>
              <Input
                placeholder="Residential, Commercial, Apartment, Studio, Parking, Gas Line, Others"
                value={settings.product_types}
                onChange={(e) => handleInputChange("product_types", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                These types will appear in the product form dropdown
              </p>
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

      {/* PDF Images Configuration */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>PDF Customization</CardTitle>
          <CardDescription>
            Upload images that will appear on all PDF documents (logo, footer image, and background graphic)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Company Logo */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Company Logo</Label>
              <p className="text-xs text-muted-foreground">PDF header logo - PNG with transparent background recommended (200x80px, max 2MB)</p>
              
              {settings.company_logo ? (
                <div className="relative border border-dashed border-gray-300 rounded-lg p-4">
                  <img 
                    src={settings.company_logo} 
                    alt="Company Logo Preview" 
                    className="max-h-20 max-w-full mx-auto object-contain"
                  />
                  <Button
                    variant="destructive" 
                    size="sm"
                    className="absolute top-1 right-1"
                    onClick={() => handleRemoveImage('company_logo')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload('company_logo', file)
                    }}
                    disabled={uploading.company_logo}
                    className="hidden"
                    id="company-logo-upload"
                  />
                  <Label 
                    htmlFor="company-logo-upload" 
                    className="cursor-pointer flex flex-col items-center space-y-2 hover:bg-gray-50 p-2 rounded"
                  >
                    {uploading.company_logo ? (
                      <><Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                      <span className="text-sm text-blue-600">Uploading...</span></>
                    ) : (
                      <><Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">Upload Logo</span></>
                    )}
                  </Label>
                </div>
              )}
            </div>

            {/* Footer Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Footer Image</Label>
              <p className="text-xs text-muted-foreground">PDF footer (full width) - PNG with transparent background recommended (800x60px, max 2MB)</p>
              
              {settings.footer_image ? (
                <div className="relative border border-dashed border-gray-300 rounded-lg p-4">
                  <img 
                    src={settings.footer_image} 
                    alt="Footer Image Preview" 
                    className="max-h-20 max-w-full mx-auto object-contain"
                  />
                  <Button
                    variant="destructive" 
                    size="sm"
                    className="absolute top-1 right-1"
                    onClick={() => handleRemoveImage('footer_image')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload('footer_image', file)
                    }}
                    disabled={uploading.footer_image}
                    className="hidden"
                    id="footer-image-upload"
                  />
                  <Label 
                    htmlFor="footer-image-upload" 
                    className="cursor-pointer flex flex-col items-center space-y-2 hover:bg-gray-50 p-2 rounded"
                  >
                    {uploading.footer_image ? (
                      <><Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                      <span className="text-sm text-blue-600">Uploading...</span></>
                    ) : (
                      <><Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">Upload Footer Image</span></>
                    )}
                  </Label>
                </div>
              )}
            </div>

            {/* Background Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Background Graphic</Label>
              <p className="text-xs text-muted-foreground">PDF left watermark - PNG with transparent background recommended (300x800px, max 2MB)</p>
              
              {settings.background_image ? (
                <div className="relative border border-dashed border-gray-300 rounded-lg p-4">
                  <img 
                    src={settings.background_image} 
                    alt="Background Image Preview" 
                    className="max-h-20 max-w-full mx-auto object-contain"
                  />
                  <Button
                    variant="destructive" 
                    size="sm"
                    className="absolute top-1 right-1"
                    onClick={() => handleRemoveImage('background_image')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload('background_image', file)
                    }}
                    disabled={uploading.background_image}
                    className="hidden"
                    id="background-image-upload"
                  />
                  <Label 
                    htmlFor="background-image-upload" 
                    className="cursor-pointer flex flex-col items-center space-y-2 hover:bg-gray-50 p-2 rounded"
                  >
                    {uploading.background_image ? (
                      <><Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                      <span className="text-sm text-blue-600">Uploading...</span></>
                    ) : (
                      <><Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">Upload Background</span></>
                    )}
                  </Label>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isAdminActionsEnabled && (
        <Card className="mt-6 border-red-300">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Admin Access: Dangerous Actions
            </CardTitle>
            <CardDescription>
              These actions are destructive and should be used only for controlled cleanup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type confirmation text</Label>
              <Input
                placeholder='Type: CONFIRM DELETE'
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Project (for project-wise voucher deletion)</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <Button
                variant="destructive"
                disabled={actionLoading !== null}
                onClick={() => runAdminAction("delete_all_vouchers")}
              >
                {actionLoading === "delete_all_vouchers" ? "Processing..." : "Delete All Vouchers"}
              </Button>

              <Button
                variant="destructive"
                disabled={actionLoading !== null}
                onClick={() => runAdminAction("delete_project_vouchers")}
              >
                {actionLoading === "delete_project_vouchers" ? "Processing..." : "Delete Project Vouchers"}
              </Button>

              <Button
                variant="destructive"
                disabled={actionLoading !== null}
                onClick={() => runAdminAction("cancel_all_sale_payments")}
              >
                {actionLoading === "cancel_all_sale_payments" ? "Processing..." : "Cancel All Sale Payments"}
              </Button>
            </div>

            {actionResult && (
              <div className="rounded-md bg-muted p-3">
                <Label>Action Result</Label>
                <pre className="mt-2 text-xs whitespace-pre-wrap">{actionResult}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Notes:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Lead Status and Lead Source values are used by CRM</li>
          <li>Invoice Prefix is used by Sales module</li>
          <li>Product Types are used in Products module for categorization</li>
          <li>PDF Images will automatically appear on all generated PDFs</li>
          <li>Images are stored locally in your project's /public/uploads folder</li>
          <li>Images are automatically compressed and optimized for PDF performance</li>
          <li>Maximum file size: 10MB (will be compressed automatically)</li>
          <li>Settings affect many modules across the ERP</li>
        </ul>
      </div>
    </div>
  )
}
