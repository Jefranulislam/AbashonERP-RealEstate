"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"

const MATERIAL_TYPES = [
  "Cement", "Sand", "Steel", "Silicon Sand", "Bricks", "Gravel", "Stone", "TMT Bar",
  "Aggregate", "Paint", "Hardware", "Electrical", "Plumbing", "Wood", "Glass", "Tiles", "Other"
]

export default function VendorsPage() {
  const { toast } = useToast()
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<any>(null)
  const [formData, setFormData] = useState({
    vendorName: "",
    mailingAddress: "",
    website: "",
    phone: "",
    email: "",
    description: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
    bankBranch: "",
    bankRoutingNumber: "",
    bankSwiftCode: "",
    materials: [] as string[],
    isActive: true,
  })

  const fetchVendors = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await axios.get(`/api/vendors?${params.toString()}`)
      setVendors(response.data.vendors)
    } catch (error) {
      console.error("[v0] Error fetching vendors:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (selectedVendor) {
        await axios.put(`/api/vendors/${selectedVendor.id}`, formData)
        toast({
          title: "Success",
          description: "Vendor updated successfully",
        })
      } else {
        await axios.post("/api/vendors", formData)
        toast({
          title: "Success",
          description: "Vendor created successfully",
        })
      }
      fetchVendors()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("[v0] Error saving vendor:", error)
      toast({
        title: "Error",
        description: "Failed to save vendor. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return

    toast({
      title: "Deleting...",
      description: "Please wait while we delete the vendor",
    })

    try {
      await axios.delete(`/api/vendors/${id}`)
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      })
      fetchVendors()
    } catch (error) {
      console.error("[v0] Error deleting vendor:", error)
      toast({
        title: "Error",
        description: "Failed to delete vendor. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      vendorName: "",
      mailingAddress: "",
      website: "",
      phone: "",
      email: "",
      description: "",
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
      bankBranch: "",
      bankRoutingNumber: "",
      bankSwiftCode: "",
      materials: [],
      isActive: true,
    })
    setSelectedVendor(null)
  }

  const toggleMaterial = (material: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.includes(material)
        ? prev.materials.filter(m => m !== material)
        : [...prev.materials, material]
    }))
  }

  const openEditDialog = (vendor: any) => {
    setSelectedVendor(vendor)
    setFormData({
      vendorName: vendor.vendor_name,
      mailingAddress: vendor.mailing_address || "",
      website: vendor.website || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      description: vendor.description || "",
      bankName: vendor.bank_name || "",
      bankAccountNumber: vendor.bank_account_number || "",
      bankAccountName: vendor.bank_account_name || "",
      bankBranch: vendor.bank_branch || "",
      bankRoutingNumber: vendor.bank_routing_number || "",
      bankSwiftCode: vendor.bank_swift_code || "",
      materials: vendor.materials || [],
      isActive: vendor.is_active,
    })
    setDialogOpen(true)
  }

  const openViewDialog = (vendor: any) => {
    setSelectedVendor(vendor)
    setViewDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">Manage your vendor relationships</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedVendor ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
              <DialogDescription>Fill in the vendor information below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vendorName">Vendor Name *</Label>
                    <Input
                      id="vendorName"
                      value={formData.vendorName}
                      onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mailingAddress">Mailing Address</Label>
                  <Textarea
                    id="mailingAddress"
                    value={formData.mailingAddress}
                    onChange={(e) => setFormData({ ...formData, mailingAddress: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Materials Supplied */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Materials Supplied</h3>
                <div className="grid grid-cols-4 gap-4">
                  {MATERIAL_TYPES.map((material) => (
                    <div key={material} className="flex items-center space-x-2">
                      <Checkbox
                        id={material}
                        checked={formData.materials.includes(material)}
                        onCheckedChange={() => toggleMaterial(material)}
                      />
                      <label htmlFor={material} className="text-sm cursor-pointer">
                        {material}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Bank Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNumber">Account Number</Label>
                    <Input
                      id="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountName">Account Name</Label>
                    <Input
                      id="bankAccountName"
                      value={formData.bankAccountName}
                      onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankBranch">Branch</Label>
                    <Input
                      id="bankBranch"
                      value={formData.bankBranch}
                      onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankRoutingNumber">Routing Number</Label>
                    <Input
                      id="bankRoutingNumber"
                      value={formData.bankRoutingNumber}
                      onChange={(e) => setFormData({ ...formData, bankRoutingNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankSwiftCode">SWIFT Code</Label>
                    <Input
                      id="bankSwiftCode"
                      value={formData.bankSwiftCode}
                      onChange={(e) => setFormData({ ...formData, bankSwiftCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{selectedVendor ? "Update Vendor" : "Add Vendor"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendors List</CardTitle>
          <CardDescription>View and manage all your vendors</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL No.</TableHead>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Mailing Address</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No vendors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendors.map((vendor, index) => (
                      <TableRow key={vendor.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                        <TableCell>{new Date(vendor.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{vendor.mailing_address || "-"}</TableCell>
                        <TableCell>{vendor.phone || "-"}</TableCell>
                        <TableCell>{vendor.email || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openViewDialog(vendor)} title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(vendor)} title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(vendor.id)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Vendor Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription>View vendor information</DialogDescription>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Vendor Name</Label>
                    <p className="font-medium">{selectedVendor.vendor_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div>
                      <Badge variant={selectedVendor.is_active ? "default" : "secondary"}>
                        {selectedVendor.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedVendor.phone || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedVendor.email || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Mailing Address</Label>
                    <p className="font-medium">{selectedVendor.mailing_address || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Website</Label>
                    <p className="font-medium">{selectedVendor.website || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="font-medium">{selectedVendor.description || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Bank Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Bank Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Bank Name</Label>
                    <p className="font-medium">{selectedVendor.bank_name || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Account Number</Label>
                    <p className="font-medium">{selectedVendor.bank_account_number || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Account Name</Label>
                    <p className="font-medium">{selectedVendor.bank_account_name || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Branch</Label>
                    <p className="font-medium">{selectedVendor.bank_branch || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Routing Number</Label>
                    <p className="font-medium">{selectedVendor.bank_routing_number || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">SWIFT Code</Label>
                    <p className="font-medium">{selectedVendor.bank_swift_code || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Materials */}
              {selectedVendor.materials && selectedVendor.materials.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Materials Supplied</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedVendor.materials.map((material: string) => (
                      <Badge key={material} variant="outline">
                        {material}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Created At</Label>
                    <p className="font-medium">
                      {new Date(selectedVendor.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Updated</Label>
                    <p className="font-medium">
                      {new Date(selectedVendor.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false)
                    openEditDialog(selectedVendor)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Vendor
                </Button>
                <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
