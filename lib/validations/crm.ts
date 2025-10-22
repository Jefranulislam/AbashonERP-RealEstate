import { z } from "zod"

// Lead creation schema
export const createLeadSchema = z.object({
  profession: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  leadsStatus: z.string().optional(),
  leadSource: z.string().optional(),
  phone: z.string().min(1, "Phone number is required"),
  whatsapp: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  nid: z.string().optional(),
  projectName: z.string().optional(),
  assignTo: z.string().optional(),
  assignedBy: z.string().optional(),
  nextCallDate: z.string().optional(),
  fatherOrHusbandName: z.string().optional(),
  mailingAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  birthDate: z.string().optional(),
})

// Lead update schema (same as create for now)
export const updateLeadSchema = createLeadSchema

// Lead convert to customer schema
export const convertLeadSchema = z.object({
  leadId: z.number(),
})

// Lead filter schema
export const leadFilterSchema = z.object({
  filter: z.enum(["", "today_call", "pending_call", "today_followup"]).optional(),
  search: z.string().optional(),
})

// Lead import schema for bulk uploads
export const importLeadSchema = z.object({
  leads: z.array(
    z.object({
      profession: z.string().optional(),
      customerName: z.string(),
      leadsStatus: z.string().optional(),
      leadSource: z.string().optional(),
      phone: z.string(),
      whatsapp: z.string().optional(),
      email: z.string().optional(),
      nid: z.string().optional(),
      projectName: z.string().optional(),
      assignTo: z.string().optional(),
      assignedBy: z.string().optional(),
      nextCallDate: z.string().optional(),
      fatherOrHusbandName: z.string().optional(),
      mailingAddress: z.string().optional(),
      permanentAddress: z.string().optional(),
      birthDate: z.string().optional(),
    })
  ),
})

// TypeScript types
export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>
export type LeadFilterInput = z.infer<typeof leadFilterSchema>
export type ImportLeadInput = z.infer<typeof importLeadSchema>

// Lead entity type
export interface Lead {
  id: number
  crm_id: string
  profession?: string
  customer_name: string
  leads_status?: string
  lead_source?: string
  phone: string
  whatsapp?: string
  email?: string
  nid?: string
  project_name?: string
  assign_to?: number
  assign_to_name?: string
  assigned_by?: number
  assigned_by_name?: string
  next_call_date?: string
  father_or_husband_name?: string
  mailing_address?: string
  permanent_address?: string
  birth_date?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}
