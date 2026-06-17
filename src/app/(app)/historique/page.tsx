"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

interface Entree {
  id: string; action: string; details?: string; entite: string;
  createdAt: string; user: { name: string };
}

const actionLabels: Record<string, string> = {
  PAIEMENT_AJOUTE: "Paiement enregistré",
  PAIEMENT_MODIFIE: "Paiement modifié",
  RECU_GENERE: "Reçu généré",
  LOCATAIRE_AJOUTE: "Locataire ajouté",
  LOCATAIRE_MODIFIE: "Locataire modifié",
};

const entiteColors: Record<string, string> = {
  PAIEMENT: "bg-green-100 text-green-800",
  LOCATAIRE: "bg-blue-100 text-blue-800",
  LOGEMENT: "bg-yellow-100 text-yellow-800",
  IMMEUBLE: "bg-purple-100 text-purple-800",
};

export default function HistoriquePage() {
  const [entries, setEntries] = useState<Entree[]>([]);

  useEffect(() => {
    fetch("/api/historique")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setEntries(d); })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historique</h1>
        <p className="text-gray-500 text-sm">Toutes les actions enregistrées dans le système</p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune action enregistrée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <Card key={e.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Badge className={entiteColors[e.entite] ?? "bg-gray-100 text-gray-700"} variant="outline">
                      {e.entite}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{actionLabels[e.action] ?? e.action}</p>
                      {e.details && <p className="text-xs text-gray-500 mt-0.5">{e.details}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">Par {e.user.name}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(e.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
