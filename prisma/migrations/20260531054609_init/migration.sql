-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ASSISTANT',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Immeuble" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "quartier" TEXT NOT NULL,
    "commune" TEXT NOT NULL,
    "proprietaire" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Logement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "etage" TEXT,
    "loyer" REAL NOT NULL,
    "caution" REAL NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'LIBRE',
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "immeubleId" TEXT NOT NULL,
    CONSTRAINT "Logement_immeubleId_fkey" FOREIGN KEY ("immeubleId") REFERENCES "Immeuble" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Locataire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "whatsapp" TEXT,
    "pieceIdentite" TEXT,
    "dateEntree" DATETIME NOT NULL,
    "dateSortie" DATETIME,
    "loyer" REAL NOT NULL,
    "caution" REAL NOT NULL DEFAULT 0,
    "contactUrgence" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'ACTIF',
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "logementId" TEXT NOT NULL,
    CONSTRAINT "Locataire_logementId_fkey" FOREIGN KEY ("logementId") REFERENCES "Logement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moisConcerne" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "montantDu" REAL NOT NULL,
    "datePaiement" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modePaiement" TEXT NOT NULL,
    "reference" TEXT,
    "commentaire" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'COMPLET',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "locataireId" TEXT NOT NULL,
    "logementId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    CONSTRAINT "Paiement_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "Locataire" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Paiement_logementId_fkey" FOREIGN KEY ("logementId") REFERENCES "Logement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Paiement_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Depense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "fournisseur" TEXT,
    "commentaire" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "immeubleId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    CONSTRAINT "Depense_immeubleId_fkey" FOREIGN KEY ("immeubleId") REFERENCES "Immeuble" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Depense_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "immeubleId" TEXT,
    "logementId" TEXT,
    "locataireId" TEXT,
    "paiementId" TEXT,
    "depenseId" TEXT,
    CONSTRAINT "Document_immeubleId_fkey" FOREIGN KEY ("immeubleId") REFERENCES "Immeuble" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_logementId_fkey" FOREIGN KEY ("logementId") REFERENCES "Logement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "Locataire" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_paiementId_fkey" FOREIGN KEY ("paiementId") REFERENCES "Paiement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_depenseId_fkey" FOREIGN KEY ("depenseId") REFERENCES "Depense" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Historique" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "entite" TEXT NOT NULL,
    "entiteId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "paiementId" TEXT,
    CONSTRAINT "Historique_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Historique_paiementId_fkey" FOREIGN KEY ("paiementId") REFERENCES "Paiement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
