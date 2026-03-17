import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/controllers/leaderboard";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subjectIdParam = searchParams.get("subjectId");
  const subjectId = subjectIdParam ? Number(subjectIdParam) : undefined;

  const data = await getLeaderboard(subjectId);
  return NextResponse.json(data);
}
