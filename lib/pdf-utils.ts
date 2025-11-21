/**
 * PDF Generation Utilities for KH ERP
 * Handles printing and PDF generation for various documents
 */

interface CompanySettings {
  company_name: string
  address: string
  invoice_prefix: string
  currency_symbol: string
  print_on_company_pad: boolean
}

/**
 * Get company settings for PDF header
 */
export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const response = await fetch('/api/settings')
    const data = await response.json()
    return {
      company_name: data.settings?.company_name || 'Company Name',
      address: data.settings?.address || 'Company Address',
      invoice_prefix: data.settings?.invoice_prefix || 'INV',
      currency_symbol: data.settings?.currency_symbol || '৳',
      print_on_company_pad: data.settings?.print_on_company_pad || false,
    }
  } catch (error) {
    console.error('Error fetching company settings:', error)
    return {
      company_name: 'Company Name',
      address: 'Company Address',
      invoice_prefix: 'INV',
      currency_symbol: '৳',
      print_on_company_pad: false,
    }
  }
}

/**
 * Trigger browser print dialog
 */
export function printDocument(elementId: string) {
  const printContent = document.getElementById(elementId)
  if (!printContent) {
    console.error('Print element not found')
    return
  }

  const windowPrint = window.open('', '_blank', 'width=800,height=600')
  if (!windowPrint) {
    console.error('Could not open print window')
    return
  }

  // Copy styles
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n')
      } catch (e) {
        return ''
      }
    })
    .join('\n')

  windowPrint.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Document</title>
        <style>
          ${styles}
          @media print {
            body { margin: 0; padding: 20px; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `)
  
  windowPrint.document.close()
  windowPrint.focus()
  
  // Wait for content to load before printing
  setTimeout(() => {
    windowPrint.print()
    windowPrint.close()
  }, 250)
}

/**
 * Generate PDF styles for printing
 */
export const pdfStyles = `
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .no-print {
      display: none !important;
    }
    .page-break {
      page-break-before: always;
    }
    table {
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
  }
`

/**
 * Format number with currency
 */
export function formatCurrency(amount: number, currencySymbol: string = '৳'): string {
  return `${currencySymbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Format date for PDF
 */
export function formatDateForPDF(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Export table data to CSV
 */
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle values with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}
