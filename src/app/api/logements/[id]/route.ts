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
    const { numero, type, etage, loyer, caution, statut, immeubleId } = await req.json();
    const logement = await prisma.logement.update({
      where: { id },
      data: { numero, type, etage, loyer: Number(loyer), caution: Number(caution), statut, immeubleId },
    });
    return NextResponse.json(logement);
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const locatairesActifs = await prisma.locataire.count({ where: { logementId: id, statut: "ACTIF" } });
    if (locatairesActifs > 0)
      return NextResponse.json({ error: "Ce logement a un locataire actif. Clôturez d'abord le bail." }, { status: 400 });
    await prisma.logement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Impossible de supprimer : " + String(err) }, { status: 400 });
  }
}
