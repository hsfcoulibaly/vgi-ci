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
    const { moisConcerne, montant, montantDu, datePaiement, modePaiement, statut, reference, commentaire } = await req.json();
    const paiement = await prisma.paiement.update({
      where: { id },
      data: {
        moisConcerne,
        montant: Number(montant),
        montantDu: Number(montantDu),
        datePaiement: new Date(datePaiement),
        modePaiement,
        statut,
        reference,
        commentaire,
      },
    });
    return NextResponse.json(paiement);
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    await prisma.paiement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Impossible de supprimer : " + String(err) }, { status: 400 });
  }
}
