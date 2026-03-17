import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLessonsForUnit, addLesson } from "@/controllers/lessons";
import { InsertLesson } from "@/schemas/lessons";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unitId = request.nextUrl.searchParams.get("unitId");
  if (!unitId) {
    return NextResponse.json({ error: "unitId is required" }, { status: 400 });
  }

  try {
    const data = await getLessonsForUnit(Number(unitId));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const lesson = await addLesson(body as InsertLesson);
    return NextResponse.json(lesson, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
