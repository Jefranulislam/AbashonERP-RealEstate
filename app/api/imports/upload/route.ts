import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { parse as parseCsv } from "csv-parse/sync"
import { getCurrentUser } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-access"
import { sql } from "@/lib/db"
import { isImportModule, type ImportModule } from "@/lib/import-templates"
import { buildVoucherNo, normalizeVoucherType } from "@/lib/voucher-utils"
import { ensureVendorCodeSchema, getNextVendorCode } from "@/lib/vendor-code"

type Row = Record<string, any>

type ImportResult = {
  totalRows: number
  successRows: number
  failedRows: number
  errors: Array<{ row: number; message: string }>
}

function normalizeKey(value: string): string {
  return String(value || "").trim().toLowerCase()
}

function toNumber(value: any, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function toBoolean(value: any, fallback = false): boolean {
  const str = String(value ?? "").trim().toLowerCase()
  if (["1", "true", "yes", "y"].includes(str)) return true
  if (["0", "false", "no", "n"].includes(str)) return false
  return fallback
}

function toDateString(value: any): string {
  if (!value) return new Date().toISOString().split("T")[0]
  if (typeof value === "number") {
    const excelDate = XLSX.SSF.parse_date_code(value)
    if (excelDate) {
      const d = new Date(Date.UTC(excelDate.y, excelDate.m - 1, excelDate.d))
      return d.toISOString().split("T")[0]
    }
  }
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return new Date().toISOString().split("T")[0]
  return d.toISOString().split("T")[0]
}

async function parseFileToRows(file: File): Promise<Row[]> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const name = file.name.toLowerCase()

  if (name.endsWith(".csv")) {
    const raw = buffer.toString("utf8")
    return parseCsv(raw, { columns: true, skip_empty_lines: true, trim: true }) as Row[]
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    return XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" })
  }

  throw new Error("Unsupported file type. Please upload CSV or XLSX")
}

async function buildLookups() {
  const [projects, customers, products, vendors, employees, expenseHeads, bankCash, requisitions, purchaseOrders] = await Promise.all([
    sql`SELECT id, project_name FROM projects WHERE is_active = true`,
    sql`SELECT id, customer_name, phone FROM customers WHERE is_active = true`,
    sql`SELECT id, product_name, unit_no FROM products WHERE is_active = true`,
    sql`SELECT id, vendor_name, vendor_code FROM vendors WHERE is_active = true`,
    sql`SELECT id, name FROM employees WHERE is_active = true`,
    sql`SELECT id, head_name FROM income_expense_heads WHERE is_active = true`,
    sql`SELECT id, account_title FROM bank_cash_accounts WHERE is_active = true`,
    sql`SELECT id, mpr_no FROM purchase_requisitions`,
    sql`SELECT id, po_number FROM purchase_orders`,
  ])

  const mapBy = (rows: any[], keyField: string) => {
    const map = new Map<string, number>()
    for (const row of rows) {
      map.set(normalizeKey(row[keyField]), Number(row.id))
    }
    return map
  }

  return {
    projectsByName: mapBy(projects, "project_name"),
    projectsById: mapBy(projects, "id"),
    customersByName: mapBy(customers, "customer_name"),
    customersById: mapBy(customers, "id"),
    customersByPhone: (() => {
      const m = new Map<string, number>()
      for (const c of customers) {
        if (c.phone) m.set(normalizeKey(c.phone), Number(c.id))
      }
      return m
    })(),
    productsByName: mapBy(products, "product_name"),
    productsById: mapBy(products, "id"),
    productsByUnitNo: (() => {
      const m = new Map<string, number>()
      for (const p of products) {
        if (p.unit_no) m.set(normalizeKey(p.unit_no), Number(p.id))
      }
      return m
    })(),
    vendorsByName: mapBy(vendors, "vendor_name"),
    vendorsByCode: mapBy(vendors, "vendor_code"),
    vendorsById: mapBy(vendors, "id"),
    employeesByName: mapBy(employees, "name"),
    employeesById: mapBy(employees, "id"),
    expenseHeadsByName: mapBy(expenseHeads, "head_name"),
    expenseHeadsByAccountCode: mapBy(expenseHeads, "account_code"),
    expenseHeadsById: mapBy(expenseHeads, "id"),
    bankCashByTitle: mapBy(bankCash, "account_title"),
    bankCashById: mapBy(bankCash, "id"),
    requisitionsByMprNo: mapBy(requisitions, "mpr_no"),
    purchaseOrdersByNumber: mapBy(purchaseOrders, "po_number"),
    purchaseOrdersById: mapBy(purchaseOrders, "id"),
  }
}

