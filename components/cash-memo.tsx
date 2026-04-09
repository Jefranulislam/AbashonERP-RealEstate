import React from 'react'
import { PDFTemplate } from './pdf-template'

interface CashMemoItem {
  serial: number
  description: string
  quantity: number
  unit: string
  rate: number
  amount: number
}

interface CashMemoProps {
  memoNumber: string
  date: string
  customerName: string
  customerAddress?: string
  customerPhone?: string
  items: CashMemoItem[]
  subtotal: number
  discountAmount?: number
  taxAmount?: number
  totalAmount: number
  amountInWords: string
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Credit'
  salesPerson?: string
  notes?: string
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyLogo?: string
  footerImage?: string
}

export function CashMemo({
  memoNumber,
  date,
  customerName,
  customerAddress,
  customerPhone,
  items,
  subtotal,
  discountAmount = 0,
  taxAmount = 0,
  totalAmount,
  amountInWords,
  paymentMethod,
  salesPerson,
  notes,
  companyName,
  companyAddress,
  companyPhone: companyPhoneNumber,
  companyEmail,
  companyLogo,
  footerImage,
}: CashMemoProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
    }).format(amount).replace('BDT', '৳')
  }

  const memoContentStyle: React.CSSProperties = {
    padding: '20px 0',
    lineHeight: '1.5'
  }

  const memoHeaderStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '15px',
    backgroundColor: '#e3f2fd',
    border: '2px solid #2196f3',
    borderRadius: '8px'
  }

  const memoTitleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '0 0 10px 0',
    textTransform: 'uppercase',
    letterSpacing: '2px'
  }

  const memoSubtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#666666',
    margin: 0
  }

  const customerSectionStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '25px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '5px'
  }

  const infoColumnStyle: React.CSSProperties = {
    flex: 1
  }

  const labelStyle: React.CSSProperties = {
    fontWeight: '600',
    color: '#333333',
    fontSize: '12px'
  }

  const valueStyle: React.CSSProperties = {
    color: '#1a1a1a',
    fontSize: '12px',
    marginBottom: '5px'
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px',
    border: '1px solid #333333'
  }

  const tableHeaderStyle: React.CSSProperties = {
    backgroundColor: '#495057',
    color: 'white',
    fontWeight: 'bold',
    padding: '10px 6px',
    textAlign: 'left',
    border: '1px solid #333333',
    fontSize: '11px'
  }

  const tableCellStyle: React.CSSProperties = {
    padding: '8px 6px',
    border: '1px solid #333333',
    fontSize: '10px',
    verticalAlign: 'top'
  }

  const summaryTableStyle: React.CSSProperties = {
    marginLeft: 'auto',
    width: '250px',
    borderCollapse: 'collapse'
  }

  const summaryRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 0',
    borderBottom: '1px dotted #cccccc'
  }

  const totalRowStyle: React.CSSProperties = {
    ...summaryRowStyle,
    fontWeight: 'bold',
    fontSize: '14px',
    borderBottom: '2px solid #333333',
    backgroundColor: '#f8f9fa',
    padding: '10px'
  }

  const amountInWordsSectionStyle: React.CSSProperties = {
    padding: '15px',
    backgroundColor: '#e8f5e8',
    border: '2px solid #28a745',
    borderRadius: '8px',
    margin: '20px 0',
    textAlign: 'center'
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
      title="CASH MEMO"
      documentNumber={memoNumber}
      date={date}
      companyName={companyName}
      companyAddress={companyAddress}
      companyPhone={companyPhoneNumber}
      companyEmail={companyEmail}
      companyLogo={companyLogo}
      footerImage={footerImage}
    >
      <div style={memoContentStyle}>
        {/* Memo Header */}
        <div style={memoHeaderStyle}>
          <h1 style={memoTitleStyle}>Cash Memo</h1>
          <p style={memoSubtitleStyle}>Sales Transaction Record</p>
        </div>

        {/* Customer & Transaction Info */}
        <div style={customerSectionStyle}>
          <div style={infoColumnStyle}>
            <div style={labelStyle}>BILL TO:</div>
            <div style={valueStyle}><strong>{customerName}</strong></div>
            {customerAddress && <div style={valueStyle}>{customerAddress}</div>}
            {customerPhone && <div style={valueStyle}>Phone: {customerPhone}</div>}
          </div>
          <div style={infoColumnStyle}>
            <div style={labelStyle}>MEMO DETAILS:</div>
            <div style={valueStyle}><strong>Memo No:</strong> {memoNumber}</div>
            <div style={valueStyle}><strong>Date:</strong> {date}</div>
            <div style={valueStyle}><strong>Payment:</strong> {paymentMethod}</div>
            {salesPerson && <div style={valueStyle}><strong>Sales Person:</strong> {salesPerson}</div>}
          </div>
        </div>

        {/* Items Table */}
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...tableHeaderStyle, width: '40px' }}>S.No</th>
              <th style={tableHeaderStyle}>Description</th>
              <th style={{ ...tableHeaderStyle, width: '60px' }}>Qty</th>
              <th style={{ ...tableHeaderStyle, width: '50px' }}>Unit</th>
              <th style={{ ...tableHeaderStyle, width: '80px' }}>Rate</th>
              <th style={{ ...tableHeaderStyle, width: '90px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.serial}>
                <td style={{ ...tableCellStyle, textAlign: 'center' }}>{item.serial}</td>
                <td style={tableCellStyle}>{item.description}</td>
                <td style={{ ...tableCellStyle, textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ ...tableCellStyle, textAlign: 'center' }}>{item.unit}</td>
                <td style={{ ...tableCellStyle, textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                <td style={{ ...tableCellStyle, textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            {/* Add empty rows if less than 5 items for consistent formatting */}
            {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td style={{ ...tableCellStyle, height: '25px' }}>&nbsp;</td>
                <td style={tableCellStyle}>&nbsp;</td>
                <td style={tableCellStyle}>&nbsp;</td>
                <td style={tableCellStyle}>&nbsp;</td>
                <td style={tableCellStyle}>&nbsp;</td>
                <td style={tableCellStyle}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <div style={{ width: '250px' }}>
            <div style={summaryRowStyle}>
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={summaryRowStyle}>
                <span>Discount:</span>
                <span>({formatCurrency(discountAmount)})</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div style={summaryRowStyle}>
                <span>Tax/VAT:</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div style={totalRowStyle}>
              <span>TOTAL:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div style={amountInWordsSectionStyle}>
          <div style={{ fontWeight: 'bold', color: '#155724', marginBottom: '5px' }}>
            Amount in Words:
          </div>
          <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#155724', textTransform: 'capitalize' }}>
            {amountInWords}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div style={{
          fontSize: '11px',
          lineHeight: '1.4',
          marginBottom: '20px'
        }}>
          <strong style={{ color: '#333333', marginBottom: '8px', display: 'block' }}>Terms & Conditions:</strong>
          <ul style={{ margin: 0, paddingLeft: '15px', color: '#666666' }}>
            <li>All sales are final unless otherwise specified</li>
            <li>Goods once sold will not be taken back or exchanged</li>
            <li>Payment should be made as per agreed terms</li>
            <li>Any disputes should be settled within the jurisdiction of local court</li>
          </ul>
        </div>

        {/* Notes */}
        {notes && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            <strong style={{ color: '#856404', fontSize: '12px' }}>Notes:</strong>
            <div style={{ fontSize: '11px', color: '#856404', marginTop: '5px' }}>
              {notes}
            </div>
          </div>
        )}

        {/* Signature Area */}
        <div style={signatureAreaStyle}>
          <div style={signatureBoxStyle}>
            <div style={signatureLineStyle}>
              Customer Signature
            </div>
          </div>
          <div style={signatureBoxStyle}>
            <div style={signatureLineStyle}>
              Authorized Signature<br />
              {salesPerson || 'Sales Representative'}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div style={{
          marginTop: '20px',
          padding: '8px',
          backgroundColor: '#e9ecef',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#495057',
          textAlign: 'center'
        }}>
          Thank you for your business! Please retain this memo for your records.<br />
          For any queries, please contact us at {companyPhoneNumber || 'our office number'}
        </div>
      </div>
    </PDFTemplate>
  )
}