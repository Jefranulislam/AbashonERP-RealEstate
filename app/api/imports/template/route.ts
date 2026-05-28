import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-access"
import { getTemplateCsv, isImportModule } from "@/lib/import-templates"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await isAdminUser(user.id)
    if (!admin) {
      return NextResponse.json({ error: "Only Admin can use bulk import templates" }, { status: 403 })
    }

    const moduleName = String(request.nextUrl.searchParams.get("module") || "")
    if (!isImportModule(moduleName)) {
      return NextResponse.json({ error: "Invalid import module" }, { status: 400 })
    }

    const csv = getTemplateCsv(moduleName)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${moduleName}-template.csv"`,
      },
    })
  } catch (error) {
    console.error("[Imports Template] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
