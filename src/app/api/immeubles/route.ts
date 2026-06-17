import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const immeubles = await prisma.immeuble.findMany({
      include: { logements: true },
      orderBy: { nom: "asc" },
    });
    return NextResponse.json(immeubles);
  } catch (err) {
    console.error("[GET /api/immeubles]", err);
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
    const { nom, adresse, quartier, commune, proprietaire, description } = data;
    const immeuble = await prisma.immeuble.create({ data: { nom, adresse, quartier, commune, proprietaire, description } });
    return NextResponse.json(immeuble, { status: 201 });
  } catch (err) {
    console.error("[POST /api/immeubles]", err);
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}
