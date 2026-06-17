import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  const existing = await prisma.user.findUnique({ where: { email: "admin@nehemie.ci" } });
  if (existing) return NextResponse.json({ message: "Déjà initialisé" });

  const password = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: { name: "Administrateur", email: "admin@nehemie.ci", password, role: "ADMIN" },
  });

  const immeuble = await prisma.immeuble.create({
    data: {
      nom: "Résidence Ebenezer",
      adresse: "Rue des Jardins",
      quartier: "Cocody Riviera",
      commune: "Cocody",
      proprietaire: "Famille Coulibaly",
      description: "Résidence moderne avec 10 appartements",
    },
  });

  const logement = await prisma.logement.create({
    data: {
      numero: "A1",
      type: "APPARTEMENT",
      etage: "1er",
      loyer: 150000,
      caution: 300000,
      statut: "OCCUPE",
      immeubleId: immeuble.id,
    },
  });

  const locataire = await prisma.locataire.create({
    data: {
      nom: "Jean-Paul Kouamé",
      telephone: "0701234567",
      whatsapp: "0701234567",
      dateEntree: new Date("2024-01-01"),
      loyer: 150000,
      caution: 300000,
      statut: "ACTIF",
      logementId: logement.id,
    },
  });

  await prisma.paiement.create({
    data: {
      moisConcerne: "2025-05",
      montant: 150000,
      montantDu: 150000,
      modePaiement: "CASH",
      statut: "COMPLET",
      locataireId: locataire.id,
      logementId: logement.id,
      agentId: admin.id,
    },
  });

  return NextResponse.json({ message: "Base de données initialisée avec succès" });
}
