"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Users, Phone, Search } from "lucide-react";
import { formatMontant, formatDate, STATUTS_LOCATAIRE } from "@/lib/format";

interface Logement { id: string; numero: string; immeuble: { nom: string } }
interface Locataire {
  id: string; nom: string; telephone: string; email?: string; whatsapp?: string;
  dateEntree: string; loyer: number; caution: number; statut: string;
  logement: { numero: string; immeuble: { nom: string } };
  paiements: { montant: number; datePaiement: string }[];
}

const statutColors: Record<string, string> = {
  ACTIF: "bg-green-100 text-green-800",
  SORTI: "bg-gray-100 text-gray-600",
  LITIGE: "bg-red-100 text-red-800",
};

export default function LocatairesPage() {
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [logements, setLogements] = useState<Logement[]>([]);
  const [open, setOpen] = useState(false);
  const [erreur, setErreur] = useState("");
  const [search, setSearch] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("ACTIF");
  const [form, setForm] = useState({
    nom: "", telephone: "", email: "", whatsapp: "", pieceIdentite: "",
    dateEntree: new Date().toISOString().split("T")[0],
    loyer: "", caution: "", contactUrgence: "", logementId: "",
  });

  const load = async () => {
    await Promise.all([
      fetch(`/api/locataires?statut=${filtreStatut}&q=${search}`).then((r) => r.json()).then((d) => { if (Array.isArray(d)) setLocataires(d); }).catch(() => {}),
      fetch("/api/logements").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setLogements(d); }).catch(() => {}),
    ]);
  };

  useEffect(() => { load(); }, [filtreStatut, search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    try {
      const res = await fetch("/api/locataires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, loyer: Number(form.loyer), caution: Number(form.caution) }),
      });
      const data = await res.json();
      if (res.ok) {
        setOpen(false);
        setForm({ nom: "", telephone: "", email: "", whatsapp: "", pieceIdentite: "", dateEntree: new Date().toISOString().split("T")[0], loyer: "", caution: "", contactUrgence: "", logementId: "" });
        await load();
      } else {
        setErreur(data?.error ?? `Erreur ${res.status}`);
      }
    } catch (err) {
      setErreur("Erreur réseau : " + String(err));
    }
  }

  const logementsLibres = logements.filter((l) => (l as Logement & { statut: string }).statut === "LIBRE");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locataires</h1>
          <p className="text-gray-500 text-sm">{locataires.length} résultat(s)</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-green-700 hover:bg-green-800">
          <Plus className="w-4 h-4 mr-2" />Ajouter
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nouveau locataire</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label>Logement</Label>
                <Select value={form.logementId} onValueChange={(v) => {
                  if (!v) return;
                  const log = logements.find((l) => l.id === v);
                  setForm({ ...form, logementId: v, loyer: log ? String((log as { loyer?: number }).loyer ?? "") : form.loyer });
                }}>
                  <SelectTrigger>
                    <span className={form.logementId ? "" : "text-gray-400"}>
                      {form.logementId
                        ? (() => { const l = logements.find(x => x.id === form.logementId); return l ? `${l.immeuble.nom} · ${l.numero}` : ""; })()
                        : "Choisir un logement libre"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {logementsLibres.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.immeuble.nom} · {l.numero}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {[
                { key: "nom", label: "Nom complet", placeholder: "Jean Kouamé", required: true },
                { key: "telephone", label: "Téléphone", placeholder: "0701234567", required: true },
                { key: "whatsapp", label: "WhatsApp", placeholder: "0701234567" },
                { key: "email", label: "Email", placeholder: "jean@email.com" },
                { key: "pieceIdentite", label: "Pièce d'identité", placeholder: "CNI / Passeport n°" },
                { key: "contactUrgence", label: "Contact urgence", placeholder: "Nom et téléphone" },
              ].map(({ key, label, placeholder, required }) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <Input
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    required={required}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Date d&apos;entrée</Label>
                  <Input type="date" value={form.dateEntree} onChange={(e) => setForm({ ...form, dateEntree: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Loyer (FCFA)</Label>
                  <Input type="number" value={form.loyer} onChange={(e) => setForm({ ...form, loyer: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Caution versée (FCFA)</Label>
                <Input type="number" value={form.caution} onChange={(e) => setForm({ ...form, caution: e.target.value })} />
              </div>
              {erreur && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{erreur}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button type="submit" className="bg-green-700 hover:bg-green-800">Enregistrer</Button>
              </div>
            </form>
          </DialogContent>
      </Dialog>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Rechercher par nom ou téléphone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {["ACTIF", "SORTI", "LITIGE"].map((s) => (
          <Button key={s} size="sm" variant={filtreStatut === s ? "default" : "outline"} className={filtreStatut === s ? "bg-green-700" : ""} onClick={() => setFiltreStatut(s)}>
            {STATUTS_LOCATAIRE[s]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {locataires.map((loc) => (
          <Card key={loc.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                    {loc.nom.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-tight">{loc.nom}</p>
                    <p className="text-xs text-gray-400">{loc.logement.immeuble.nom} · {loc.logement.numero}</p>
                  </div>
                </div>
                <Badge className={statutColors[loc.statut] ?? ""}>{STATUTS_LOCATAIRE[loc.statut]}</Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Phone className="w-3 h-3" />{loc.telephone}
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-500">Loyer mensuel</span>
                <span className="font-semibold text-green-700">{formatMontant(loc.loyer)}</span>
              </div>
              <div className="text-xs text-gray-400">Entrée : {formatDate(loc.dateEntree)}</div>
              {loc.paiements.length > 0 && (
                <div className="text-xs text-gray-400">
                  Dernier paiement : {formatDate(loc.paiements[0].datePaiement)} · {formatMontant(loc.paiements[0].montant)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {locataires.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun locataire trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}





