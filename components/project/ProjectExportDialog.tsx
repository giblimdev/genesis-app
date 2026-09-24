/*
path :           components/project/ProjectExportDialog.tsx
tag :            ["project", "export", "dialog", "json", "markdown"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Dialogue d'export d'un projet. Affiche le snapshot complet
                 (features, personas, user stories, sprints) dans une
                 <Textarea> en lecture seule, avec bascule JSON / MD et
                 bouton Copier. Le snapshot est chargé à la première
                 ouverture via la Server Action exportProjectFull (lazy).

flow:            Client Component → useState(open, format, snapshot, loading,
                 error, reloadKey) → useEffect déclenché UNIQUEMENT par
                 [open, projectId, reloadKey] → appelle exportProjectFull
                 → stocke le résultat dans snapshot → useMemo calcule le
                 contenu selon le format (JSON.stringify OU snapshotToMarkdown)
                 → bouton Copier (navigator.clipboard + fallback) → toast.

ecosystem:       Project = [
                   "@/app/actions/project/exportProjectFull.ts",
                   "@/app/back-studio/scrum/[slug]/page.tsx",
                   "@/components/project/ProjectExportDialog.tsx",
                   "@/lib/project/serialize-for-disk.ts",
                   "@/lib/project/serialize-to-md.ts",
                 ]
relatedFiles:    ["@/app/actions/project/exportProjectFull.ts",
                  "@/lib/project/serialize-to-md.ts",
                  "@/components/ui/dialog",
                  "@/components/ui/button",
                  "@/components/ui/textarea"]
imports:         ["react", "lucide-react", "sonner",
                  "@/components/ui/dialog",
                  "@/components/ui/button",
                  "@/components/ui/textarea",
                  "@/app/actions/project/exportProjectFull",
                  "@/lib/project/serialize-to-md",
                  "@/lib/project/serialize-for-disk",
                  "props reçues : { projectId: string; projectName: string; trigger: ReactElement; }"]
exports:         ["ProjectExportDialog", "ProjectExportDialogProps"]
useBy:           ["@/app/back-studio/scrum/[slug]/page.tsx"]

userStories:     ["*en tant que développeur je veux voir le JSON ou MD complet d'un projet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  FileJson,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { exportProjectFull } from "@/app/actions/project/exportProjectFull";
import { snapshotToMarkdown } from "@/lib/project/serialize-to-md";
import type { ProjectDiskSnapshot } from "@/lib/project/serialize-for-disk";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Format = "json" | "md";

export type ProjectExportDialogProps = {
  readonly projectId: string;
  readonly projectName: string;
  readonly trigger: ReactElement;
};

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function ProjectExportDialog({
  projectId,
  projectName,
  trigger,
}: ProjectExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>("json");
  const [snapshot, setSnapshot] = useState<ProjectDiskSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  /* ---------------------------------------------------------------- */
  /*  Chargement lazy — déclenché par [open, projectId, reloadKey]     */
  /*  IMPORTANT : `loading` et `snapshot` ne sont PAS dans les deps    */
  /*  pour éviter que setLoading(true) ne relance l'effet et annule    */
  /*  la promesse via le cleanup.                                      */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    exportProjectFull(projectId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError("Projet introuvable ou accès refusé.");
          return;
        }
        setSnapshot(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Chargement impossible.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, projectId, reloadKey]);

  /* ---------- Reset du toggle à la fermeture ---------- */

  useEffect(() => {
    if (!open) {
      setFormat("json");
      setCopied(false);
    }
  }, [open]);

  /* ---------- Contenu calculé ---------- */

  const content = useMemo(() => {
    if (!snapshot) return "";
    if (format === "json") return JSON.stringify(snapshot, null, 2);
    return snapshotToMarkdown(snapshot);
  }, [snapshot, format]);

  /* ---------- Copie presse-papiers ---------- */

  async function handleCopy() {
    if (!content) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        const ta = document.createElement("textarea");
        ta.value = content;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success(`Projet copié (${format.toUpperCase()}).`);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copie impossible.");
    }
  }

  /* ---------- Retry ---------- */

  function handleRetry() {
    setSnapshot(null);
    setError(null);
    setReloadKey((k) => k + 1);
  }

  /* ---------- Rendu ---------- */

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />

      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-3xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>Export complet — {projectName}</DialogTitle>
          <DialogDescription>
            Snapshot ré-importable du projet : features, personas, user stories
            et sprints, relations converties en slugs.
          </DialogDescription>
        </DialogHeader>

        {/* Barre d'outils : toggle JSON / MD + compteur */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Format d'export"
            className="inline-flex rounded-lg border border-border bg-background p-0.5"
          >
            <button
              type="button"
              onClick={() => setFormat("json")}
              aria-pressed={format === "json"}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                format === "json"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <FileJson className="h-3.5 w-3.5" aria-hidden />
              JSON
            </button>
            <button
              type="button"
              onClick={() => setFormat("md")}
              aria-pressed={format === "md"}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                format === "md"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5" aria-hidden />
              MD
            </button>
          </div>

          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            {content.length.toLocaleString()} caractères
          </span>
        </div>

        {/* Contenu : spinner / erreur / textarea */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && (
            <div className="grid place-items-center rounded-md border border-dashed border-border bg-muted/20 p-12">
              <div className="flex flex-col items-center gap-2">
                <Loader2
                  className="h-5 w-5 animate-spin text-muted-foreground"
                  aria-hidden
                />
                <p className="text-xs italic text-muted-foreground">
                  Chargement du projet…
                </p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                aria-hidden
              />
              <div className="flex flex-1 flex-col gap-2">
                <p className="text-xs leading-relaxed text-destructive">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="w-fit rounded border border-destructive/40 bg-background px-2 py-1 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {!loading && !error && content && (
            <Textarea
              value={content}
              readOnly
              rows={22}
              spellCheck={false}
              className="font-mono text-xs leading-relaxed"
            />
          )}
        </div>

        {/* Pied : annuler + copier */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Fermer
          </Button>
          <Button
            type="button"
            onClick={handleCopy}
            disabled={!content || loading}
            className="gap-2"
          >
            {copied ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
            {copied ? "Copié" : `Copier ${format.toUpperCase()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}