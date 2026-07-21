"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { FileText, Trash2, ExternalLink, Upload, FolderOpen } from "lucide-react";
import { formatDate } from "@/lib/format";
import { DocumentUploader, DocumentIcon, TYPES_DOC_LABELS } from "@/components/document-uploader";

interface Locataire { id: string; nom: string; logement: { numero: string; immeuble: { nom: string } } }
interface Immeuble { id: string; nom: string }
interface Doc {
  id: string; nom: string; type: string; url: string; publicId?: string; createdAt: string;
  locataireId?: string; immeubleId?: string; logementId?: string;
}

type EntityType = "locataire" | "immeuble" | "tous";

export default function DocumentsPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? "";
  const canDelete = role === "ADMIN" || role === "RESPONSABLE";

  const [docs, setDocs] = useState<Doc[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [entityType, setEntityType] = useState<EntityType>("locataire");
  const [selectedId, setSelectedId] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<Doc | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/locataires?statut=ACTIF").then((r) => r.json()),
      fetch("/api/immeubles").then((r) => r.json()),
    ]).then(([locs, imms]) => {
      if (Array.isArray(locs)) setLocataires(locs);
      if (Array.isArray(imms)) setImmeubles(imms);
    });
  }, []);

  const load = async () => {
    if (!selectedId && entityType !== "tous") return setDocs([]);
    const qs = entityType === "locataire" && selectedId
      ? `locataireId=${selectedId}`
      : entityType === "immeuble" && selectedId
      ? `immeubleId=${selectedId}`
      : "";
    const res = await fetch(`/api/documents${qs ? `?${qs}` : ""}`);
    const d = await res.json();
    if (Array.isArray(d)) setDocs(d);
  };

  useEffect(() => { load(); }, [selectedId, entityType]);

  async function handleDelete() {
    if (!deleteDoc) return;
    const res = await fetch(`/api/documents/${deleteDoc.id}`, { method: "DELETE" });
    if (res.ok) { setDeleteOpen(false); setDeleteDoc(null); await load(); }
    else { const d = await res.json(); alert(d?.error ?? "Erreur"); }
  }

  const getEntityLabel = (doc: Doc) => {
    if (doc.locataireId) {
      const l = locataires.find(x => x.id === doc.locataireId);
      return l ? `${l.nom} · ${l.logement.immeuble.nom} ${l.logement.numero}` : "Locataire";
    }
    if (doc.immeubleId) {
      const i = immeubles.find(x => x.id === doc.immeubleId);
      return i?.nom ?? "Immeuble";
    }
    return "";
  };

  const isCloudinaryConfigured = true; // checked at runtime via sign endpoint

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 text-sm">Gestion des fichiers par locataire ou immeuble</p>
        </div>
        <Button
          onClick={() => setUploadOpen(true)}
          className="bg-green-700 hover:bg-green-800"
          disabled={!selectedId}
        >
          <Upload className="w-4 h-4 mr-2" />Ajouter un document
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Filtrer par</label>
              <div className="flex gap-1">
                {(["locataire", "immeuble"] as EntityType[]).map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={entityType === t ? "default" : "outline"}
                    className={entityType === t ? "bg-green-700" : ""}
                    onClick={() => { setEntityType(t); setSelectedId(""); setDocs([]); }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1 min-w-64">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {entityType === "locataire" ? "Locataire" : "Immeuble"}
              </label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <span className={selectedId ? "" : "text-gray-400"}>
                    {selectedId
                      ? entityType === "locataire"
                        ? (() => { const l = locataires.find(x => x.id === selectedId); return l ? `${l.nom} · ${l.logement.immeuble.nom} ${l.logement.numero}` : ""; })()
                        : immeubles.find(x => x.id === selectedId)?.nom
                      : `Choisir un ${entityType}`}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {(entityType === "locataire" ? locataires : immeubles).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {entityType === "locataire"
                        ? `${(item as Locataire).nom} · ${(item as Locataire).logement.immeuble.nom} ${(item as Locataire).logement.numero}`
                        : (item as Immeuble).nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un document</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <DocumentUploader
              locataireId={entityType === "locataire" ? selectedId : undefined}
              immeubleId={entityType === "immeuble" ? selectedId : undefined}
              onUploaded={async () => { setUploadOpen(false); await load(); }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Supprimer ce document ?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-semibold">{deleteDoc?.nom}</span> sera définitivement supprimé. Action irréversible.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Supprimer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Documents list */}
      {!selectedId ? (
        <div className="text-center py-20 text-gray-400">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sélectionnez un locataire ou un immeuble</p>
          <p className="text-sm">pour voir et gérer ses documents</p>
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucun document</p>
          <p className="text-sm">Cliquez sur « Ajouter un document » pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <DocumentIcon type={doc.type} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" title={doc.nom}>{doc.nom}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{TYPES_DOC_LABELS[doc.type] ?? doc.type}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Ajouté le {formatDate(doc.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      <ExternalLink className="w-3 h-3 mr-1" />Ouvrir
                    </Button>
                  </a>
                  {canDelete && (
                    <Button
                      size="sm" variant="outline"
                      className="text-red-600 hover:bg-red-50 text-xs"
                      onClick={() => { setDeleteDoc(doc); setDeleteOpen(true); }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
