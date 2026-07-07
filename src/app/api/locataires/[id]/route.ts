import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  if ((session.user as { role: string }).role !== "ADMIN")
    return { error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  return { session };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const { nom, telephone, email, whatsapp, pieceIdentite, contactUrgence, loyer, caution, statut, dateEntree } = await req.json();
    const data: Record<string, unknown> = {};
    if (nom !== undefined) data.nom = nom;
    if (telephone !== undefined) data.telephone = telephone;
    if (email !== undefined) data.email = email;
    if (whatsapp !== undefined) data.whatsapp = whatsapp;
    if (pieceIdentite !== undefined) data.pieceIdentite = pieceIdentite;
    if (contactUrgence !== undefined) data.contactUrgence = contactUrgence;
    if (loyer !== undefined) data.loyer = Number(loyer);
    if (caution !== undefined) data.caution = Number(caution);
    if (statut !== undefined) data.statut = statut;
    if (dateEntree !== undefined) data.dateEntree = new Date(dateEntree);

    const locataire = await prisma.locataire.update({ where: { id }, data });

    // If marked SORTI, set logement to LIBRE
    if (statut === "SORTI") {
      await prisma.logement.update({ where: { id: locataire.logementId }, data: { statut: "LIBRE" } });
    }

    return NextResponse.json(locataire);
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const locataire = await prisma.locataire.findUnique({ where: { id } });
    if (!locataire) return NextResponse.json({ error: "Locataire introuvable" }, { status: 404 });
    await prisma.locataire.delete({ where: { id } });
    if (locataire.statut === "ACTIF") {
      await prisma.logement.update({ where: { id: locataire.logementId }, data: { statut: "LIBRE" } });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Impossible de supprimer : " + String(err) }, { status: 400 });
  }
}
