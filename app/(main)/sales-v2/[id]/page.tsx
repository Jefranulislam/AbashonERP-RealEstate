"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Edit,
  Printer,
  DollarSign,
  Calendar,
  User,
  Building2,
  Home,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Save,
  X,
  Loader2,
  ScrollText,
} from "lucide-react"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/hooks/use-currency"
import { BookingReceiptPDF } from "@/components/pdf/booking-receipt-pdf"

// Default terms & conditions
const DEFAULT_TERMS = `This booking is subject to the terms mentioned in the final agreement.
Down payment must be made within 30 days of booking.
Monthly installments will start from the 2nd month after booking.
Delay in payment may attract late fee as per company policy.
Registration and other government charges are extra.
Handover date is tentative and subject to construction progress.`

// Sale status badges
const statusColors: Record<string, string> = {
  'booked': 'bg-blue-100 text-blue-800',
  'agreement_signed': 'bg-purple-100 text-purple-800',
  'in_progress': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-green-100 text-green-800',
  'handed_over': 'bg-emerald-100 text-emerald-800',
  'cancelled': 'bg-red-100 text-red-800',
}

const scheduleStatusColors: Record<string, string> = {
  'paid': 'bg-green-100 text-green-800',
  'pending': 'bg-yellow-100 text-yellow-800',
  'overdue': 'bg-red-100 text-red-800',
  'partial': 'bg-orange-100 text-orange-800',
}

