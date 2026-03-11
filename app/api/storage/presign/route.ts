import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if ((session.user as any).role !== "teacher") {
    return NextResponse.json(
      { error: "Only teachers can upload lesson resources" },
      { status: 403 },
    );
  }

  let body: { fileName?: string; fileType?: string; fileSize?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { fileName, fileType, fileSize } = body;

  if (!fileName || !fileType) {
    return NextResponse.json(
      { error: "fileName and fileType are required" },
      { status: 400 },
    );
  }

  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    return NextResponse.json(
      { error: "File type not allowed" },
      { status: 400 },
    );
  }

  if (fileSize && fileSize > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File exceeds maximum size of 200 MB" },
      { status: 400 },
    );
  }

  // Build a safe, unique storage key
  const ext = (fileName.split(".").pop() ?? "bin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const key = `resources/${session.user.id}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: fileType,
    ...(fileSize ? { ContentLength: fileSize } : {}),
  });

  const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 900 }); // 15 min
  const fileUrl = `${R2_PUBLIC_URL}/${key}`;

  return NextResponse.json({ presignedUrl, fileUrl, key });
}
