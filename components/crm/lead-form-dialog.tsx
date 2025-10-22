"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createLeadSchema, type CreateLeadInput } from "@/lib/validations/crm"
import { useCreateLead, useUpdateLead } from "@/lib/hooks/use-crm"

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
  const createLead = useCreateLead()
  const updateLead = useUpdateLead(lead?.id || 0)

  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
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
    },
  })

  // Reset form when dialog opens/closes or lead changes
  useEffect(() => {
    if (open && lead) {
      form.reset({
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
    } else if (open && !lead) {
      form.reset({
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
  }, [open, lead, form])

  const onSubmit = async (data: CreateLeadInput) => {
    try {
      if (lead) {
        await updateLead.mutateAsync(data)
        toast({
          title: "Success",
          description: "Lead updated successfully",
        })
      } else {
        await createLead.mutateAsync(data)
        toast({
          title: "Success",
          description: "Lead created successfully",
        })
      }

      onSuccess()
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save lead",
        variant: "destructive",
      })
    }
  }

  const isLoading = createLead.isPending || updateLead.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          <DialogDescription>Fill in the lead information below</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input id="customerName" {...form.register("customerName")} />
              {form.formState.errors.customerName && (
                <p className="text-sm text-destructive">{form.formState.errors.customerName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="profession">Profession</Label>
              <Input id="profession" {...form.register("profession")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" {...form.register("phone")} />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" {...form.register("whatsapp")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nid">NID</Label>
              <Input id="nid" {...form.register("nid")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadsStatus">Lead Status</Label>
              <Select value={form.watch("leadsStatus")} onValueChange={(value) => form.setValue("leadsStatus", value)}>
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
              <Select value={form.watch("leadSource")} onValueChange={(value) => form.setValue("leadSource", value)}>
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
              <Input id="projectName" {...form.register("projectName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignTo">Assign To</Label>
              <Select value={form.watch("assignTo")} onValueChange={(value) => form.setValue("assignTo", value)}>
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
              <Select value={form.watch("assignedBy")} onValueChange={(value) => form.setValue("assignedBy", value)}>
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
              <Input id="nextCallDate" type="date" {...form.register("nextCallDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input id="birthDate" type="date" {...form.register("birthDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatherOrHusbandName">Father's/Husband's Name</Label>
              <Input id="fatherOrHusbandName" {...form.register("fatherOrHusbandName")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mailingAddress">Mailing Address</Label>
            <Textarea id="mailingAddress" {...form.register("mailingAddress")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="permanentAddress">Permanent Address</Label>
            <Textarea id="permanentAddress" {...form.register("permanentAddress")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : lead ? "Update Lead" : "Add Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
