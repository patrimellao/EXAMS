import { NextResponse, type NextRequest } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    },
  );

  if (!session) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const role = (session.user as any).role;
  if (
    (request.nextUrl.pathname.startsWith('/teach') ||
      request.nextUrl.pathname.startsWith('/build')) &&
    role === 'student'
  ) {
    return NextResponse.redirect(new URL('/study', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static / _next/image (static assets)
     * - favicon.ico
     * - sign-in / sign-up (public auth pages)
     * - api/auth (Better Auth API — must never be intercepted)
     * - root path (/) for landing page
     * - image files
     */
    "/((?!_next/static|_next/image|favicon.ico|sign-in|sign-up|api/|manifest.json|^/$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
