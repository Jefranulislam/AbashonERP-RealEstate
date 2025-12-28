"use client"

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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Edit, Trash2, Shield, Users, Save, X } from "lucide-react"
import axios from "axios"
import { toast } from "@/hooks/use-toast"

interface Role {
  id: number
  role_name: string
  description: string
  is_active: boolean
  employee_count: number
  user_count: number
  created_at: string
}

interface Module {
  module_id: number
  module_name: string
  display_name: string
  permissions: {
    [key: string]: {
      permission_id: number
      permission_name: string
      description: string
      is_granted: boolean
    }
  }
}

export default function RoleManagerPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    role_name: "",
    description: "",
    is_active: true,
  })

  const fetchRoles = async () => {
    try {
      const response = await axios.get("/api/roles")
      setRoles(response.data.roles)
    } catch (error) {
      console.error("Error fetching roles:", error)
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async (roleId: number) => {
    try {
      const response = await axios.get(`/api/roles/permissions?roleId=${roleId}`)
      setModules(response.data.permissions)
    } catch (error) {
      console.error("Error fetching permissions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch permissions",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (selectedRole) {
        await axios.put("/api/roles", { id: selectedRole.id, ...formData })
        toast({
          title: "Success",
          description: "Role updated successfully",
        })
      } else {
        await axios.post("/api/roles", formData)
        toast({
          title: "Success",
          description: "Role created successfully",
        })
      }

      fetchRoles()
      setDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save role",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this role?")) return

    try {
      await axios.delete(`/api/roles?id=${id}`)
      toast({
        title: "Success",
        description: "Role deleted successfully",
      })
      fetchRoles()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete role",
        variant: "destructive",
      })
    }
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setFormData({
      role_name: role.role_name,
      description: role.description,
      is_active: role.is_active,
    })
    setDialogOpen(true)
  }

  const handleManagePermissions = async (role: Role) => {
    setSelectedRole(role)
    await fetchPermissions(role.id)
    setPermissionDialogOpen(true)
  }

  const handlePermissionChange = async (
    moduleId: number,
    permissionId: number,
    isGranted: boolean
  ) => {
    if (!selectedRole) return

    try {
      await axios.post("/api/roles/permissions", {
        roleId: selectedRole.id,
        moduleId,
        permissionId,
        isGranted,
      })

      // Update local state
      setModules(prev =>
        prev.map(module => {
          if (module.module_id === moduleId) {
            const updatedPermissions = { ...module.permissions }
            Object.keys(updatedPermissions).forEach(key => {
              if (updatedPermissions[key].permission_id === permissionId) {
                updatedPermissions[key].is_granted = isGranted
              }
            })
            return { ...module, permissions: updatedPermissions }
          }
          return module
        })
      )
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive",
      })
    }
  }

  const handleSelectAllForModule = async (moduleId: number, grant: boolean) => {
    if (!selectedRole) return

    const module = modules.find(m => m.module_id === moduleId)
    if (!module) return

    try {
      const promises = Object.values(module.permissions).map(perm =>
        axios.post("/api/roles/permissions", {
          roleId: selectedRole.id,
          moduleId,
          permissionId: perm.permission_id,
          isGranted: grant,
        })
      )

      await Promise.all(promises)

      // Refresh permissions
      await fetchPermissions(selectedRole.id)

      toast({
        title: "Success",
        description: `${grant ? "Granted" : "Revoked"} all permissions for ${module.display_name}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      role_name: "",
      description: "",
      is_active: true,
    })
    setSelectedRole(null)
  }

  const permissionLabels: { [key: string]: string } = {
    module_show: "Module Access",
    show: "View",
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    pdf: "PDF Export",
    trash_show: "View Trash",
    restore: "Restore",
    permanently_delete: "Permanently Delete",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Manager</h1>
          <p className="text-muted-foreground">
            Manage user roles and their permissions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedRole ? "Edit Role" : "Create New Role"}
              </DialogTitle>
              <DialogDescription>
                {selectedRole
                  ? "Update the role details below"
                  : "Add a new role to the system"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="role_name">Role Name</Label>
                <Input
                  id="role_name"
                  value={formData.role_name}
                  onChange={e =>
                    setFormData({ ...formData, role_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked as boolean })
                  }
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active
                </Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>
            List of all roles in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map(role => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Shield className="mr-2 h-4 w-4 text-primary" />
                        {role.role_name}
                      </div>
                    </TableCell>
                    <TableCell>{role.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Users className="mr-1 h-3 w-3" />
                        {role.user_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Users className="mr-1 h-3 w-3" />
                        {role.employee_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.is_active ? "default" : "secondary"}>
                        {role.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManagePermissions(role)}
                        >
                          <Shield className="mr-1 h-3 w-3" />
                          Permissions
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(role.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Manage Permissions: {selectedRole?.role_name}
            </DialogTitle>
            <DialogDescription>
              Configure module access and permissions for this role
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {modules.map(module => (
                <Card key={module.module_id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {module.display_name}
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleSelectAllForModule(module.module_id, true)
                          }
                        >
                          Grant All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleSelectAllForModule(module.module_id, false)
                          }
                        >
                          Revoke All
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(module.permissions).map(([key, perm]) => (
                        <div key={perm.permission_id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${module.module_id}-${perm.permission_id}`}
                            checked={perm.is_granted}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(
                                module.module_id,
                                perm.permission_id,
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor={`${module.module_id}-${perm.permission_id}`}
                            className="cursor-pointer text-sm"
                          >
                            {permissionLabels[perm.permission_name] ||
                              perm.permission_name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end">
            <Button onClick={() => setPermissionDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
