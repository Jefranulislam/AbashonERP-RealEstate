'use client'

import React from 'react'
import { PDFTemplate, PDFSection, PDFInfoRow } from '@/components/pdf-template'
import { formatCurrency, formatDateForPDF } from '@/lib/pdf-utils'

interface BookingReceiptPDFProps {
  booking: {
    sale_no: string
    booking_date: string
    customer_name: string
    customer_phone?: string
    customer_address?: string
    customer_nid?: string
    father_or_husband_name?: string
    project_name: string
    project_address?: string
    product_name: string
    unit_no?: string
    floor_no?: string
    size_sqft?: number
    unit_type?: string
    facing?: string
    bedrooms?: number
    bathrooms?: number
    base_price: number
    discount_amount?: number
    discount_percent?: number
    net_price: number
    booking_amount: number
    down_payment?: number
    payment_plan?: string
    installment_count?: number
    installment_amount?: number
    expected_handover_date?: string
    seller_name?: string
    nominee_name?: string
    nominee_phone?: string
    nominee_relation?: string
    notes?: string
    terms_conditions?: string
  }
  companyName?: string
  companyAddress?: string
  currencySymbol?: string
  companyLogo?: string
  footerImage?: string
  backgroundImage?: string
}

// Default terms if none specified
const DEFAULT_TERMS = `This booking is subject to the terms mentioned in the final agreement.
Down payment must be made within 30 days of booking.
Monthly installments will start from the 2nd month after booking.
Delay in payment may attract late fee as per company policy.
Registration and other government charges are extra.
Handover date is tentative and subject to construction progress.`

