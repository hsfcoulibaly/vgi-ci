"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Phone } from "lucide-react";
import { formatMontant, formatDate, STATUTS_RETARD } from "@/lib/format";

interface Retard {
  locataire: { id: string; nom: string; telephone: string };
  immeuble: string;
  logement: string;
  loyer: number;
  montantPaye: number;
  resteADu: number;
  statut: string;
  dernierPaiement: { date: string; montant: number } | null;
}

export default function RetardsPage() {
  const [retards, setRetards] = useState<Retard[]>([]);

  useEffect(() => {
    fetch("/api/retards").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setRetards(d); }).catch(() => {});
  }, []);

  const total = retards.reduce((s, r) => s + r.resteADu, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suivi des retards</h1>
        <p className="text-gray-500 text-sm">{retards.length} locataire(s) en retard · Total dû : {formatMontant(total)}</p>
      </div>

      {retards.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucun retard ce mois-ci</p>
          <p className="text-sm">Tous les locataires actifs sont à jour.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {retards.map((r) => {
            const info = STATUTS_RETARD[r.statut] ?? { label: r.statut, color: "bg-gray-100 text-gray-700" };
            return (
              <Card key={r.locataire.id} className="border-l-4" style={{ borderLeftColor: r.statut === "LITIGE" ? "#ef4444" : r.statut === "RETARD_IMPORTANT" ? "#f97316" : "#eab308" }}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{r.locataire.nom}</p>
                        <Badge className={info.color}>{info.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{r.immeuble} · {r.logement}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Phone className="w-3 h-3" />{r.locataire.telephone}
                      </div>
                      {r.dernierPaiement && (
                        <p className="text-xs text-gray-400 mt-1">
                          Dernier paiement : {formatDate(r.dernierPaiement.date)} · {formatMontant(r.dernierPaiement.montant)}
                        </p>
                      )}
                      {!r.dernierPaiement && <p className="text-xs text-red-400 mt-1">Aucun paiement enregistré</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">Loyer mensuel</p>
                      <p className="text-sm font-medium">{formatMontant(r.loyer)}</p>
                      <p className="text-xs text-gray-400 mt-1">Payé</p>
                      <p className="text-sm text-green-700">{formatMontant(r.montantPaye)}</p>
                      <p className="text-xs text-gray-400 mt-1">Reste dû</p>
                      <p className="text-lg font-bold text-red-600">{formatMontant(r.resteADu)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

