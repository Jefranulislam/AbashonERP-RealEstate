import React from 'react'

export interface PDFTemplateProps {
  title: string
  documentNumber?: string
  date?: string
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyLogo?: string
  footerImage?: string
  backgroundImage?: string
  children: React.ReactNode
}

export function PDFTemplate({
  title,
  documentNumber,
  date,
  companyName = 'Company Name',
  companyAddress = 'Company Address',
  companyPhone,
  companyEmail,
  companyLogo,
  footerImage,
  backgroundImage,
  children,
}: PDFTemplateProps) {
  return (
    <div className="pdf-template">
      {/* Print & Screen styles for multi-page letterhead */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          * {
            box-sizing: border-box;
          }
          /* Background image repeats on every printed page via position: fixed */
          .pdf-bg-image {
            position: fixed !important;
            top: 0;
            left: 0;
            width: 210mm;
            height: 297mm;
            z-index: 0;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .pdf-bg-image img {
            height: 100%;
            width: auto;
            opacity: 1;
          }
          /* The table layout trick: thead/tfoot repeat on every page */
          .pdf-layout-table {
            width: 100%;
          }
          .pdf-layout-table thead td,
          .pdf-layout-table tfoot td {
            padding: 0;
          }
          /* Avoid breaking inside table rows and sections */
          .pdf-layout-table tbody tr {
            page-break-inside: avoid;
          }
          /* Footer fixed at the bottom of every printed page */
          .pdf-footer-fixed {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            z-index: 10;
            background: white;
          }
          /* Reserve space at the bottom of each page so content doesn't overlap the footer */
          .pdf-layout-table tfoot td {
            height: 0;
          }
          .pdf-footer-spacer {
            height: 60px; /* must match footer height */
          }
        }
        @media screen {
          .pdf-template {
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
            max-width: 210mm;
            margin: 20px auto;
            background: white;
          }
          .pdf-bg-image {
            position: fixed;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 210mm;
            height: 297mm;
            z-index: 0;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .pdf-bg-image img {
            height: 100%;
            width: auto;
            opacity: 1;
          }
        }
      `}</style>

      {/* Background Image — fixed so it repeats on every printed page */}
      {backgroundImage && (
        <div className="pdf-bg-image">
          <img src={backgroundImage} alt="Background" />
        </div>
      )}

      {/*
        TABLE-BASED LAYOUT:
        - <thead> = Company header → repeated on every printed page
        - <tfoot> = Footer → repeated on every printed page
        - <tbody> = Document title + content → flows across pages
      */}
      <table
        className="pdf-layout-table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          lineHeight: '1.4',
          color: '#333333',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* ===== HEADER (repeats on every page) ===== */}
        <thead>
          <tr>
            <td style={{ padding: 0, verticalAlign: 'top' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '10mm 10mm 5mm 10mm',
                  borderBottom: '2px solid #e5e5e5',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {companyLogo && (
                    <img
                      src={companyLogo}
                      alt="Company Logo"
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'contain',
                        border: 'none',
                        display: 'block',
                      }}
                    />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', margin: 0, lineHeight: '1.2' }}>
                      {companyName}
                    </h1>
                    <p style={{ fontSize: '11px', color: '#666666', margin: 0, lineHeight: '1.3' }}>
                      {companyAddress}
                    </p>
                    {companyPhone && (
                      <p style={{ fontSize: '11px', color: '#666666', margin: 0, lineHeight: '1.3' }}>
                        Phone: {companyPhone}
                      </p>
                    )}
                    {companyEmail && (
                      <p style={{ fontSize: '11px', color: '#666666', margin: 0, lineHeight: '1.3' }}>
                        Email: {companyEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '80px' }}>
                  {date && (
                    <p style={{ fontSize: '11px', color: '#666666', margin: '0 0 5px 0', lineHeight: '1.3' }}>
                      <strong>Date:</strong> {date}
                    </p>
                  )}
                  {documentNumber && (
                    <p style={{ fontSize: '11px', color: '#666666', margin: 0, lineHeight: '1.3' }}>
                      <strong>Doc No:</strong> {documentNumber}
                    </p>
                  )}
                </div>
              </div>
            </td>
          </tr>
        </thead>

        {/* ===== FOOTER SPACER (repeats on every page to reserve space) ===== */}
        <tfoot>
          <tr>
            <td style={{ padding: 0 }}>
              {/* Spacer so body content doesn't overlap the fixed footer */}
              <div className="pdf-footer-spacer" />
            </td>
          </tr>
        </tfoot>

        {/* ===== BODY (flows across pages naturally) ===== */}
        <tbody>
          <tr>
            <td style={{ padding: 0, verticalAlign: 'top' }}>
              {/* Document Title Section */}
              <div
                style={{
                  padding: '10px 20mm 15px 20mm',
                  borderBottom: '1px solid #cccccc',
                  marginBottom: '20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                }}
              >
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#1a1a1a',
                    margin: '0 0 8px 0',
                    textAlign: 'center',
                  }}
                >
                  {title}
                </h2>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    color: '#666666',
                  }}
                >
                  <span>Generated on: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Main Content Area */}
              <div style={{ padding: '0 20mm 20mm 20mm', position: 'relative', zIndex: 2 }}>
                {children}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Fixed footer pinned to the bottom of every printed page */}
      <div
        className="pdf-footer-fixed"
        style={{
          textAlign: 'center',
          fontSize: '9px',
          color: '#888888',
          borderTop: '1px solid #e5e5e5',
          padding: '2px 10mm 0 10mm',
        }}
      >
        {footerImage ? (
          <div>
            <p style={{ margin: '4px 0 0 0' }}>
              This document is computer generated and requires no signature, Print and Generate by {companyName}
            </p>
            <img
              src={footerImage}
              alt="Footer"
              style={{ maxWidth: '100%', height: 'auto', marginBottom: '0' }}
            />
          </div>
        ) : (
          <p style={{ margin: '4px 0' }}>
            This document is computer generated and requires no signature | Generated by {companyName}
          </p>
        )}
      </div>
    </div>
  )
}

export interface TableRow {
  [key: string]: any
}

export interface PDFTableProps {
  headers: string[]
  rows: TableRow[]
  columns: string[]
  footerRow?: {
    label: string
    colspan: number
    value: string
  }
  showBorders?: boolean
  alternateRowColors?: boolean
}

export function PDFTable({ 
  headers, 
  rows, 
  columns, 
  footerRow,
  showBorders = true,
  alternateRowColors = true 
}: PDFTableProps) {
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11px',
    marginBottom: '20px',
    border: showBorders ? '1px solid #cccccc' : 'none'
  }

  const headerStyle: React.CSSProperties = {
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'left',
    padding: '10px 8px',
    border: showBorders ? '1px solid #cccccc' : 'none',
    fontSize: '11px',
    lineHeight: '1.4'
  }

  const cellStyle: React.CSSProperties = {
    padding: '8px',
    border: showBorders ? '1px solid #cccccc' : 'none',
    lineHeight: '1.4',
    verticalAlign: 'top'
  }

  const evenRowStyle: React.CSSProperties = {
    backgroundColor: alternateRowColors ? '#f9f9f9' : 'transparent'
  }

  const oddRowStyle: React.CSSProperties = {
    backgroundColor: 'transparent'
  }

  const footerRowStyle: React.CSSProperties = {
    backgroundColor: '#e9ecef',
    fontWeight: 'bold',
    color: '#1a1a1a'
  }

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index} style={headerStyle}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr 
            key={rowIndex} 
            style={alternateRowColors && rowIndex % 2 === 0 ? evenRowStyle : oddRowStyle}
          >
            {columns.map((column, colIndex) => (
              <td key={colIndex} style={cellStyle}>
                {row[column] || '-'}
              </td>
            ))}
          </tr>
        ))}
        {footerRow && (
          <tr style={footerRowStyle}>
            <td
              colSpan={footerRow.colspan}
              style={{
                ...cellStyle,
                textAlign: 'right',
                fontWeight: 'bold',
                backgroundColor: '#e9ecef'
              }}
            >
              {footerRow.label}
            </td>
            <td style={{
              ...cellStyle,
              fontWeight: 'bold',
              backgroundColor: '#e9ecef'
            }}>
              {footerRow.value}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

export interface PDFInfoRowProps {
  label: string
  value: string | number
  labelWidth?: string
  valueAlign?: 'left' | 'right' | 'center'
}

export function PDFInfoRow({ 
  label, 
  value, 
  labelWidth = '150px',
  valueAlign = 'left' 
}: PDFInfoRowProps) {
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px dotted #e5e5e5',
    fontSize: '12px',
    lineHeight: '1.4'
  }

  const labelStyle: React.CSSProperties = {
    fontWeight: '500',
    color: '#333333',
    minWidth: labelWidth,
    marginRight: '10px'
  }

  const valueStyle: React.CSSProperties = {
    color: '#1a1a1a',
    textAlign: valueAlign,
    flex: 1,
    fontWeight: 'normal'
  }

  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}:</span>
      <span style={valueStyle}>{value}</span>
    </div>
  )
}

export interface PDFSectionProps {
  title: string
  children: React.ReactNode
  titleSize?: 'small' | 'medium' | 'large'
  spacing?: 'compact' | 'normal' | 'spacious'
}

export function PDFSection({ 
  title, 
  children, 
  titleSize = 'medium',
  spacing = 'normal'
}: PDFSectionProps) {
  const getFontSize = () => {
    switch (titleSize) {
      case 'small': return '14px'
      case 'large': return '18px'
      default: return '16px'
    }
  }

  const getMarginBottom = () => {
    switch (spacing) {
      case 'compact': return '15px'
      case 'spacious': return '30px'
      default: return '20px'
    }
  }

  const sectionStyle: React.CSSProperties = {
    marginBottom: getMarginBottom(),
    pageBreakInside: 'avoid'
  }

  const titleStyle: React.CSSProperties = {
    fontSize: getFontSize(),
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '12px',
    borderBottom: '2px solid #e5e5e5',
    paddingBottom: '8px',
    lineHeight: '1.3'
  }

  const contentStyle: React.CSSProperties = {
    marginTop: '12px'
  }

  return (
    <div style={sectionStyle}>
      <h3 style={titleStyle}>
        {title}
      </h3>
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  )
}

// Additional utility components for common PDF elements
export interface PDFSummaryBoxProps {
  title: string
  items: Array<{
    label: string
    value: string | number
    highlight?: boolean
  }>
}

export function PDFSummaryBox({ title, items }: PDFSummaryBoxProps) {
  const boxStyle: React.CSSProperties = {
    border: '2px solid #e5e5e5',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    backgroundColor: '#f8f9fa'
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '12px',
    textAlign: 'center',
    borderBottom: '1px solid #dee2e6',
    paddingBottom: '8px'
  }

  return (
    <div style={boxStyle}>
      <div style={titleStyle}>{title}</div>
      {items.map((item, index) => (
        <PDFInfoRow
          key={index}
          label={item.label}
          value={item.value}
          valueAlign="right"
        />
      ))}
    </div>
  )
}
