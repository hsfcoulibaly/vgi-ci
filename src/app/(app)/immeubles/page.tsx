"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building2, MapPin } from "lucide-react";

interface Logement { id: string; statut: string }
interface Immeuble {
  id: string;
  nom: string;
  adresse: string;
  quartier: string;
  commune: string;
  proprietaire: string;
  description?: string;
  logements: Logement[];
}

export default function ImmeublesPage() {
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState("");
  const [form, setForm] = useState({
    nom: "", adresse: "", quartier: "", commune: "", proprietaire: "", description: "",
  });

  const load = () =>
    fetch("/api/immeubles")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setImmeubles(d); })
      .catch(() => {});

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErreur("");
    try {
      const res = await fetch("/api/immeubles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setOpen(false);
        setForm({ nom: "", adresse: "", quartier: "", commune: "", proprietaire: "", description: "" });
        await load();
      } else {
        setErreur(data?.error ?? `Erreur ${res.status}`);
      }
    } catch (err) {
      setErreur("Erreur réseau : " + String(err));
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Immeubles</h1>
          <p className="text-gray-500 text-sm">{immeubles.length} immeuble(s) enregistré(s)</p>
        </div>

        {/* Button lives OUTSIDE Dialog to avoid event conflicts */}
        <Button onClick={() => setOpen(true)} className="bg-green-700 hover:bg-green-800">
          <Plus className="w-4 h-4 mr-2" /> Ajouter
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un immeuble</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            {[
              { key: "nom", label: "Nom de l'immeuble", placeholder: "Résidence Ebenezer" },
              { key: "adresse", label: "Adresse", placeholder: "Rue des Jardins" },
              { key: "quartier", label: "Quartier", placeholder: "Cocody Riviera" },
              { key: "commune", label: "Commune", placeholder: "Cocody" },
              { key: "proprietaire", label: "Propriétaire", placeholder: "M. Dupont" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  required
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {immeubles.map((imm) => {
          const occupes = imm.logements.filter((l) => l.statut === "OCCUPE").length;
          const libres = imm.logements.filter((l) => l.statut === "LIBRE").length;
          return (
            <Card key={imm.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <CardTitle className="text-base leading-tight">{imm.nom}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-3 h-3" />
                  {imm.quartier}, {imm.commune}
                </div>
                <p className="text-xs text-gray-400">{imm.adresse}</p>
                <p className="text-xs text-gray-500">Propriétaire : {imm.proprietaire}</p>
                {imm.description && (
                  <p className="text-xs text-gray-400 line-clamp-2">{imm.description}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Badge className="bg-green-100 text-green-800 text-xs">{occupes} occupé{occupes > 1 ? "s" : ""}</Badge>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">{libres} libre{libres > 1 ? "s" : ""}</Badge>
                  <Badge variant="outline" className="text-xs">{imm.logements.length} total</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {immeubles.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun immeuble enregistré</p>
          </div>
        )}
      </div>
    </div>
  );
}