export default function SaleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { formatAmount } = useCurrency()
  const printRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [saleDetails, setSaleDetails] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>({})
  
  // Terms & Conditions editing state
  const [editingTerms, setEditingTerms] = useState(false)
  const [termsText, setTermsText] = useState("")
  const [savingTerms, setSavingTerms] = useState(false)

  const saleId = params.id as string

  useEffect(() => {
    if (saleId) {
      fetchSaleDetails()
      fetchSettings()
    }
  }, [saleId])

  const fetchSaleDetails = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/sales-v2/${saleId}`)
      setSaleDetails(response.data)
      // Set terms text (use default if not set)
      setTermsText(response.data.sale?.terms_conditions || DEFAULT_TERMS)
    } catch (error: any) {
      console.error("Error fetching sale details:", error)
      toast({
        title: "Error",
        description: "Failed to load booking details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTerms = async () => {
    try {
      setSavingTerms(true)
      await axios.put(`/api/sales-v2/${saleId}`, {
        termsConditions: termsText
      })
      setSaleDetails((prev: any) => ({
        ...prev,
        sale: { ...prev.sale, terms_conditions: termsText }
      }))
      setEditingTerms(false)
      toast({
        title: "Success",
        description: "Terms & Conditions saved successfully",
      })
    } catch (error) {
      console.error("Error saving terms:", error)
      toast({
        title: "Error",
        description: "Failed to save terms & conditions",
        variant: "destructive",
      })
    } finally {
      setSavingTerms(false)
    }
  }

  const handleCancelEditTerms = () => {
    setTermsText(saleDetails?.sale?.terms_conditions || DEFAULT_TERMS)
    setEditingTerms(false)
  }

  const handleResetToDefault = () => {
    setTermsText(DEFAULT_TERMS)
  }

  const fetchSettings = async () => {
    try {
      const response = await axios.get("/api/settings")
      setCompanySettings(response.data.settings || {})
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Booking-${saleDetails?.sale?.sale_no || 'Receipt'}`,
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (!saleDetails?.sale) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <XCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Booking Not Found</h2>
        <Button onClick={() => router.push("/sales-v2")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Button>
      </div>
    )
  }

  const { sale, schedules, payments, activities } = saleDetails

  // Calculate totals
  const totalScheduled = schedules?.reduce((sum: number, s: any) => sum + (s.amount || 0), 0) || 0
  const totalPaid = payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0
  const outstanding = sale.net_price - totalPaid
  const overdueSchedules = schedules?.filter((s: any) => s.status === 'overdue') || []
  const paidSchedules = schedules?.filter((s: any) => s.status === 'paid') || []
  const pendingSchedules = schedules?.filter((s: any) => s.status === 'pending') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/sales-v2")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{sale.sale_no}</h1>
              <Badge className={statusColors[sale.sale_status] || 'bg-gray-100'}>
                {sale.sale_status?.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-muted-foreground">Booking created on {formatDate(sale.booking_date)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handlePrint()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={() => router.push(`/sales-v2/new?edit=${saleId}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(sale.net_price)}</div>
            <p className="text-xs text-muted-foreground">
              Base: {formatAmount(sale.base_price)} | Discount: {formatAmount(sale.discount_amount || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatAmount(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">{payments?.length || 0} payments received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${outstanding > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {formatAmount(outstanding)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paidSchedules.length}/{schedules?.length || 0} installments paid
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueSchedules.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {overdueSchedules.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {overdueSchedules.length > 0 
                ? `${formatAmount(overdueSchedules.reduce((s: number, o: any) => s + o.amount - o.paid_amount, 0))} overdue`
                : 'No overdue payments'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Customer & Property Info */}
        <div className="space-y-6">
          {/* Customer Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-semibold">{sale.customer_name}</p>
                {sale.father_or_husband_name && (
                  <p className="text-sm text-muted-foreground">S/O or W/O: {sale.father_or_husband_name}</p>
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                {sale.customer_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{sale.customer_phone}</span>
                  </div>
                )}
                {sale.customer_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{sale.customer_email}</span>
                  </div>
                )}
                {sale.customer_address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{sale.customer_address}</span>
                  </div>
                )}
                {sale.customer_nid && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>NID: {sale.customer_nid}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Property Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-semibold">{sale.project_name}</p>
                {sale.project_address && (
                  <p className="text-sm text-muted-foreground">{sale.project_address}</p>
                )}
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Unit</p>
                  <p className="font-medium">{sale.product_name}</p>
                </div>
                {sale.unit_no && (
                  <div>
                    <p className="text-muted-foreground">Unit No</p>
                    <p className="font-medium">{sale.unit_no}</p>
                  </div>
                )}
                {sale.floor_no && (
                  <div>
                    <p className="text-muted-foreground">Floor</p>
                    <p className="font-medium">{sale.floor_no}</p>
                  </div>
                )}
                {sale.size_sqft && (
                  <div>
                    <p className="text-muted-foreground">Size</p>
                    <p className="font-medium">{sale.size_sqft} sqft</p>
                  </div>
                )}
                {sale.unit_type && (
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{sale.unit_type}</p>
                  </div>
                )}
                {sale.bedrooms && (
                  <div>
                    <p className="text-muted-foreground">Bedrooms</p>
                    <p className="font-medium">{sale.bedrooms}</p>
                  </div>
                )}
                {sale.bathrooms && (
                  <div>
                    <p className="text-muted-foreground">Bathrooms</p>
                    <p className="font-medium">{sale.bathrooms}</p>
                  </div>
                )}
                {sale.facing && (
                  <div>
                    <p className="text-muted-foreground">Facing</p>
                    <p className="font-medium">{sale.facing}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Nominee Card */}
          {sale.nominee_name && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Nominee Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{sale.nominee_name}</p>
                  </div>
                  {sale.nominee_relation && (
                    <div>
                      <p className="text-muted-foreground">Relation</p>
                      <p className="font-medium">{sale.nominee_relation}</p>
                    </div>
                  )}
                  {sale.nominee_phone && (
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{sale.nominee_phone}</p>
                    </div>
                  )}
                  {sale.nominee_nid && (
                    <div>
                      <p className="text-muted-foreground">NID</p>
                      <p className="font-medium">{sale.nominee_nid}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Financial Info & Tabs */}
        <div className="md:col-span-2 space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Base Price</p>
                  <p className="font-semibold text-lg">{formatAmount(sale.base_price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Discount ({sale.discount_percent || 0}%)</p>
                  <p className="font-semibold text-lg text-red-600">-{formatAmount(sale.discount_amount || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Utility Charge</p>
                  <p className="font-semibold text-lg">{formatAmount(sale.utility_charge || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Net Price</p>
                  <p className="font-semibold text-lg">{formatAmount(sale.net_price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Booking Amount</p>
                  <p className="font-semibold">{formatAmount(sale.booking_amount || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Down Payment</p>
                  <p className="font-semibold">{formatAmount(sale.down_payment || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Seller</p>
                  <p className="font-semibold">{sale.seller_name || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expected Handover</p>
                  <p className="font-semibold">{formatDate(sale.expected_handover_date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Schedules, Payments, Activity */}
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="schedule">
                <TabsList className="mb-4">
                  <TabsTrigger value="schedule">Payment Schedule ({schedules?.length || 0})</TabsTrigger>
                  <TabsTrigger value="payments">Payments ({payments?.length || 0})</TabsTrigger>
                  <TabsTrigger value="activity">Activity Log</TabsTrigger>
                </TabsList>

                <TabsContent value="schedule">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedules?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No payment schedule defined
                            </TableCell>
                          </TableRow>
                        ) : (
                          schedules?.map((schedule: any) => (
                            <TableRow key={schedule.id}>
                              <TableCell className="font-medium capitalize">
                                {schedule.schedule_type?.replace('_', ' ')}
                                {schedule.installment_no > 0 && ` #${schedule.installment_no}`}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  {formatDate(schedule.due_date)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{formatAmount(schedule.amount)}</TableCell>
                              <TableCell className="text-right text-green-600">
                                {formatAmount(schedule.paid_amount || 0)}
                              </TableCell>
                              <TableCell className="text-right text-orange-600">
                                {formatAmount(schedule.amount - (schedule.paid_amount || 0))}
                              </TableCell>
                              <TableCell>
                                <Badge className={scheduleStatusColors[schedule.status] || 'bg-gray-100'}>
                                  {schedule.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="payments">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt No</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No payments recorded yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          payments?.map((payment: any) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-medium">{payment.receipt_no}</TableCell>
                              <TableCell>{formatDate(payment.payment_date)}</TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                {formatAmount(payment.amount)}
                              </TableCell>
                              <TableCell className="capitalize">{payment.payment_method}</TableCell>
                              <TableCell>{payment.bank_account_name || "-"}</TableCell>
                              <TableCell>
                                <Badge className={
                                  payment.status === 'received' ? 'bg-green-100 text-green-800' :
                                  payment.status === 'bounced' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }>
                                  {payment.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="activity">
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {activities?.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No activity recorded</p>
                    ) : (
                      activities?.map((activity: any) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium capitalize">
                                {activity.activity_type?.replace('_', ' ')}
                              </p>
                              {activity.performed_by_name && (
                                <span className="text-xs text-muted-foreground">
                                  by {activity.performed_by_name}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(activity.created_at)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Notes */}
          {sale.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{sale.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Terms & Conditions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5" />
                  Terms & Conditions
                </CardTitle>
                {!editingTerms && (
                  <Button variant="outline" size="sm" onClick={() => setEditingTerms(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
              <CardDescription>
                These terms will appear on the printed receipt
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editingTerms ? (
                <div className="space-y-4">
                  <Textarea
                    value={termsText}
                    onChange={(e) => setTermsText(e.target.value)}
                    rows={10}
                    placeholder="Enter each term on a new line..."
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Tip: Write each term on a separate line. They will appear as bullet points on the receipt.
                  </p>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={handleResetToDefault}>
                      Reset to Default
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleCancelEditTerms} disabled={savingTerms}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSaveTerms} disabled={savingTerms}>
                        {savingTerms ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                        ) : (
                          <><Save className="h-4 w-4 mr-2" />Save Terms</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {(termsText || DEFAULT_TERMS).split('\n').filter((line: string) => line.trim()).map((term: string, index: number) => (
                    <li key={index}>{term.trim()}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Template (off-screen) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={printRef}>
          <BookingReceiptPDF
            booking={sale}
            companyName={companySettings.company_name}
            companyAddress={companySettings.company_address}
            currencySymbol={companySettings.currency_symbol}
          />
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
