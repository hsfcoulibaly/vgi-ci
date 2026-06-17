"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  CreditCard,
  AlertTriangle,
  DoorOpen,
  TrendingUp,
} from "lucide-react";
import { formatMontant, formatDate, labelMoisConcerne } from "@/lib/format";

interface DashboardData {
  moisActuel: string;
  totalLogements: number;
  logementsOccupes: number;
  logementsLibres: number;
  locatairesActifs: number;
  locatairesAJour: number;
  locatairesEnRetard: number;
  totalAttendu: number;
  totalEncaisse: number;
  resteAEncaisser: number;
  derniersPaiements: {
    id: string;
    montant: number;
    datePaiement: string;
    moisConcerne: string;
    modePaiement: string;
    locataire: { nom: string };
    logement: { numero: string; immeuble: { nom: string } };
    agent: { name: string };
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { if (d && d.moisActuel) setData(d); })
      .catch(() => {});
  }, []);

  if (!data) return <div className="text-gray-500 p-4">Chargement...</div>;

  const pct = data.totalAttendu > 0 ? Math.round((data.totalEncaisse / data.totalAttendu) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm">Mois en cours : {labelMoisConcerne(data.moisActuel)}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total attendu</p>
                <p className="text-xl font-bold text-gray-900">{formatMontant(data.totalAttendu)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Encaissé</p>
                <p className="text-xl font-bold text-green-700">{formatMontant(data.totalEncaisse)}</p>
                <p className="text-xs text-gray-400">{pct}%</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Reste à encaisser</p>
                <p className="text-xl font-bold text-orange-600">{formatMontant(data.resteAEncaisser)}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Locataires actifs</p>
                <p className="text-xl font-bold text-gray-900">{data.locatairesActifs}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-100 bg-green-50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <DoorOpen className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Occupés</p>
                <p className="text-lg font-bold text-gray-900">{data.logementsOccupes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Libres</p>
                <p className="text-lg font-bold text-gray-900">{data.logementsLibres}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100 bg-green-50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">À jour</p>
                <p className="text-lg font-bold text-green-700">{data.locatairesAJour}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-red-50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <p className="text-xs text-gray-500">En retard</p>
                <p className="text-lg font-bold text-red-600">{data.locatairesEnRetard}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Derniers paiements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Derniers paiements enregistrés</CardTitle>
        </CardHeader>
        <CardContent>
          {(data.derniersPaiements ?? []).length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun paiement enregistré</p>
          ) : (
            <div className="space-y-3">
              {(data.derniersPaiements ?? []).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{p.locataire.nom}</p>
                    <p className="text-xs text-gray-500">
                      {p.logement.immeuble.nom} · {p.logement.numero} · {labelMoisConcerne(p.moisConcerne)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-700 text-sm">{formatMontant(p.montant)}</p>
                    <p className="text-xs text-gray-400">{formatDate(p.datePaiement)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
