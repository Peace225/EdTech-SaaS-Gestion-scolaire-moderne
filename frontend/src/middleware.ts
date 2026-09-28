import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const role = (req.auth?.user as any)?.role
  const { pathname } = req.nextUrl

  // Routes publiques
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Non connecté -> login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Protection par rôle
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL(`/${role?.toLowerCase()}/dashboard`, req.url))
  }
  if (pathname.startsWith("/parent") && role !== "PARENT" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  if (pathname.startsWith("/teacher") && role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*", "/parent/:path*", "/teacher/:path*", "/student/:path*", "/dashboard/:path*"]
}
