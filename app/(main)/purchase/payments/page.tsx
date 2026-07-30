"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { formatDateDMY } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateField } from "@/components/ui/date-field"
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
import { Plus, Search, Eye, DollarSign, Receipt, FileText, Printer, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"
import axios from "axios"
import { Switch } from "@/components/ui/switch"
import { Combobox } from "@/components/ui/combobox"
import { SortableHeader } from "@/components/ui/sortable-header"
import { useSortable } from "@/lib/hooks/use-sortable"
import { VoucherReceiptPDF } from "@/components/pdf/voucher-receipt-pdf"
import { VoucherViewModal } from "@/components/accounting/voucher-view-modal"
import { getCompanySettings, printDocument } from "@/lib/pdf-utils"

export default function PaymentTransactionsPage() {
  const [isClient, setIsClient] = useState(false)
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
  const [poLoading, setPoLoading] = useState(false)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [printPayment, setPrintPayment] = useState<any>(null)

  const getTodayDate = () => new Date().toISOString().split("T")[0]

  const [formData, setFormData] = useState({
    purchaseOrderId: "",
    vendorId: "",
    constructorId: "",
    projectId: "",
    paymentDate: "",
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

      const poList = Array.isArray(posRes.data) ? posRes.data : posRes.data.orders || []
      const vendorsList = Array.isArray(vendorsRes.data) ? vendorsRes.data : vendorsRes.data.vendors || []
      const projectsList = Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data.projects || []
      const employeesList = Array.isArray(employeesRes.data) ? employeesRes.data : employeesRes.data.employees || []
      const bankList = bankAccountsRes.data.bankCashAccounts || bankAccountsRes.data.accounts || []

      setPurchaseOrders(poList)
      setVendors(vendorsList)
      setProjects(projectsList)
      setEmployees(employeesList)
      setBankAccounts(bankList)
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

  useEffect(() => {
    setIsClient(true)
    setFormData((prev) => ({
      ...prev,
      paymentDate: getTodayDate(),
    }))
    getCompanySettings().then(setCompanySettings)
  }, [])

  const handlePOChange = async (poId: string) => {
    if (!poId || poLoading) return // ignore empty selection / in-flight request
    setFormData((prev) => ({ ...prev, purchaseOrderId: poId }))
    setSelectedPO(null)
    setPoLoading(true)

    try {
      // Fast path endpoint: PO header + party + totals only (no items/schedules/etc.)
      const response = await axios.get(`/api/purchase/orders/${poId}?mode=payment-form`)
      const order = response.data?.order || response.data
      setSelectedPO(order)

      // Pre-fill party (vendor or contractor) and project
      setFormData((prev) => ({
        ...prev,
        purchaseOrderId: poId,
        vendorId: order?.vendor_id?.toString() || "",
        constructorId: order?.constructor_id?.toString() || "",
        projectId: order?.project_id?.toString() || "",
      }))
    } catch (error) {
      console.error("Error fetching PO details:", error)
      alert("Failed to load purchase order. Please try again.")
    } finally {
      setPoLoading(false)
    }
  }

  // Options for the searchable PO picker — matched by PO number, vendor/party
  // name, and supplier/vendor code.
  const poOptions = purchaseOrders.map((po) => {
    const party = po.party_name || po.vendor_name || po.constructor_name || ""
    const due = parseFloat(po.total_amount) <= 0 ? "Open" : `Due: ৳${parseFloat(po.total_due || 0).toFixed(2)}`
    return {
      value: po.id.toString(),
      label: `${po.po_number} — ${party} — ${due}`,
      keywords: `${po.po_number} ${party} ${po.supplier_code || po.vendor_code || ""}`,
    }
  })

  // An "open" PO has no committed total (e.g. a contractor engagement billed by
  // a fixed rate with an open quantity). There is no remaining-due or payment cap.
  const isOpenPO = (): boolean => {
    if (!selectedPO) return false
    return parseFloat(selectedPO.total_amount) <= 0
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
        poId: formData.purchaseOrderId ? parseInt(formData.purchaseOrderId) : null,
        poNumber: selectedPO?.po_number || null,
        vendorId: formData.vendorId ? parseInt(formData.vendorId) : null,
        constructorId: formData.constructorId ? parseInt(formData.constructorId) : null,
        projectId: formData.projectId ? parseInt(formData.projectId) : null,
        paymentDate: formData.paymentDate,
        paymentType: formData.paymentType,
        paymentMethod: formData.paymentMethod,
        bankAccountId: formData.bankAccountId ? parseInt(formData.bankAccountId) : null,
        chequeNumber: formData.chequeNumber || null,
        chequeDate: formData.chequeDate || null,
        transactionReference: formData.referenceNumber || null,
        remarks: formData.paymentRemarks || null,
        paymentStatus: "Completed",
        amount: formData.amount ? parseFloat(formData.amount) : 0,
        createVoucher: formData.createVoucher,
      }

      await axios.post("/api/purchase/payments", paymentData)

      setDialogOpen(false)
      resetForm()
      fetchPayments()
      alert("Payment recorded successfully" + (formData.createVoucher ? " and voucher created" : ""))
    } catch (error) {
      console.error("Error recording payment:", error)
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : "Failed to record payment"
      alert(`Failed to record payment: ${message}`)
    }
  }

  const resetForm = () => {
    setFormData({
      purchaseOrderId: "",
      vendorId: "",
      constructorId: "",
      projectId: "",
      paymentDate: getTodayDate(),
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

  // Map a payment row to the shared View-modal shape
  const paymentToView = (p: any) => ({
    title: `Payment Voucher — ${p.payment_number ?? ""}`.trim(),
    voucherNo: p.voucher_number || p.payment_number,
    date: p.payment_date,
    voucherType: p.payment_type,
    status: p.status || p.payment_status,
    project: p.project_name,
    partyLabel: p.constructor_name && !p.vendor_name ? "Contractor" : "Vendor",
    partyName: p.vendor_name || p.constructor_name,
    partyAddress: p.vendor_address,
    partyPhone: p.vendor_phone,
    partyEmail: p.vendor_email,
    paymentMethod: p.payment_method,
    bankName: p.bank_account_name || p.bank_name,
    chequeNo: p.cheque_number,
    chequeDate: p.cheque_date,
    referenceNumber: p.reference_number || p.transaction_reference,
    headOfAccount: p.head_of_account,
    description: p.remarks,
    amount: Number(p.amount) || 0,
    preparedBy: p.receipt_issued_by,
    verifiedBy: p.verified_by_name,
  })

  const handleViewPayment = async (payment: any) => {
    setSelectedPayment(payment)
    setViewDialogOpen(true)
  }

  // Map a payment row to the shared client-facing receipt shape (no ledger tables)
  const paymentToReceipt = (p: any) => ({
    documentTitle: "Payment Voucher",
    voucherNo: p.voucher_number || p.payment_number,
    voucherDate: p.payment_date,
    voucherType: p.payment_type,
    status: p.status || p.payment_status,
    partyLabel: p.constructor_name && !p.vendor_name ? "Contractor" : "Vendor",
    partyName: p.vendor_name || p.constructor_name,
    partyAddress: p.vendor_address,
    partyPhone: p.vendor_phone,
    partyEmail: p.vendor_email,
    paymentMethod: p.payment_method,
    bankName: p.bank_account_name || p.bank_name,
    chequeNo: p.cheque_number,
    chequeDate: p.cheque_date,
    referenceNumber: p.reference_number || p.transaction_reference,
    poNumber: p.po_number,
    headOfAccount: p.head_of_account,
    purpose: p.remarks,
    totalAmount: Number(p.amount) || 0,
    rows: [
      {
        description: p.payment_type ? `${p.payment_type} Payment` : "Payment",
        bank: p.bank_account_name || p.bank_name,
        chequeNo: p.cheque_number,
        chequeDate: p.cheque_date,
        reference: p.reference_number || p.transaction_reference,
        amount: Number(p.amount) || 0,
      },
    ],
    preparedBy: p.receipt_issued_by,
    receivedBy: p.vendor_name || p.constructor_name,
  })

  const handlePrintPayment = (payment: any) => {
    setPrintPayment(paymentToReceipt(payment))
    setTimeout(() => printDocument("print-payment-content", payment.payment_number), 150)
  }

  // Sortable payments table (Date + PO Number)
  const { sorted: sortedPayments, sort, requestSort } = useSortable(
    payments,
    {
      payment_date: (p: any) => p.payment_date,
      po_number: (p: any) => p.po_number,
    },
    { key: "payment_date", direction: "desc" },
  )

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

  if (!isClient) {
    return <div className="p-6">Loading...</div>
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
                <Combobox
                  options={poOptions}
                  value={formData.purchaseOrderId}
                  onChange={handlePOChange}
                  disabled={poLoading}
                  placeholder="Select purchase order"
                  searchPlaceholder="Search by PO number, vendor, or code…"
                  emptyText="No matching purchase order."
                />
              </div>

              {poLoading && (
                <div className="flex items-center justify-center gap-3 rounded-lg border bg-muted/40 py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">Loading Purchase Order…</span>
                </div>
              )}

              {selectedPO && !poLoading && (
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
                          <Label className="text-muted-foreground">
                            {selectedPO.party_type === "Contractor" ? "Contractor" : "Vendor"}
                          </Label>
                          <p className="font-medium">
                            {selectedPO.party_name || selectedPO.vendor_name || selectedPO.constructor_name}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Project</Label>
                          <p className="font-medium">{selectedPO.project_name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Order Date</Label>
                          <p>{formatDateDMY(selectedPO.order_date)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted rounded-lg">
                        <div>
                          <Label className="text-muted-foreground">Total Amount</Label>
                          <p className="text-xl font-bold">
                            {isOpenPO() ? "Open" : `৳ ${parseFloat(selectedPO.total_amount).toFixed(2)}`}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Total Paid</Label>
                          <p className="text-xl font-bold text-green-600">
                            ৳ {parseFloat(selectedPO.total_paid || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Remaining Due</Label>
                          {isOpenPO() ? (
                            <p className="text-sm font-medium text-muted-foreground">
                              No fixed total — pay as you go
                            </p>
                          ) : (
                            <p className="text-xl font-bold text-red-600">
                              ৳ {calculateRemainingAmount().toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Information */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Payment Date *</Label>
                      <DateField
                        value={formData.paymentDate}
                        onChange={(v) => setFormData({ ...formData, paymentDate: v })}
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
                              {account.account_title} {account.description ? `(${account.description})` : ""}
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
                        <DateField
                          value={formData.chequeDate}
                          onChange={(v) => setFormData({ ...formData, chequeDate: v })}
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
                  <TableHead>
                    <SortableHeader label="Payment Date" sortKey="payment_date" sort={sort} onSort={requestSort} />
                  </TableHead>
                  <TableHead>
                    <SortableHeader label="PO Number" sortKey="po_number" sort={sort} onSort={requestSort} />
                  </TableHead>
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
                {sortedPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.payment_number}</TableCell>
                    <TableCell>{formatDateDMY(payment.payment_date)}</TableCell>
                    <TableCell>{payment.po_number}</TableCell>
                    <TableCell>{payment.vendor_name || payment.constructor_name}</TableCell>
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
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewPayment(payment)}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrintPayment(payment)}
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog (shared, fully-detailed) */}
      <VoucherViewModal
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        data={selectedPayment ? paymentToView(selectedPayment) : null}
      />

      {/* Hidden Print Content — client-facing payment receipt (no ledger tables) */}
      <div className="hidden">
        {printPayment && companySettings && (
          <div id="print-payment-content">
            <VoucherReceiptPDF
              data={printPayment}
              companyName={companySettings.company_name}
              companyAddress={companySettings.address}
              currencySymbol={companySettings.currency_symbol}
              companyLogo={companySettings.company_logo}
              footerImage={companySettings.footer_image}
              backgroundImage={companySettings.background_image}
            />
          </div>
        )}
      </div>
    </div>
  )
}