function resolveId(map: Map<string, number>, value: any): number | null {
  const key = normalizeKey(String(value || ""))
  if (!key) return null
  return map.get(key) ?? null
}

function resolveFirstRowValue(row: Row, keys: string[]): any {
  for (const key of keys) {
    const value = row[key]
    if (String(value ?? "").trim()) return value
  }
  return null
}

function resolveVendorId(lookups: Awaited<ReturnType<typeof buildLookups>>, row: Row): number | null {
  return (
    resolveId(lookups.vendorsByName, resolveFirstRowValue(row, ["vendor_name", "vendor"])) ??
    resolveId(lookups.vendorsByCode, resolveFirstRowValue(row, ["vendor_code", "vendor_id", "vendor_serial"])) ??
    resolveId(lookups.vendorsById, resolveFirstRowValue(row, ["vendor_record_id", "id"]))
  )
}

function resolveProjectId(lookups: Awaited<ReturnType<typeof buildLookups>>, row: Row): number | null {
  return (
    resolveId(lookups.projectsByName, resolveFirstRowValue(row, ["project_name", "project"])) ??
    resolveId(lookups.projectsById, resolveFirstRowValue(row, ["project_id"]))
  )
}

function resolveCustomerId(lookups: Awaited<ReturnType<typeof buildLookups>>, row: Row): number | null {
  return (
    resolveId(lookups.customersByName, resolveFirstRowValue(row, ["customer_name", "customer"])) ??
    resolveId(lookups.customersByPhone, resolveFirstRowValue(row, ["customer_phone", "phone"])) ??
    resolveId(lookups.customersById, resolveFirstRowValue(row, ["customer_id"]))
  )
}

function resolveProductId(lookups: Awaited<ReturnType<typeof buildLookups>>, row: Row): number | null {
  return (
    resolveId(lookups.productsByUnitNo, resolveFirstRowValue(row, ["unit_no"])) ??
    resolveId(lookups.productsByName, resolveFirstRowValue(row, ["product_name", "product"])) ??
    resolveId(lookups.productsById, resolveFirstRowValue(row, ["product_id"]))
  )
}

function resolveBankCashId(lookups: Awaited<ReturnType<typeof buildLookups>>, row: Row): number | null {
  return (
    resolveId(lookups.bankCashByTitle, resolveFirstRowValue(row, ["bank_account_title", "bank_account_name", "bank_account"])) ??
    resolveId(lookups.bankCashById, resolveFirstRowValue(row, ["bank_account_id", "cash_account_id"]))
  )
}

function resolveExpenseHeadId(lookups: Awaited<ReturnType<typeof buildLookups>>, row: Row): number | null {
  return (
    resolveId(lookups.expenseHeadsByName, resolveFirstRowValue(row, ["expense_head_name", "head_name", "expense_head"])) ??
    resolveId(lookups.expenseHeadsByAccountCode, resolveFirstRowValue(row, ["expense_head_code", "account_code", "head_code"])) ??
    resolveId(lookups.expenseHeadsById, resolveFirstRowValue(row, ["expense_head_id", "head_id"]))
  )
}

