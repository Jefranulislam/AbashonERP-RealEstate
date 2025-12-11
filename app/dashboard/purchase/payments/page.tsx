"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Eye, DollarSign, Receipt, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import axios from "axios"
import { Switch } from "@/components/ui/switch"

export default function PaymentTransactionsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterVendor, setFilterVendor] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [selectedPO, setSelectedPO] = useState<any>(null)

  const [formData, setFormData] = useState({
    purchaseOrderId: "",
    vendorId: "",
    projectId: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentType: "Partial",
    paymentMethod: "Bank Transfer",
    bankAccountId: "",
    amount: "",
    referenceNumber: "",
    chequeNumber: "",
    chequeDate: "",
    transactionId: "",
    paidBy: "",
    verifiedBy: "",
    paymentRemarks: "",
    createVoucher: true,
    voucherRemarks: "",
  })

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterType !== "all") params.append("paymentType", filterType)
      if (filterVendor !== "all") params.append("vendorId", filterVendor)

      const response = await axios.get(`/api/purchase/payments?${params.toString()}`)
      setPayments(response.data.payments)
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const [posRes, vendorsRes, projectsRes, employeesRes, bankAccountsRes] = await Promise.all([
        axios.get("/api/purchase/orders"),
        axios.get("/api/vendors"),
        axios.get("/api/projects"),
        axios.get("/api/employees"),
        axios.get("/api/finance/bank-cash"),
      ])

      setPurchaseOrders(posRes.data.orders)
      setVendors(vendorsRes.data.vendors)
      setProjects(projectsRes.data.projects)
      setEmployees(employeesRes.data.employees)
      setBankAccounts(bankAccountsRes.data.accounts)
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [search, filterStatus, filterType, filterVendor])

  useEffect(() => {
    fetchData()
  }, [])

  const handlePOChange = async (poId: string) => {
    setFormData({ ...formData, purchaseOrderId: poId })

    try {
      const response = await axios.get(`/api/purchase/orders/${poId}`)
      setSelectedPO(response.data)
      
      // Pre-fill vendor and project
      setFormData({
        ...formData,
        purchaseOrderId: poId,
        vendorId: response.data.vendor_id?.toString() || "",
        projectId: response.data.project_id?.toString() || "",
      })
    } catch (error) {
      console.error("Error fetching PO details:", error)
    }
  }

  const calculateRemainingAmount = (): number => {
    if (!selectedPO) return 0
    const totalAmount = parseFloat(selectedPO.total_amount)
    const totalPaid = parseFloat(selectedPO.total_paid || 0)
    return totalAmount - totalPaid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        createVoucher: formData.createVoucher,
      }

      await axios.post("/api/purchase/payments", paymentData)

      setDialogOpen(false)
      resetForm()
      fetchPayments()
      alert("Payment recorded successfully" + (formData.createVoucher ? " and voucher created" : ""))
    } catch (error) {
      console.error("Error recording payment:", error)
      alert("Failed to record payment")
    }
  }

  const resetForm = () => {
    setFormData({
      purchaseOrderId: "",
      vendorId: "",
      projectId: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentType: "Partial",
      paymentMethod: "Bank Transfer",
      bankAccountId: "",
      amount: "",
      referenceNumber: "",
      chequeNumber: "",
      chequeDate: "",
      transactionId: "",
      paidBy: "",
      verifiedBy: "",
      paymentRemarks: "",
      createVoucher: true,
      voucherRemarks: "",
    })
    setSelectedPO(null)
  }

  const handleViewPayment = async (payment: any) => {
    setSelectedPayment(payment)
    setViewDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "success"
      case "Pending": return "warning"
      case "Verified": return "default"
      case "Cancelled": return "destructive"
      default: return "secondary"
    }
  }

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case "Advance": return "info"
      case "Partial": return "warning"
      case "Full": return "success"
      case "Due Settlement": return "default"
      default: return "secondary"
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Payment Transactions</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Payment Transaction</DialogTitle>
              <DialogDescription>Record payment to vendor for purchase order</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Purchase Order Selection */}
              <div>
                <Label>Purchase Order *</Label>
                <Select
                  value={formData.purchaseOrderId}
                  onValueChange={handlePOChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purchase order" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders.map((po) => (
                      <SelectItem key={po.id} value={po.id.toString()}>
                        {po.po_number} - {po.vendor_name} - Due: ৳{parseFloat(po.total_due || 0).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPO && (
                <>
                  {/* PO Summary */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">PO Number</Label>
                          <p className="font-semibold">{selectedPO.po_number}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Vendor</Label>
                          <p className="font-medium">{selectedPO.vendor_name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Project</Label>
                          <p className="font-medium">{selectedPO.project_name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Order Date</Label>
                          <p>{new Date(selectedPO.order_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted rounded-lg">
                        <div>
                          <Label className="text-muted-foreground">Total Amount</Label>
                          <p className="text-xl font-bold">৳ {parseFloat(selectedPO.total_amount).toFixed(2)}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Total Paid</Label>
                          <p className="text-xl font-bold text-green-600">
                            ৳ {parseFloat(selectedPO.total_paid || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Remaining Due</Label>
                          <p className="text-xl font-bold text-red-600">
                            ৳ {calculateRemainingAmount().toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Information */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Payment Date *</Label>
                      <Input
                        type="date"
                        value={formData.paymentDate}
                        onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Payment Type *</Label>
                      <Select
                        value={formData.paymentType}
                        onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Advance">Advance Payment</SelectItem>
                          <SelectItem value="Partial">Partial Payment</SelectItem>
                          <SelectItem value="Full">Full Payment</SelectItem>
                          <SelectItem value="Due Settlement">Due Settlement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Amount *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="Enter amount"
                        required
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Payment Method *</Label>
                      <Select
                        value={formData.paymentMethod}
                        onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Cheque">Cheque</SelectItem>
                          <SelectItem value="Mobile Banking">Mobile Banking</SelectItem>
                          <SelectItem value="Card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Bank/Cash Account {formData.paymentMethod !== "Cash" && "*"}</Label>
                      <Select
                        value={formData.bankAccountId}
                        onValueChange={(value) => setFormData({ ...formData, bankAccountId: value })}
                        required={formData.paymentMethod !== "Cash"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.account_name} ({account.account_type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Payment Details Based on Method */}
                  {formData.paymentMethod === "Bank Transfer" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Reference Number</Label>
                        <Input
                          value={formData.referenceNumber}
                          onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                          placeholder="Bank reference number"
                        />
                      </div>
                      <div>
                        <Label>Transaction ID</Label>
                        <Input
                          value={formData.transactionId}
                          onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                          placeholder="Transaction ID"
                        />
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === "Cheque" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Cheque Number *</Label>
                        <Input
                          value={formData.chequeNumber}
                          onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                          placeholder="Cheque number"
                          required
                        />
                      </div>
                      <div>
                        <Label>Cheque Date *</Label>
                        <Input
                          type="date"
                          value={formData.chequeDate}
                          onChange={(e) => setFormData({ ...formData, chequeDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === "Mobile Banking" && (
                    <div>
                      <Label>Transaction ID *</Label>
                      <Input
                        value={formData.transactionId}
                        onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                        placeholder="Mobile banking transaction ID"
                        required
                      />
                    </div>
                  )}

                  {/* Authorization */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Paid By *</Label>
                      <Select
                        value={formData.paidBy}
                        onValueChange={(value) => setFormData({ ...formData, paidBy: value })}
                        required
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
                    <div>
                      <Label>Verified By</Label>
                      <Select
                        value={formData.verifiedBy}
                        onValueChange={(value) => setFormData({ ...formData, verifiedBy: value })}
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
                  </div>

                  <div>
                    <Label>Payment Remarks</Label>
                    <Textarea
                      value={formData.paymentRemarks}
                      onChange={(e) => setFormData({ ...formData, paymentRemarks: e.target.value })}
                      placeholder="Additional payment notes"
                    />
                  </div>

                  {/* Voucher Creation */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">Auto-Create Accounting Voucher</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically create a debit voucher for this payment
                          </p>
                        </div>
                        <Switch
                          checked={formData.createVoucher}
                          onCheckedChange={(checked) => setFormData({ ...formData, createVoucher: checked })}
                        />
                      </div>
                      {formData.createVoucher && (
                        <div>
                          <Label>Voucher Remarks</Label>
                          <Textarea
                            value={formData.voucherRemarks}
                            onChange={(e) => setFormData({ ...formData, voucherRemarks: e.target.value })}
                            placeholder="Additional notes for the voucher"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Record Payment
                    </Button>
                  </div>
                </>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payment number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label>Payment Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Advance">Advance</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Full">Full</SelectItem>
                  <SelectItem value="Due Settlement">Due Settlement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vendor</Label>
              <Select value={filterVendor} onValueChange={setFilterVendor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>Track all vendor payments and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments recorded yet. Record your first payment transaction.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Number</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.payment_number}</TableCell>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.po_number}</TableCell>
                    <TableCell>{payment.vendor_name}</TableCell>
                    <TableCell>
                      <Badge variant={getPaymentTypeColor(payment.payment_type) as any}>
                        {payment.payment_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">৳ {parseFloat(payment.amount).toFixed(2)}</TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell>
                      {payment.voucher_number ? (
                        <Badge variant="outline">
                          <FileText className="h-3 w-3 mr-1" />
                          {payment.voucher_number}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(payment.status) as any}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewPayment(payment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Payment Number</Label>
                  <p className="font-semibold">{selectedPayment.payment_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Date</Label>
                  <p>{new Date(selectedPayment.payment_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">PO Number</Label>
                  <p>{selectedPayment.po_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vendor</Label>
                  <p>{selectedPayment.vendor_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Project</Label>
                  <p>{selectedPayment.project_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Type</Label>
                  <Badge variant={getPaymentTypeColor(selectedPayment.payment_type) as any}>
                    {selectedPayment.payment_type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="text-2xl font-bold">৳ {parseFloat(selectedPayment.amount).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Method</Label>
                  <p>{selectedPayment.payment_method}</p>
                </div>
                {selectedPayment.bank_account_name && (
                  <div>
                    <Label className="text-muted-foreground">Bank/Cash Account</Label>
                    <p>{selectedPayment.bank_account_name}</p>
                  </div>
                )}
                {selectedPayment.reference_number && (
                  <div>
                    <Label className="text-muted-foreground">Reference Number</Label>
                    <p>{selectedPayment.reference_number}</p>
                  </div>
                )}
                {selectedPayment.cheque_number && (
                  <div>
                    <Label className="text-muted-foreground">Cheque Number</Label>
                    <p>{selectedPayment.cheque_number}</p>
                  </div>
                )}
                {selectedPayment.transaction_id && (
                  <div>
                    <Label className="text-muted-foreground">Transaction ID</Label>
                    <p>{selectedPayment.transaction_id}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Paid By</Label>
                  <p>{selectedPayment.paid_by_name}</p>
                </div>
                {selectedPayment.verified_by_name && (
                  <div>
                    <Label className="text-muted-foreground">Verified By</Label>
                    <p>{selectedPayment.verified_by_name}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={getStatusColor(selectedPayment.status) as any}>
                    {selectedPayment.status}
                  </Badge>
                </div>
                {selectedPayment.voucher_number && (
                  <div>
                    <Label className="text-muted-foreground">Voucher Number</Label>
                    <Badge variant="outline" className="text-base">
                      <FileText className="h-4 w-4 mr-1" />
                      {selectedPayment.voucher_number}
                    </Badge>
                  </div>
                )}
              </div>

              {selectedPayment.payment_remarks && (
                <div>
                  <Label className="text-muted-foreground">Payment Remarks</Label>
                  <p className="text-sm mt-1">{selectedPayment.payment_remarks}</p>
                </div>
              )}

              {selectedPayment.voucher_remarks && (
                <div>
                  <Label className="text-muted-foreground">Voucher Remarks</Label>
                  <p className="text-sm mt-1">{selectedPayment.voucher_remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
