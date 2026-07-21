import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const locataireId = searchParams.get("locataireId");
  const immeubleId = searchParams.get("immeubleId");
  const logementId = searchParams.get("logementId");

  try {
    const where = locataireId
      ? { locataireId }
      : immeubleId
      ? { immeubleId }
      : logementId
      ? { logementId }
      : {};

    const docs = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(docs);
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { nom, type, url, publicId, locataireId, immeubleId, logementId, paiementId } = await req.json();
    if (!nom || !url) return NextResponse.json({ error: "Nom et URL requis" }, { status: 400 });

    const doc = await prisma.document.create({
      data: { nom, type: type ?? "AUTRE", url, publicId, locataireId, immeubleId, logementId, paiementId },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}
