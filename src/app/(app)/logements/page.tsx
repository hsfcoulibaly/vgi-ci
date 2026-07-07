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
import { Plus, DoorOpen, Pencil, Trash2 } from "lucide-react";
import { formatMontant, TYPES_LOGEMENT, STATUTS_LOGEMENT } from "@/lib/format";

interface Immeuble { id: string; nom: string }
interface Logement {
  id: string; numero: string; type: string; etage?: string;
  loyer: number; caution: number; statut: string;
  immeuble: { id: string; nom: string };
  locataires: { nom: string; telephone: string }[];
}

const statusColors: Record<string, string> = {
  OCCUPE: "bg-green-100 text-green-800",
  LIBRE: "bg-blue-100 text-blue-800",
  TRAVAUX: "bg-yellow-100 text-yellow-800",
};

const emptyForm = { numero: "", type: "APPARTEMENT", etage: "", loyer: "", caution: "", statut: "LIBRE", immeubleId: "" };

export default function LogementsPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const [logements, setLogements] = useState<Logement[]>([]);
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState("");
  const [editItem, setEditItem] = useState<Logement | null>(null);
  const [deleteItem, setDeleteItem] = useState<Logement | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState("TOUS");
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    await Promise.all([
      fetch("/api/logements").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setLogements(d); }).catch(() => {}),
      fetch("/api/immeubles").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setImmeubles(d); }).catch(() => {}),
    ]);
  };
  useEffect(() => { load(); }, []);

  const filtered = filtreStatut === "TOUS" ? logements : logements.filter((l) => l.statut === filtreStatut);

  function openCreate() {
    setEditItem(null);
    setForm(emptyForm);
    setErreur("");
    setOpen(true);
  }

  function openEdit(log: Logement) {
    setEditItem(log);
    setForm({ numero: log.numero, type: log.type, etage: log.etage ?? "", loyer: String(log.loyer), caution: String(log.caution), statut: log.statut, immeubleId: log.immeuble.id });
    setErreur("");
    setOpen(true);
  }

  function openDelete(log: Logement) {
    setDeleteItem(log);
    setDeleteOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErreur("");
    try {
      const url = editItem ? `/api/logements/${editItem.id}` : "/api/logements";
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, loyer: Number(form.loyer), caution: Number(form.caution) }) });
      const data = await res.json();
      if (res.ok) { setOpen(false); await load(); }
      else setErreur(data?.error ?? `Erreur ${res.status}`);
    } catch (err) {
      setErreur("Erreur réseau : " + String(err));
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteItem) return;
    const res = await fetch(`/api/logements/${deleteItem.id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) { setDeleteOpen(false); await load(); }
    else alert(data?.error ?? "Erreur lors de la suppression");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logements</h1>
          <p className="text-gray-500 text-sm">{logements.length} logement(s)</p>
        </div>
        <Button onClick={openCreate} className="bg-green-700 hover:bg-green-800">
          <Plus className="w-4 h-4 mr-2" />Ajouter
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? "Modifier le logement" : "Ajouter un logement"}</DialogTitle></DialogHeader>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Numéro</Label>
                <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="A1" required />
              </div>
              <div className="space-y-1">
                <Label>Étage</Label>
                <Input value={form.etage} onChange={(e) => setForm({ ...form, etage: e.target.value })} placeholder="RDC" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPES_LOGEMENT).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {editItem && (
              <div className="space-y-1">
                <Label>Statut</Label>
                <Select value={form.statut} onValueChange={(v) => v && setForm({ ...form, statut: v })}>
                  <SelectTrigger>
                    <span>{STATUTS_LOGEMENT[form.statut] ?? form.statut}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUTS_LOGEMENT).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Loyer mensuel (FCFA)</Label>
                <Input type="number" value={form.loyer} onChange={(e) => setForm({ ...form, loyer: e.target.value })} placeholder="150000" required />
              </div>
              <div className="space-y-1">
                <Label>Caution (FCFA)</Label>
                <Input type="number" value={form.caution} onChange={(e) => setForm({ ...form, caution: e.target.value })} placeholder="300000" />
              </div>
            </div>
            {erreur && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{erreur}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Supprimer ce logement ?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-1">
            Logement <span className="font-semibold">{deleteItem?.numero}</span> — {deleteItem?.immeuble.nom}. Action irréversible.
          </p>
          <p className="text-xs text-orange-600 mt-1">La suppression échouera si un locataire actif occupe ce logement.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Supprimer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex gap-2 flex-wrap">
        {["TOUS", "OCCUPE", "LIBRE", "TRAVAUX"].map((s) => (
          <Button key={s} size="sm" variant={filtreStatut === s ? "default" : "outline"}
            className={filtreStatut === s ? "bg-green-700" : ""} onClick={() => setFiltreStatut(s)}>
            {s === "TOUS" ? "Tous" : STATUTS_LOGEMENT[s]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((log) => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">{log.numero}</span>
                  <span className="text-gray-400 text-sm">· {TYPES_LOGEMENT[log.type] ?? log.type}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge className={statusColors[log.statut] ?? ""}>{STATUTS_LOGEMENT[log.statut] ?? log.statut}</Badge>
                  {isAdmin && (
                    <>
                      <button onClick={() => openEdit(log)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-green-700 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openDelete(log)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500">{log.immeuble.nom}{log.etage ? ` · ${log.etage}` : ""}</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Loyer</span>
                <span className="font-semibold text-green-700">{formatMontant(log.loyer)}</span>
              </div>
              {log.locataires.length > 0 && (
                <div className="text-sm border-t pt-2">
                  <p className="text-gray-500 text-xs">Locataire actuel</p>
                  <p className="font-medium">{log.locataires[0].nom}</p>
                  <p className="text-gray-400 text-xs">{log.locataires[0].telephone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <DoorOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun logement trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
