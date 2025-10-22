"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function PurchaseBudgetPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Purchase Budget</h1>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">Manage budgets per head and project.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Budget</CardTitle>
          <CardDescription>Define budgets for heads and units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Head Name</Label>
              <Input placeholder="Enter head name" />
            </div>
            <div>
              <Label>Unit</Label>
              <Input placeholder="Unit" />
            </div>
            <div>
              <Label>Type</Label>
              <Input placeholder="Dr/Cr" />
            </div>
            <div>
              <Label>Budget Amount</Label>
              <Input type="number" placeholder="Enter amount" />
            </div>
          </div>
          <div className="mt-4">
            <Button disabled>Create Budget</Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Coming Soon:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Budget vs actual tracking</li>
          <li>Head-wise and project-wise budgets</li>
          <li>Export and reporting</li>
        </ul>
      </div>
    </div>
  )
}
