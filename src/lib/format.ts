export function formatMontant(montant: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(montant);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function labelMoisConcerne(mois: string | undefined | null): string {
  if (!mois) return "";
  const [year, month] = mois.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
}

export const MODES_PAIEMENT: Record<string, string> = {
  CASH: "Espèces",
  WAVE: "Wave",
  ORANGE_MONEY: "Orange Money",
  MOOV_MONEY: "Moov Money",
  VIREMENT: "Virement bancaire",
  CHEQUE: "Chèque",
  AUTRE: "Autre",
};

export const STATUTS_PAIEMENT: Record<string, string> = {
  COMPLET: "Complet",
  PARTIEL: "Partiel",
  AVANCE: "Avance",
};

export const TYPES_LOGEMENT: Record<string, string> = {
  APPARTEMENT: "Appartement",
  STUDIO: "Studio",
  MAGASIN: "Magasin",
  BUREAU: "Bureau",
  CHAMBRE: "Chambre",
  AUTRE: "Autre",
};

export const STATUTS_LOGEMENT: Record<string, string> = {
  OCCUPE: "Occupé",
  LIBRE: "Libre",
  TRAVAUX: "En travaux",
};

export const STATUTS_LOCATAIRE: Record<string, string> = {
  ACTIF: "Actif",
  SORTI: "Sorti",
  LITIGE: "Litige",
};

export const STATUTS_RETARD: Record<string, { label: string; color: string }> = {
  A_JOUR: { label: "À jour", color: "bg-green-100 text-green-800" },
  RETARD_LEGER: { label: "Retard léger", color: "bg-yellow-100 text-yellow-800" },
  RETARD_IMPORTANT: { label: "Retard important", color: "bg-orange-100 text-orange-800" },
  EN_SUIVI: { label: "En suivi", color: "bg-blue-100 text-blue-800" },
  LITIGE: { label: "Litige", color: "bg-red-100 text-red-800" },
};
