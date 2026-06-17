# Néhémie — Application de Gestion Locative

Application web de gestion immobilière adaptée au contexte ivoirien. Gestion des immeubles, logements, locataires, paiements manuels, reçus PDF, suivi des retards et rapports Excel.

---

## Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur
- npm v9 ou supérieur

---

## Installation

```bash
# 1. Cloner ou ouvrir le dossier du projet
cd nehemie

# 2. Installer les dépendances
npm install

# 3. Générer le client Prisma
npx prisma generate

# 4. Créer la base de données et appliquer les migrations
npx prisma migrate dev --name init
```

---

## Lancer l'application

```bash
npm run dev
```

L'application est accessible sur **http://localhost:3000**

---

## Initialiser les données de démonstration

Après avoir lancé le serveur, exécuter cette commande **une seule fois** pour créer le compte administrateur et des données d'exemple :

```bash
curl -X POST http://localhost:3000/api/seed
```

Ou ouvrir cette URL dans le navigateur avec un outil comme Postman / Insomnia (requête POST).

---

## Connexion

| Champ | Valeur |
|-------|--------|
| Email | `admin@nehemie.ci` |
| Mot de passe | `admin123` |

> ⚠️ Changer ce mot de passe avant toute mise en production.

---

## Structure du projet

```
nehemie/
├── prisma/
│   ├── schema.prisma       # Modèles de la base de données
│   └── migrations/         # Historique des migrations SQL
├── src/
│   ├── app/
│   │   ├── (app)/          # Pages de l'application (protégées)
│   │   │   ├── dashboard/  # Tableau de bord
│   │   │   ├── immeubles/  # Gestion des immeubles
│   │   │   ├── logements/  # Gestion des logements
│   │   │   ├── locataires/ # Gestion des locataires
│   │   │   ├── paiements/  # Enregistrement des paiements + reçus PDF
│   │   │   ├── retards/    # Suivi des impayés
│   │   │   ├── depenses/   # Gestion des dépenses
│   │   │   ├── historique/ # Journal des actions
│   │   │   └── rapports/   # Export Excel
│   │   ├── api/            # Routes API (Next.js)
│   │   └── login/          # Page de connexion
│   ├── components/
│   │   ├── sidebar.tsx     # Navigation latérale
│   │   └── ui/             # Composants shadcn/ui
│   └── lib/
│       ├── auth.ts         # Configuration NextAuth
│       ├── format.ts       # Formatage FCFA, dates, labels
│       ├── pdf.ts          # Génération des reçus PDF
│       └── prisma.ts       # Client Prisma (SQLite via libsql)
├── dev.db                  # Base de données SQLite (générée automatiquement)
├── prisma.config.ts        # Configuration Prisma v7
└── .env                    # Variables d'environnement
```

---

## Fonctionnalités

| Module | Description |
|--------|-------------|
| **Tableau de bord** | Vue d'ensemble : loyers attendus/encaissés, logements libres/occupés, derniers paiements |
| **Immeubles** | Ajouter et gérer plusieurs immeubles (nom, adresse, quartier, commune, propriétaire) |
| **Logements** | Gérer les logements par immeuble, filtrer par statut (occupé / libre / en travaux) |
| **Locataires** | Fiche complète par locataire, recherche par nom ou téléphone, filtres par statut |
| **Paiements** | Enregistrement manuel (espèces, Wave, Orange Money, Moov Money, virement, chèque) avec génération automatique de reçu PDF |
| **Retards** | Tableau des locataires en retard avec montants dus et code couleur |
| **Dépenses** | Suivi des dépenses par immeuble (plomberie, électricité, gardiennage, etc.) |
| **Historique** | Journal de toutes les actions enregistrées dans le système |
| **Rapports** | Export Excel des paiements et de la liste des locataires |

---

## Modes de paiement supportés

- Espèces (Cash)
- Wave
- Orange Money
- Moov Money
- Virement bancaire
- Chèque
- Autre

---

## Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| **Admin** | Accès complet : immeubles, logements, locataires, paiements, utilisateurs, rapports |
| **Responsable** | Paiements, reçus, retards, historiques, observations, locataires |
| **Assistant** | Consultation locataires, enregistrement paiements (si autorisé), reçus, notes |

---

## Technologies utilisées

| Technologie | Rôle |
|------------|------|
| [Next.js 15](https://nextjs.org/) | Framework React (App Router) |
| [Tailwind CSS](https://tailwindcss.com/) | Style et mise en page responsive |
| [shadcn/ui](https://ui.shadcn.com/) | Composants UI (variante base-ui) |
| [Prisma v7](https://www.prisma.io/) | ORM pour la base de données |
| [SQLite + libsql](https://turso.tech/libsql) | Base de données locale |
| [NextAuth v4](https://next-auth.js.org/) | Authentification avec sessions JWT |
| [jsPDF](https://github.com/parallax/jsPDF) | Génération des reçus PDF |
| [xlsx](https://github.com/SheetJS/sheetjs) | Export Excel |

---

## Variables d'environnement

Le fichier `.env` à la racine du projet contient :

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="nehemie-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

> En production, remplacer `NEXTAUTH_SECRET` par une chaîne aléatoire longue et sécurisée.

---

## Commandes utiles

```bash
# Lancer en développement
npm run dev

# Construire pour la production
npm run build

# Lancer en production
npm start

# Ouvrir l'interface graphique de la base de données
npx prisma studio

# Réinitialiser la base de données (⚠️ efface toutes les données)
npx prisma migrate reset

# Appliquer une nouvelle migration après modification du schéma
npx prisma migrate dev --name nom_de_la_migration
```

---

## Fonctionnalités prévues (versions futures)

- Portail locataire (consultation des paiements et reçus)
- Portail propriétaire
- Notifications WhatsApp
- Relances automatiques des retards
- Rapport PDF mensuel par immeuble
- Upload de documents (contrats, pièces d'identité, photos)
- Application mobile native
- Paiement en ligne intégré
- Statistiques avancées