export function BookingReceiptPDF({
  booking,
  companyName,
  companyAddress,
  currencySymbol = '৳',
  companyLogo,
  footerImage,
  backgroundImage,
}: BookingReceiptPDFProps) {
  return (
    <PDFTemplate
      title="BOOKING RECEIPT"
      documentNumber={booking.sale_no}
      date={formatDateForPDF(booking.booking_date)}
      companyName={companyName}
      companyAddress={companyAddress}
      companyLogo={companyLogo}
      footerImage={footerImage}
      backgroundImage={backgroundImage}
    >
      <div className="grid grid-cols-2 gap-8 mb-6">
        {/* Customer Details */}
        <PDFSection title="Customer Information">
          <div className="space-y-1">
            <p className="font-bold text-base">{booking.customer_name}</p>
            {booking.father_or_husband_name && (
              <p className="text-sm text-gray-700">S/O, D/O, W/O: {booking.father_or_husband_name}</p>
            )}
            {booking.customer_phone && (
              <p className="text-sm text-gray-700">Phone: {booking.customer_phone}</p>
            )}
            {booking.customer_nid && (
              <p className="text-sm text-gray-700">NID: {booking.customer_nid}</p>
            )}
            {booking.customer_address && (
              <p className="text-sm text-gray-700">Address: {booking.customer_address}</p>
            )}
          </div>
        </PDFSection>

        {/* Booking Details */}
        <PDFSection title="Booking Details">
          <div className="space-y-1">
            <PDFInfoRow label="Booking No" value={booking.sale_no} />
            <PDFInfoRow label="Booking Date" value={formatDateForPDF(booking.booking_date)} />
            {booking.seller_name && (
              <PDFInfoRow label="Sales Executive" value={booking.seller_name} />
            )}
            {booking.expected_handover_date && (
              <PDFInfoRow label="Expected Handover" value={formatDateForPDF(booking.expected_handover_date)} />
            )}
          </div>
        </PDFSection>
      </div>

      {/* Property Details */}
      <PDFSection title="Property Details">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <PDFInfoRow label="Project" value={booking.project_name} />
            {booking.project_address && (
              <PDFInfoRow label="Location" value={booking.project_address} />
            )}
            <PDFInfoRow label="Unit/Flat" value={booking.product_name} />
            {booking.unit_no && (
              <PDFInfoRow label="Unit No" value={booking.unit_no} />
            )}
            {booking.floor_no && (
              <PDFInfoRow label="Floor" value={booking.floor_no} />
            )}
          </div>
          <div className="space-y-2">
            {booking.unit_type && (
              <PDFInfoRow label="Type" value={booking.unit_type} />
            )}
            {booking.size_sqft && (
              <PDFInfoRow label="Size" value={`${booking.size_sqft} sq.ft`} />
            )}
            {booking.facing && (
              <PDFInfoRow label="Facing" value={booking.facing} />
            )}
            {booking.bedrooms && (
              <PDFInfoRow label="Bedrooms" value={booking.bedrooms.toString()} />
            )}
            {booking.bathrooms && (
              <PDFInfoRow label="Bathrooms" value={booking.bathrooms.toString()} />
            )}
          </div>
        </div>
      </PDFSection>

      {/* Payment Summary */}
      <PDFSection title="Payment Summary">
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Base Price:</span>
            <span className="font-medium">{formatCurrency(booking.base_price, currencySymbol)}</span>
          </div>
          
          {(booking.discount_amount && booking.discount_amount > 0) && (
            <div className="flex justify-between py-2 border-b border-gray-200 text-green-600">
              <span>Discount {booking.discount_percent ? `(${booking.discount_percent}%)` : ''}:</span>
              <span>- {formatCurrency(booking.discount_amount, currencySymbol)}</span>
            </div>
          )}
          
          <div className="flex justify-between py-2 border-b-2 border-gray-800 text-lg font-bold">
            <span>Net Price:</span>
            <span>{formatCurrency(booking.net_price, currencySymbol)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-200 text-green-700">
            <span>Booking Amount Received:</span>
            <span className="font-bold">{formatCurrency(booking.booking_amount, currencySymbol)}</span>
          </div>

          {booking.down_payment && booking.down_payment > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Down Payment (Due):</span>
              <span>{formatCurrency(booking.down_payment, currencySymbol)}</span>
            </div>
          )}

          {booking.payment_plan === 'installment' && booking.installment_count && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Installments:</span>
              <span>{booking.installment_count} x {formatCurrency(booking.installment_amount || 0, currencySymbol)}</span>
            </div>
          )}

          <div className="flex justify-between py-2 text-lg font-bold text-red-600">
            <span>Balance Due:</span>
            <span>{formatCurrency(booking.net_price - booking.booking_amount, currencySymbol)}</span>
          </div>
        </div>
      </PDFSection>

      {/* Nominee Details */}
      {booking.nominee_name && (
        <PDFSection title="Nominee / Co-Applicant">
          <div className="space-y-1">
            <PDFInfoRow label="Name" value={booking.nominee_name} />
            {booking.nominee_relation && (
              <PDFInfoRow label="Relation" value={booking.nominee_relation} />
            )}
            {booking.nominee_phone && (
              <PDFInfoRow label="Phone" value={booking.nominee_phone} />
            )}
          </div>
        </PDFSection>
      )}

      {/* Terms & Conditions */}
      <PDFSection title="Terms & Conditions">
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
          {(booking.terms_conditions || DEFAULT_TERMS)
            .split('\n')
            .filter((line: string) => line.trim())
            .map((term: string, index: number) => (
              <li key={index}>{term.trim()}</li>
            ))}
        </ol>
      </PDFSection>

      {booking.notes && (
        <PDFSection title="Remarks">
          <p className="text-sm text-gray-700">{booking.notes}</p>
        </PDFSection>
      )}

      {/* Signatures */}
      <div className="mt-12 pt-8 grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-12">
            <p className="font-medium">Customer Signature</p>
            <p className="text-sm text-gray-600">{booking.customer_name}</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-12">
            <p className="font-medium">For {companyName || 'Company'}</p>
            <p className="text-sm text-gray-600">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </PDFTemplate>
  )
}
