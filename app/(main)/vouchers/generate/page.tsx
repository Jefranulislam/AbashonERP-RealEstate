// app/(main)/vouchers/generate/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { formatDateDMY } from "@/lib/utils"
import { CustomerReceipt, VendorPayment, JournalVoucher } from '@/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { printDocument } from '@/lib/pdf-utils'
import { amountToWordsBDT } from '@/lib/payment-utils'

interface VoucherData {
  id: string
  voucher_no: string
  voucher_type: 'Credit' | 'Debit'
  amount: number
  date: string
  vendor_name?: string
  customer_name?: string
  particulars: string
  payment_method: string
  project_name?: string
}

export default function GenerateVoucherPage() {
  const [vouchers, setVouchers] = useState<VoucherData[]>([])
  const [selectedVoucherId, setSelectedVoucherId] = useState('')
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null)
  const [documentType, setDocumentType] = useState<'customer-receipt' | 'vendor-payment' | 'journal-voucher'>('customer-receipt')

  useEffect(() => {
    fetchVouchers()
    
    // Check URL parameters for document type
    const params = new URLSearchParams(window.location.search)
    const urlType = params.get('type')
    if (urlType && ['customer-receipt', 'vendor-payment', 'journal-voucher'].includes(urlType)) {
      setDocumentType(urlType as any)
    }
  }, [])

  const fetchVouchers = async () => {
    try {
      const response = await fetch('/api/vouchers')
      const data = await response.json()
      setVouchers(data)
    } catch (error) {
      console.error('Error fetching vouchers:', error)
    }
  }

  const handleVoucherSelect = (voucherId: string) => {
    const voucher = vouchers.find(v => v.id === voucherId)
    setSelectedVoucher(voucher || null)
    setSelectedVoucherId(voucherId)
  }

  const handlePrintDocument = () => {
    printDocument('voucher-document-content')
  }

  const convertToAmountWords = (amount: number): string => {
    return amountToWordsBDT(amount)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Generate Professional Documents</h1>
        <p className="text-muted-foreground">
          Create customer receipts, vendor payments, and internal vouchers
        </p>
      </div>

      {/* Selection Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Document Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Select Voucher:</label>
              <Select value={selectedVoucherId} onValueChange={handleVoucherSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a voucher..." />
                </SelectTrigger>
                <SelectContent>
                  {vouchers.map((voucher) => (
                    <SelectItem key={voucher.id} value={voucher.id}>
                      {voucher.voucher_no} - {voucher.vendor_name || voucher.customer_name} - ৳{voucher.amount}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Document Type:</label>
              <Select value={documentType} onValueChange={(value: any) => setDocumentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer-receipt">Customer Receipt (External)</SelectItem>
                  <SelectItem value="vendor-payment">Vendor Payment (External)</SelectItem>
                  <SelectItem value="journal-voucher">Journal Voucher (Internal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedVoucher && (
            <div className="flex gap-2">
              <Button onClick={handlePrintDocument} className="flex-1">
                🖨️ Print Document
              </Button>
              <Button variant="outline" onClick={() => window.open('#', '_blank')}>
                📄 Preview PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview */}
      {selectedVoucher && (
        <div id="voucher-document-content" className="bg-white">
          {documentType === 'customer-receipt' && (
            <CustomerReceipt
              receiptNumber={selectedVoucher.voucher_no}
              date={formatDateDMY(selectedVoucher.date)}
              customerName={selectedVoucher.customer_name || selectedVoucher.vendor_name || 'Customer'}
              amount={selectedVoucher.amount}
              amountInWords={convertToAmountWords(selectedVoucher.amount)}
              description={selectedVoucher.particulars}
              paymentMethod={selectedVoucher.payment_method as any}
              receivedBy="System Administrator"
              companyName="Kuddus Holdings Ltd"
              companyAddress="Your Company Address"
            />
          )}

          {documentType === 'vendor-payment' && (
            <VendorPayment
              paymentNumber={selectedVoucher.voucher_no}
              date={formatDateDMY(selectedVoucher.date)}
              vendorName={selectedVoucher.vendor_name || 'Vendor'}
              amount={selectedVoucher.amount}
              amountInWords={convertToAmountWords(selectedVoucher.amount)}
              description={selectedVoucher.particulars}
              paymentMethod={selectedVoucher.payment_method as any}
              authorizedBy="System Administrator"
              companyName="Kuddus Holdings Ltd"
              companyAddress="Your Company Address"
            />
          )}

          {documentType === 'journal-voucher' && (
            <JournalVoucher
              voucherNumber={selectedVoucher.voucher_no}
              date={formatDateDMY(selectedVoucher.date)}
              entries={[
                {
                  accountName: selectedVoucher.voucher_type === 'Credit' ? 'Bank Account' : 'Expense Account',
                  accountType: selectedVoucher.voucher_type === 'Credit' ? 'Asset' : 'Expense',
                  debitAmount: selectedVoucher.voucher_type === 'Debit' ? selectedVoucher.amount : undefined,
                  creditAmount: selectedVoucher.voucher_type === 'Credit' ? selectedVoucher.amount : undefined,
                  narration: selectedVoucher.particulars
                }
              ]}
              narration={selectedVoucher.particulars}
              preparedBy="System Administrator"
              companyName="Kuddus Holdings Ltd"
              companyAddress="Your Company Address"
            />
          )}
        </div>
      )}
    </div>
  )
}