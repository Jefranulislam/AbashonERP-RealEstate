import React from 'react'
import { PDFTemplate } from './pdf-template'

interface VendorPaymentProps {
  paymentNumber: string
  date: string
  vendorName: string
  vendorAddress?: string
  vendorPhone?: string
  vendorEmail?: string
  amount: number
  amountInWords: string
  description: string
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Online'
  chequeNumber?: string
  bankName?: string
  billNumber?: string
  memoNumber?: string
  projectName?: string
  projectAddress?: string
  deliveryAddress?: string
  totalPaymentsToVendor?: number
  paymentCount?: number
  authorizedBy: string
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyLogo?: string
  footerImage?: string
}

export function VendorPayment({
  paymentNumber,
  date,
  vendorName,
  vendorAddress,
  amount,
  amountInWords,
  description,
  paymentMethod,
  chequeNumber,
  bankName,
  authorizedBy,
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  companyLogo,
  footerImage,
}: VendorPaymentProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
    }).format(amount).replace('BDT', '৳')
  }

  const paymentContentStyle: React.CSSProperties = {
    padding: '20px 0',
    lineHeight: '1.6'
  }

  const paymentHeaderStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '15px',
    backgroundColor: '#f1f8ff',
    border: '2px solid #007bff',
    borderRadius: '8px'
  }

  const paymentTitleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '0 0 10px 0',
    textTransform: 'uppercase',
    letterSpacing: '2px'
  }

  const paymentSubtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#666666',
    margin: 0
  }

  const infoRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px dotted #cccccc'
  }

  const labelStyle: React.CSSProperties = {
    fontWeight: '600',
    color: '#333333',
    minWidth: '150px'
  }

  const valueStyle: React.CSSProperties = {
    color: '#1a1a1a',
    textAlign: 'right',
    flex: 1
  }

  const amountSectionStyle: React.CSSProperties = {
    backgroundColor: '#fff3e0',
    padding: '20px',
    margin: '20px 0',
    borderRadius: '8px',
    border: '2px solid #ff9800'
  }

  const amountStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#e65100',
    textAlign: 'center',
    margin: '0 0 10px 0'
  }

  const amountWordsStyle: React.CSSProperties = {
    fontSize: '12px',
    fontStyle: 'italic',
    color: '#e65100',
    textAlign: 'center',
    textTransform: 'capitalize'
  }

  const signatureAreaStyle: React.CSSProperties = {
    marginTop: '40px',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '20px 0'
  }

  const signatureBoxStyle: React.CSSProperties = {
    textAlign: 'center',
    minWidth: '200px'
  }

  const signatureLineStyle: React.CSSProperties = {
    borderTop: '1px solid #333333',
    paddingTop: '5px',
    marginTop: '40px',
    fontSize: '12px',
    color: '#666666'
  }

  return (
    <PDFTemplate
      title="PAYMENT RECEIPT"
      documentNumber={paymentNumber}
      date={date}
      companyName={companyName}
      companyAddress={companyAddress}
      companyPhone={companyPhone}
      companyEmail={companyEmail}
      companyLogo={companyLogo}
      footerImage={footerImage}
    >
      <div style={paymentContentStyle}>
        {/* Payment Header */}
        <div style={paymentHeaderStyle}>
          <h1 style={paymentTitleStyle}>Payment Receipt</h1>
          <p style={paymentSubtitleStyle}>Payment Confirmation</p>
        </div>

        {/* Vendor Information */}
        <div style={{ marginBottom: '25px' }}>
          <div style={infoRowStyle}>
            <span style={labelStyle}>Payment No:</span>
            <span style={valueStyle}>{paymentNumber}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={labelStyle}>Date:</span>
            <span style={valueStyle}>{date}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={labelStyle}>Paid to:</span>
            <span style={valueStyle}>{vendorName}</span>
          </div>
          {vendorAddress && (
            <div style={infoRowStyle}>
              <span style={labelStyle}>Address:</span>
              <span style={valueStyle}>{vendorAddress}</span>
            </div>
          )}
        </div>

        {/* Amount Section */}
        <div style={amountSectionStyle}>
          <div style={amountStyle}>
            Amount Paid: {formatCurrency(amount)}
          </div>
          <div style={amountWordsStyle}>
            In Words: {amountInWords}
          </div>
        </div>

        {/* Payment Details */}
        <div style={{ marginBottom: '25px' }}>
          <div style={infoRowStyle}>
            <span style={labelStyle}>Being payment for:</span>
            <span style={valueStyle}>{description}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={labelStyle}>Payment Method:</span>
            <span style={valueStyle}>{paymentMethod}</span>
          </div>
          {chequeNumber && (
            <div style={infoRowStyle}>
              <span style={labelStyle}>Cheque No:</span>
              <span style={valueStyle}>{chequeNumber}</span>
            </div>
          )}
          {bankName && (
            <div style={infoRowStyle}>
              <span style={labelStyle}>Bank:</span>
              <span style={valueStyle}>{bankName}</span>
            </div>
          )}
        </div>

        {/* Payment Confirmation */}
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#e8f5e8', 
          borderLeft: '4px solid #28a745',
          margin: '20px 0',
          fontSize: '13px',
          lineHeight: '1.5'
        }}>
          <strong>Payment Confirmation:</strong><br />
          We confirm that payment has been made to {vendorName} for {description.toLowerCase()}. 
          This document serves as proof of payment and should be retained for your records. 
          Please acknowledge receipt of this payment.
        </div>

        {/* Terms & Conditions */}
        <div style={{
          marginTop: '20px',
          fontSize: '12px',
          lineHeight: '1.4'
        }}>
          <strong style={{ color: '#333333', marginBottom: '8px', display: 'block' }}>Terms & Conditions:</strong>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#666666' }}>
            <li>Payment made as per agreed terms and conditions</li>
            <li>This serves as final settlement unless otherwise specified</li>
            <li>Any disputes should be raised within 7 days of payment</li>
            <li>Receipt acknowledgment is required within 3 business days</li>
          </ul>
        </div>

        {/* Signature Area */}
        <div style={signatureAreaStyle}>
          <div style={signatureBoxStyle}>
            <div style={signatureLineStyle}>
              Vendor Acknowledgment
            </div>
          </div>
          <div style={signatureBoxStyle}>
            <div style={signatureLineStyle}>
              Authorized by: {authorizedBy}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{
          marginTop: '30px',
          padding: '10px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#721c24'
        }}>
          <strong>Important:</strong> This payment receipt is computer-generated and legally valid. 
          Please confirm receipt and retain for tax and audit purposes. Contact our accounts department for any queries.
        </div>
      </div>
    </PDFTemplate>
  )
}