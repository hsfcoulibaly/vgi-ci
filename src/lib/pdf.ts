import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatMontant, labelMoisConcerne, MODES_PAIEMENT, STATUTS_PAIEMENT } from "./format";

export interface PaiementPDF {
  id: string;
  moisConcerne: string;
  montant: number;
  montantDu: number;
  datePaiement: string;
  modePaiement: string;
  statut: string;
  reference?: string;
  locataire: { nom: string };
  logement: { numero: string; immeuble: { nom: string } };
  agent: { name: string };
}

export function generateRecuPDF(p: PaiementPDF) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(27, 94, 32);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("NÉHÉMIE", 15, 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Gestion Locative — Côte d'Ivoire", 15, 24);
  doc.text("Reçu de paiement", 15, 31);

  // Receipt number
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`N° ${p.id.slice(-8).toUpperCase()}`, 195, 20, { align: "right" });

  doc.setTextColor(50, 50, 50);

  // Date
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Date : ${new Date(p.datePaiement).toLocaleDateString("fr-FR")}`, 15, 45);

  // Tenant info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Informations du locataire", 15, 58);
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 60, 195, 60);

  const info = [
    ["Locataire", p.locataire.nom],
    ["Immeuble", p.logement.immeuble.nom],
    ["Logement", p.logement.numero],
    ["Mois concerné", labelMoisConcerne(p.moisConcerne)],
  ];

  autoTable(doc, {
    startY: 62,
    head: [],
    body: info,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: [80, 80, 80] } },
    margin: { left: 15 },
  });

  const y1 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Payment info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Détails du paiement", 15, y1);
  doc.line(15, y1 + 2, 195, y1 + 2);

  const paiInfo = [
    ["Montant payé", formatMontant(p.montant)],
    ["Montant dû", formatMontant(p.montantDu)],
    ["Solde restant", formatMontant(Math.max(0, p.montantDu - p.montant))],
    ["Mode de paiement", MODES_PAIEMENT[p.modePaiement] ?? p.modePaiement],
    ["Statut", STATUTS_PAIEMENT[p.statut] ?? p.statut],
    ...(p.reference ? [["Référence", p.reference]] : []),
    ["Agent", p.agent.name],
  ];

  autoTable(doc, {
    startY: y1 + 4,
    head: [],
    body: paiInfo,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: [80, 80, 80] } },
    margin: { left: 15 },
  });

  const y2 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Highlight box
  doc.setFillColor(232, 245, 233);
  doc.rect(15, y2, 180, 20, "F");
  doc.setTextColor(27, 94, 32);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`MONTANT PAYÉ : ${formatMontant(p.montant)}`, 105, y2 + 13, { align: "center" });

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Reçu généré électroniquement — Néhémie Gestion Locative", 105, 285, { align: "center" });

  doc.save(`recu_${p.locataire.nom.replace(/\s+/g, "_")}_${p.moisConcerne}.pdf`);
}

export function exportPaiementsExcel(paiements: PaiementPDF[]) {
  // Dynamic import to avoid SSR issues
  import("xlsx").then(({ utils, writeFile }) => {
    const rows = paiements.map((p) => ({
      "Locataire": p.locataire.nom,
      "Immeuble": p.logement.immeuble.nom,
      "Logement": p.logement.numero,
      "Mois": p.moisConcerne,
      "Montant payé": p.montant,
      "Montant dû": p.montantDu,
      "Mode": MODES_PAIEMENT[p.modePaiement],
      "Statut": STATUTS_PAIEMENT[p.statut],
      "Date": new Date(p.datePaiement).toLocaleDateString("fr-FR"),
      "Agent": p.agent.name,
    }));
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Paiements");
    writeFile(wb, "paiements_nehemie.xlsx");
  });
}
