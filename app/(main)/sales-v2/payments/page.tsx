"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { printDocument } from "@/lib/pdf-utils"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Printer, DollarSign, Calendar, AlertTriangle, CreditCard, Banknote, Building2 } from "lucide-react"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/hooks/use-currency"
import { amountToWordsBDT, normalizePaymentMethod } from "@/lib/payment-utils"
import { CustomerReceipt } from "@/components/customer-receipt"

interface PaymentSchedule {
  id: number
  sale_id: number
  sale_no: string
  schedule_type: string
  installment_no: number
  due_date: string
  amount: number
  paid_amount: number
  status: string
  customer_name: string
  customer_phone: string
  project_name: string
  product_name: string
  unit_no: string
  days_overdue?: number
}

interface Payment {
  id: number
  receipt_no: string
  sale_no: string
  customer_name: string
  customer_phone: string
  customer_address?: string
  project_name: string
  product_name: string
  unit_no: string
  floor_no?: string
  payment_date: string
  amount: number
  payment_method: string
  cheque_number?: string
  cheque_bank?: string
  cheque_date?: string
  bank_account_name?: string
  transaction_reference?: string
  status: string
}

export default function PaymentCollectionPage() {
  const { toast } = useToast()
  const { formatAmount } = useCurrency()
  
  // States
  const [dueSchedules, setDueSchedules] = useState<PaymentSchedule[]>([])
  const [overdueSchedules, setOverdueSchedules] = useState<PaymentSchedule[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [todayCollection, setTodayCollection] = useState(0)
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [standaloneDialogOpen, setStandaloneDialogOpen] = useState(false)
  const [allSales, setAllSales] = useState<any[]>([])
  const [selectedSaleId, setSelectedSaleId] = useState("")
  const [saleSchedules, setSaleSchedules] = useState<any[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState<PaymentSchedule | null>(null)
  const [printData, setPrintData] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    saleId: "",
    scheduleId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    bankCashId: "",
    chequeNumber: "",
    chequeDate: "",
    chequeBank: "",
    transactionReference: "",
    remarks: "",
    sendSMS: true,
  })

  // Fetch data
  const fetchSchedules = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const [dueRes, overdueRes, paymentsRes, paymentsTodayRes] = await Promise.all([
        axios.get("/api/sales-v2/schedules"),
        axios.get("/api/sales-v2/schedules?overdue=true"),
        axios.get("/api/sales-v2/payments"),
        axios.get(`/api/sales-v2/payments?startDate=${today}&endDate=${today}`),
      ])

      setDueSchedules(dueRes.data.schedules)
      setOverdueSchedules(overdueRes.data.schedules)
      setRecentPayments(paymentsRes.data.payments?.slice(0, 20) || [])
      setTodayCollection(
        (paymentsTodayRes.data?.payments || [])
          .filter((p: any) => p.status !== "cancelled" && p.status !== "bounced")
          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
      )
    } catch (error) {
      console.error("Error fetching schedules:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMasterData = async () => {
    try {
      const [banksRes, settingsRes, salesRes] = await Promise.all([
        axios.get("/api/finance/bank-cash"),
        axios.get("/api/settings"),
        axios.get("/api/sales-v2"),
      ])

      setBankAccounts(banksRes.data.bankCashAccounts || [])
      setCompanySettings(settingsRes.data.settings || {})
      setAllSales(salesRes.data.sales || [])
    } catch (error) {
      console.error("Error fetching master data:", error)
    }
  }

  const openStandalonePaymentDialog = () => {
    setSelectedSaleId("")
    setPaymentForm({
      saleId: "",
      scheduleId: "",
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      bankCashId: "",
      chequeNumber: "",
      chequeDate: "",
      chequeBank: "",
      transactionReference: "",
      remarks: "",
      sendSMS: true,
    })
    setStandaloneDialogOpen(true)
  }

  const handleStandaloneSaleChange = async (saleId: string) => {
    setSelectedSaleId(saleId)
    setPaymentForm(prev => ({ ...prev, saleId, scheduleId: "", amount: "" }))
    setSaleSchedules([])
    if (saleId) {
      try {
        const res = await axios.get(`/api/sales-v2/schedules?saleId=${saleId}`)
        const pending = (res.data.schedules || []).filter(
          (s: any) => s.status !== 'paid' && (s.amount - (s.paid_amount || 0)) > 0
        )
        setSaleSchedules(pending)
      } catch {}
    }
  }

  const handleSubmitStandalonePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!paymentForm.saleId) {
      toast({ title: "Required", description: "Please select a booking", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    toast({ title: "Processing payment...", description: "Please wait." })
    try {
      const response = await axios.post("/api/sales-v2/payments", paymentForm)
      toast({ title: "Payment Recorded!", description: `Receipt No: ${response.data.receiptNo}` })
      if (response.data.payment) {
        const paymentDetails = await axios.get(`/api/sales-v2/payments/${response.data.payment.id}`)
        setPrintData(paymentDetails.data.payment)
      }
      setStandaloneDialogOpen(false)
      await fetchSchedules()
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.error || "Failed to record payment", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
    fetchMasterData()
  }, [])

  const openPaymentDialog = (schedule: PaymentSchedule) => {
    setSelectedSchedule(schedule)
    setPaymentForm({
      saleId: String(schedule.sale_id),
      scheduleId: String(schedule.id),
      amount: String(schedule.amount - schedule.paid_amount),
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      bankCashId: "",
      chequeNumber: "",
      chequeDate: "",
      chequeBank: "",
      transactionReference: "",
      remarks: "",
      sendSMS: true,
    })
    setDialogOpen(true)
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    setIsSubmitting(true)
    toast({
      title: "Processing payment...",
      description: "Please wait and do not click submit multiple times.",
    })

    try {
      const response = await axios.post("/api/sales-v2/payments", paymentForm)
      
      toast({
        title: "Payment Recorded!",
        description: `Receipt No: ${response.data.receiptNo}`,
      })

      // Set print data
      if (response.data.payment) {
        const paymentDetails = await axios.get(`/api/sales-v2/payments/${response.data.payment.id}`)
        setPrintData(paymentDetails.data.payment)
      }

      setDialogOpen(false)
      await fetchSchedules()
    } catch (error: any) {
      console.error("Error recording payment:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to record payment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle printing existing receipts - direct print
  const handlePrintExistingReceipt = async (paymentId: number) => {
    try {
      const response = await axios.get(`/api/sales-v2/payments/${paymentId}`)
      const paymentData = response.data.payment
      
      if (paymentData) {
        // Set print data and trigger immediate print
        setPrintData(paymentData)
        setTimeout(() => {
          printDocument('print-receipt-content')
        }, 100)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load receipt data.",
        variant: "destructive",
      })
    }
  }

  // Auto-print when printData is set (for new payments)
  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        printDocument('print-receipt-content')
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [printData])

  // Summary calculations
  const totalDue = dueSchedules.reduce((sum, s) => sum + (s.amount - s.paid_amount), 0)
  const totalOverdue = overdueSchedules.reduce((sum, s) => sum + (s.amount - s.paid_amount), 0)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Collection</h1>
          <p className="text-muted-foreground">Collect payments and manage payment schedules</p>
        </div>
        <Button onClick={openStandalonePaymentDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatAmount(todayCollection)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due (Next 30 Days)</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatAmount(totalDue)}</div>
            <p className="text-xs text-muted-foreground">{dueSchedules.length} payments</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatAmount(totalOverdue)}</div>
            <p className="text-xs text-red-600">{overdueSchedules.length} overdue payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentPayments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="due" className="space-y-4">
        <TabsList>
          <TabsTrigger value="due">
            Upcoming Due ({dueSchedules.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="text-red-600">
            Overdue ({overdueSchedules.length})
          </TabsTrigger>
          <TabsTrigger value="recent">
            Recent Payments ({recentPayments.length})
          </TabsTrigger>
        </TabsList>

        {/* Due Payments Tab */}
        <TabsContent value="due">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Due Payments</CardTitle>
              <CardDescription>Payments due in the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">Loading...</div>
              ) : dueSchedules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming payments due
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dueSchedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{schedule.customer_name}</div>
                            <div className="text-xs text-muted-foreground">{schedule.customer_phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{schedule.product_name}</div>
                            <div className="text-xs text-muted-foreground">{schedule.project_name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {schedule.schedule_type.replace('_', ' ')}
                          {schedule.installment_no > 0 && ` #${schedule.installment_no}`}
                        </TableCell>
                        <TableCell>{formatDateDMY(schedule.due_date)}</TableCell>
                        <TableCell>{formatAmount(schedule.amount)}</TableCell>
                        <TableCell className="text-green-600">{formatAmount(schedule.paid_amount)}</TableCell>
                        <TableCell className="font-medium">
                          {formatAmount(schedule.amount - schedule.paid_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => openPaymentDialog(schedule)}>
                            <DollarSign className="mr-1 h-4 w-4" />
                            Collect
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Payments Tab */}
        <TabsContent value="overdue">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Overdue Payments</CardTitle>
              <CardDescription>These payments are past their due date</CardDescription>
            </CardHeader>
            <CardContent>
              {overdueSchedules.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  🎉 No overdue payments!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Balance Due</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueSchedules.map((schedule) => (
                      <TableRow key={schedule.id} className="bg-red-50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{schedule.customer_name}</div>
                            <div className="text-xs text-muted-foreground">{schedule.customer_phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{schedule.product_name}</div>
                            <div className="text-xs text-muted-foreground">{schedule.project_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDateDMY(schedule.due_date)}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{schedule.days_overdue} days</Badge>
                        </TableCell>
                        <TableCell className="font-bold text-red-600">
                          {formatAmount(schedule.amount - schedule.paid_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="destructive" onClick={() => openPaymentDialog(schedule)}>
                            <DollarSign className="mr-1 h-4 w-4" />
                            Collect Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Payments Tab */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.receipt_no}</TableCell>
                      <TableCell>{payment.customer_name}</TableCell>
                      <TableCell>
                        <div>
                          <div>{payment.product_name}</div>
                          <div className="text-xs text-muted-foreground">{payment.project_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDateDMY(payment.payment_date)}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatAmount(payment.amount)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {payment.payment_method === 'cash' && <Banknote className="inline h-4 w-4 mr-1" />}
                        {payment.payment_method === 'cheque' && <CreditCard className="inline h-4 w-4 mr-1" />}
                        {payment.payment_method === 'bank_transfer' && <Building2 className="inline h-4 w-4 mr-1" />}
                        {payment.payment_method.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          payment.status === 'received' || payment.status === 'cleared' 
                            ? 'bg-green-100 text-green-800' 
                            : payment.status === 'bounced' 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handlePrintExistingReceipt(payment.id)}
                          title="Print Receipt"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Standalone Record Payment Dialog */}
      <Dialog open={standaloneDialogOpen} onOpenChange={setStandaloneDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a payment for any booking</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitStandalonePayment} className="space-y-4">
            {/* Booking Selection */}
            <div className="space-y-2">
              <Label>Booking *</Label>
              <Select value={selectedSaleId} onValueChange={handleStandaloneSaleChange} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select booking" />
                </SelectTrigger>
                <SelectContent>
                  {allSales.map((sale: any) => (
                    <SelectItem key={sale.id} value={String(sale.id)}>
                      {sale.sale_no} — {sale.customer_name} ({sale.product_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule Selection */}
            {saleSchedules.length > 0 && (
              <div className="space-y-2">
                <Label>Payment Schedule (optional — links payment to a schedule)</Label>
                <Select
                  value={paymentForm.scheduleId || "none"}
                  onValueChange={(v) => {
                    const scheduleId = v === "none" ? "" : v
                    const sch = saleSchedules.find((s: any) => String(s.id) === scheduleId)
                    setPaymentForm(prev => ({
                      ...prev,
                      scheduleId,
                      amount: sch ? String(sch.amount - (sch.paid_amount || 0)) : prev.amount,
                    }))
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger><SelectValue placeholder="Select schedule (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- No specific schedule --</SelectItem>
                    {saleSchedules.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.payment_label || s.schedule_type} — Due {formatDateDMY(s.due_date)} — Balance: {s.amount - (s.paid_amount || 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number" step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                required disabled={isSubmitting}
              />
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label>Payment Date *</Label>
              <DateField
                value={paymentForm.paymentDate}
                onChange={(v) => setPaymentForm({ ...paymentForm, paymentDate: v })}
                required disabled={isSubmitting}
              />
              {paymentForm.paymentDate && (
                <p className="text-xs text-muted-foreground">{formatDateDMY(paymentForm.paymentDate)}</p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={paymentForm.paymentMethod} onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentMethod: v })} disabled={isSubmitting}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Deposit To */}
            <div className="space-y-2">
              <Label>Deposit To</Label>
              <Select value={paymentForm.bankCashId} onValueChange={(v) => setPaymentForm({ ...paymentForm, bankCashId: v })} disabled={isSubmitting}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((acc: any) => (
                    <SelectItem key={acc.id} value={String(acc.id)}>{acc.account_title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cheque Details */}
            {paymentForm.paymentMethod === 'cheque' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label>Cheque Number *</Label>
                  <Input value={paymentForm.chequeNumber} onChange={(e) => setPaymentForm({ ...paymentForm, chequeNumber: e.target.value })} required disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label>Cheque Date *</Label>
                  <DateField value={paymentForm.chequeDate} onChange={(v) => setPaymentForm({ ...paymentForm, chequeDate: v })} required disabled={isSubmitting} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Bank Name</Label>
                  <Input value={paymentForm.chequeBank} onChange={(e) => setPaymentForm({ ...paymentForm, chequeBank: e.target.value })} placeholder="Bank name" disabled={isSubmitting} />
                </div>
              </div>
            )}

            {/* Bank Transfer Reference */}
            {(paymentForm.paymentMethod === 'bank_transfer' || paymentForm.paymentMethod === 'online') && (
              <div className="space-y-2">
                <Label>Transaction Reference</Label>
                <Input value={paymentForm.transactionReference} onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })} placeholder="Transaction ID / reference" disabled={isSubmitting} />
              </div>
            )}

            {/* Remarks */}
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={paymentForm.remarks} onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })} rows={2} disabled={isSubmitting} />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setStandaloneDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                <DollarSign className="mr-2 h-4 w-4" />
                {isSubmitting ? "Processing..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Collection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Collect Payment</DialogTitle>
            <DialogDescription>
              {selectedSchedule && (
                <span>
                  Collecting from {selectedSchedule.customer_name} for {selectedSchedule.product_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPayment} className="space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount to Collect *</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                required
                disabled={isSubmitting}
                className="text-lg font-bold"
              />
              {selectedSchedule && (
                <p className="text-xs text-muted-foreground">
                  Balance due: {formatAmount(selectedSchedule.amount - selectedSchedule.paid_amount)}
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label>Payment Date *</Label>
              <DateField
                value={paymentForm.paymentDate}
                onChange={(v) => setPaymentForm({ ...paymentForm, paymentDate: v })}
                required
                disabled={isSubmitting}
              />
              {paymentForm.paymentDate && (
                <p className="text-xs text-muted-foreground">{formatDateDMY(paymentForm.paymentDate)}</p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select
                value={paymentForm.paymentMethod}
                onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethod: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center">
                      <Banknote className="mr-2 h-4 w-4" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="cheque">
                    <div className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Cheque
                    </div>
                  </SelectItem>
                  <SelectItem value="bank_transfer">
                    <div className="flex items-center">
                      <Building2 className="mr-2 h-4 w-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bank Account */}
            <div className="space-y-2">
              <Label>Deposit To</Label>
              <Select
                value={paymentForm.bankCashId}
                onValueChange={(value) => setPaymentForm({ ...paymentForm, bankCashId: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank/cash account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.account_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cheque Details */}
            {paymentForm.paymentMethod === 'cheque' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label>Cheque Number *</Label>
                  <Input
                    value={paymentForm.chequeNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, chequeNumber: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cheque Date *</Label>
                  <DateField
                    value={paymentForm.chequeDate}
                    onChange={(v) => setPaymentForm({ ...paymentForm, chequeDate: v })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={paymentForm.chequeBank}
                    onChange={(e) => setPaymentForm({ ...paymentForm, chequeBank: e.target.value })}
                    placeholder="Enter bank name"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            {/* Bank Transfer Details */}
            {paymentForm.paymentMethod === 'bank_transfer' && (
              <div className="space-y-2">
                <Label>Transaction Reference</Label>
                <Input
                  value={paymentForm.transactionReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                  placeholder="Enter transaction ID/reference"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Remarks */}
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={paymentForm.remarks}
                onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            {/* SMS Notification */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendSMS"
                checked={paymentForm.sendSMS}
                onChange={(e) => setPaymentForm({ ...paymentForm, sendSMS: e.target.checked })}
                disabled={isSubmitting}
                className="h-4 w-4"
              />
              <Label htmlFor="sendSMS" className="text-sm">
                Send SMS notification to customer
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <DollarSign className="mr-2 h-4 w-4" />
                {isSubmitting ? "Processing..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Print Component (hidden div for printing) */}
      <div id="print-receipt-content" style={{ display: 'none' }}>
        {printData && (
          <CustomerReceipt
            receiptNumber={printData.receipt_no}
            date={formatDateDMY(printData.payment_date)}
            customerName={printData.customer_name}
            customerAddress={printData.customer_address || ''}
            customerPhone={printData.customer_phone || ''}
            amount={printData.amount}
            amountInWords={amountToWordsBDT(Number(printData.amount) || 0)}
            description={
              printData.product_name
                ? `Payment for ${printData.product_name}${printData.unit_no ? ` - Unit ${printData.unit_no}` : ''}`
                : `Payment against booking ${printData.sale_no || ''}`.trim()
            }
            paymentMethod={normalizePaymentMethod(String(printData.payment_method || '').replace(/_/g, ' '))}
            paymentType="Installment"
            projectName={printData.project_name}
            unitFlatInfo={
              [
                printData.unit_no ? `Unit ${printData.unit_no}` : '',
                printData.floor_no ? `Floor ${printData.floor_no}` : '',
              ]
                .filter(Boolean)
                .join(', ') || undefined
            }
            projectAddress={printData.project_address || ''}
            chequeNumber={printData.cheque_number}
            bankName={printData.cheque_bank}
            chequeDate={printData.cheque_date ? formatDateDMY(printData.cheque_date) : undefined}
            receivedBy="Sales Department"
            companyName={companySettings?.company_name || 'Company Name'}
            companyAddress={companySettings?.address || 'Company Address'}
            companyPhone={companySettings?.phone || ''}
            companyEmail={companySettings?.email || ''}
            companyLogo={companySettings?.company_logo}
            footerImage={companySettings?.footer_image}
          />
        )}
      </div>
    </div>
  )
}
