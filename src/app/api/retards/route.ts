import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const now = new Date();
  const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const locatairesActifs = await prisma.locataire.findMany({
    where: { statut: "ACTIF" },
    include: {
      logement: { include: { immeuble: { select: { nom: true, id: true } } } },
      paiements: { orderBy: { datePaiement: "desc" }, take: 3 },
    },
  });

  const retards = locatairesActifs.map((loc) => {
    const paiementsMois = loc.paiements.filter((p) => p.moisConcerne === moisActuel);
    const aPaye = paiementsMois.length > 0 && paiementsMois.some((p) => p.statut === "COMPLET");
    const montantPaye = paiementsMois.reduce((s, p) => s + p.montant, 0);
    const resteADu = loc.loyer - montantPaye;
    const dernierPaiement = loc.paiements[0];

    let statut = "A_JOUR";
    if (!aPaye) {
      if (now.getDate() > 15) statut = "RETARD_IMPORTANT";
      else if (now.getDate() > 5) statut = "RETARD_LEGER";
    }
    if (resteADu > 0 && resteADu < loc.loyer) statut = "RETARD_LEGER";
    if (loc.statut === "LITIGE") statut = "LITIGE";

    return {
      locataire: { id: loc.id, nom: loc.nom, telephone: loc.telephone },
      immeuble: loc.logement.immeuble.nom,
      logement: loc.logement.numero,
      loyer: loc.loyer,
      montantPaye,
      resteADu: Math.max(0, resteADu),
      statut,
      dernierPaiement: dernierPaiement
        ? { date: dernierPaiement.datePaiement, montant: dernierPaiement.montant }
        : null,
    };
  });

  return NextResponse.json(retards.filter((r) => r.statut !== "A_JOUR"));
}
