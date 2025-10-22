"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Company Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Company Information</CardTitle>
          <CardDescription>Basic company settings used across the ERP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <Input placeholder="Company name" />
            </div>
            <div>
              <Label>Invoice Prefix</Label>
              <Input placeholder="e.g., ADDL" />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea placeholder="Address" />
            </div>
            <div>
              <Label>Payment Methods (comma separated)</Label>
              <Input placeholder="Cheque, Cash, Online Transfer" />
            </div>
            <div>
              <Label>Lead Status (CSV)</Label>
              <Input placeholder="Positive, Negative, Junk, Followup" />
            </div>
            <div>
              <Label>Lead Source (CSV)</Label>
              <Input placeholder="Self, Facebook, Youtube" />
            </div>
            <div>
              <Label>Print on Company Pad</Label>
              <Input placeholder="Yes/No" />
            </div>
          </div>
          <div className="mt-4">
            <Button disabled>Save Settings</Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Notes:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Lead Status and Lead Source values are used by CRM</li>
          <li>Invoice Prefix is used by Sales module</li>
          <li>Settings affect many modules across the ERP</li>
        </ul>
      </div>
    </div>
  )
}
