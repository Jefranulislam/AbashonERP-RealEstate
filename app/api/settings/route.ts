import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await sql`
      SELECT * FROM settings ORDER BY id DESC LIMIT 1
    `

    return NextResponse.json({ settings: settings[0] || null })
  } catch (error) {
    console.error("[v0] Error fetching settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[v0] Settings POST - Body keys:", Object.keys(body))
    
    const {
      company_name,
      invoice_prefix,
      address,
      payment_methods,
      lead_status,
      lead_source,
      print_on_company_pad,
      currency_code,
      currency_symbol,
      product_types,
      company_logo,
      footer_image,
      background_image,
    } = body

    // Log image URLs for debugging
    if (company_logo) {
      console.log("[v0] Company logo URL:", company_logo)
    }
    if (footer_image) {
      console.log("[v0] Footer image URL:", footer_image)
    }
    if (background_image) {
      console.log("[v0] Background image URL:", background_image)
    }

    // Check if settings exist
    const existingSettings = await sql`
      SELECT id FROM settings ORDER BY id DESC LIMIT 1
    `

    let result
    if (existingSettings.length > 0) {
      // Update existing settings
      result = await sql`
        UPDATE settings
        SET
          company_name = ${company_name},
          invoice_prefix = ${invoice_prefix},
          address = ${address},
          payment_methods = ${payment_methods},
          lead_status = ${lead_status},
          lead_source = ${lead_source},
          print_on_company_pad = ${print_on_company_pad === 'Yes' || print_on_company_pad === true},
          currency_code = ${currency_code || 'BDT'},
          currency_symbol = ${currency_symbol || '৳'},
          product_types = ${product_types || 'Residential,Commercial,Apartment,Studio,Parking,Gas Line,Others'},
          company_logo = ${company_logo || null},
          footer_image = ${footer_image || null},
          background_image = ${background_image || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingSettings[0].id}
        RETURNING *
      `
    } else {
      // Insert new settings
      result = await sql`
        INSERT INTO settings (
          company_name,
          invoice_prefix,
          address,
          payment_methods,
          lead_status,
          lead_source,
          print_on_company_pad,
          currency_code,
          currency_symbol,
          product_types,
          company_logo,
          footer_image,
          background_image
        )
        VALUES (
          ${company_name},
          ${invoice_prefix},
          ${address},
          ${payment_methods},
          ${lead_status},
          ${lead_source},
          ${print_on_company_pad === 'Yes' || print_on_company_pad === true},
          ${currency_code || 'BDT'},
          ${currency_symbol || '৳'},
          ${product_types || 'Residential,Commercial,Apartment,Studio,Parking,Gas Line,Others'},
          ${company_logo || null},
          ${footer_image || null},
          ${background_image || null}
        )
        RETURNING *
      `
    }

    return NextResponse.json({
      success: true,
      settings: result[0],
    })
  } catch (error) {
    console.error("[v0] Error saving settings:", error)
    
    // Check if it's a database size limit error
    if (error instanceof Error && error.message.includes('value too long')) {
      return NextResponse.json({ 
        error: "Image file too large. Please use images smaller than 1MB." 
      }, { status: 413 })
    }
    
    return NextResponse.json({ 
      error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error")
    }, { status: 500 })
  }
}
