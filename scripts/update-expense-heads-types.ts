import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = neon(process.env.DATABASE_URL)

async function updateExpenseHeads() {
  try {
    console.log('Starting expense heads update...\n')

    const updates = [
      // Revenue Accounts (Credit - Cr)
      { name: 'Apartment Sales', type: 'Cr', category: 'Revenue', unit: 'UNIT' },
      { name: 'Commercial Space Sales', type: 'Cr', category: 'Revenue', unit: 'SQ.FT' },
      { name: 'Parking Sales', type: 'Cr', category: 'Revenue', unit: 'UNIT' },
      { name: 'Service Charge', type: 'Cr', category: 'Revenue', unit: null },
      { name: 'Maintenance Fee', type: 'Cr', category: 'Revenue', unit: null },
      
      // Expense Accounts (Debit - Dr)
      { name: 'Bank Charge', type: 'Dr', category: 'Expenses', unit: null },
      { name: 'Construction Materials', type: 'Dr', category: 'Expenses', unit: null },
      { name: 'Contractor Bill', type: 'Dr', category: 'Expenses', unit: null },
      { name: 'Engineer/Consultant Fee', type: 'Dr', category: 'Expenses', unit: null },
      { name: 'Govt Approval Fee (CDA, Municipality)', type: 'Dr', category: 'Expenses', unit: null },
      { name: 'Labour Payment', type: 'Dr', category: 'Expenses', unit: null },
      { name: 'Legal & Audit', type: 'Dr', category: 'Expenses', unit: null },
      { name: 'Marketing & Promotion', type: 'Dr', category: 'Expenses', unit: null },
      { name: 'Office Rent', type: 'Dr', category: 'Expenses', unit: null },
      { name: 'Registration/Documentation Fee', type: 'Dr', category: 'Expenses', unit: null },
      { name: 'Salary', type: 'Dr', category: 'Expenses', unit: null },
      { name: 'Utilities (Electricity, Internet)', type: 'Dr', category: 'Expenses', unit: null },
      { name: 'Piling Construction', type: 'Dr', category: 'Expenses', unit: 'CFT' },
      
      // Asset Account (Debit - Dr)
      { name: 'Land Purchase', type: 'Dr', category: 'Fixed Assets', unit: 'KATHA' },
    ]

    let successCount = 0
    let notFoundCount = 0

    for (const update of updates) {
      // Check if record exists
      const existing = await sql`
        SELECT id FROM income_expense_heads WHERE head_name = ${update.name}
      `
      
      if (existing.length === 0) {
        console.log(`✗ Not found: ${update.name}`)
        notFoundCount++
        continue
      }

      // Update the record
      await sql`
        UPDATE income_expense_heads 
        SET type = ${update.type}, 
            unit = ${update.unit}
        WHERE head_name = ${update.name}
      `

      console.log(`✓ Updated: ${update.name}`)
      console.log(`  Type: ${update.type}, Category: ${update.category}, Unit: ${update.unit || '—'}`)
      successCount++
    }

    console.log(`\n===========================================`)
    console.log(`Update Summary:`)
    console.log(`✓ Successfully updated: ${successCount}`)
    console.log(`✗ Not found: ${notFoundCount}`)
    console.log(`===========================================\n`)

  } catch (error) {
    console.error('Error updating expense heads:', error)
    throw error
  }
}

updateExpenseHeads()
  .then(() => {
    console.log('Update completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Update failed:', error)
    process.exit(1)
  })
