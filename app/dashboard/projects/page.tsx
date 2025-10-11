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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2 } from "lucide-react"
import axios from "axios"
import { Badge } from "@/components/ui/badge"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [formData, setFormData] = useState({
    projectName: "",
    projectLocationId: "",
    address: "",
    facing: "",
    buildingHeight: "",
    landArea: "",
    projectLaunchingDate: "",
    handOverDate: "",
    description: "",
    isActive: true,
  })

  const fetchProjects = async () => {
    try {
      const response = await axios.get("/api/projects")
      setProjects(response.data.projects)
    } catch (error) {
      console.error("[v0] Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await axios.get("/api/projects/locations")
      setLocations(response.data.locations)
    } catch (error) {
      console.error("[v0] Error fetching locations:", error)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchLocations()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (selectedProject) {
        await axios.put(`/api/projects/${selectedProject.id}`, formData)
      } else {
        await axios.post("/api/projects", formData)
      }
      fetchProjects()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("[v0] Error saving project:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      await axios.delete(`/api/projects/${id}`)
      fetchProjects()
    } catch (error) {
      console.error("[v0] Error deleting project:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      projectName: "",
      projectLocationId: "",
      address: "",
      facing: "",
      buildingHeight: "",
      landArea: "",
      projectLaunchingDate: "",
      handOverDate: "",
      description: "",
      isActive: true,
    })
    setSelectedProject(null)
  }

  const openEditDialog = (project: any) => {
    setSelectedProject(project)
    setFormData({
      projectName: project.project_name,
      projectLocationId: project.project_location_id,
      address: project.address || "",
      facing: project.facing || "",
      buildingHeight: project.building_height || "",
      landArea: project.land_area || "",
      projectLaunchingDate: project.project_launching_date || "",
      handOverDate: project.hand_over_date || "",
      description: project.description || "",
      isActive: project.is_active,
    })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your construction projects</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProject ? "Edit Project" : "Add New Project"}</DialogTitle>
              <DialogDescription>Fill in the project information below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectLocationId">Project Location *</Label>
                  <Select
                    value={formData.projectLocationId}
                    onValueChange={(value) => setFormData({ ...formData, projectLocationId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={String(location.id)}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facing">Facing</Label>
                  <Input
                    id="facing"
                    value={formData.facing}
                    onChange={(e) => setFormData({ ...formData, facing: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buildingHeight">Building Height</Label>
                  <Input
                    id="buildingHeight"
                    value={formData.buildingHeight}
                    onChange={(e) => setFormData({ ...formData, buildingHeight: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="landArea">Land Area</Label>
                  <Input
                    id="landArea"
                    value={formData.landArea}
                    onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectLaunchingDate">Launching Date</Label>
                  <Input
                    id="projectLaunchingDate"
                    type="date"
                    value={formData.projectLaunchingDate}
                    onChange={(e) => setFormData({ ...formData, projectLaunchingDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handOverDate">Hand Over Date</Label>
                  <Input
                    id="handOverDate"
                    type="date"
                    value={formData.handOverDate}
                    onChange={(e) => setFormData({ ...formData, handOverDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{selectedProject ? "Update Project" : "Add Project"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects List</CardTitle>
          <CardDescription>View and manage all your projects</CardDescription>
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
                    <TableHead>Project Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Facing</TableHead>
                    <TableHead>Building Height</TableHead>
                    <TableHead>Land Area</TableHead>
                    <TableHead>Launching Date</TableHead>
                    <TableHead>Hand Over Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground">
                        No projects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    projects.map((project, index) => (
                      <TableRow key={project.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{project.project_name}</TableCell>
                        <TableCell>{project.location_name}</TableCell>
                        <TableCell>{project.address}</TableCell>
                        <TableCell>{project.facing}</TableCell>
                        <TableCell>{project.building_height}</TableCell>
                        <TableCell>{project.land_area}</TableCell>
                        <TableCell>
                          {project.project_launching_date
                            ? new Date(project.project_launching_date).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {project.hand_over_date ? new Date(project.hand_over_date).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={project.is_active ? "default" : "secondary"}>
                            {project.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(project)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)}>
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
