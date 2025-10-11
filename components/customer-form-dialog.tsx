"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import axios from "axios"
import { toast } from "sonner"

interface CustomerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: any
  onSuccess: () => void
}

export function CustomerFormDialog({ open, onOpenChange, customer, onSuccess }: CustomerFormDialogProps) {
  const [formData, setFormData] = useState({
    profession: "",
    customerName: "",
    fatherOrHusbandName: "",
    phone: "",
    whatsapp: "",
    nid: "",
    email: "",
    mailingAddress: "",
    permanentAddress: "",
    birthDate: "",
    crmId: "",
    assignToName: "",
    isActive: true,
  })

  useEffect(() => {
    if (customer) {
      setFormData({
        profession: customer.profession || "",
        customerName: customer.customer_name || "",
        fatherOrHusbandName: customer.father_or_husband_name || "",
        phone: customer.phone || "",
        whatsapp: customer.whatsapp || "",
        nid: customer.nid || "",
        email: customer.email || "",
        mailingAddress: customer.mailing_address || "",
        permanentAddress: customer.permanent_address || "",
        birthDate: customer.birth_date || "",
        crmId: customer.crm_id || "",
        assignToName: customer.assign_to_name || "",
        isActive: customer.is_active ?? true,
      })
    } else {
      resetForm()
    }
  }, [customer, open])

  const resetForm = () => {
    setFormData({
      profession: "",
      customerName: "",
      fatherOrHusbandName: "",
      phone: "",
      whatsapp: "",
      nid: "",
      email: "",
      mailingAddress: "",
      permanentAddress: "",
      birthDate: "",
      crmId: "",
      assignToName: "",
      isActive: true,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (customer) {
        await axios.put(`/api/customers/${customer.id}`, formData)
        toast.success("Customer updated successfully")
      } else {
        await axios.post("/api/customers", formData)
        toast.success("Customer added successfully")
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error saving customer:", error)
      toast.error("Failed to save customer")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>Fill in the customer information below</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profession">Profession</Label>
              <Input
                id="profession"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              />
            </div>
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
              <Label htmlFor="fatherOrHusbandName">Father's or Husband's Name</Label>
              <Input
                id="fatherOrHusbandName"
                value={formData.fatherOrHusbandName}
                onChange={(e) => setFormData({ ...formData, fatherOrHusbandName: e.target.value })}
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
              <Label htmlFor="nid">NID</Label>
              <Input
                id="nid"
                value={formData.nid}
                onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
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
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crmId">CRM ID</Label>
              <Input
                id="crmId"
                value={formData.crmId}
                onChange={(e) => setFormData({ ...formData, crmId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignToName">Assign To Name</Label>
              <Input
                id="assignToName"
                value={formData.assignToName}
                onChange={(e) => setFormData({ ...formData, assignToName: e.target.value })}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Active</Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{customer ? "Update" : "Add"} Customer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
