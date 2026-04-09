import React from 'react'
import { PDFTemplate } from './pdf-template'
import type { PaymentMethod } from '@/lib/payment-utils'

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
  paymentMethod: PaymentMethod
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
  vendorPhone,
  vendorEmail,
  amount,
  amountInWords,
  description,
  paymentMethod,
  chequeNumber,
  bankName,
  billNumber,
  memoNumber,
  projectName,
  projectAddress,
  deliveryAddress,
  totalPaymentsToVendor,
  paymentCount,
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

  // Professional corporate styling - Black & White theme
  const headerStyle: React.CSSProperties = {
    borderBottom: '3px solid #000000',
    paddingBottom: '15px',  
    marginBottom: '20px',
    textAlign: 'center'
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    margin: '15px 0',
    border: '1px solid #000000'
  }

  const thStyle: React.CSSProperties = {
    border: '1px solid #000000',
    padding: '12px 8px',
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: '12px'
  }

  const tdStyle: React.CSSProperties = {
    border: '1px solid #000000', 
    padding: '10px 8px',
    fontSize: '12px',
    verticalAlign: 'top'
  }



  const signatureStyle: React.CSSProperties = {
    marginTop: '40px',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '20px 0'
  }

  const signatureBoxStyle: React.CSSProperties = {
    textAlign: 'center',
    minWidth: '180px',
    borderTop: '1px solid #000000',
    paddingTop: '8px',
    fontSize: '11px'
  }

  return (
    <PDFTemplate
      title="SUPPLIER PAYMENT RECEIPT"
      documentNumber={paymentNumber}
      date={date}
      companyName={companyName}
      companyAddress={companyAddress}
      companyPhone={companyPhone}
      companyEmail={companyEmail}
      companyLogo={companyLogo}
      footerImage={footerImage}
    >
      {/* Document Header */}
      <div style={headerStyle}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }}>
          Payment No: {paymentNumber} | Date: {date}
        </div>
      </div>

      {/* Supplier Information */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #000000', paddingBottom: '5px' }}>
          SUPPLIER DETAILS
        </h3>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa', width: '25%' }}>Supplier Name:</td>
              <td style={tdStyle}>{vendorName}</td>
              <td style={{ ...tdStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa', width: '25%' }}>Payment Count:</td>
              <td style={tdStyle}>#{paymentCount || 1} Payment</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Address:</td>
              <td style={tdStyle}>{vendorAddress || 'Not specified'}</td>
              <td style={{ ...tdStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Total Paid:</td>
              <td style={tdStyle}>{formatCurrency(totalPaymentsToVendor || amount)}</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Phone:</td>
              <td style={tdStyle}>{vendorPhone || 'Not provided'}</td>
              <td style={{ ...tdStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Email:</td>
              <td style={tdStyle}>{vendorEmail || 'Not provided'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Project Information */}
      {projectName && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #000000', paddingBottom: '5px' }}>
            PROJECT INFORMATION
          </h3>
          <table style={tableStyle}>
            <tbody>
              <tr>
                <td style={{ ...tdStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa', width: '25%' }}>Project Name:</td>
                <td style={tdStyle}>{projectName}</td>
              </tr>
              <tr>
                <td style={{ ...tdStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Project Address:</td>
                <td style={tdStyle}>{projectAddress || 'As per project details'}</td>
              </tr>
              <tr>
                <td style={{ ...tdStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Delivery Address:</td>
                <td style={tdStyle}>{deliveryAddress || projectAddress || 'Same as project address'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Information */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #000000', paddingBottom: '5px' }}>
          PAYMENT DETAILS
        </h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Payment Method</th>
              <th style={thStyle}>Reference</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>{description}</td>
              <td style={{ ...tdStyle, fontWeight: 'bold', textAlign: 'right' }}>{formatCurrency(amount)}</td>
              <td style={tdStyle}>{paymentMethod}</td>
              <td style={tdStyle}>
                {chequeNumber && `Cheque: ${chequeNumber}`}
                {bankName && ` Bank: ${bankName}`}
                {billNumber && `Bill: ${billNumber}`}
                {memoNumber && `Memo: ${memoNumber}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bill/Memo Information */}
      {(billNumber || memoNumber) && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #000000', paddingBottom: '5px' }}>
            SUPPLIER BILLING REFERENCE
          </h3>
          <table style={tableStyle}>
            <tbody>
              {billNumber && (
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa', width: '30%' }}>Supplier Bill Number:</td>
                  <td style={tdStyle}>{billNumber}</td>
                </tr>
              )}
              {memoNumber && (
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Supplier Memo Number:</td>
                  <td style={tdStyle}>{memoNumber}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}



      {/* Payment Summary */}
      <div style={{ marginBottom: '20px' }}>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Payment Authorization:</td>
              <td style={tdStyle}>{authorizedBy}</td>
              <td style={{ ...tdStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Payment Date:</td>
              <td style={tdStyle}>{date}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signatures */}
      <div style={signatureStyle}>
        <div style={signatureBoxStyle}>
          Prepared By<br/>
          ___________________<br/>
          Accounts Department
        </div>
        <div style={signatureBoxStyle}>
          Verified By<br/>
          ___________________<br/>
          {authorizedBy}
        </div>
        <div style={signatureBoxStyle}>
          Received By<br/>
          ___________________<br/>
          Supplier Representative
        </div>
      </div>

      {/* Terms and Conditions */}
      <div style={{
        marginTop: '30px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #000000',
        fontSize: '10px'
      }}>
        <strong>TERMS & CONDITIONS:</strong><br/>
        • This receipt serves as official proof of payment made to the supplier.<br/>
        • All supplies must be delivered to the specified project address as per agreement.<br/>
        • Any discrepancy in this payment should be reported within 7 days of receipt.<br/>
        • This is a computer-generated document and requires no signature for validity.
      </div>
    </PDFTemplate>
  )
}