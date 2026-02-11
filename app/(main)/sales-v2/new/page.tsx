"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { printDocument } from "@/lib/pdf-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, Save, Printer, Home, Building2, DollarSign, CreditCard, User } from "lucide-react"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/hooks/use-currency"
import { BookingStepper } from "@/components/booking-stepper"
import { DynamicPaymentPlan, type PaymentScheduleItem } from "@/components/dynamic-payment-plan"
import { SaleAdditionalItems, type AdditionalItem } from "@/components/sale-additional-items"
import { BookingReceiptPDF } from "@/components/pdf/booking-receipt-pdf"

// Define steps
const STEPS = [
  { id: 1, title: "Customer & Project", description: "Select customer and unit" },
  { id: 2, title: "Pricing", description: "Set price and discount" },
  { id: 3, title: "Additional Items", description: "Parking, Gas Line, etc." },
  { id: 4, title: "Payment Plan", description: "Define installments" },
  { id: 5, title: "Nominee & Notes", description: "Final details" },
]

export default function NewBookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const { toast } = useToast()
  const { formatAmount } = useCurrency()

  // Current step
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [printData, setPrintData] = useState<any>(null)

  // Master data
  const [customers, setCustomers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [allProjectProducts, setAllProjectProducts] = useState<any[]>([])
  const [companySettings, setCompanySettings] = useState<any>({})

  // Payment plan & additional items
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentScheduleItem[]>([])
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([])

  // Form data
  const [formData, setFormData] = useState({
    customerId: "",
    sellerId: "",
    projectId: "",
    productId: "",
    saleDate: "",
    bookingDate: "",
    basePrice: "",
    utilityCharge: "",
    discountPercent: "",
    discountAmount: "",
    bookingAmount: "",
    downPayment: "",
    paymentPlan: "custom",
    installmentCount: "12",
    expectedHandoverDate: "",
    nomineeName: "",
    nomineePhone: "",
    nomineeRelation: "",
    nomineeNid: "",
    referenceBy: "",
    notes: "",
  })

  // Set dates on client-side
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    setFormData(prev => ({
      ...prev,
      saleDate: prev.saleDate || today,
      bookingDate: prev.bookingDate || today,
    }))
  }, [])

  // Fetch master data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [customersRes, projectsRes, employeesRes, settingsRes] = await Promise.all([
          axios.get("/api/customers"),
          axios.get("/api/projects"),
          axios.get("/api/employees"),
          axios.get("/api/settings"),
        ])

        setCustomers(customersRes.data.customers)
        setProjects(projectsRes.data.projects)
        setEmployees(employeesRes.data.employees)
        setCompanySettings(settingsRes.data.settings || {})
      } catch (error) {
        console.error("Error fetching master data:", error)
      }
    }
    fetchMasterData()
  }, [])

  // Fetch products when project changes
  useEffect(() => {
    const fetchProducts = async (projectId: string) => {
      try {
        const [availableRes, allRes] = await Promise.all([
          axios.get(`/api/products?projectId=${projectId}&status=available`),
          axios.get(`/api/products?projectId=${projectId}`),
        ])
        setProducts(availableRes.data.products)
        setAllProjectProducts(allRes.data.products || [])
      } catch (error) {
        console.error("Error fetching products:", error)
      }
    }

    if (formData.projectId) {
      fetchProducts(formData.projectId)
    }
  }, [formData.projectId])

  // Load existing sale for editing
  useEffect(() => {
    const loadSale = async () => {
      if (!editId) return
      try {
        const response = await axios.get(`/api/sales-v2/${editId}`)
        const sale = response.data.sale
        setFormData({
          customerId: String(sale.customer_id || ""),
          sellerId: String(sale.seller_id || ""),
          projectId: String(sale.project_id || ""),
          productId: String(sale.product_id || ""),
          saleDate: sale.sale_date?.split("T")[0] || "",
          bookingDate: sale.booking_date?.split("T")[0] || "",
          basePrice: String(sale.base_price || ""),
          utilityCharge: String(sale.utility_charge || ""),
          discountPercent: String(sale.discount_percent || ""),
          discountAmount: String(sale.discount_amount || ""),
          bookingAmount: String(sale.booking_amount || ""),
          downPayment: String(sale.down_payment || ""),
          paymentPlan: sale.payment_plan || "custom",
          installmentCount: String(sale.installment_count || "12"),
          expectedHandoverDate: sale.expected_handover_date?.split("T")[0] || "",
          nomineeName: sale.nominee_name || "",
          nomineePhone: sale.nominee_phone || "",
          nomineeRelation: sale.nominee_relation || "",
          nomineeNid: sale.nominee_nid || "",
          referenceBy: sale.reference_by || "",
          notes: sale.notes || "",
        })
      } catch (error) {
        console.error("Error loading sale:", error)
        toast({
          title: "Error",
          description: "Failed to load booking data",
          variant: "destructive",
        })
      }
    }
    loadSale()
  }, [editId, toast])

  // Calculate discount amount when price/percent changes
  useEffect(() => {
    const basePrice = parseFloat(formData.basePrice) || 0
    const utilityCharge = parseFloat(formData.utilityCharge) || 0
    const discountPercent = parseFloat(formData.discountPercent) || 0
    const grossPrice = basePrice + utilityCharge
    const discountAmount = grossPrice * (discountPercent / 100)
    setFormData(prev => ({ ...prev, discountAmount: discountAmount.toFixed(2) }))
  }, [formData.basePrice, formData.utilityCharge, formData.discountPercent])

  // Auto-fill product price
  const handleProductChange = (productId: string) => {
    const product = products.find(p => String(p.id) === productId)
    if (product) {
      setFormData(prev => ({
        ...prev,
        productId,
        basePrice: String(product.base_price || product.price || ''),
        utilityCharge: String(product.utility_charge || '0'),
      }))
    } else {
      setFormData(prev => ({ ...prev, productId }))
    }
  }

  // Calculate net price
  const calculateNetPrice = () => {
    const basePrice = parseFloat(formData.basePrice) || 0
    const utilityCharge = parseFloat(formData.utilityCharge) || 0
    const discountAmount = parseFloat(formData.discountAmount) || 0
    const additionalTotal = additionalItems
      .filter(i => i.selected)
      .reduce((sum, i) => sum + (parseFloat(i.netPrice) || 0), 0)
    return basePrice + utilityCharge + additionalTotal - discountAmount
  }

  // Navigation
  const goToNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= STEPS.length) {
      setCurrentStep(step)
    }
  }

  // Validate current step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.customerId) {
          toast({ title: "Required", description: "Please select a customer", variant: "destructive" })
          return false
        }
        if (!formData.projectId) {
          toast({ title: "Required", description: "Please select a project", variant: "destructive" })
          return false
        }
        if (!formData.productId) {
          toast({ title: "Required", description: "Please select a unit/product", variant: "destructive" })
          return false
        }
        return true
      case 2:
        if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
          toast({ title: "Required", description: "Please enter the base price", variant: "destructive" })
          return false
        }
        if (!formData.bookingAmount || parseFloat(formData.bookingAmount) <= 0) {
          toast({ title: "Required", description: "Please enter the booking amount", variant: "destructive" })
          return false
        }
        return true
      default:
        return true
    }
  }

  // Handle next with validation
  const handleNext = () => {
    if (validateStep(currentStep)) {
      goToNextStep()
    }
  }

  // Submit booking
  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      toast({ title: "Error", description: "Please complete all required fields", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const additionalItemsTotal = additionalItems
        .filter(i => i.selected)
        .reduce((sum, i) => sum + (parseFloat(i.netPrice) || 0), 0)

      const submitData = {
        ...formData,
        additionalItems: additionalItems.filter(i => i.selected),
        paymentSchedules: paymentSchedules,
        additionalItemsTotal,
      }

      let response
      if (editId) {
        response = await axios.put(`/api/sales-v2/${editId}`, submitData)
        toast({
          title: "Success",
          description: "Booking updated successfully",
        })
        // Redirect after update
        setTimeout(() => {
          router.push("/sales-v2")
        }, 1500)
      } else {
        response = await axios.post("/api/sales-v2", submitData)
        toast({
          title: "Booking Created!",
          description: `Booking No: ${response.data.saleNo}. You can now print the receipt.`,
        })

        if (response.data.sale) {
          setPrintData(response.data.sale)
        }
        // Don't redirect - let user print the receipt
      }
    } catch (error: any) {
      console.error("Error saving booking:", error)
      const errorData = error.response?.data
      const errorMsg = errorData?.details || errorData?.error || "Failed to save booking"
      const errorStep = errorData?.step ? ` (at step: ${errorData.step})` : ""
      toast({
        title: "Error",
        description: `${errorMsg}${errorStep}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrint = () => {
    printDocument('print-booking-content')
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Customer & Project Selection
              </CardTitle>
              <CardDescription>Select the customer and the unit they want to book</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Selection */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>
                          {customer.customer_name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sales Person</Label>
                  <Select
                    value={formData.sellerId}
                    onValueChange={(value) => setFormData({ ...formData, sellerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select seller" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={String(emp.id)}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Project Selection */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Project *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value, productId: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit/Flat *</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={handleProductChange}
                    disabled={!formData.projectId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.projectId ? "Select unit" : "Select project first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={String(product.id)}>
                          {product.product_name} - {product.unit_no || 'N/A'} ({formatAmount(product.price || product.base_price || 0)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Booking Date</Label>
                  <Input
                    type="date"
                    value={formData.bookingDate}
                    onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value, saleDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Handover Date</Label>
                  <Input
                    type="date"
                    value={formData.expectedHandoverDate}
                    onChange={(e) => setFormData({ ...formData, expectedHandoverDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Selected Unit Summary */}
              {formData.productId && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Selected Unit Details</h4>
                  {(() => {
                    const product = products.find(p => String(p.id) === formData.productId)
                    if (!product) return null
                    return (
                      <div className="grid gap-2 text-sm md:grid-cols-3">
                        <div><span className="text-muted-foreground">Unit:</span> {product.product_name}</div>
                        <div><span className="text-muted-foreground">Floor:</span> {product.floor_no || 'N/A'}</div>
                        <div><span className="text-muted-foreground">Size:</span> {product.size_sqft || product.size} sqft</div>
                        <div><span className="text-muted-foreground">Type:</span> {product.unit_type || 'N/A'}</div>
                        <div><span className="text-muted-foreground">Price:</span> {formatAmount(product.price || product.base_price || 0)}</div>
                        <div><span className="text-muted-foreground">Status:</span> {product.status}</div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing & Discount
              </CardTitle>
              <CardDescription>Set the price, utility charges, and any discounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pricing */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Base Price (Flat) *</Label>
                  <Input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Utility Charge</Label>
                  <Input
                    type="number"
                    value={formData.utilityCharge}
                    onChange={(e) => setFormData({ ...formData, utilityCharge: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gross Price</Label>
                  <Input
                    type="text"
                    value={formatAmount((parseFloat(formData.basePrice) || 0) + (parseFloat(formData.utilityCharge) || 0))}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    value={formData.discountPercent}
                    onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount Amount</Label>
                  <Input
                    type="number"
                    value={formData.discountAmount}
                    onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Net Price (After Discount)</Label>
                  <Input
                    type="text"
                    value={formatAmount(
                      (parseFloat(formData.basePrice) || 0) + 
                      (parseFloat(formData.utilityCharge) || 0) - 
                      (parseFloat(formData.discountAmount) || 0)
                    )}
                    readOnly
                    className="bg-muted font-semibold"
                  />
                </div>
              </div>

              {/* Booking & Down Payment */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Booking Amount *</Label>
                  <Input
                    type="number"
                    value={formData.bookingAmount}
                    onChange={(e) => setFormData({ ...formData, bookingAmount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Down Payment</Label>
                  <Input
                    type="number"
                    value={formData.downPayment}
                    onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="font-semibold mb-3">Price Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span>{formatAmount(parseFloat(formData.basePrice) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utility Charge:</span>
                    <span>{formatAmount(parseFloat(formData.utilityCharge) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>- {formatAmount(parseFloat(formData.discountAmount) || 0)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Net Price:</span>
                    <span className="text-primary">
                      {formatAmount(
                        (parseFloat(formData.basePrice) || 0) + 
                        (parseFloat(formData.utilityCharge) || 0) - 
                        (parseFloat(formData.discountAmount) || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Additional Items
              </CardTitle>
              <CardDescription>Select additional items like Parking, Gas Line, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <SaleAdditionalItems
                projectId={formData.projectId}
                products={allProjectProducts}
                onItemsChange={setAdditionalItems}
                initialItems={additionalItems}
              />
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Plan
              </CardTitle>
              <CardDescription>Define the payment schedule and installments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Payment Plan Type</Label>
                <Select
                  value={formData.paymentPlan}
                  onValueChange={(value) => setFormData({ ...formData, paymentPlan: value })}
                >
                  <SelectTrigger className="w-[200px] mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Plan</SelectItem>
                    <SelectItem value="installment">Fixed Installments</SelectItem>
                    <SelectItem value="full">Full Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.paymentPlan === 'installment' && (
                <div className="mb-4">
                  <Label>Number of Installments</Label>
                  <Input
                    type="number"
                    value={formData.installmentCount}
                    onChange={(e) => setFormData({ ...formData, installmentCount: e.target.value })}
                    className="w-[200px] mt-2"
                    min="1"
                    max="120"
                  />
                </div>
              )}

              {formData.paymentPlan === 'custom' && (
                <DynamicPaymentPlan
                  totalAmount={calculateNetPrice()}
                  bookingAmount={formData.bookingAmount}
                  downPayment={formData.downPayment}
                  onScheduleChange={setPaymentSchedules}
                  initialSchedules={paymentSchedules}
                />
              )}

              {formData.paymentPlan === 'full' && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-center text-muted-foreground">
                    Full payment will be collected at the time of booking.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Nominee & Additional Information
              </CardTitle>
              <CardDescription>Add nominee details and any additional notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nominee Details */}
              <div>
                <h4 className="font-medium mb-3">Nominee Details</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nominee Name</Label>
                    <Input
                      value={formData.nomineeName}
                      onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                      placeholder="Enter nominee name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nominee Phone</Label>
                    <Input
                      value={formData.nomineePhone}
                      onChange={(e) => setFormData({ ...formData, nomineePhone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relation</Label>
                    <Select
                      value={formData.nomineeRelation}
                      onValueChange={(value) => setFormData({ ...formData, nomineeRelation: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nominee NID</Label>
                    <Input
                      value={formData.nomineeNid}
                      onChange={(e) => setFormData({ ...formData, nomineeNid: e.target.value })}
                      placeholder="Enter NID number"
                    />
                  </div>
                </div>
              </div>

              {/* Reference & Notes */}
              <div>
                <h4 className="font-medium mb-3">Reference & Notes</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Reference By</Label>
                    <Input
                      value={formData.referenceBy}
                      onChange={(e) => setFormData({ ...formData, referenceBy: e.target.value })}
                      placeholder="Who referred this customer?"
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes about this booking..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Final Summary */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/30 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3">Booking Summary</h4>
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>{" "}
                    {customers.find(c => String(c.id) === formData.customerId)?.customer_name || "-"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Project:</span>{" "}
                    {projects.find(p => String(p.id) === formData.projectId)?.project_name || "-"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unit:</span>{" "}
                    {products.find(p => String(p.id) === formData.productId)?.product_name || "-"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Net Price:</span>{" "}
                    <span className="font-semibold">{formatAmount(calculateNetPrice())}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Booking Amount:</span>{" "}
                    {formatAmount(parseFloat(formData.bookingAmount) || 0)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Additional Items:</span>{" "}
                    {additionalItems.filter(i => i.selected).length} items
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{editId ? "Edit Booking" : "New Booking"}</h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/sales-v2")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="container mx-auto px-4 py-6">
        <BookingStepper
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={goToStep}
        />
      </div>

      {/* Step Content */}
      <div className="container mx-auto px-4 pb-24">
        {renderStepContent()}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep === STEPS.length ? (
              <>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-w-[150px]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Saving..." : (editId ? "Update Booking" : "Create Booking")}
                </Button>
                {printData && (
                  <>
                    <Button variant="outline" onClick={() => handlePrint()}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Receipt
                    </Button>
                    <Button variant="ghost" onClick={() => router.push("/sales-v2")}>
                      Go to Sales
                    </Button>
                  </>
                )}
              </>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Print Template (hidden div for printing) */}
      {printData && (
        <div id="print-booking-content" style={{ display: 'none' }}>
          <BookingReceiptPDF
            booking={printData}
            companyName={companySettings.company_name}
            companyAddress={companySettings.company_address}
            currencySymbol={companySettings.currency_symbol}
            companyLogo={companySettings.company_logo}
            footerImage={companySettings.footer_image}
            backgroundImage={companySettings.background_image}
          />
        </div>
      )}
    </div>
  )
}
