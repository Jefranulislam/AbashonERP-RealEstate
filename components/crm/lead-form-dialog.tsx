"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"

interface LeadFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: any
  onSuccess: () => void
  employees: any[]
  leadStatuses: string[]
  leadSources: string[]
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  onSuccess,
  employees,
  leadStatuses,
  leadSources,
}: LeadFormDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    profession: "",
    customerName: "",
    leadsStatus: "",
    leadSource: "",
    phone: "",
    whatsapp: "",
    email: "",
    nid: "",
    projectName: "",
    assignTo: "",
    assignedBy: "",
    nextCallDate: "",
    fatherOrHusbandName: "",
    mailingAddress: "",
    permanentAddress: "",
    birthDate: "",
  })

  useEffect(() => {
    if (open) {
      if (lead) {
        setFormData({
          profession: lead.profession || "",
          customerName: lead.customer_name || "",
          leadsStatus: lead.leads_status || "",
          leadSource: lead.lead_source || "",
          phone: lead.phone || "",
          whatsapp: lead.whatsapp || "",
          email: lead.email || "",
          nid: lead.nid || "",
          projectName: lead.project_name || "",
          assignTo: lead.assign_to?.toString() || "",
          assignedBy: lead.assigned_by?.toString() || "",
          nextCallDate: lead.next_call_date ? lead.next_call_date.split("T")[0] : "",
          fatherOrHusbandName: lead.father_or_husband_name || "",
          mailingAddress: lead.mailing_address || "",
          permanentAddress: lead.permanent_address || "",
          birthDate: lead.birth_date ? lead.birth_date.split("T")[0] : "",
        })
      } else {
        // Reset to empty form
        setFormData({
          profession: "",
          customerName: "",
          leadsStatus: "",
          leadSource: "",
          phone: "",
          whatsapp: "",
          email: "",
          nid: "",
          projectName: "",
          assignTo: "",
          assignedBy: "",
          nextCallDate: "",
          fatherOrHusbandName: "",
          mailingAddress: "",
          permanentAddress: "",
          birthDate: "",
        })
      }
    }
  }, [open, lead])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("[v0] Submitting lead data:", formData)

      if (lead) {
        const response = await axios.put(`/api/crm/leads/${lead.id}`, formData)
        console.log("[v0] Lead updated:", response.data)
        toast({
          title: "Success",
          description: "Lead updated successfully",
        })
      } else {
        const response = await axios.post("/api/crm/leads", formData)
        console.log("[v0] Lead created:", response.data)
        toast({
          title: "Success",
          description: "Lead created successfully",
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("[v0] Error saving lead:", error)
      console.error("[v0] Error response:", error.response?.data)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save lead",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          <DialogDescription>Fill in the lead information below</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profession">Profession</Label>
              <Input
                id="profession"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
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
              <Label htmlFor="nid">NID</Label>
              <Input
                id="nid"
                value={formData.nid}
                onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadsStatus">Lead Status</Label>
              <Select
                value={formData.leadsStatus}
                onValueChange={(value) => setFormData({ ...formData, leadsStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {leadStatuses.map((status) => (
                    <SelectItem key={status} value={status.trim()}>
                      {status.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadSource">Lead Source</Label>
              <Select
                value={formData.leadSource}
                onValueChange={(value) => setFormData({ ...formData, leadSource: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {leadSources.map((source) => (
                    <SelectItem key={source} value={source.trim()}>
                      {source.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignTo">Assign To</Label>
              <Select
                value={formData.assignTo}
                onValueChange={(value) => setFormData({ ...formData, assignTo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedBy">Assigned By</Label>
              <Select
                value={formData.assignedBy}
                onValueChange={(value) => setFormData({ ...formData, assignedBy: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextCallDate">Next Call Date</Label>
              <Input
                id="nextCallDate"
                type="date"
                value={formData.nextCallDate}
                onChange={(e) => setFormData({ ...formData, nextCallDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatherOrHusbandName">Father's/Husband's Name</Label>
              <Input
                id="fatherOrHusbandName"
                value={formData.fatherOrHusbandName}
                onChange={(e) => setFormData({ ...formData, fatherOrHusbandName: e.target.value })}
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
            <Label htmlFor="permanentAddress">Permanent Address</Label>
            <Textarea
              id="permanentAddress"
              value={formData.permanentAddress}
              onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : lead ? "Update Lead" : "Add Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
