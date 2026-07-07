import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if ((session.user as { role: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, actif: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(users);
  } catch (err) {
    console.error("[GET /api/users]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if ((session.user as { role: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const { name, email, password, role } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role ?? "ASSISTANT" },
      select: { id: true, name: true, email: true, role: true, actif: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("[POST /api/users]", err);
    return NextResponse.json({ error: "Erreur serveur : " + String(err) }, { status: 500 });
  }
}
