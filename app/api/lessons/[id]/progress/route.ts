import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markLessonComplete } from "@/controllers/lessons";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const timeSpentSeconds = body?.timeSpentSeconds ?? 0;
    const result = await markLessonComplete(
      Number(params.id),
      session.user.id,
      timeSpentSeconds
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
