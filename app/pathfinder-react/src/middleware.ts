import { auth } from "@/auth"

export default auth((req) => {
  const { nextUrl } = req
  // Keep the middleware simple for now
  return null
})

// Don't run middleware on these paths
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
} 