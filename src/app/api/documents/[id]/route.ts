import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as { role: string }).role;
  if (role !== "ADMIN" && role !== "RESPONSABLE")
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const { id } = await params;
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

    if (doc.publicId) {
      await deleteCloudinaryAsset(doc.publicId);
    }

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Erreur : " + String(err) }, { status: 500 });
  }
}
