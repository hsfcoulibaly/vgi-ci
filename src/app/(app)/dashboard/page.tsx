"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, Users, CreditCard, AlertTriangle,
  DoorOpen, TrendingDown, Plus, ArrowRight,
} from "lucide-react";
import { formatMontant, formatDate, labelMoisConcerne } from "@/lib/format";

interface DashboardData {
  moisActuel: string;
  totalImmeubles: number;
  totalLogements: number;
  logementsOccupes: number;
  logementsLibres: number;
  locatairesActifs: number;
  locatairesAJour: number;
  locatairesEnRetard: number;
  totalAttendu: number;
  totalEncaisse: number;
  resteAEncaisser: number;
  depensesMois: number;
  derniersPaiements: {
    id: string; montant: number; datePaiement: string;
    moisConcerne: string; modePaiement: string; statut: string;
    locataire: { nom: string };
    logement: { numero: string; immeuble: { nom: string } };
    agent: { name: string };
  }[];
}

const statutPaiementColors: Record<string, string> = {
  COMPLET: "bg-green-100 text-green-700",
  PARTIEL: "bg-yellow-100 text-yellow-700",
  AVANCE: "bg-blue-100 text-blue-700",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const prenom = session?.user?.name?.split(" ")[0] ?? "";

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { if (d && d.moisActuel) setData(d); })
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  const tauxRecouvrement = data.totalAttendu > 0 ? Math.round((data.totalEncaisse / data.totalAttendu) * 100) : 0;
  const tauxOccupation = data.totalLogements > 0 ? Math.round((data.logementsOccupes / data.totalLogements) * 100) : 0;
  const netMois = data.totalEncaisse - data.depensesMois;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour{prenom ? `, ${prenom}` : ""} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Tableau de bord — <span className="font-medium text-gray-700">{labelMoisConcerne(data.moisActuel)}</span>
          </p>
        </div>
        <Link href="/paiements">
          <Button className="bg-green-700 hover:bg-green-800 hidden sm:flex">
            <Plus className="w-4 h-4 mr-2" />Enregistrer un paiement
          </Button>
        </Link>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="col-span-2 xl:col-span-1 bg-green-700 text-white border-0">
          <CardContent className="pt-5">
            <p className="text-green-200 text-xs font-medium uppercase tracking-wide">Encaissé ce mois</p>
            <p className="text-3xl font-bold mt-1">{formatMontant(data.totalEncaisse)}</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-green-200 mb-1">
                <span>Taux de recouvrement</span>
                <span className="font-semibold text-white">{tauxRecouvrement}%</span>
              </div>
              <div className="w-full bg-green-600 rounded-full h-1.5">
                <div className="bg-white rounded-full h-1.5 transition-all duration-700" style={{ width: `${Math.min(tauxRecouvrement, 100)}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Total attendu</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatMontant(data.totalAttendu)}</p>
            <p className="text-xs text-gray-400 mt-2">{data.locatairesActifs} locataire{data.locatairesActifs > 1 ? "s" : ""} actif{data.locatairesActifs > 1 ? "s" : ""}</p>
          </CardContent>
        </Card>

        <Card className={data.resteAEncaisser > 0 ? "border-orange-200" : ""}>
          <CardContent className="pt-5">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Reste à encaisser</p>
            <p className={`text-2xl font-bold mt-1 ${data.resteAEncaisser > 0 ? "text-orange-600" : "text-green-600"}`}>
              {formatMontant(data.resteAEncaisser)}
            </p>
            {data.locatairesEnRetard > 0 && (
              <Link href="/retards" className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 mt-2">
                <AlertTriangle className="w-3 h-3" />{data.locatairesEnRetard} en retard
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            {data.locatairesEnRetard === 0 && <p className="text-xs text-green-500 mt-2">Tous à jour ✓</p>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Net du mois</p>
            <p className={`text-2xl font-bold mt-1 ${netMois >= 0 ? "text-gray-900" : "text-red-600"}`}>
              {formatMontant(netMois)}
            </p>
            <p className="text-xs text-gray-400 mt-2">Dépenses : {formatMontant(data.depensesMois)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Occupation card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Occupation des logements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-3xl font-bold text-gray-900">{tauxOccupation}%</span>
              <span className="text-gray-400 text-sm pb-1">occupé</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
              <div className="bg-green-600 rounded-full h-2 transition-all duration-700" style={{ width: `${tauxOccupation}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-green-50 rounded-lg p-2">
                <p className="font-bold text-green-700 text-lg">{data.logementsOccupes}</p>
                <p className="text-gray-500">Occupés</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <p className="font-bold text-blue-700 text-lg">{data.logementsLibres}</p>
                <p className="text-gray-500">Libres</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="font-bold text-gray-700 text-lg">{data.totalLogements}</p>
                <p className="text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: "Immeubles", value: data.totalImmeubles, icon: Building2, color: "text-green-600", bg: "bg-green-50", href: "/immeubles" },
            { label: "Locataires", value: data.locatairesActifs, icon: Users, color: "text-blue-600", bg: "bg-blue-50", href: "/locataires" },
            { label: "À jour", value: data.locatairesAJour, icon: CreditCard, color: "text-green-600", bg: "bg-green-50", href: "/paiements" },
            { label: "En retard", value: data.locatairesEnRetard, icon: AlertTriangle, color: data.locatairesEnRetard > 0 ? "text-red-600" : "text-gray-400", bg: data.locatairesEnRetard > 0 ? "bg-red-50" : "bg-gray-50", href: "/retards" },
          ].map(({ label, value, icon: Icon, color, bg, href }) => (
            <Link key={label} href={href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-4">
                  <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Derniers paiements</CardTitle>
            <Link href="/paiements" className="text-xs text-green-700 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.derniersPaiements.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun paiement enregistré</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.derniersPaiements.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                        {p.locataire.nom.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{p.locataire.nom}</p>
                        <p className="text-xs text-gray-400 truncate">{p.logement.immeuble.nom} · {p.logement.numero} · {labelMoisConcerne(p.moisConcerne)}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-semibold text-green-700 text-sm">{formatMontant(p.montant)}</p>
                      <p className="text-xs text-gray-400">{formatDate(p.datePaiement)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { href: "/paiements", icon: CreditCard, label: "Enregistrer un paiement", color: "text-green-700 bg-green-50 hover:bg-green-100" },
              { href: "/locataires", icon: Users, label: "Ajouter un locataire", color: "text-blue-700 bg-blue-50 hover:bg-blue-100" },
              { href: "/logements", icon: DoorOpen, label: "Nouveau logement", color: "text-purple-700 bg-purple-50 hover:bg-purple-100" },
              { href: "/depenses", icon: TrendingDown, label: "Saisir une dépense", color: "text-orange-700 bg-orange-50 hover:bg-orange-100" },
              { href: "/retards", icon: AlertTriangle, label: "Voir les retards", color: "text-red-700 bg-red-50 hover:bg-red-100" },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href}>
                <div className={`flex items-center gap-3 p-3 rounded-lg ${color} transition-colors cursor-pointer`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
