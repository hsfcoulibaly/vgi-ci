"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, CreditCard, Download } from "lucide-react";
import { formatMontant, formatDate, labelMoisConcerne, MODES_PAIEMENT, STATUTS_PAIEMENT } from "@/lib/format";
import { generateRecuPDF, PaiementPDF } from "@/lib/pdf";

interface Locataire {
  id: string; nom: string; loyer: number;
  logement: { id: string; numero: string; immeuble: { nom: string } };
}
interface Paiement {
  id: string; moisConcerne: string; montant: number; montantDu: number;
  datePaiement: string; modePaiement: string; statut: string; commentaire?: string;
  locataire: { nom: string };
  logement: { numero: string; immeuble: { nom: string } };
  agent: { name: string };
}

const statutColors: Record<string, string> = {
  COMPLET: "bg-green-100 text-green-800",
  PARTIEL: "bg-yellow-100 text-yellow-800",
  AVANCE: "bg-blue-100 text-blue-800",
};

export default function PaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [open, setOpen] = useState(false);
  const [erreur, setErreur] = useState("");
  const [filtreMois, setFiltreMois] = useState(
    () => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  );
  const [form, setForm] = useState({
    locataireId: "", logementId: "", moisConcerne: filtreMois,
    montant: "", montantDu: "", modePaiement: "CASH",
    datePaiement: new Date().toISOString().split("T")[0],
    reference: "", commentaire: "", statut: "COMPLET",
  });

  const load = async () => {
    await Promise.all([
      fetch(`/api/paiements?mois=${filtreMois}`).then((r) => r.json()).then((d) => { if (Array.isArray(d)) setPaiements(d); }).catch(() => {}),
      fetch("/api/locataires?statut=ACTIF").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setLocataires(d); }).catch(() => {}),
    ]);
  };
  useEffect(() => { load(); }, [filtreMois]);

  function onLocataireChange(id: string | null) {
    if (!id) return;
    const loc = locataires.find((l) => l.id === id);
    if (loc) {
      setForm({
        ...form, locataireId: id,
        logementId: loc.logement.id,
        montantDu: String(loc.loyer),
        montant: String(loc.loyer),
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    try {
      const res = await fetch("/api/paiements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, montant: Number(form.montant), montantDu: Number(form.montantDu) }),
      });
      const p = await res.json();
      if (res.ok) {
        setOpen(false);
        await load();
        if (p.id) generateRecuPDF(p);
      } else {
        setErreur(p?.error ?? `Erreur ${res.status}`);
      }
    } catch (err) {
      setErreur("Erreur réseau : " + String(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="text-gray-500 text-sm">{paiements.length} paiement(s) ce mois</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-green-700 hover:bg-green-800">
          <Plus className="w-4 h-4 mr-2" />Enregistrer
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Enregistrer un paiement</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label>Locataire</Label>
                <Select value={form.locataireId} onValueChange={onLocataireChange}>
                  <SelectTrigger>
                    <span className={form.locataireId ? "" : "text-gray-400"}>
                      {form.locataireId
                        ? (() => { const l = locataires.find(x => x.id === form.locataireId); return l ? `${l.nom} · ${l.logement.immeuble.nom} ${l.logement.numero}` : ""; })()
                        : "Choisir un locataire"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {locataires.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.nom} · {l.logement.immeuble.nom} {l.logement.numero}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Mois concerné</Label>
                  <Input type="month" value={form.moisConcerne} onChange={(e) => setForm({ ...form, moisConcerne: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Date du paiement</Label>
                  <Input type="date" value={form.datePaiement} onChange={(e) => setForm({ ...form, datePaiement: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Montant dû (FCFA)</Label>
                  <Input type="number" value={form.montantDu} onChange={(e) => setForm({ ...form, montantDu: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Montant payé (FCFA)</Label>
                  <Input type="number" value={form.montant} onChange={(e) => {
                    const m = Number(e.target.value);
                    const du = Number(form.montantDu);
                    setForm({ ...form, montant: e.target.value, statut: m >= du ? "COMPLET" : "PARTIEL" });
                  }} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Mode de paiement</Label>
                <Select value={form.modePaiement} onValueChange={(v) => v && setForm({ ...form, modePaiement: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODES_PAIEMENT).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Statut</Label>
                <Select value={form.statut} onValueChange={(v) => v && setForm({ ...form, statut: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUTS_PAIEMENT).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Référence (optionnel)</Label>
                <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="N° wave / chèque..." />
              </div>
              <div className="space-y-1">
                <Label>Commentaire</Label>
                <Textarea value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} rows={2} />
              </div>
              {erreur && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{erreur}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button type="submit" className="bg-green-700 hover:bg-green-800">Enregistrer + Reçu PDF</Button>
              </div>
            </form>
          </DialogContent>
      </Dialog>

      <div className="flex items-center gap-3">
        <Label>Mois :</Label>
        <Input type="month" value={filtreMois} onChange={(e) => setFiltreMois(e.target.value)} className="w-44" />
      </div>

      <div className="space-y-3">
        {paiements.map((p) => (
          <Card key={p.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{p.locataire.nom}</p>
                    <Badge className={statutColors[p.statut] ?? ""}>{STATUTS_PAIEMENT[p.statut]}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">{p.logement.immeuble.nom} · {p.logement.numero} · {labelMoisConcerne(p.moisConcerne)}</p>
                  <p className="text-xs text-gray-400 mt-1">{MODES_PAIEMENT[p.modePaiement]} · Par {p.agent.name} · {formatDate(p.datePaiement)}</p>
                  {p.commentaire && <p className="text-xs text-gray-400 mt-1 italic">{p.commentaire}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-green-700">{formatMontant(p.montant)}</p>
                  {p.montant < p.montantDu && (
                    <p className="text-xs text-red-500">Reste : {formatMontant(p.montantDu - p.montant)}</p>
                  )}
                  <Button
                    size="sm" variant="ghost" className="mt-1 text-green-700 text-xs"
                    onClick={() => generateRecuPDF(p as PaiementPDF)}
                  >
                    <Download className="w-3 h-3 mr-1" />Reçu PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {paiements.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun paiement ce mois-ci</p>
          </div>
        )}
      </div>
    </div>
  );
}





