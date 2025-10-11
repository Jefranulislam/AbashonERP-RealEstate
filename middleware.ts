import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")
  const isAuthPage = request.nextUrl.pathname.startsWith("/login")
  const isApiAuthRoute = request.nextUrl.pathname.startsWith("/api/auth")

  // Allow auth API routes
  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect to dashboard if authenticated and trying to access login
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
