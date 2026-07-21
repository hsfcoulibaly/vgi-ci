"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle, Phone, Send, CheckCircle2,
  AlertTriangle, Copy, RefreshCw,
} from "lucide-react";
import { formatMontant, formatDate, labelMoisConcerne, STATUTS_RETARD } from "@/lib/format";
import { whatsappLink } from "@/lib/phone";

interface Retard {
  locataire: { id: string; nom: string; telephone: string };
  immeuble: string;
  logement: string;
  loyer: number;
  montantPaye: number;
  resteADu: number;
  statut: string;
  dernierPaiement: { date: string; montant: number } | null;
}

const now = new Date();
const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const DEFAULT_TEMPLATE = `Bonjour {nom},

Nous vous rappelons que votre loyer du mois de {mois} d'un montant de {montant} FCFA est dû pour le logement {logement} ({immeuble}).

Merci de régulariser votre situation dans les meilleurs délais.

Cordialement,
Valoris Gestion Immobilière`;

function buildMessage(template: string, r: Retard): string {
  return template
    .replace("{nom}", r.locataire.nom)
    .replace("{mois}", labelMoisConcerne(moisActuel))
    .replace("{montant}", formatMontant(r.resteADu).replace(" ", " "))
    .replace("{loyer}", formatMontant(r.loyer).replace(" ", " "))
    .replace("{logement}", r.logement)
    .replace("{immeuble}", r.immeuble);
}

