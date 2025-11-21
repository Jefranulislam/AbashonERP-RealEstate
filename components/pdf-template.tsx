import React from 'react'

interface PDFTemplateProps {
  title: string
  documentNumber?: string
  date?: string
  companyName?: string
  companyAddress?: string
  children: React.ReactNode
}

export function PDFTemplate({
  title,
  documentNumber,
  date,
  companyName = 'Company Name',
  companyAddress = 'Company Address',
  children,
}: PDFTemplateProps) {
  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-center text-gray-900">{companyName}</h1>
        <p className="text-center text-sm text-gray-600 mt-1">{companyAddress}</p>
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
      <div className="border-t border-gray-300 pt-4 mt-8 text-center text-xs text-gray-500">
        <p>This is a computer-generated document. No signature is required.</p>
        <p className="mt-1">Printed on {new Date().toLocaleString()}</p>
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
