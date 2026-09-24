/*
path :           components/common/ImportJsonDialog.tsx
tag :            ["common", "import", "json", "dialog"]
projectId:       <à fournir>
type :           component
generic:         true

role:            Dialog d'import JSON générique avec option UPSERT. Affiche
                 une <Textarea> pré-remplie avec un template, laisse
                 l'utilisateur éditer, puis appelle onSubmit(rawJson, mode).
                 Si `modes` est fourni (>1 valeur), un toggle apparaît.
                 Gère l'état pending MANUELLEMENT (pas useTransition) pour
                 éviter les spinners infinis avec Next.js 16 / Turbopack.

flow:            Client Component → useState(open, text, mode, isPending)
                 → submit → try/catch → await onSubmit(text, mode) →
                 si succès : close + reset ; si erreur : toast + reset.

ecosystem:       UI = [
                   "@/components/common/CopyButton.tsx",
                   "@/components/common/CopyJsonButton.tsx",
                   "@/components/common/ExportJsonDialog.tsx",
                   "@/components/common/ImportJsonDialog.tsx",
                   "@/components/common/JsonEditor.tsx",
                 ]
relatedFiles:    ["@/components/ui/dialog",
                  "@/components/ui/button",
                  "@/components/ui/textarea",
                  "@/lib/actions/types"]
imports:         ["react", "lucide-react", "sonner",
                  "@/components/ui/dialog",
                  "@/components/ui/button",
                  "@/components/ui/textarea",
                  "@/lib/actions/types",
                  "props reçues : { trigger, title, description, template, submitLabel?, modes?, defaultMode?, onSubmit, onSuccess? }"]
exports:         ["ImportJsonDialog", "ImportJsonDialogProps"]
useBy:           ["@/app/back-studio/scrum/page.tsx",
                  "@/app/back-studio/scrum/[slug]/features/new/page.tsx",
                  "@/app/back-studio/scrum/[slug]/personas/new/page.tsx",
                  "@/app/back-studio/scrum/[slug]/backlog/new/page.tsx",
                  "@/app/back-studio/scrum/[slug]/sprints/new/page.tsx",
                  "@/components/task/TaskList.tsx"]

userStories:     ["*en tant que développeur je veux importer du JSON en un clic",
                  "*en tant que développeur je veux pouvoir mettre à jour l'existant"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useEffect, useState, type ReactElement } from "react";
import {
  Check,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { BulkImportResult, ImportMode } from "@/lib/actions/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ImportJsonDialogProps = {
  readonly trigger: ReactElement;
  readonly title: string;
  readonly description: string;
  readonly template: string;
  readonly submitLabel?: string;
  readonly modes?: readonly ImportMode[];
  readonly defaultMode?: ImportMode;
  readonly onSubmit: (
    rawJson: string,
    mode: ImportMode,
  ) => Promise<BulkImportResult>;
  readonly onSuccess?: () => void;
};

const MODE_LABELS: Record<ImportMode, string> = {
  create: "Créer seulement",
  upsert: "Créer ou mettre à jour",
};

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function ImportJsonDialog({
  trigger,
  title,
  description,
  template,
  submitLabel = "Importer",
  modes,
  defaultMode = "create",
  onSubmit,
  onSuccess,
}: ImportJsonDialogProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(template);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<ImportMode>(defaultMode);
  const [isPending, setIsPending] = useState(false);

  /* Reset à la fermeture. */
  useEffect(() => {
    if (!open) {
      setText(template);
      setMode(defaultMode);
      setCopied(false);
      setIsPending(false);
    }
  }, [open, template, defaultMode]);

  const showModeToggle = modes !== undefined && modes.length > 1;

  async function handleCopyTemplate() {
    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      toast.success("Template copié dans le presse-papiers.");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copie impossible.");
    }
  }

  function handleReset() {
    setText(template);
  }

  async function handleSubmit() {
    /* Garde-fou : évite le double-clic. */
    if (isPending) return;

    setIsPending(true);

    /* Timeout de sécurité : si le serveur ne répond pas en 90s,
       on arrête le spinner et on affiche une erreur claire. */
    const timeoutPromise = new Promise<BulkImportResult>((resolve) => {
      window.setTimeout(() => {
        resolve({
          success: false,
          error:
            "Délai dépassé (90s). Le serveur n'a pas répondu. Vérifie le terminal Next.js pour les erreurs.",
        });
      }, 90_000);
    });

    try {
      const result = await Promise.race([
        onSubmit(text, mode),
        timeoutPromise,
      ]);

      if (result.success) {
        const parts: string[] = [];
        if (result.created !== undefined && result.created > 0) {
          parts.push(`${result.created} créé${result.created > 1 ? "s" : ""}`);
        }
        if (result.updated !== undefined && result.updated > 0) {
          parts.push(
            `${result.updated} mis à jour${result.updated > 1 ? "s" : ""}`,
          );
        }
        const summary =
          parts.length > 0
            ? parts.join(", ")
            : `${result.imported} élément${result.imported > 1 ? "s" : ""} ajouté${result.imported > 1 ? "s" : ""}`;

        toast.success(summary + ".");
        setText(template);
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error("[ImportJsonDialog] submit error:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur inattendue lors de l'import.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />

      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {showModeToggle && (
          <div
            role="group"
            aria-label="Mode d'import"
            className="inline-flex w-fit rounded-lg border border-border bg-background p-0.5"
          >
            {modes!.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {m === "create" ? (
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                )}
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Template JSON prêt à l&apos;emploi
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyTemplate}
              className="h-7 gap-1.5 px-2 text-[11px]"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" aria-hidden />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" aria-hidden />
                  Copier le template
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 gap-1.5 px-2 text-[11px]"
            >
              <RotateCcw className="h-3 w-3" aria-hidden />
              Réinitialiser
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={20}
            spellCheck={false}
            className="font-mono text-xs leading-relaxed"
          />
        </div>

        <DialogFooter className="shrink-0 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || text.trim().length === 0}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : mode === "upsert" ? (
              <RefreshCw className="h-4 w-4" aria-hidden />
            ) : (
              <Plus className="h-4 w-4" aria-hidden />
            )}
            {isPending
              ? "Enregistrement…"
              : mode === "upsert"
                ? "Enregistrer"
                : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}