"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, ShieldCheck, UserCheck, UserX, KeyRound, Pencil } from "lucide-react";
import { formatDate } from "@/lib/format";

interface User {
  id: string; name: string; email: string;
  role: string; actif: boolean; createdAt: string;
}

const ROLES: Record<string, { label: string; color: string }> = {
  ADMIN:        { label: "Administrateur", color: "bg-purple-100 text-purple-800" },
  RESPONSABLE:  { label: "Responsable",    color: "bg-blue-100 text-blue-800" },
  ASSISTANT:    { label: "Assistant",      color: "bg-gray-100 text-gray-700" },
};

const emptyForm = { name: "", email: "", password: "", role: "ASSISTANT" };

export default function ParametresPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [erreur, setErreur] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/users");
    const d = await res.json();
    if (Array.isArray(d)) setUsers(d);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  function openCreate() {
    setEditUser(null);
    setForm(emptyForm);
    setErreur("");
    setOpen(true);
  }

  function openEdit(u: User) {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setErreur("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErreur("");
    try {
      const url = editUser ? `/api/users/${editUser.id}` : "/api/users";
      const method = editUser ? "PATCH" : "POST";
      const body = editUser
        ? { name: form.name, email: form.email, role: form.role, ...(form.password ? { password: form.password } : {}) }
        : form;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) { setOpen(false); await load(); }
      else setErreur(data?.error ?? `Erreur ${res.status}`);
    } catch (err) { setErreur("Erreur réseau : " + String(err)); }
    setSaving(false);
  }

  async function toggleActif(u: User) {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !u.actif }),
    });
    await load();
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <ShieldCheck className="w-14 h-14 mb-4 opacity-30" />
        <p className="text-lg font-medium">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-500 text-sm">{users.length} utilisateur(s) enregistré(s)</p>
        </div>
        <Button onClick={openCreate} className="bg-green-700 hover:bg-green-800">
          <Plus className="w-4 h-4 mr-2" />Ajouter un agent
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editUser ? "Modifier l'agent" : "Nouvel agent"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Nom complet</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kouamé Jean" required />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="agent@nehemie.ci" required />
            </div>
            <div className="space-y-1">
              <Label>{editUser ? "Nouveau mot de passe (laisser vide = inchangé)" : "Mot de passe"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required={!editUser} />
            </div>
            <div className="space-y-1">
              <Label>Rôle</Label>
              <Select value={form.role} onValueChange={(v) => v && setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <span>{ROLES[form.role]?.label ?? form.role}</span>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        {users.map((u) => (
          <Card key={u.id} className={`transition-shadow hover:shadow-md ${!u.actif ? "opacity-60" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-sm leading-tight">{u.name}</CardTitle>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </div>
                <Badge className={ROLES[u.role]?.color ?? ""}>{ROLES[u.role]?.label ?? u.role}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                {u.actif
                  ? <span className="flex items-center gap-1 text-xs text-green-700"><UserCheck className="w-3 h-3" />Actif</span>
                  : <span className="flex items-center gap-1 text-xs text-red-500"><UserX className="w-3 h-3" />Désactivé</span>}
                <span className="text-xs text-gray-400 ml-auto">Depuis {formatDate(u.createdAt)}</span>
              </div>
              <div className="flex gap-2 pt-1 border-t">
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => openEdit(u)}>
                  <Pencil className="w-3 h-3 mr-1" />Modifier
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => openEdit({ ...u, password: "" } as User & { password: string })}>
                  <KeyRound className="w-3 h-3 mr-1" />Mot de passe
                </Button>
                <Button
                  size="sm" variant="outline"
                  className={`text-xs ${u.actif ? "text-red-600 hover:bg-red-50" : "text-green-700 hover:bg-green-50"}`}
                  onClick={() => toggleActif(u)}
                >
                  {u.actif ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun agent enregistré</p>
        </div>
      )}

      <Card className="border-gray-200">
        <CardContent className="pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Permissions par rôle</p>
          <div className="text-xs text-gray-500 space-y-1">
            <p><span className="font-medium text-purple-700">Administrateur</span> — Accès complet : gestion des agents, immeubles, logements, locataires, paiements, dépenses</p>
            <p><span className="font-medium text-blue-700">Responsable</span> — Peut gérer immeubles, logements, locataires, paiements et dépenses. Ne peut pas gérer les agents.</p>
            <p><span className="font-medium text-gray-700">Assistant</span> — Peut enregistrer des paiements et consulter les données. Ne peut pas créer d&apos;immeubles ni de dépenses.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
