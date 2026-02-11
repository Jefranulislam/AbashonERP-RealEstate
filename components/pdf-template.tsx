import React from 'react'

interface PDFTemplateProps {
  title: string
  documentNumber?: string
  date?: string
  companyName?: string
  companyAddress?: string
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
  companyLogo,
  footerImage,
  backgroundImage,
  children,
}: PDFTemplateProps) {
  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto relative">
      {/* Background Image on Left Side */}
      {backgroundImage && (
        <div className="absolute left-0 top-0 w-32 h-full opacity-10 z-0">
          <img 
            src={backgroundImage}
            alt="Company Background"
            className="w-full h-full object-cover object-left"
            style={{ filter: 'grayscale(20%)' }}
          />
        </div>
      )}

      {/* Content with z-index to appear above background */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-center text-gray-900">{companyName}</h1>
              <p className="text-center text-sm text-gray-600 mt-1">{companyAddress}</p>
            </div>
            {companyLogo && (
              <div className="ml-4">
                <img 
                  src={companyLogo}
                  alt="Company Logo"
                  className="h-16 w-auto max-w-[120px] object-contain"
                />
              </div>
            )}
          </div>
        </div>

      {/* Document Title and Info */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {documentNumber && (
            <p className="text-sm text-gray-600 mt-1">Document No: {documentNumber}</p>
          )}
        </div>
        {date && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Date: {date}</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-8">
        {children}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-4 mt-8">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center text-xs text-gray-500">
            <p>This is a computer-generated document. No signature is required.</p>
            <p className="mt-1">Printed on {new Date().toLocaleString()}</p>
          </div>
          {footerImage && (
            <div className="ml-4">
              <img 
                src={footerImage}
                alt="Footer Image"
                className="h-12 w-auto max-w-[100px] object-contain"
              />
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

interface TableRow {
  [key: string]: any
}

interface PDFTableProps {
  headers: string[]
  rows: TableRow[]
  columns: string[]
  footerRow?: {
    label: string
    colspan: number
    value: string
  }
}

export function PDFTable({ headers, rows, columns, footerRow }: PDFTableProps) {
  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className="bg-gray-100">
          {headers.map((header, index) => (
            <th
              key={index}
              className="border border-gray-300 px-3 py-2 text-left font-semibold"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="hover:bg-gray-50">
            {columns.map((column, colIndex) => (
              <td
                key={colIndex}
                className="border border-gray-300 px-3 py-2"
              >
                {row[column]}
              </td>
            ))}
          </tr>
        ))}
        {footerRow && (
          <tr className="bg-gray-50 font-bold">
            <td
              colSpan={footerRow.colspan}
              className="border border-gray-300 px-3 py-2 text-right"
            >
              {footerRow.label}
            </td>
            <td className="border border-gray-300 px-3 py-2">
              {footerRow.value}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

interface PDFInfoRowProps {
  label: string
  value: string
}

export function PDFInfoRow({ label, value }: PDFInfoRowProps) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="font-medium text-gray-700">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  )
}

interface PDFSectionProps {
  title: string
  children: React.ReactNode
}

export function PDFSection({ title, children }: PDFSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}
