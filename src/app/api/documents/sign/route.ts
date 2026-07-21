import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { signCloudinaryUpload } from "@/lib/cloudinary";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json({ error: "Cloudinary non configuré" }, { status: 503 });
  }

  const params = signCloudinaryUpload("vgi");
  return NextResponse.json(params);
}
