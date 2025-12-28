import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, getUserRole } from "@/lib/permissions"

// Define routes that don't require authentication
const publicRoutes = ["/login", "/api/auth/login", "/api/auth/register"]

// Define API routes and their required permissions
const apiPermissions: { [key: string]: { module: string; permission: string } } = {
  "/api/employees": { module: "employees", permission: "show" },
  "/api/customers": { module: "customers", permission: "show" },
  "/api/vendors": { module: "vendors", permission: "show" },
  "/api/projects": { module: "projects", permission: "show" },
  "/api/products": { module: "products", permission: "show" },
  "/api/sales": { module: "sales", permission: "show" },
  "/api/purchase": { module: "purchase", permission: "show" },
  "/api/finance": { module: "finance", permission: "show" },
  "/api/accounting": { module: "ledger", permission: "show" },
  "/api/crm": { module: "crm", permission: "show" },
  "/api/constructors": { module: "constructors", permission: "show" },
  "/api/cheques": { module: "cheques", permission: "show" },
  "/api/advance-payables": { module: "advance_payables", permission: "show" },
}

// Map HTTP methods to permission names
const methodPermissionMap: { [key: string]: string } = {
  GET: "show",
  POST: "create",
  PUT: "edit",
  PATCH: "edit",
  DELETE: "delete",
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  const user = await getCurrentUser()
  
  if (!user) {
    // Redirect to login for protected routes
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    
    // Return 401 for API routes
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    return NextResponse.next()
  }

  // Check permissions for API routes
  if (pathname.startsWith("/api")) {
    // Get the base API route
    const apiRoute = Object.keys(apiPermissions).find(route => 
      pathname.startsWith(route)
    )

    if (apiRoute) {
      const { module, permission: basePermission } = apiPermissions[apiRoute]
      const method = request.method
      
      // Determine required permission based on HTTP method
      const requiredPermission = methodPermissionMap[method] || basePermission
      
      // Check if user has permission
      const hasAccess = await hasPermission(user.id, module, requiredPermission)
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Forbidden: You don't have permission to access this resource" },
          { status: 403 }
        )
      }
    }
  }

  // Check permissions for dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const pathParts = pathname.split("/").filter(Boolean)
    
    // If accessing a specific module (e.g., /dashboard/employees)
    if (pathParts.length >= 2) {
      const moduleName = pathParts[1].replace(/-/g, "_")
      
      // Check if user can access this module
      const canAccess = await hasPermission(user.id, moduleName, "module_show")
      
      if (!canAccess) {
        // Redirect to dashboard home with error
        const url = new URL("/dashboard", request.url)
        url.searchParams.set("error", "access_denied")
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