async function importTransactions(rows: Row[], lookups: Awaited<ReturnType<typeof buildLookups>>): Promise<ImportResult> {
  const result: ImportResult = { totalRows: rows.length, successRows: 0, failedRows: 0, errors: [] }

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    try {
      const voucherTypeInput = String(row.voucher_type || "")
      const voucherType = normalizeVoucherType(voucherTypeInput)
      if (!voucherType) throw new Error("voucher_type is required (Credit/Debit/Journal/Contra)")

      const date = toDateString(row.date)
      const amount = toNumber(row.amount)
      if (amount <= 0) throw new Error("amount must be greater than 0")

      const countRows = await sql`
        SELECT COUNT(*)::int AS count
        FROM vouchers
        WHERE CASE
          WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
          WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
          WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
          WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
          ELSE voucher_type
        END = ${voucherType}
      `
      const serial = Number(countRows[0]?.count || 0) + 1
      const voucherNo = buildVoucherNo(voucherType, serial, new Date(date).getFullYear())

      const projectId = resolveProjectId(lookups, row)
      const expenseHeadId = resolveExpenseHeadId(lookups, row)
      const bankCashId = resolveBankCashId(lookups, row)

      if (voucherType === "Journal") {
        const drExpenseHeadId = resolveExpenseHeadId(lookups, { ...row, expense_head_name: row.dr_expense_head_name, expense_head_code: row.dr_expense_head_code })
        const crExpenseHeadId = resolveExpenseHeadId(lookups, { ...row, expense_head_name: row.cr_expense_head_name, expense_head_code: row.cr_expense_head_code })
        const drAmount = toNumber(row.dr_amount, amount)
        const crAmount = toNumber(row.cr_amount, amount)

        if (!drExpenseHeadId || !crExpenseHeadId) {
          throw new Error("Journal rows require dr_expense_head_name and cr_expense_head_name")
        }
        if (Math.abs(drAmount - crAmount) > 0.0001) {
          throw new Error("Journal dr_amount and cr_amount must match")
        }

        const voucherRows = await sql`
          INSERT INTO vouchers (
            voucher_no, voucher_type, project_id, bill_no, date, amount, particulars, is_confirmed
          ) VALUES (
            ${voucherNo}, 'Journal', ${projectId}, ${row.bill_no || null}, ${date}, ${drAmount}, ${row.particulars || null}, ${toBoolean(row.is_confirmed)}
          )
          RETURNING id
        `
        const voucherId = Number(voucherRows[0].id)

        await sql`
          INSERT INTO journal_voucher_details (
            voucher_id, project_id, expense_head_id, debit_amount, credit_amount
          ) VALUES
            (${voucherId}, ${projectId}, ${drExpenseHeadId}, ${drAmount}, 0),
            (${voucherId}, ${projectId}, ${crExpenseHeadId}, 0, ${crAmount})
        `
      } else if (voucherType === "Contra") {
        const drBankId = resolveId(lookups.bankCashByTitle, row.dr_bank_account_title)
        const crBankId = resolveId(lookups.bankCashByTitle, row.cr_bank_account_title)
        if (!drBankId || !crBankId) {
          throw new Error("Contra rows require dr_bank_account_title and cr_bank_account_title")
        }

        await sql`
          INSERT INTO vouchers (
            voucher_no, voucher_type, project_id, dr_bank_cash_id, cr_bank_cash_id, date, amount,
            description, cheque_number, is_confirmed
          ) VALUES (
            ${voucherNo}, 'Contra', ${projectId}, ${drBankId}, ${crBankId}, ${date}, ${amount},
            ${row.particulars || row.description || null}, ${row.cheque_number || null}, ${toBoolean(row.is_confirmed)}
          )
        `
      } else {
        // Resolve vendor_id if vendor_name is provided
        const vendorId = row.vendor_name ? resolveId(lookups.vendorsByName, row.vendor_name) : null
        const referencePartyType = row.reference_party_type ? String(row.reference_party_type).toUpperCase().trim() : null
        const referencePartyName = row.reference_party_name ? String(row.reference_party_name).trim() : null

        // Validate that either vendor_id or reference_party_name is provided
        if (!vendorId && !referencePartyName) {
          throw new Error("Either vendor_name or reference_party_name must be provided")
        }

        // If reference_party_name is provided, reference_party_type must be set
        if (referencePartyName && !referencePartyType) {
          throw new Error("reference_party_type must be specified when reference_party_name is provided")
        }

        // Auto-populate reference_party_type as VENDOR if vendor_id is provided
        const finalReferencePartyType = vendorId && !referencePartyType ? "VENDOR" : referencePartyType

        await sql`
          INSERT INTO vouchers (
            voucher_no, voucher_type, project_id, expense_head_id, bank_cash_id,
            bill_no, date, amount, particulars, cheque_number, is_confirmed,
            vendor_id, reference_party_type, reference_party_name
          ) VALUES (
            ${voucherNo}, ${voucherType}, ${projectId}, ${expenseHeadId}, ${bankCashId},
            ${row.bill_no || null}, ${date}, ${amount}, ${row.particulars || null}, ${row.cheque_number || null}, ${toBoolean(row.is_confirmed)},
            ${vendorId || null}, ${finalReferencePartyType || null}, ${referencePartyName || null}
          )
        `
      }

      result.successRows += 1
    } catch (error) {
      result.failedRows += 1
      result.errors.push({ row: i + 2, message: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  return result
}

async function importSales(rows: Row[], lookups: Awaited<ReturnType<typeof buildLookups>>): Promise<ImportResult> {
  const result: ImportResult = { totalRows: rows.length, successRows: 0, failedRows: 0, errors: [] }

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    try {
      const customerId = resolveCustomerId(lookups, row)
      const projectId = resolveProjectId(lookups, row)
      const productId = resolveProductId(lookups, row)

      if (!customerId || !projectId || !productId) {
        throw new Error("customer_name/customer_phone, project_name, and product_name/unit_no are required and must exist")
      }

      const saleNo = String(row.sale_no || "").trim()
      const saleDate = toDateString(row.sale_date || row.booking_date)
      const bookingDate = toDateString(row.booking_date || row.sale_date)
      const basePrice = toNumber(row.base_price)
      const discountAmount = toNumber(row.discount_amount)
      const netPrice = toNumber(row.net_price, Math.max(basePrice - discountAmount, 0))
      const bookingAmount = toNumber(row.booking_amount)
      const downPayment = toNumber(row.down_payment)
      const totalPaid = toNumber(row.total_paid, bookingAmount)

      const outstanding = netPrice - totalPaid

      await sql`
        INSERT INTO sales (
          sale_no, sale_type, sale_status, customer_id, seller_id, project_id, product_id,
          sale_date, booking_date, base_price, discount_amount, net_price,
          booking_amount, down_payment, total_paid, outstanding_amount,
          payment_plan, notes, is_active
        ) VALUES (
          ${saleNo || `SALE-${Date.now()}-${i + 1}`},
          'booking',
          ${String(row.sale_status || 'booked')},
          ${customerId},
          ${null},
          ${projectId},
          ${productId},
          ${saleDate},
          ${bookingDate},
          ${basePrice},
          ${discountAmount},
          ${netPrice},
          ${bookingAmount},
          ${downPayment},
          ${totalPaid},
          ${outstanding},
          ${String(row.payment_plan || 'custom')},
          ${row.notes || null},
          true
        )
      `

      await sql`UPDATE products SET status = 'booked', updated_at = CURRENT_TIMESTAMP WHERE id = ${productId}`

      result.successRows += 1
    } catch (error) {
      result.failedRows += 1
      result.errors.push({ row: i + 2, message: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  return result
}

async function importDeliveries(rows: Row[], lookups: Awaited<ReturnType<typeof buildLookups>>): Promise<ImportResult> {
  const result: ImportResult = { totalRows: rows.length, successRows: 0, failedRows: 0, errors: [] }

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    try {
      const deliveryNumber = String(row.delivery_number || "").trim()
      if (!deliveryNumber) throw new Error("delivery_number is required")

      const poId = resolveId(lookups.purchaseOrdersByNumber, row.po_number) ?? resolveId(lookups.purchaseOrdersById, row.po_id)
      const vendorId = resolveVendorId(lookups, row)
      const projectId = resolveProjectId(lookups, row)

      await sql`
        INSERT INTO material_deliveries (
          delivery_number, po_id, vendor_id, project_id,
          delivery_date, received_date,
          material_type, material_specification,
          delivered_qty, accepted_qty, rejected_qty,
          unit_of_measurement, delivery_status, quality_status, remarks,
          is_active
        ) VALUES (
          ${deliveryNumber}, ${poId}, ${vendorId}, ${projectId},
          ${toDateString(row.delivery_date)}, ${toDateString(row.received_date)},
          ${row.material_type || null}, ${row.material_specification || null},
          ${toNumber(row.delivered_qty)}, ${toNumber(row.accepted_qty)}, ${toNumber(row.rejected_qty)},
          ${row.unit_of_measurement || null}, ${row.delivery_status || 'Received'}, ${row.quality_status || 'Passed'}, ${row.remarks || null},
          true
        )
      `

      result.successRows += 1
    } catch (error) {
      result.failedRows += 1
      result.errors.push({ row: i + 2, message: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  return result
}

async function importRequisitions(rows: Row[], lookups: Awaited<ReturnType<typeof buildLookups>>): Promise<ImportResult> {
  const result: ImportResult = { totalRows: rows.length, successRows: 0, failedRows: 0, errors: [] }

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    try {
      const projectId = resolveProjectId(lookups, row)
      const employeeId = resolveId(lookups.employeesByName, row.employee_name) ?? resolveId(lookups.employeesById, row.employee_id)
      const expenseHeadId = resolveExpenseHeadId(lookups, row)

      if (!projectId || !employeeId || !expenseHeadId) {
        throw new Error("project_name, employee_name, and expense_head_name must exist")
      }

      const qty = toNumber(row.qty)
      const rate = toNumber(row.rate)
      const totalPrice = qty * rate

      const countRows = await sql`SELECT COUNT(*)::int AS count FROM purchase_requisitions`
      const mprNo = String(row.mpr_no || `MPR${String(Number(countRows[0]?.count || 0) + 1).padStart(6, "0")}`)

      const reqRows = await sql`
        INSERT INTO purchase_requisitions (
          mpr_no, project_id, employee_id, purpose_description, requisition_date,
          required_date, total_amount, is_confirmed
        ) VALUES (
          ${mprNo}, ${projectId}, ${employeeId}, ${row.purpose_description || null}, ${toDateString(row.requisition_date)},
          ${row.required_date ? toDateString(row.required_date) : null}, ${totalPrice}, ${toBoolean(row.is_confirmed)}
        )
        RETURNING id
      `

      const requisitionId = Number(reqRows[0].id)

      await sql`
        INSERT INTO purchase_requisition_items (
          requisition_id, expense_head_id, description, qty, rate, total_price
        ) VALUES (
          ${requisitionId}, ${expenseHeadId}, ${row.description || null}, ${qty}, ${rate}, ${totalPrice}
        )
      `

      result.successRows += 1
    } catch (error) {
      result.failedRows += 1
      result.errors.push({ row: i + 2, message: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  return result
}

async function importPurchaseOrders(rows: Row[], lookups: Awaited<ReturnType<typeof buildLookups>>): Promise<ImportResult> {
  const result: ImportResult = { totalRows: rows.length, successRows: 0, failedRows: 0, errors: [] }

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    try {
      const vendorId = resolveId(lookups.vendorsByName, row.vendor_name)
      const projectId = resolveProjectId(lookups, row)
      const expenseHeadId = resolveExpenseHeadId(lookups, row)

      if (!vendorId || !expenseHeadId) {
        throw new Error("vendor_name/vendor_id and expense_head_name/expense_head_code must exist")
      }

      const qty = toNumber(row.qty)
      const rate = toNumber(row.rate)
      const amount = qty * rate

      let poNumber = String(row.po_number || "").trim()
      if (!poNumber) {
        const year = new Date().getFullYear()
        const lastPO = await sql`
          SELECT po_number FROM purchase_orders
          WHERE po_number LIKE ${`PO-${year}-%`}
          ORDER BY created_at DESC LIMIT 1
        `
        const lastNum = lastPO.length > 0 ? parseInt(String(lastPO[0].po_number).split("-")[2], 10) : 0
        poNumber = `PO-${year}-${String(lastNum + 1).padStart(4, "0")}`
      }

      const orderRows = await sql`
        INSERT INTO purchase_orders (
          po_number, vendor_id, project_id, order_date, expected_delivery_date,
          subtotal, discount_percentage, discount_amount, tax_percentage, tax_amount, total_amount,
          payment_terms, delivery_terms, status, notes, is_active
        ) VALUES (
          ${poNumber}, ${vendorId}, ${projectId}, ${toDateString(row.order_date)}, ${row.expected_delivery_date ? toDateString(row.expected_delivery_date) : null},
          ${amount}, 0, 0, 0, 0, ${amount},
          ${row.payment_terms || null}, ${row.delivery_terms || null}, ${row.status || 'Draft'}, ${row.notes || null}, true
        )
        RETURNING id
      `

      const poId = Number(orderRows[0].id)

      await sql`
        INSERT INTO purchase_order_items (
          po_id, expense_head_id, description,
          qty, unit_of_measurement, rate, amount, remaining_qty
        ) VALUES (
          ${poId}, ${expenseHeadId}, ${row.description || null},
          ${qty}, ${row.unit_of_measurement || null}, ${rate}, ${amount}, ${qty}
        )
      `

      result.successRows += 1
    } catch (error) {
      result.failedRows += 1
      result.errors.push({ row: i + 2, message: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  return result
}

async function importVendors(rows: Row[]): Promise<ImportResult> {
  const result: ImportResult = { totalRows: rows.length, successRows: 0, failedRows: 0, errors: [] }

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    try {
      const vendorName = String(row.vendor_name || "").trim()
      if (!vendorName) {
        throw new Error("vendor_name is required")
      }

      const providedVendorCode = String(row.vendor_code || "").trim()

      const mailingAddress = String(row.mailing_address || "").trim() || null
      const website = String(row.website || "").trim() || null
      const phone = String(row.phone || "").trim() || null
      const email = String(row.email || "").trim() || null
      const description = String(row.description || "").trim() || null
      
      // Bank information
      const bankName = String(row.bank_name || "").trim() || null
      const bankAccountNumber = String(row.bank_account_number || "").trim() || null
      const bankAccountName = String(row.bank_account_name || "").trim() || null
      const bankBranch = String(row.bank_branch || "").trim() || null
      const bankRoutingNumber = String(row.bank_routing_number || "").trim() || null
      const bankSwiftCode = String(row.bank_swift_code || "").trim() || null
      
      // Materials (comma-separated string converted to array)
      const materialsStr = String(row.materials || "").trim()
      const materials = materialsStr ? materialsStr.split(",").map(m => m.trim()).filter(m => m.length > 0) : []
      
      const isActive = toBoolean(row.is_active, true)

      // Check if vendor already exists
      const existingVendor = await sql`
        SELECT id, vendor_code FROM vendors
        WHERE LOWER(TRIM(vendor_name)) = ${vendorName.toLowerCase()}
        LIMIT 1
      `

      const vendorCode = providedVendorCode || String(existingVendor[0]?.vendor_code || "").trim() || await getNextVendorCode()

      if (existingVendor.length > 0) {
        // Update existing vendor
        await sql`
          UPDATE vendors
          SET
            vendor_code = ${vendorCode},
            mailing_address = ${mailingAddress},
            website = ${website},
            phone = ${phone},
            email = ${email},
            description = ${description},
            bank_name = ${bankName},
            bank_account_number = ${bankAccountNumber},
            bank_account_name = ${bankAccountName},
            bank_branch = ${bankBranch},
            bank_routing_number = ${bankRoutingNumber},
            bank_swift_code = ${bankSwiftCode},
            materials = ${materials.length > 0 ? materials : null},
            is_active = ${isActive},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existingVendor[0].id}
        `
      } else {
        // Create new vendor
        await sql`
          INSERT INTO vendors (
            vendor_code, vendor_name, mailing_address, website, phone, email, description,
            bank_name, bank_account_number, bank_account_name, bank_branch, bank_routing_number, bank_swift_code,
            materials, is_active
          ) VALUES (
            ${vendorCode}, ${vendorName}, ${mailingAddress}, ${website}, ${phone}, ${email}, ${description},
            ${bankName}, ${bankAccountNumber}, ${bankAccountName}, ${bankBranch}, ${bankRoutingNumber}, ${bankSwiftCode},
            ${materials.length > 0 ? materials : null}, ${isActive}
          )
        `
      }

      result.successRows += 1
    } catch (error) {
      result.failedRows += 1
      result.errors.push({ row: i + 2, message: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await isAdminUser(user.id)
    if (!admin) {
      return NextResponse.json({ error: "Only Admin can run bulk imports" }, { status: 403 })
    }

    const formData = await request.formData()
    const moduleName = String(formData.get("module") || "")
    const file = formData.get("file") as File | null

    if (!isImportModule(moduleName)) {
      return NextResponse.json({ error: "Invalid module" }, { status: 400 })
    }
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    await ensureVendorCodeSchema()

    const rows = await parseFileToRows(file)
    if (rows.length === 0) {
      return NextResponse.json({ error: "No rows found in file" }, { status: 400 })
    }

    const lookups = await buildLookups()

    let result: ImportResult
    switch (moduleName as ImportModule) {
      case "vendors":
        result = await importVendors(rows)
        break
      case "transactions":
        result = await importTransactions(rows, lookups)
        break
      case "sales":
        result = await importSales(rows, lookups)
        break
      case "product_delivery_received":
        result = await importDeliveries(rows, lookups)
        break
      case "purchase_requisitions":
        result = await importRequisitions(rows, lookups)
        break
      case "purchase_orders":
        result = await importPurchaseOrders(rows, lookups)
        break
      default:
        return NextResponse.json({ error: "Unsupported module" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      module: moduleName,
      ...result,
      errors: result.errors.slice(0, 100),
    })
  } catch (error) {
    console.error("[Imports Upload] Error:", error)
    return NextResponse.json({ error: "Import failed" }, { status: 500 })
  }
}