export default function RappelsPage() {
  const [retards, setRetards] = useState<Retard[]>([]);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [editTemplate, setEditTemplate] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [smsSending, setSmsSending] = useState<string | null>(null);
  const [smsStatus, setSmsStatus] = useState<Record<string, "ok" | "err">>({});
  const [twilioDisponible, setTwilioDisponible] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/retards").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setRetards(d); }).catch(() => {});
    fetch("/api/rappels/sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telephone: "test", message: "test" }) })
      .then((r) => setTwilioDisponible(r.status !== 503))
      .catch(() => setTwilioDisponible(false));
  }, []);

  function markSent(id: string) {
    setSentIds((prev) => new Set([...prev, id]));
  }

  function copyMessage(r: Retard) {
    navigator.clipboard.writeText(buildMessage(template, r));
  }

  async function sendSMS(r: Retard) {
    setSmsSending(r.locataire.id);
    const res = await fetch("/api/rappels/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telephone: r.locataire.telephone, message: buildMessage(template, r) }),
    });
    setSmsStatus((prev) => ({ ...prev, [r.locataire.id]: res.ok ? "ok" : "err" }));
    if (res.ok) markSent(r.locataire.id);
    setSmsSending(null);
  }

  const totalDu = retards.reduce((s, r) => s + r.resteADu, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rappels</h1>
        <p className="text-gray-500 text-sm">
          {retards.length} locataire(s) en retard · Total dû : <span className="font-semibold text-orange-600">{formatMontant(totalDu)}</span>
        </p>
      </div>

      {/* Template editor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Modèle de message</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setEditTemplate(!editTemplate)}>
            {editTemplate ? "Fermer" : "Modifier"}
          </Button>
        </CardHeader>
        <CardContent>
          {editTemplate ? (
            <div className="space-y-2">
              <Textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-400">
                Variables : <code className="bg-gray-100 px-1 rounded">{"{nom}"}</code>{" "}
                <code className="bg-gray-100 px-1 rounded">{"{mois}"}</code>{" "}
                <code className="bg-gray-100 px-1 rounded">{"{montant}"}</code>{" "}
                <code className="bg-gray-100 px-1 rounded">{"{loyer}"}</code>{" "}
                <code className="bg-gray-100 px-1 rounded">{"{logement}"}</code>{" "}
                <code className="bg-gray-100 px-1 rounded">{"{immeuble}"}</code>
              </p>
              <Button size="sm" variant="outline" onClick={() => setTemplate(DEFAULT_TEMPLATE)}>
                <RefreshCw className="w-3 h-3 mr-1" />Réinitialiser
              </Button>
            </div>
          ) : (
            <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans bg-gray-50 rounded-lg p-3 border text-xs leading-relaxed">
              {template}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Twilio status badge */}
      {twilioDisponible === false && (
        <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>SMS Twilio non configuré — seul l'envoi WhatsApp est disponible. Ajoutez <code className="font-mono text-xs">TWILIO_ACCOUNT_SID</code>, <code className="font-mono text-xs">TWILIO_AUTH_TOKEN</code> et <code className="font-mono text-xs">TWILIO_PHONE_NUMBER</code> dans Vercel.</span>
        </div>
      )}

      {/* Locataires en retard */}
      {retards.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-60" />
          <p className="font-medium text-gray-600">Aucun retard ce mois-ci</p>
          <p className="text-sm">Tous les locataires sont à jour.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {retards.map((r) => {
            const info = STATUTS_RETARD[r.statut] ?? { label: r.statut, color: "bg-gray-100 text-gray-700" };
            const waLink = whatsappLink(r.locataire.telephone, buildMessage(template, r));
            const sent = sentIds.has(r.locataire.id);

            return (
              <Card
                key={r.locataire.id}
                className={`border-l-4 transition-opacity ${sent ? "opacity-60" : ""}`}
                style={{ borderLeftColor: r.statut === "LITIGE" ? "#ef4444" : r.statut === "RETARD_IMPORTANT" ? "#f97316" : "#eab308" }}
              >
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold">{r.locataire.nom}</p>
                        <Badge className={info.color}>{info.label}</Badge>
                        {sent && <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Rappel envoyé</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">{r.immeuble} · Logement {r.logement}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <Phone className="w-3 h-3" />{r.locataire.telephone}
                      </div>
                      {r.dernierPaiement && (
                        <p className="text-xs text-gray-400 mt-1">
                          Dernier paiement : {formatDate(r.dernierPaiement.date)} · {formatMontant(r.dernierPaiement.montant)}
                        </p>
                      )}
                      {!r.dernierPaiement && <p className="text-xs text-red-400 mt-1">Aucun paiement enregistré</p>}
                    </div>

                    {/* Amounts */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className="text-xs text-gray-400">Loyer</p>
                      <p className="text-sm font-medium">{formatMontant(r.loyer)}</p>
                      {r.montantPaye > 0 && <>
                        <p className="text-xs text-gray-400 mt-1">Payé</p>
                        <p className="text-sm text-green-600">{formatMontant(r.montantPaye)}</p>
                      </>}
                      <p className="text-xs text-gray-400 mt-1">Reste dû</p>
                      <p className="text-xl font-bold text-red-600">{formatMontant(r.resteADu)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markSent(r.locataire.id)}
                    >
                      <Button size="sm" className="bg-[#25D366] hover:bg-[#1da851] text-white">
                        <MessageCircle className="w-4 h-4 mr-1.5" />WhatsApp
                      </Button>
                    </a>

                    {twilioDisponible && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={smsSending === r.locataire.id}
                        className={smsStatus[r.locataire.id] === "ok" ? "border-green-500 text-green-600" : smsStatus[r.locataire.id] === "err" ? "border-red-400 text-red-600" : ""}
                        onClick={() => sendSMS(r)}
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        {smsSending === r.locataire.id ? "Envoi..." : smsStatus[r.locataire.id] === "ok" ? "SMS envoyé ✓" : smsStatus[r.locataire.id] === "err" ? "Échec" : "SMS"}
                      </Button>
                    )}

                    <Button size="sm" variant="outline" onClick={() => copyMessage(r)}>
                      <Copy className="w-3.5 h-3.5 mr-1.5" />Copier
                    </Button>

                    {sent && !sentIds.has(r.locataire.id + "_unsent") && (
                      <Button size="sm" variant="ghost" className="text-gray-400 text-xs" onClick={() => setSentIds((p) => { const n = new Set(p); n.delete(r.locataire.id); return n; })}>
                        Marquer non envoyé
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
