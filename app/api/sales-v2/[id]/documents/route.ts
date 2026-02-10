import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET - Get all documents for a sale
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const documents = await sql`
      SELECT 
        sd.*,
        e.name as uploaded_by_name
      FROM sale_documents sd
      LEFT JOIN employees e ON sd.uploaded_by = e.id
      WHERE sd.sale_id = ${id} AND sd.is_active = true
      ORDER BY sd.created_at DESC
    `

    // Group documents by type
    const grouped: Record<string, any[]> = {}
    const documentTypes = [
      'booking_form',
      'agreement',
      'nid_copy',
      'photo',
      'payment_receipt',
      'handover_letter',
      'other'
    ]

    documentTypes.forEach(type => {
      grouped[type] = documents.filter((d: any) => d.document_type === type)
    })

    return NextResponse.json({ 
      documents,
      grouped,
      totalCount: documents.length
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Upload/Add a document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Validate required fields
    if (!data.documentType || !data.documentUrl) {
      return NextResponse.json({ 
        error: "documentType and documentUrl are required" 
      }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO sale_documents (
        sale_id, document_type, document_name, document_url
      ) VALUES (
        ${id},
        ${data.documentType},
        ${data.documentName || data.documentType},
        ${data.documentUrl}
      )
      RETURNING *
    `

    // Log activity
    await sql`
      INSERT INTO sale_activities (
        sale_id, activity_type, description
      ) VALUES (
        ${id},
        'document_uploaded',
        ${'Document uploaded: ' + (data.documentName || data.documentType)}
      )
    `

    return NextResponse.json({ 
      success: true, 
      document: result[0],
      message: "Document uploaded successfully"
    })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Remove a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 })
    }

    // Get document info before deleting
    const doc = await sql`
      SELECT * FROM sale_documents WHERE id = ${documentId} AND sale_id = ${id}
    `

    if (doc.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Soft delete
    await sql`
      UPDATE sale_documents
      SET is_active = false
      WHERE id = ${documentId}
    `

    // Log activity
    await sql`
      INSERT INTO sale_activities (
        sale_id, activity_type, description
      ) VALUES (
        ${id},
        'document_deleted',
        ${'Document deleted: ' + doc[0].document_name}
      )
    `

    return NextResponse.json({ success: true, message: "Document deleted" })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
