"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, TrendingDown, Pencil, Trash2 } from "lucide-react";
import { formatMontant, formatDate } from "@/lib/format";

interface Immeuble { id: string; nom: string }
interface Depense {
  id: string; type: string; montant: number; date: string;
  fournisseur?: string; commentaire?: string;
  immeuble: { id: string; nom: string };
  agent: { name: string };
}

const TYPES_DEPENSE = {
  PLOMBERIE: "Plomberie", ELECTRICITE: "Électricité", NETTOYAGE: "Nettoyage",
  PEINTURE: "Peinture", GARDIENNAGE: "Gardiennage", REPARATION: "Réparation",
  ACHAT: "Achat matériel", AUTRE: "Autre",
};

const typeColors: Record<string, string> = {
  PLOMBERIE: "bg-blue-100 text-blue-800",
  ELECTRICITE: "bg-yellow-100 text-yellow-800",
  NETTOYAGE: "bg-green-100 text-green-800",
  REPARATION: "bg-orange-100 text-orange-800",
  GARDIENNAGE: "bg-purple-100 text-purple-800",
  PEINTURE: "bg-pink-100 text-pink-800",
  ACHAT: "bg-gray-100 text-gray-700",
  AUTRE: "bg-gray-100 text-gray-700",
};

const emptyForm = {
  type: "PLOMBERIE", montant: "", date: new Date().toISOString().split("T")[0],
  fournisseur: "", commentaire: "", immeubleId: "",
};

export default function DepensesPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [open, setOpen] = useState(false);
  const [erreur, setErreur] = useState("");
  const [editItem, setEditItem] = useState<Depense | null>(null);
  const [deleteItem, setDeleteItem] = useState<Depense | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    await Promise.all([
      fetch("/api/depenses").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setDepenses(d); }).catch(() => {}),
      fetch("/api/immeubles").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setImmeubles(d); }).catch(() => {}),
    ]);
  };
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditItem(null);
    setForm(emptyForm);
    setErreur("");
    setOpen(true);
  }

  function openEdit(d: Depense) {
    setEditItem(d);
    setForm({ type: d.type, montant: String(d.montant), date: d.date.split("T")[0], fournisseur: d.fournisseur ?? "", commentaire: d.commentaire ?? "", immeubleId: d.immeuble.id });
    setErreur("");
    setOpen(true);
  }

  function openDelete(d: Depense) {
    setDeleteItem(d);
    setDeleteOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    try {
      const url = editItem ? `/api/depenses/${editItem.id}` : "/api/depenses";
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, montant: Number(form.montant) }) });
      const data = await res.json();
      if (res.ok) { setOpen(false); await load(); }
      else setErreur(data?.error ?? `Erreur ${res.status}`);
    } catch (err) {
      setErreur("Erreur réseau : " + String(err));
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    const res = await fetch(`/api/depenses/${deleteItem.id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) { setDeleteOpen(false); await load(); }
    else alert(data?.error ?? "Erreur lors de la suppression");
  }

  const total = depenses.reduce((s, d) => s + d.montant, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dépenses</h1>
          <p className="text-gray-500 text-sm">{depenses.length} dépense(s) · Total : {formatMontant(total)}</p>
        </div>
        <Button onClick={openCreate} className="bg-green-700 hover:bg-green-800">
          <Plus className="w-4 h-4 mr-2" />Ajouter
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? "Modifier la dépense" : "Enregistrer une dépense"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Immeuble</Label>
              <Select value={form.immeubleId} onValueChange={(v) => v && setForm({ ...form, immeubleId: v })}>
                <SelectTrigger>
                  <span className={form.immeubleId ? "" : "text-gray-400"}>
                    {form.immeubleId ? immeubles.find(i => i.id === form.immeubleId)?.nom : "Choisir un immeuble"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {immeubles.map((i) => <SelectItem key={i.id} value={i.id}>{i.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Type de dépense</Label>
              <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPES_DEPENSE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Montant (FCFA)</Label>
                <Input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Fournisseur / Prestataire</Label>
              <Input value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Commentaire</Label>
              <Textarea value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} rows={2} />
            </div>
            {erreur && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{erreur}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800">Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Supprimer cette dépense ?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-semibold">{deleteItem ? (TYPES_DEPENSE as Record<string, string>)[deleteItem.type] : ""}</span> — {formatMontant(deleteItem?.montant ?? 0)} chez {deleteItem?.immeuble.nom}. Action irréversible.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Supprimer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {depenses.map((d) => (
          <Card key={d.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={typeColors[d.type] ?? ""}>{(TYPES_DEPENSE as Record<string, string>)[d.type] ?? d.type}</Badge>
                    <span className="text-sm text-gray-500">{d.immeuble.nom}</span>
                  </div>
                  {d.fournisseur && <p className="text-sm text-gray-500">Prestataire : {d.fournisseur}</p>}
                  {d.commentaire && <p className="text-xs text-gray-400 italic">{d.commentaire}</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatDate(d.date)} · Par {d.agent.name}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <p className="text-lg font-bold text-red-600">{formatMontant(d.montant)}</p>
                  {isAdmin && (
                    <>
                      <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-green-700 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openDelete(d)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {depenses.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune dépense enregistrée</p>
          </div>
        )}
      </div>
    </div>
  );
}
