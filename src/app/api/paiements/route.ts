import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const locataireId = searchParams.get("locataireId");
    const mois = searchParams.get("mois");

    const paiements = await prisma.paiement.findMany({
      where: {
        ...(locataireId ? { locataireId } : {}),
        ...(mois ? { moisConcerne: mois } : {}),
      },
      include: {
        locataire: { select: { nom: true } },
        logement: { include: { immeuble: { select: { nom: true } } } },
        agent: { select: { name: true } },
      },
      orderBy: { datePaiement: "desc" },
    });
    return NextResponse.json(paiements);
  } catch (err) {
    console.error("[GET /api/paiements]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const data = await req.json();
    const userId = (session.user as { id: string }).id;
    const { locataireId, logementId, moisConcerne, montant, montantDu, modePaiement, datePaiement, reference, commentaire, statut } = data;

    const paiement = await prisma.paiement.create({
      data: { locataireId, logementId, moisConcerne, montant, montantDu, modePaiement, datePaiement: new Date(datePaiement), reference, commentaire, statut, agentId: userId },
      include: {
        locataire: { select: { nom: true } },
        logement: { include: { immeuble: { select: { nom: true } } } },
        agent: { select: { name: true } },
      },
    });

    await prisma.historique.create({
      data: {
        action: "PAIEMENT_AJOUTE",
        details: `Paiement de ${montant} FCFA pour ${paiement.locataire.nom} - ${moisConcerne}`,
        entite: "PAIEMENT",
        entiteId: paiement.id,
        userId,
        paiementId: paiement.id,
      },
    });

    return NextResponse.json(paiement, { status: 201 });
  } catch (err) {
    console.error("[POST /api/paiements]", err);
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}
