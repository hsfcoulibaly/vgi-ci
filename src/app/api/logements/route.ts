import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const immeubleId = searchParams.get("immeubleId");

    const logements = await prisma.logement.findMany({
      where: immeubleId ? { immeubleId } : undefined,
      include: {
        immeuble: { select: { nom: true } },
        locataires: { where: { statut: "ACTIF" }, select: { nom: true, telephone: true } },
      },
      orderBy: { numero: "asc" },
    });
    return NextResponse.json(logements);
  } catch (err) {
    console.error("[GET /api/logements]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const role = (session.user as { role: string }).role;
  if (!["ADMIN", "RESPONSABLE"].includes(role))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const data = await req.json();
    const { numero, type, etage, loyer, caution, immeubleId } = data;
    const logement = await prisma.logement.create({ data: { numero, type, etage, loyer, caution, immeubleId } });
    return NextResponse.json(logement, { status: 201 });
  } catch (err) {
    console.error("[POST /api/logements]", err);
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}
