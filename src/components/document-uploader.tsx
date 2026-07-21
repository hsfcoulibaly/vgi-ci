"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Loader2 } from "lucide-react";

const TYPES_DOC = {
  CONTRAT: "Contrat de bail",
  PIECE_IDENTITE: "Pièce d'identité",
  QUITTANCE: "Quittance",
  PHOTO: "Photo",
  AUTRE: "Autre",
};

interface Props {
  locataireId?: string;
  immeubleId?: string;
  logementId?: string;
  onUploaded: () => void;
}

export function DocumentUploader({ locataireId, immeubleId, logementId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [type, setType] = useState("CONTRAT");

  async function upload(file: File) {
    setUploading(true);
    setErreur("");
    try {
      // Step 1: get signature
      const signRes = await fetch("/api/documents/sign");
      if (!signRes.ok) throw new Error("Cloudinary non configuré — ajoutez les variables d'environnement.");
      const { timestamp, signature, apiKey, cloudName } = await signRes.json();

      // Step 2: upload directly to Cloudinary
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "vgi");
      fd.append("timestamp", String(timestamp));
      fd.append("signature", signature);
      fd.append("api_key", apiKey);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: fd,
      });
      if (!uploadRes.ok) throw new Error("Échec de l'upload vers Cloudinary");
      const { secure_url, public_id } = await uploadRes.json();

      // Step 3: save to DB
      const saveRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: file.name,
          type,
          url: secure_url,
          publicId: public_id,
          locataireId,
          immeubleId,
          logementId,
        }),
      });
      if (!saveRes.ok) throw new Error("Erreur lors de l'enregistrement");
      onUploaded();
    } catch (err) {
      setErreur(String(err));
    }
    setUploading(false);
  }

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    upload(files[0]);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <label className="text-sm text-gray-600 font-medium">Type :</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="text-sm border rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          {Object.entries(TYPES_DOC).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragging ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-400 hover:bg-gray-50"
        }`}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-green-600">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium">Envoi en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Upload className="w-8 h-8" />
            <p className="text-sm font-medium text-gray-600">Glisser-déposer ou cliquer pour choisir</p>
            <p className="text-xs">PDF, image, Word — max 10 Mo</p>
          </div>
        )}
      </div>

      {erreur && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
          <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {erreur}
        </div>
      )}
    </div>
  );
}

export function DocumentIcon({ type }: { type: string }) {
  const colors: Record<string, string> = {
    CONTRAT: "text-green-600 bg-green-50",
    PIECE_IDENTITE: "text-blue-600 bg-blue-50",
    QUITTANCE: "text-purple-600 bg-purple-50",
    PHOTO: "text-orange-600 bg-orange-50",
    AUTRE: "text-gray-600 bg-gray-100",
  };
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[type] ?? colors.AUTRE}`}>
      <FileText className="w-4 h-4" />
    </div>
  );
}

export const TYPES_DOC_LABELS: Record<string, string> = {
  CONTRAT: "Contrat de bail",
  PIECE_IDENTITE: "Pièce d'identité",
  QUITTANCE: "Quittance",
  PHOTO: "Photo",
  AUTRE: "Autre",
};
