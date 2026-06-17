import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const depenses = await prisma.depense.findMany({
      include: {
        immeuble: { select: { nom: true } },
        agent: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(depenses);
  } catch (err) {
    console.error("[GET /api/depenses]", err);
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
    const userId = (session.user as { id: string }).id;
    const { type, montant, date, fournisseur, commentaire, immeubleId } = data;
    const depense = await prisma.depense.create({
      data: { type, montant, date: new Date(date), fournisseur, commentaire, immeubleId, agentId: userId },
    });
    return NextResponse.json(depense, { status: 201 });
  } catch (err) {
    console.error("[POST /api/depenses]", err);
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}
