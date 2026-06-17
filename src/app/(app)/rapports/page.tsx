"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, Table } from "lucide-react";
import { exportPaiementsExcel } from "@/lib/pdf";
import { labelMoisConcerne } from "@/lib/format";

export default function RapportsPage() {
  const [mois, setMois] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  );
  const [loading, setLoading] = useState<string | null>(null);

  async function exportPaiements() {
    setLoading("paiements");
    const res = await fetch(`/api/paiements?mois=${mois}`);
    const paiements = await res.json();
    exportPaiementsExcel(paiements);
    setLoading(null);
  }

  async function exportLocataires() {
    setLoading("locataires");
    const res = await fetch("/api/locataires?statut=ACTIF");
    const locataires = await res.json();
    const { utils, writeFile } = await import("xlsx");
    const rows = locataires.map((l: {
      nom: string; telephone: string; email?: string;
      logement: { numero: string; immeuble: { nom: string } };
      loyer: number; caution: number; dateEntree: string; statut: string;
    }) => ({
      "Nom": l.nom,
      "Téléphone": l.telephone,
      "Email": l.email ?? "",
      "Immeuble": l.logement.immeuble.nom,
      "Logement": l.logement.numero,
      "Loyer": l.loyer,
      "Caution": l.caution,
      "Date d'entrée": new Date(l.dateEntree).toLocaleDateString("fr-FR"),
      "Statut": l.statut,
    }));
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Locataires");
    writeFile(wb, "locataires_nehemie.xlsx");
    setLoading(null);
  }

  const rapports = [
    {
      id: "paiements",
      titre: "Rapport des paiements",
      description: `Tous les paiements du mois de ${labelMoisConcerne(mois)}`,
      icon: Table,
      format: "Excel",
      action: exportPaiements,
    },
    {
      id: "locataires",
      titre: "Liste des locataires actifs",
      description: "Tous les locataires actifs avec leurs informations",
      icon: FileText,
      format: "Excel",
      action: exportLocataires,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
        <p className="text-gray-500 text-sm">Générez et exportez vos rapports</p>
      </div>

      <div className="flex items-center gap-3">
        <Label>Mois de référence :</Label>
        <Input type="month" value={mois} onChange={(e) => setMois(e.target.value)} className="w-44" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rapports.map((r) => (
          <Card key={r.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <r.icon className="w-5 h-5 text-green-600" />
                <CardTitle className="text-base">{r.titre}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-500">{r.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{r.format}</span>
                <Button
                  size="sm"
                  className="bg-green-700 hover:bg-green-800"
                  onClick={r.action}
                  disabled={loading === r.id}
                >
                  <Download className="w-3 h-3 mr-1" />
                  {loading === r.id ? "Export..." : "Télécharger"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-gray-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">Rapports PDF à venir</p>
          <p className="text-xs">Rapport mensuel par immeuble, rapport des retards, rapport des logements libres...</p>
        </CardContent>
      </Card>
    </div>
  );
}
