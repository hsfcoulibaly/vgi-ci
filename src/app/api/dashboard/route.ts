import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const now = new Date();
  const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [
    totalLogements,
    logementsOccupes,
    logementsLibres,
    locatairesActifs,
    paiementsMois,
    derniersPaiements,
  ] = await Promise.all([
    prisma.logement.count(),
    prisma.logement.count({ where: { statut: "OCCUPE" } }),
    prisma.logement.count({ where: { statut: "LIBRE" } }),
    prisma.locataire.count({ where: { statut: "ACTIF" } }),
    prisma.paiement.findMany({
      where: { moisConcerne: moisActuel },
      include: { locataire: { select: { nom: true } } },
    }),
    prisma.paiement.findMany({
      take: 5,
      orderBy: { datePaiement: "desc" },
      include: {
        locataire: { select: { nom: true } },
        logement: { include: { immeuble: { select: { nom: true } } } },
        agent: { select: { name: true } },
      },
    }),
  ]);

  const totalEncaisse = paiementsMois.reduce((s: number, p: { montant: number }) => s + p.montant, 0);
  const totalAttendu = await prisma.locataire.aggregate({
    where: { statut: "ACTIF" },
    _sum: { loyer: true },
  });

  const locatairesAJour = paiementsMois.filter((p) => p.statut === "COMPLET").length;
  const locatairesEnRetard = locatairesActifs - locatairesAJour;

  return NextResponse.json({
    moisActuel,
    totalLogements,
    logementsOccupes,
    logementsLibres,
    locatairesActifs,
    locatairesAJour,
    locatairesEnRetard: Math.max(0, locatairesEnRetard),
    totalAttendu: totalAttendu._sum.loyer ?? 0,
    totalEncaisse,
    resteAEncaisser: Math.max(0, (totalAttendu._sum.loyer ?? 0) - totalEncaisse),
    derniersPaiements,
  });
}
