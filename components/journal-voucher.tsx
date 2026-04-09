import React from 'react'
import { PDFTemplate } from './pdf-template'

interface JournalEntry {
  accountName: string
  accountType: string
  debitAmount?: number
  creditAmount?: number
  narration?: string
}

interface JournalVoucherProps {
  voucherNumber: string
  date: string
  entries: JournalEntry[]
  narration: string
  preparedBy: string
  checkedBy?: string
  approvedBy?: string
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyLogo?: string
  footerImage?: string
}

export function JournalVoucher({
  voucherNumber,
  date,
  entries,
  narration,
  preparedBy,
  checkedBy,
  approvedBy,
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  companyLogo,
  footerImage,
}: JournalVoucherProps) {
  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
    }).format(amount).replace('BDT', '৳')
  }

  const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0)
  const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0)

  const voucherContentStyle: React.CSSProperties = {
    padding: '20px 0',
    lineHeight: '1.5'
  }

  const voucherHeaderStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    border: '2px solid #6c757d',
    borderRadius: '8px'
  }

  const voucherTitleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '0 0 10px 0',
    textTransform: 'uppercase',
    letterSpacing: '2px'
  }

  const voucherSubtitleStyle: React.CSSProperties = {
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

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px',
    border: '1px solid #333333'
  }

  const tableHeaderStyle: React.CSSProperties = {
    backgroundColor: '#343a40',
    color: 'white',
    fontWeight: 'bold',
    padding: '12px 8px',
    textAlign: 'left',
    border: '1px solid #333333',
    fontSize: '12px'
  }

  const tableCellStyle: React.CSSProperties = {
    padding: '10px 8px',
    border: '1px solid #333333',
    fontSize: '11px',
    verticalAlign: 'top'
  }

  const totalRowStyle: React.CSSProperties = {
    backgroundColor: '#e9ecef',
    fontWeight: 'bold',
    color: '#1a1a1a'
  }

  const signatureAreaStyle: React.CSSProperties = {
    marginTop: '40px',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '20px 0'
  }

  const signatureBoxStyle: React.CSSProperties = {
    textAlign: 'center',
    minWidth: '150px',
    margin: '0 10px'
  }

  const signatureLineStyle: React.CSSProperties = {
    borderTop: '1px solid #333333',
    paddingTop: '5px',
    marginTop: '40px',
    fontSize: '10px',
    color: '#666666'
  }

  return (
    <PDFTemplate
      title="JOURNAL VOUCHER"
      documentNumber={voucherNumber}
      date={date}
      companyName={companyName}
      companyAddress={companyAddress}
      companyPhone={companyPhone}
      companyEmail={companyEmail}
      companyLogo={companyLogo}
      footerImage={footerImage}
    >
      <div style={voucherContentStyle}>
        {/* Voucher Header */}
        <div style={voucherHeaderStyle}>
          <h1 style={voucherTitleStyle}>Journal Voucher</h1>
          <p style={voucherSubtitleStyle}>General Accounting Entry</p>
        </div>

        {/* Voucher Information */}
        <div style={{ marginBottom: '25px' }}>
          <div style={infoRowStyle}>
            <span style={labelStyle}>Voucher No:</span>
            <span style={valueStyle}>{voucherNumber}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={labelStyle}>Date:</span>
            <span style={valueStyle}>{date}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={labelStyle}>Prepared By:</span>
            <span style={valueStyle}>{preparedBy}</span>
          </div>
        </div>

        {/* Journal Entries Table */}
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Serial</th>
              <th style={tableHeaderStyle}>Account Name</th>
              <th style={tableHeaderStyle}>Account Type</th>
              <th style={tableHeaderStyle}>Debit Amount</th>
              <th style={tableHeaderStyle}>Credit Amount</th>
              <th style={tableHeaderStyle}>Narration</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={index}>
                <td style={tableCellStyle}>{index + 1}</td>
                <td style={tableCellStyle}>{entry.accountName}</td>
                <td style={tableCellStyle}>{entry.accountType}</td>
                <td style={{ ...tableCellStyle, textAlign: 'right', color: entry.debitAmount ? '#28a745' : '#666666' }}>
                  {formatCurrency(entry.debitAmount)}
                </td>
                <td style={{ ...tableCellStyle, textAlign: 'right', color: entry.creditAmount ? '#dc3545' : '#666666' }}>
                  {formatCurrency(entry.creditAmount)}
                </td>
                <td style={tableCellStyle}>{entry.narration || '-'}</td>
              </tr>
            ))}
            {/* Total Row */}
            <tr style={totalRowStyle}>
              <td colSpan={3} style={{ ...tableCellStyle, textAlign: 'right', ...totalRowStyle }}>
                <strong>TOTAL:</strong>
              </td>
              <td style={{ ...tableCellStyle, textAlign: 'right', ...totalRowStyle }}>
                <strong>{formatCurrency(totalDebit)}</strong>
              </td>
              <td style={{ ...tableCellStyle, textAlign: 'right', ...totalRowStyle }}>
                <strong>{formatCurrency(totalCredit)}</strong>
              </td>
              <td style={{ ...tableCellStyle, ...totalRowStyle }}></td>
            </tr>
          </tbody>
        </table>

        {/* Balance Verification */}
        <div style={{
          padding: '15px',
          backgroundColor: totalDebit === totalCredit ? '#d4edda' : '#f8d7da',
          border: `2px solid ${totalDebit === totalCredit ? '#28a745' : '#dc3545'}`,
          borderRadius: '8px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <strong style={{ 
            color: totalDebit === totalCredit ? '#155724' : '#721c24',
            fontSize: '14px' 
          }}>
            {totalDebit === totalCredit 
              ? '✓ VOUCHER BALANCED - Debit equals Credit' 
              : '✗ VOUCHER NOT BALANCED - Please verify entries'}
          </strong>
          <div style={{ fontSize: '12px', marginTop: '5px', color: '#666666' }}>
            Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}
          </div>
        </div>

        {/* General Narration */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '5px'
          }}>
            <strong style={{ display: 'block', marginBottom: '8px', color: '#333333' }}>
              General Narration:
            </strong>
            <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#495057' }}>
              {narration}
            </div>
          </div>
        </div>

        {/* Accounting Reference */}
        <div style={{
          fontSize: '11px',
          color: '#666666',
          fontStyle: 'italic',
          textAlign: 'center',
          padding: '10px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Accounting Principle:</strong> Every debit must have a corresponding credit (Double Entry System)<br />
          This voucher follows Generally Accepted Accounting Principles (GAAP)
        </div>

        {/* Authorization Section */}
        <div style={signatureAreaStyle}>
          <div style={signatureBoxStyle}>
            <div style={signatureLineStyle}>
              Prepared by<br />
              {preparedBy}
            </div>
          </div>
          {checkedBy && (
            <div style={signatureBoxStyle}>
              <div style={signatureLineStyle}>
                Checked by<br />
                {checkedBy}
              </div>
            </div>
          )}
          {approvedBy && (
            <div style={signatureBoxStyle}>
              <div style={signatureLineStyle}>
                Approved by<br />
                {approvedBy}
              </div>
            </div>
          )}
        </div>

        {/* Internal Use Only */}
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#e2e3e5',
          border: '1px solid #c6c8ca',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#6c757d',
          textAlign: 'center'
        }}>
          <strong>FOR INTERNAL ACCOUNTING USE ONLY</strong><br />
          This document contains confidential financial information and should not be shared with external parties
        </div>
      </div>
    </PDFTemplate>
  )
}