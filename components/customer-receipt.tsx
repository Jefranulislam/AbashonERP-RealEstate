import React from 'react'
import { PDFTemplate } from './pdf-template'

interface CustomerReceiptProps {
  receiptNumber: string
  date: string
  customerName: string
  customerAddress?: string
  customerPhone?: string
  amount: number
  amountInWords: string
  description: string
  paymentType?: 'Installment' | 'Booking Money' | 'Signing Money' | 'Other'
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Online' | 'Online Transfer' | 'Mobile Banking'
  chequeNumber?: string
  bankName?: string
  chequeDate?: string
  projectName?: string
  unitFlatInfo?: string
  projectAddress?: string
  receivedBy: string
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyLogo?: string
  footerImage?: string
}

export function CustomerReceipt({
  receiptNumber,
  date,
  customerName,
  customerAddress,
  customerPhone,
  amount,
  amountInWords,
  description,
  paymentType = 'Other',
  paymentMethod,
  chequeNumber,
  bankName,
  chequeDate,
  projectName,
  unitFlatInfo,
  projectAddress,
  receivedBy,
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  companyLogo,
  footerImage,
}: CustomerReceiptProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
    }).format(amount).replace('BDT', '৳')
  }

  // Professional styling - clean and corporate
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

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px',
    borderBottom: '1px solid #000000',
    paddingBottom: '5px'
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
      title="MONEY RECEIPT"
      documentNumber={receiptNumber}
      date={date}
      companyName={companyName}
      companyAddress={companyAddress}
      companyPhone={companyPhone}
      companyEmail={companyEmail}
      companyLogo={companyLogo}
      footerImage={footerImage}
    >
      <div style={{ padding: '12px 0', fontSize: '12px' }}>
        {/* Customer Information Section */}
        <div style={sectionHeaderStyle}>CUSTOMER INFORMATION</div>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={tdStyle}><strong>Receipt No:</strong></td>
              <td style={tdStyle}>{receiptNumber}</td>
              <td style={tdStyle}><strong>Date:</strong></td>
              <td style={tdStyle}>{date}</td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Customer Name:</strong></td>
              <td style={tdStyle}>{customerName}</td>
              <td style={tdStyle}><strong>Phone:</strong></td>
              <td style={tdStyle}>{customerPhone || 'N/A'}</td>
            </tr>
            {customerAddress && (
              <tr>
                <td style={tdStyle}><strong>Address:</strong></td>
                <td style={tdStyle} colSpan={3}>{customerAddress}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Project Information Section */}
        {projectName && (
          <div>
            <div style={sectionHeaderStyle}>PROJECT INFORMATION</div>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={tdStyle}><strong>Project Name:</strong></td>
                  <td style={tdStyle}>{projectName}</td>
                </tr>
                {unitFlatInfo && (
                  <tr>
                    <td style={tdStyle}><strong>Unit/Flat:</strong></td>
                    <td style={tdStyle}>{unitFlatInfo}</td>
                  </tr>
                )}
                {projectAddress && (
                  <tr>
                    <td style={tdStyle}><strong>Project Address:</strong></td>
                    <td style={tdStyle}>{projectAddress}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment Details Section */}
        <div style={sectionHeaderStyle}>PAYMENT DETAILS</div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Payment Type</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Cheque Date </th>
              <th style={thStyle}>Payment Method</th>
              <th style={thStyle}>Amount (৳)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>{paymentType || 'Installment'}</td>
              <td style={tdStyle}>{description}</td>
              <td style={tdStyle}>{chequeDate || 'N/A'}</td>
              <td style={tdStyle}>{paymentMethod}</td>
              <td style={tdStyle}>{formatCurrency(amount)}</td>
            </tr>
          </tbody>
        </table>

        {/* Bank Details (if applicable) */}
        {(chequeNumber || bankName || chequeDate) && (
          <div>
            <div style={sectionHeaderStyle}>BANK DETAILS</div>
            <table style={tableStyle}>
              <tbody>
                {chequeNumber && (
                  <tr>
                    <td style={tdStyle}><strong>Cheque No:</strong></td>
                    <td style={tdStyle}>{chequeNumber}</td>
                  </tr>
                )}
                {bankName && (
                  <tr>
                    <td style={tdStyle}><strong>Bank Name:</strong></td>
                    <td style={tdStyle}>{bankName}</td>
                  </tr>
                )}
                {chequeDate && (
                  <tr>
                    <td style={tdStyle}><strong>Cheque Date:</strong></td>
                    <td style={tdStyle}>{chequeDate}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Total + Amount in Words — always visible regardless of payment method */}
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={tdStyle}><strong>Total Amount:</strong></td>
              <td style={tdStyle}><strong>{formatCurrency(amount)}</strong></td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Amount in Words:</strong></td>
              <td style={tdStyle}><em>{amountInWords}</em></td>
            </tr>
          </tbody>
        </table>


        {/* Appreciation Note */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          fontSize: '9px',
          textAlign: 'center'
        }}>
          <strong>Thank You!</strong><br />
          We appreciate your trust in us and look forward to serving you again. 
          This receipt serves as proof of payment for your records.
        </div>

        {/* Signature Area */}
        <div style={signatureStyle}>
          <div style={signatureBoxStyle}>
            Customer Signature
          </div>
          <div style={signatureBoxStyle}>
            Authorized By: {receivedBy}
          </div>
        </div>
      </div>
    </PDFTemplate>
  )
}