"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Phone, Calendar, RefreshCw, UserPlus, Loader2 } from "lucide-react"
import { useLeads, useDeleteLead, useConvertLead } from "@/lib/hooks/use-crm"
import { LeadFormDialog } from "@/components/crm/lead-form-dialog"
import { useToast } from "@/hooks/use-toast"
import type { Lead } from "@/lib/validations/crm"

const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Interested",
  "Follow Up",
  "Positive",
  "Negative",
  "Not Interested",
]

const LEAD_SOURCES = [
  "Website",
  "Facebook",
  "Instagram",
  "Referral",
  "Walk-in",
  "Phone Call",
  "WhatsApp",
  "Other",
]

export default function CRMLeadsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"" | "today_call" | "pending_call" | "today_followup">("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)
  const [employees, setEmployees] = useState<any[]>([])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch leads with filters
  const { data: leads = [], isLoading, refetch } = useLeads({
    filter: filter || undefined,
    search: debouncedSearch || undefined,
  })

  const deleteLead = useDeleteLead()
  const convertToCustomer = useConvertLead()

  // Fetch employees for form
  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data.employees || []))
      .catch(console.error)
  }, [])

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead)
    setDialogOpen(true)
  }

  const handleDelete = (lead: Lead) => {
    setLeadToDelete(lead)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!leadToDelete) return
    try {
      await deleteLead.mutateAsync(leadToDelete.id)
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
    } finally {
      setDeleteDialogOpen(false)
      setLeadToDelete(null)
    }
  }

  const handleConvert = async (lead: Lead) => {
    try {
      await convertToCustomer.mutateAsync(lead.id)
      toast({
        title: "Success",
        description: "Lead converted to customer successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to convert lead",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status?: string) => {
    const statusColors: Record<string, string> = {
      New: "bg-blue-100 text-blue-800",
      Contacted: "bg-yellow-100 text-yellow-800",
      Interested: "bg-green-100 text-green-800",
      "Follow Up": "bg-orange-100 text-orange-800",
      Positive: "bg-emerald-100 text-emerald-800",
      Negative: "bg-red-100 text-red-800",
      "Not Interested": "bg-gray-100 text-gray-800",
    }
    const colorClass = statusColors[status || ""] || "bg-gray-100 text-gray-800"
    return <Badge className={colorClass}>{status || "Unknown"}</Badge>
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Leads</h1>
          <p className="text-muted-foreground">Manage your leads and prospects</p>
        </div>
        <Button onClick={() => { setSelectedLead(undefined); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>View and manage all your leads</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                  <TabsTrigger value="">All Leads</TabsTrigger>
                  <TabsTrigger value="today_call">Today's Calls</TabsTrigger>
                  <TabsTrigger value="pending_call">Pending Calls</TabsTrigger>
                  <TabsTrigger value="today_followup">Today's Follow-up</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search leads..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : leads.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <p className="text-muted-foreground">No leads found</p>
              <Button
                variant="link"
                onClick={() => { setSelectedLead(undefined); setDialogOpen(true) }}
              >
                Add your first lead
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CRM ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Next Call</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.crm_id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.customer_name}</p>
                          {lead.email && (
                            <p className="text-sm text-muted-foreground">{lead.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {lead.phone}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.leads_status)}</TableCell>
                      <TableCell>{lead.lead_source || "-"}</TableCell>
                      <TableCell>{lead.project_name || "-"}</TableCell>
                      <TableCell>{lead.assign_to_name || "-"}</TableCell>
                      <TableCell>
                        {lead.next_call_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(lead.next_call_date)}
                          </div>
                        )}
                        {!lead.next_call_date && "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(lead)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleConvert(lead)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Convert to Customer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(lead)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Form Dialog */}
      <LeadFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={selectedLead}
        onSuccess={() => refetch()}
        employees={employees}
        leadStatuses={LEAD_STATUSES}
        leadSources={LEAD_SOURCES}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
