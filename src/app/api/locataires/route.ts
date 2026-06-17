import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const statut = searchParams.get("statut");
    const q = searchParams.get("q");

    const locataires = await prisma.locataire.findMany({
      where: {
        ...(statut ? { statut } : {}),
        ...(q ? { OR: [{ nom: { contains: q } }, { telephone: { contains: q } }] } : {}),
      },
      include: {
        logement: { include: { immeuble: { select: { nom: true } } } },
        paiements: { orderBy: { datePaiement: "desc" }, take: 1 },
      },
      orderBy: { nom: "asc" },
    });
    return NextResponse.json(locataires);
  } catch (err) {
    console.error("[GET /api/locataires]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const data = await req.json();
    const { nom, telephone, email, whatsapp, pieceIdentite, dateEntree, loyer, caution, contactUrgence, logementId } = data;

    if (!logementId) return NextResponse.json({ error: "logementId requis" }, { status: 400 });

    const [locataire] = await prisma.$transaction([
      prisma.locataire.create({
        data: { nom, telephone, email, whatsapp, pieceIdentite, dateEntree: new Date(dateEntree), loyer, caution, contactUrgence, logementId },
      }),
      prisma.logement.update({
        where: { id: logementId },
        data: { statut: "OCCUPE" },
      }),
    ]);

    return NextResponse.json(locataire, { status: 201 });
  } catch (err) {
    console.error("[POST /api/locataires]", err);
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}
