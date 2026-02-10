"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useReactToPrint } from "react-to-print"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Printer, DollarSign, Calendar, AlertTriangle, CreditCard, Banknote, Building2 } from "lucide-react"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/hooks/use-currency"
import { MoneyReceiptPDF } from "@/components/pdf/money-receipt-pdf"

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
  project_name: string
  product_name: string
  unit_no: string
  payment_date: string
  amount: number
  payment_method: string
  cheque_number: string
  status: string
}

export default function PaymentCollectionPage() {
  const { toast } = useToast()
  const { formatAmount } = useCurrency()
  const printRef = useRef<HTMLDivElement>(null)
  
  // States
  const [dueSchedules, setDueSchedules] = useState<PaymentSchedule[]>([])
  const [overdueSchedules, setOverdueSchedules] = useState<PaymentSchedule[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<PaymentSchedule | null>(null)
  const [printData, setPrintData] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>({})
  
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
      const [dueRes, overdueRes, paymentsRes] = await Promise.all([
        axios.get("/api/sales-v2/schedules"),
        axios.get("/api/sales-v2/schedules?overdue=true"),
        axios.get("/api/sales-v2/payments"),
      ])

      setDueSchedules(dueRes.data.schedules)
      setOverdueSchedules(overdueRes.data.schedules)
      setRecentPayments(paymentsRes.data.payments?.slice(0, 20) || [])
    } catch (error) {
      console.error("Error fetching schedules:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMasterData = async () => {
    try {
      const [banksRes, settingsRes] = await Promise.all([
        axios.get("/api/finance/bank-cash"),
        axios.get("/api/settings"),
      ])

      setBankAccounts(banksRes.data.accounts || [])
      setCompanySettings(settingsRes.data.settings || {})
    } catch (error) {
      console.error("Error fetching master data:", error)
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

      fetchSchedules()
      setDialogOpen(false)
    } catch (error: any) {
      console.error("Error recording payment:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to record payment",
        variant: "destructive",
      })
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt-${printData?.receipt_no || 'Payment'}`,
  })

  // Auto-print when printData is set
  useEffect(() => {
    if (printData && printRef.current) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        handlePrint()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [printData])

  // Summary calculations
  const totalDue = dueSchedules.reduce((sum, s) => sum + (s.amount - s.paid_amount), 0)
  const totalOverdue = overdueSchedules.reduce((sum, s) => sum + (s.amount - s.paid_amount), 0)
  const todayCollection = recentPayments
    .filter(p => p.payment_date === new Date().toISOString().split("T")[0])
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Collection</h1>
        <p className="text-muted-foreground">Collect payments and manage payment schedules</p>
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
                        <TableCell>{new Date(schedule.due_date).toLocaleDateString()}</TableCell>
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
                        <TableCell>{new Date(schedule.due_date).toLocaleDateString()}</TableCell>
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
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
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
                        <Button variant="ghost" size="sm">
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
              <Input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                required
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select
                value={paymentForm.paymentMethod}
                onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethod: value })}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cheque Date *</Label>
                  <Input
                    type="date"
                    value={paymentForm.chequeDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, chequeDate: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={paymentForm.chequeBank}
                    onChange={(e) => setPaymentForm({ ...paymentForm, chequeBank: e.target.value })}
                    placeholder="Enter bank name"
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
              />
            </div>

            {/* SMS Notification */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendSMS"
                checked={paymentForm.sendSMS}
                onChange={(e) => setPaymentForm({ ...paymentForm, sendSMS: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="sendSMS" className="text-sm">
                Send SMS notification to customer
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <DollarSign className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Print Component (off-screen for react-to-print compatibility) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={printRef}>
          {printData && (
            <MoneyReceiptPDF
              receipt={printData}
              companyName={companySettings.company_name}
              companyAddress={companySettings.address}
              currencySymbol={companySettings.currency_symbol}
            />
          )}
        </div>
      </div>
    </div>
  )
}
