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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import axios from "axios"

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [formData, setFormData] = useState({
    customerId: "",
    sellerId: "",
    projectId: "",
    productId: "",
    saleDate: new Date().toISOString().split("T")[0],
    amount: "",
  })

  const fetchSales = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await axios.get(`/api/sales?${params.toString()}`)
      setSales(response.data.sales)
    } catch (error) {
      console.error("[v0] Error fetching sales:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const [customersRes, projectsRes, employeesRes] = await Promise.all([
        axios.get("/api/customers"),
        axios.get("/api/projects"),
        axios.get("/api/employees"),
      ])

      setCustomers(customersRes.data.customers)
      setProjects(projectsRes.data.projects)
      setEmployees(employeesRes.data.employees)
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
    }
  }

  const fetchProducts = async (projectId: string) => {
    try {
      const response = await axios.get(`/api/products?projectId=${projectId}`)
      setProducts(response.data.products)
    } catch (error) {
      console.error("[v0] Error fetching products:", error)
    }
  }

  useEffect(() => {
    fetchSales()
    fetchData()
  }, [search])

  useEffect(() => {
    if (formData.projectId) {
      fetchProducts(formData.projectId)
    }
  }, [formData.projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (selectedSale) {
        await axios.put(`/api/sales/${selectedSale.id}`, formData)
      } else {
        await axios.post("/api/sales", formData)
      }
      fetchSales()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("[v0] Error saving sale:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this sale?")) return

    try {
      await axios.delete(`/api/sales/${id}`)
      fetchSales()
    } catch (error) {
      console.error("[v0] Error deleting sale:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      customerId: "",
      sellerId: "",
      projectId: "",
      productId: "",
      saleDate: new Date().toISOString().split("T")[0],
      amount: "",
    })
    setSelectedSale(null)
    setProducts([])
  }

  const openEditDialog = (sale: any) => {
    setSelectedSale(sale)
    setFormData({
      customerId: sale.customer_id,
      sellerId: sale.seller_id,
      projectId: sale.project_id,
      productId: sale.product_id,
      saleDate: sale.sale_date,
      amount: sale.amount,
    })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground">Manage your sales transactions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedSale ? "Edit Sale" : "Add New Sale"}</DialogTitle>
              <DialogDescription>Fill in the sale information below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer *</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>
                          {customer.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerId">Seller *</Label>
                  <Select
                    value={formData.sellerId}
                    onValueChange={(value) => setFormData({ ...formData, sellerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select seller" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={String(employee.id)}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value, productId: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productId">Product *</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => setFormData({ ...formData, productId: value })}
                    disabled={!formData.projectId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={String(product.id)}>
                          {product.product_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saleDate">Sale Date *</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{selectedSale ? "Update Sale" : "Add Sale"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sales..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales List</CardTitle>
          <CardDescription>View and manage all your sales transactions</CardDescription>
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
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Seller Name</TableHead>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Sale Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No sales found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale, index) => (
                      <TableRow key={sale.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{sale.customer_name}</TableCell>
                        <TableCell>{sale.seller_name}</TableCell>
                        <TableCell>{sale.project_name}</TableCell>
                        <TableCell>{sale.product_name}</TableCell>
                        <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                        <TableCell>{sale.amount ? `$${Number(sale.amount).toFixed(2)}` : "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(sale)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(sale.id)}>
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
    </div>
  )
}
