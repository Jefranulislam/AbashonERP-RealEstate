"use client"

import type React from "react"

import { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2 } from "lucide-react"
import { 
  useProjectLocations, 
  useCreateProjectLocation, 
  useUpdateProjectLocation, 
  useDeleteProjectLocation 
} from "@/lib/hooks/use-projects"

export default function ProjectLocationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    isActive: true,
  })

  // React Query hooks
  const { data: locations = [], isLoading: loading } = useProjectLocations()
  const createLocation = useCreateProjectLocation()
  const updateLocation = useUpdateProjectLocation()
  const deleteLocation = useDeleteProjectLocation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (selectedLocation) {
        await updateLocation.mutateAsync({
          id: selectedLocation.id,
          data: formData,
        })
      } else {
        await createLocation.mutateAsync(formData)
      }
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this location?")) return

    try {
      await deleteLocation.mutateAsync(id)
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      isActive: true,
    })
    setSelectedLocation(null)
  }

  const openEditDialog = (location: any) => {
    setSelectedLocation(location)
    setFormData({
      name: location.name,
      isActive: location.is_active,
    })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Locations</h1>
          <p className="text-muted-foreground">Manage project locations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedLocation ? "Edit Location" : "Add New Location"}</DialogTitle>
              <DialogDescription>Fill in the location information below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
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
                <Button type="submit">{selectedLocation ? "Update" : "Add"} Location</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locations List</CardTitle>
          <CardDescription>View and manage all project locations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SL No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Is Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No locations found
                    </TableCell>
                  </TableRow>
                ) : (
                  locations.map((location, index) => (
                    <TableRow key={location.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell>{location.is_active ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(location)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(location.id)}>
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
