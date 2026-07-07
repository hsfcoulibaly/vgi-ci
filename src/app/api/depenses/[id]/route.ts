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
    const { type, montant, date, fournisseur, commentaire, immeubleId } = await req.json();
    const depense = await prisma.depense.update({
      where: { id },
      data: { type, montant: Number(montant), date: new Date(date), fournisseur, commentaire, immeubleId },
    });
    return NextResponse.json(depense);
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    await prisma.depense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Impossible de supprimer : " + String(err) }, { status: 400 });
  }
}
