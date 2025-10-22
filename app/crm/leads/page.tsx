"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, MoreVertical, Edit, Trash2, UserPlus } from "lucide-react"
import { LeadFormDialog } from "@/components/crm/lead-form-dialog"
import { useLeads, useDeleteLead, useConvertLead, useEmployees, useSettings } from "@/lib/hooks/use-crm"
import type { Lead } from "@/lib/validations/crm"
import { useToast } from "@/hooks/use-toast"

export default function CRMLeadsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"" | "today_call" | "pending_call" | "today_followup">("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Fetch data with React Query
  const { data: leads = [], isLoading, refetch } = useLeads({ filter, search })
  const { data: employees = [] } = useEmployees()
  const { data: settings } = useSettings()
  const deleteLead = useDeleteLead()
  const convertLead = useConvertLead()

  const leadStatuses = settings?.lead_status?.split(",") || []
  const leadSources = settings?.lead_source?.split(",") || []

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this lead?")) return

    try {
      await deleteLead.mutateAsync(id)
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead",
        variant: "destructive",
      })
    }
  }

  const handleConvert = async (id: number) => {
    if (!confirm("Convert this lead to a customer?")) return

    try {
      await convertLead.mutateAsync(id)
      toast({
        title: "Success",
        description: "Lead converted to customer successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to convert lead",
        variant: "destructive",
      })
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
          {isLoading ? (
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
                          <Badge className={getStatusColor(lead.leads_status || "")}>{lead.leads_status}</Badge>
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
        onSuccess={() => refetch()}
        employees={employees}
        leadStatuses={leadStatuses}
        leadSources={leadSources}
      />
    </div>
  )
}
