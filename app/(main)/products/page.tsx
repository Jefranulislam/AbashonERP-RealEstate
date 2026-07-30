"use client"

import type React from "react"

import { useEffect, useState, useMemo } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2 } from "lucide-react"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/hooks/use-currency"

export default function ProductsPage() {
  const { toast } = useToast()
  const { formatAmount } = useCurrency()
  const [products, setProducts] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [productTypes, setProductTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [formData, setFormData] = useState({
    projectId: "",
    productName: "",
    productType: "",
    size: "",
    ratePerSqft: "",
    utilityCharge: "",
    price: "",
    description: "",
    isActive: true,
  })

  // Calculate total price: rate * size + utility
  const calculatedPrice = useMemo(() => {
    const rate = parseFloat(formData.ratePerSqft) || 0
    const size = parseFloat(formData.size) || 0
    const utility = parseFloat(formData.utilityCharge) || 0
    return rate * size + utility
  }, [formData.ratePerSqft, formData.size, formData.utilityCharge])

  // Auto-update price when calculated
  useEffect(() => {
    if (formData.ratePerSqft && formData.size) {
      setFormData(prev => ({ ...prev, price: calculatedPrice.toFixed(2) }))
    }
  }, [calculatedPrice, formData.ratePerSqft, formData.size])

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/products")
      console.log("Products fetched:", response.data)
      setProducts(response.data.products || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await axios.get("/api/projects")
      setProjects(response.data.projects || [])
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await axios.get("/api/settings")
      if (response.data.settings?.product_types) {
        const types = response.data.settings.product_types
          .split(",")
          .map((t: string) => t.trim())
          .filter((t: string) => t)
        setProductTypes(types)
      } else {
        setProductTypes(["Residential", "Commercial", "Apartment", "Studio", "Parking", "Gas Line", "Others"])
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      setProductTypes(["Residential", "Commercial", "Apartment", "Studio", "Parking", "Gas Line", "Others"])
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchProjects()
    fetchSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        ...formData,
        projectId: Number.parseInt(formData.projectId),
        price: Number.parseFloat(formData.price),
        ratePerSqft: formData.ratePerSqft ? Number.parseFloat(formData.ratePerSqft) : null,
        size: formData.size ? Number.parseFloat(formData.size) : null,
        utilityCharge: formData.utilityCharge ? Number.parseFloat(formData.utilityCharge) : 0,
      }

      if (selectedProduct) {
        await axios.put(`/api/products/${selectedProduct.id}`, payload)
        toast({
          title: "Success",
          description: "Product updated successfully",
        })
      } else {
        await axios.post("/api/products", payload)
        toast({
          title: "Success",
          description: "Product added successfully",
        })
      }
      fetchProducts()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    toast({
      title: "Deleting...",
      description: "Please wait while we delete the product",
    })

    try {
      await axios.delete(`/api/products/${id}`)
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
      fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      projectId: "",
      productName: "",
      productType: "",
      size: "",
      ratePerSqft: "",
      utilityCharge: "",
      price: "",
      description: "",
      isActive: true,
    })
    setSelectedProduct(null)
  }

  const openEditDialog = (product: any) => {
    setSelectedProduct(product)
    setFormData({
      projectId: product.project_id?.toString() || "",
      productName: product.product_name,
      productType: product.product_type || "",
      size: product.size?.toString() || product.size_sqft?.toString() || "",
      ratePerSqft: product.rate_per_sqft?.toString() || "",
      utilityCharge: product.utility_charge?.toString() || "",
      price: product.price?.toString() || product.base_price?.toString() || "",
      description: product.description || "",
      isActive: product.is_active,
    })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your products</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>Fill in the product information below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type *</Label>
                  <Select
                    value={formData.productType}
                    onValueChange={(value) => setFormData({ ...formData, productType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size (sqft)</Label>
                  <Input
                    id="size"
                    type="number"
                    step="0.01"
                    placeholder="Enter size in sqft"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ratePerSqft">Rate per Sqft</Label>
                  <Input
                    id="ratePerSqft"
                    type="number"
                    step="0.01"
                    placeholder="Rate per square foot"
                    value={formData.ratePerSqft}
                    onChange={(e) => setFormData({ ...formData, ratePerSqft: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utilityCharge">Utility Charge</Label>
                  <Input
                    id="utilityCharge"
                    type="number"
                    step="0.01"
                    placeholder="Utility/Connection charge"
                    value={formData.utilityCharge}
                    onChange={(e) => setFormData({ ...formData, utilityCharge: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="price">Total Price *</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="flex-1"
                    />
                    {formData.ratePerSqft && formData.size && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        ({formData.ratePerSqft} × {formData.size} + {formData.utilityCharge || 0} = {formatAmount(calculatedPrice)})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Auto-calculated: Rate × Size + Utility Charge
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{selectedProduct ? "Update" : "Add"} Product</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products List</CardTitle>
          <CardDescription>View and manage all products</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SL No.</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size (sqft)</TableHead>
                  <TableHead>Rate/sqft</TableHead>
                  <TableHead>Utility</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product, index) => (
                    <TableRow key={product.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{product.product_name}</TableCell>
                      <TableCell>{product.project_name}</TableCell>
                      <TableCell>{product.product_type || "-"}</TableCell>
                      <TableCell>{product.size || product.size_sqft || "-"}</TableCell>
                      <TableCell>{product.rate_per_sqft ? formatAmount(product.rate_per_sqft) : "-"}</TableCell>
                      <TableCell>{product.utility_charge ? formatAmount(product.utility_charge) : "-"}</TableCell>
                      <TableCell className="font-medium">{product.price || product.base_price ? formatAmount(product.price || product.base_price) : "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
