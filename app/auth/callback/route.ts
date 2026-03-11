import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // OAuth callback is handled by Better Auth at /api/auth/[...all]
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/study`);
}
