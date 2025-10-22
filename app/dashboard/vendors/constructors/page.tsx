"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Constructor {
  id: number
  constructor_name: string
  mailing_address?: string
  phone?: string
  email?: string
  website?: string
  description?: string
  is_active: boolean
}

export default function ConstructorsPage() {
  const [constructors, setConstructors] = useState<Constructor[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [formData, setFormData] = useState({
    constructorName: "",
    mailingAddress: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    isActive: true,
  })

  useEffect(() => {
    fetchConstructors()
  }, [])

  const fetchConstructors = async () => {
    try {
      const url = searchTerm
        ? `/api/constructors?search=${searchTerm}`
        : "/api/constructors"
      const response = await fetch(url)
      const data = await response.json()
      if (response.ok) {
        setConstructors(data.constructors)
      }
    } catch (error) {
      console.error("Error fetching constructors:", error)
      toast.error("Failed to fetch constructors")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/constructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Constructor added successfully!")
        setDialogOpen(false)
        setFormData({
          constructorName: "",
          mailingAddress: "",
          phone: "",
          email: "",
          website: "",
          description: "",
          isActive: true,
        })
        fetchConstructors()
      } else {
        toast.error(data.error || "Failed to add constructor")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to add constructor")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Constructors</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Constructor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Constructor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Constructor Name *</Label>
                  <Input
                    value={formData.constructorName}
                    onChange={(e) =>
                      setFormData({ ...formData, constructorName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Mailing Address</Label>
                <Textarea
                  value={formData.mailingAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, mailingAddress: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label>Active</Label>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Constructor"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={fetchConstructors}>Search</Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SL No.</TableHead>
                <TableHead>Constructor Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mailing Address</TableHead>
                <TableHead>Is Active</TableHead>
                <TableHead>Options</TableHead>
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
                    <TableCell>{constructor.constructor_name}</TableCell>
                    <TableCell>{constructor.phone || "-"}</TableCell>
                    <TableCell>{constructor.email || "-"}</TableCell>
                    <TableCell>{constructor.mailing_address || "-"}</TableCell>
                    <TableCell>{constructor.is_active ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
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
    </div>
  )
}
