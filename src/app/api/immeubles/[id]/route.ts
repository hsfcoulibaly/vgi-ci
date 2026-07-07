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
    const { nom, adresse, quartier, commune, proprietaire, description } = await req.json();
    const immeuble = await prisma.immeuble.update({
      where: { id },
      data: { nom, adresse, quartier, commune, proprietaire, description },
    });
    return NextResponse.json(immeuble);
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    await prisma.immeuble.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Impossible de supprimer : cet immeuble a des logements liés." }, { status: 400 });
  }
}
