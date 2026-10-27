export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/parent/:path*",
    "/student/:path*",
  ],
};