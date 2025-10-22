"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function PurchaseOrdersPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>Manage purchase orders and their statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No purchase orders yet. This feature will be available soon.</div>
          <div className="mt-4">
            <Button disabled>Create Purchase Order</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
