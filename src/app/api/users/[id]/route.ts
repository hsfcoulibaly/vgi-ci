import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if ((session.user as { role: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const { id } = await params;
    const { name, email, role, actif, password } = await req.json();

    const currentUser = session.user as { id: string };
    if (id === currentUser.id && actif === false)
      return NextResponse.json({ error: "Vous ne pouvez pas vous désactiver vous-même" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (actif !== undefined) data.actif = actif;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, actif: true, createdAt: true },
    });
    return NextResponse.json(user);
  } catch (err) {
    console.error("[PATCH /api/users/:id]", err);
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if ((session.user as { role: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const { id } = await params;
    const currentUser = session.user as { id: string };
    if (id === currentUser.id)
      return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });

    await prisma.user.update({ where: { id }, data: { actif: false } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/users/:id]", err);
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}
