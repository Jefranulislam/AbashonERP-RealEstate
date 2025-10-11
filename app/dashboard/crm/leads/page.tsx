"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, MoreVertical, Edit, Trash2, UserPlus } from "lucide-react"
import axios from "axios"
import { LeadFormDialog } from "@/components/crm/lead-form-dialog"
import { useRouter } from "next/navigation"

export default function CRMLeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams()
      if (filter) params.append("filter", filter)
      if (search) params.append("search", search)

      const response = await axios.get(`/api/crm/leads?${params.toString()}`)
      setLeads(response.data.leads)
    } catch (error) {
      console.error("[v0] Error fetching leads:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await axios.get("/api/settings")
      setSettings(response.data.settings)
    } catch (error) {
      console.error("[v0] Error fetching settings:", error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/employees")
      console.log("[v0] Employees fetched:", response.data)
      setEmployees(response.data.employees || [])
    } catch (error) {
      console.error("[v0] Error fetching employees:", error)
    }
  }

  useEffect(() => {
    fetchLeads()
    fetchSettings()
    fetchEmployees()
  }, [filter, search])

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this lead?")) return

    try {
      await axios.delete(`/api/crm/leads/${id}`)
      fetchLeads()
    } catch (error) {
      console.error("[v0] Error deleting lead:", error)
    }
  }

  const handleConvert = async (id: number) => {
    if (!confirm("Convert this lead to a customer?")) return

    try {
      await axios.post(`/api/crm/leads/${id}/convert`)
      fetchLeads()
      alert("Lead converted to customer successfully!")
    } catch (error) {
      console.error("[v0] Error converting lead:", error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Positive: "bg-green-500",
      Negative: "bg-red-500",
      Junk: "bg-gray-500",
      Followup: "bg-blue-500",
      "Client will Visit": "bg-purple-500",
      New: "bg-yellow-500",
    }
    return colors[status] || "bg-gray-500"
  }

  const leadStatuses = settings?.lead_status?.split(",") || []
  const leadSources = settings?.lead_source?.split(",") || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Leads</h1>
          <p className="text-muted-foreground">Manage your customer leads and conversions</p>
        </div>
        <Button
          onClick={() => {
            setSelectedLead(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "" ? "default" : "outline"} onClick={() => setFilter("")}>
            All Leads
          </Button>
          <Button variant={filter === "today_call" ? "default" : "outline"} onClick={() => setFilter("today_call")}>
            Today's Call
          </Button>
          <Button variant={filter === "pending_call" ? "default" : "outline"} onClick={() => setFilter("pending_call")}>
            Pending Call
          </Button>
          <Button
            variant={filter === "today_followup" ? "default" : "outline"}
            onClick={() => setFilter("today_followup")}
          >
            Today's Follow-up
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads List</CardTitle>
          <CardDescription>View and manage all your CRM leads</CardDescription>
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
                    <TableHead>CRM ID</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Profession</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Next Call</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground">
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead, index) => (
                      <TableRow key={lead.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{lead.crm_id}</TableCell>
                        <TableCell>{lead.customer_name}</TableCell>
                        <TableCell>{lead.profession}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(lead.leads_status)}>{lead.leads_status}</Badge>
                        </TableCell>
                        <TableCell>{lead.lead_source}</TableCell>
                        <TableCell>{lead.phone}</TableCell>
                        <TableCell>{lead.project_name}</TableCell>
                        <TableCell>
                          {lead.next_call_date ? new Date(lead.next_call_date).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>{lead.assign_to_name || "-"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedLead(lead)
                                  setDialogOpen(true)
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleConvert(lead.id)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Convert to Customer
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(lead.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <LeadFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={selectedLead}
        onSuccess={fetchLeads}
        employees={employees}
        leadStatuses={leadStatuses}
        leadSources={leadSources}
      />
    </div>
  )
}
