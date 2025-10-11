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
import { Switch } from "@/components/ui/switch"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

export default function ConstructorsPage() {
  const [constructors, setConstructors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedConstructor, setSelectedConstructor] = useState<any>(null)
  const [formData, setFormData] = useState({
    constructorName: "",
    mailingAddress: "",
    website: "",
    phone: "",
    email: "",
    description: "",
    isActive: true,
  })

  const fetchConstructors = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await axios.get(`/api/constructors?${params.toString()}`)
      console.log("[v0] Constructors fetched:", response.data)
      setConstructors(response.data.constructors || [])
    } catch (error) {
      console.error("[v0] Error fetching constructors:", error)
      toast.error("Failed to fetch constructors")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConstructors()
  }, [search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (selectedConstructor) {
        await axios.put(`/api/constructors/${selectedConstructor.id}`, formData)
        toast.success("Constructor updated successfully")
      } else {
        await axios.post("/api/constructors", formData)
        toast.success("Constructor added successfully")
      }
      fetchConstructors()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("[v0] Error saving constructor:", error)
      toast.error("Failed to save constructor")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this constructor?")) return

    try {
      await axios.delete(`/api/constructors/${id}`)
      toast.success("Constructor deleted successfully")
      fetchConstructors()
    } catch (error) {
      console.error("[v0] Error deleting constructor:", error)
      toast.error("Failed to delete constructor")
    }
  }

  const resetForm = () => {
    setFormData({
      constructorName: "",
      mailingAddress: "",
      website: "",
      phone: "",
      email: "",
      description: "",
      isActive: true,
    })
    setSelectedConstructor(null)
  }

  const openEditDialog = (constructor: any) => {
    setSelectedConstructor(constructor)
    setFormData({
      constructorName: constructor.constructor_name,
      mailingAddress: constructor.mailing_address || "",
      website: constructor.website || "",
      phone: constructor.phone || "",
      email: constructor.email || "",
      description: constructor.description || "",
      isActive: constructor.is_active,
    })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Constructors</h1>
          <p className="text-muted-foreground">Manage your construction contractors</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Constructor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedConstructor ? "Edit Constructor" : "Add New Constructor"}</DialogTitle>
              <DialogDescription>Fill in the constructor information below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="constructorName">Constructor Name *</Label>
                  <Input
                    id="constructorName"
                    value={formData.constructorName}
                    onChange={(e) => setFormData({ ...formData, constructorName: e.target.value })}
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
                <Button type="submit">{selectedConstructor ? "Update" : "Add"} Constructor</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search constructors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Constructors List</CardTitle>
          <CardDescription>View and manage all your constructors</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SL No.</TableHead>
                  <TableHead>Constructor Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Mailing Address</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {constructors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No constructors found
                    </TableCell>
                  </TableRow>
                ) : (
                  constructors.map((constructor, index) => (
                    <TableRow key={constructor.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{constructor.constructor_name}</TableCell>
                      <TableCell>{new Date(constructor.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{constructor.mailing_address || "-"}</TableCell>
                      <TableCell>{constructor.phone || "-"}</TableCell>
                      <TableCell>{constructor.email || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(constructor)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(constructor.id)}>
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
