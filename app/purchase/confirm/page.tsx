"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Search, Eye, CheckCircle, XCircle, Loader2, Info } from "lucide-react"
import axios from "axios"
import { formatDistanceToNow } from "date-fns"

export default function PurchaseConfirmPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [requisitions, setRequisitions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedRequisition, setSelectedRequisition] = useState<any>(null)
  const [requisitionItems, setRequisitionItems] = useState<any[]>([])

  const fetchRequisitions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)

      const response = await axios.get(`/api/purchase/requisitions?${params.toString()}`)
      // Filter only unconfirmed requisitions
      const unconfirmedRequisitions = response.data.requisitions.filter(
        (req: any) => !req.is_confirmed
      )
      setRequisitions(unconfirmedRequisitions)
    } catch (error) {
      console.error("[v0] Error fetching requisitions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequisitions()
  }, [searchTerm])

  const handleViewRequisition = async (requisition: any) => {
    try {
      const response = await axios.get(`/api/purchase/requisitions/${requisition.id}`)
      setSelectedRequisition(response.data.requisition)
      setRequisitionItems(response.data.items)
      setViewDialogOpen(true)
    } catch (error) {
      console.error("[v0] Error fetching requisition details:", error)
    }
  }

  const handleConfirm = async (id: number) => {
    if (!confirm("Are you sure you want to confirm this requisition?")) return

    try {
      await axios.patch(`/api/purchase/requisitions/${id}`, {
        is_confirmed: true,
      })
      fetchRequisitions()
      alert("Requisition confirmed successfully!")
    } catch (error) {
      console.error("[v0] Error confirming requisition:", error)
      alert("Error confirming requisition. Please try again.")
    }
  }

  const handleReject = async (id: number) => {
    if (!confirm("Are you sure you want to reject this requisition?")) return

    try {
      await axios.delete(`/api/purchase/requisitions/${id}`)
      fetchRequisitions()
      alert("Requisition rejected successfully!")
    } catch (error) {
      console.error("[v0] Error rejecting requisition:", error)
      alert("Error rejecting requisition. Please try again.")
    }
  }

  return (
    <div className="p-6">
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Purchase Workflow - Step 2: Confirm Requisitions</AlertTitle>
        <AlertDescription>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li><strong>Step 1:</strong> Requisition created by employee (needs approval)</li>
            <li><strong>Step 2 (Current):</strong> Review and confirm/reject requisitions</li>
            <li><strong>Step 3:</strong> Create Purchase Order from confirmed requisitions</li>
            <li><strong>Step 4:</strong> Record Material Deliveries against PO</li>
            <li><strong>Step 5:</strong> Process Payment Transactions</li>
            <li><strong>Step 6:</strong> View comprehensive Purchase Reports</li>
          </ol>
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Confirm Purchase Requisitions</h1>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Review and approve pending purchase requisitions.
        </p>
      </div>

      <div className="mb-4">
        <Label>Search Requisitions</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by requisition number or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Req. No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requisitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No pending requisitions found.
                  </TableCell>
                </TableRow>
              ) : (
                requisitions.map((requisition) => (
                  <TableRow key={requisition.id}>
                    <TableCell className="font-medium">{requisition.mpr_no}</TableCell>
                    <TableCell>
                      {new Date(requisition.requisition_date).toLocaleDateString()}
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(requisition.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>{requisition.project_name}</TableCell>
                    <TableCell>{requisition.employee_name}</TableCell>
                    <TableCell>৳ {Number(requisition.total_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRequisition(requisition)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleConfirm(requisition.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleReject(requisition.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Requisition Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Requisition Details - {selectedRequisition?.mpr_no}</DialogTitle>
            <DialogDescription>Review the complete requisition information</DialogDescription>
          </DialogHeader>

          {selectedRequisition && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Project</Label>
                  <p className="text-sm font-medium">{selectedRequisition.project_name}</p>
                </div>
                <div>
                  <Label>Employee</Label>
                  <p className="text-sm font-medium">{selectedRequisition.employee_name}</p>
                </div>
                <div>
                  <Label>Requisition Date</Label>
                  <p className="text-sm">
                    {new Date(selectedRequisition.requisition_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label>Required Date</Label>
                  <p className="text-sm">
                    {selectedRequisition.required_date
                      ? new Date(selectedRequisition.required_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label>Purpose</Label>
                  <p className="text-sm">{selectedRequisition.purpose_description || "N/A"}</p>
                </div>
                {selectedRequisition.contact_person && (
                  <div>
                    <Label>Contact Person</Label>
                    <p className="text-sm">{selectedRequisition.contact_person}</p>
                  </div>
                )}
                {selectedRequisition.comments && (
                  <div className="col-span-2">
                    <Label>Comments</Label>
                    <p className="text-sm">{selectedRequisition.comments}</p>
                  </div>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expense Head</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requisitionItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.expense_head_name}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.qty}</TableCell>
                        <TableCell className="text-right">৳ {Number(item.rate).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          ৳ {Number(item.total_price).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold">
                        Total Amount:
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ৳ {Number(selectedRequisition.total_amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleReject(selectedRequisition.id)
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleConfirm(selectedRequisition.id)
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Coming Soon:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Multi-level approval workflow</li>
          <li>Convert to purchase order</li>
          <li>Email notifications to vendors</li>
          <li>Approval history tracking</li>
        </ul>
      </div>
    </div>
  )
}
