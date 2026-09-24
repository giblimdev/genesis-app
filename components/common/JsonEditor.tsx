/*
path :           components/common/JsonEditor.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Éditeur JSON générique : textarea monospace, validation
                 syntaxique en direct (indicateur vert / rouge), bouton
                 d'action désactivé si le JSON est invalide.

flow:            Client Component → useState(value, error) → onChange parse
                 JSON et met à jour l'erreur → bouton Appliquer appelle
                 onSubmit(value) si valide.

ecosystem:       UI = [
                   "@/components/common/CopyButton.tsx",
                   "@/components/common/CopyJsonButton.tsx",
                   "@/components/common/ExportJsonDialog.tsx",
                   "@/components/common/ImportJsonDialog.tsx",
                   "@/components/common/JsonEditor.tsx",
                 ]
relatedFiles:    ["@/components/ui/textarea",
                  "@/components/ui/button",
                  "@/lib/utils"]
imports:         ["react", "lucide-react",
                  "@/components/ui/textarea",
                  "@/components/ui/button",
                  "@/lib/utils",
                  "props reçues : { initialValue?, rows?, submitLabel?, isPending?, onSubmit, className?, emptyMessage? }"]
exports:         ["JsonEditor", "JsonEditorProps"]
useBy:           []

userStories:     ["*auto-json-editor"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useState, type ChangeEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type JsonEditorProps = {
  readonly initialValue?: string;
  readonly rows?: number;
  readonly submitLabel?: string;
  readonly isPending?: boolean;
  readonly onSubmit: (rawJson: string) => void | Promise<void>;
  readonly className?: string;
  readonly emptyMessage?: string;
};

/* ------------------------------------------------------------------ */
/*  Helper — validation syntaxique                                     */
/* ------------------------------------------------------------------ */

function validateJson(raw: string): string | null {
  if (raw.trim().length === 0) return "Le JSON est vide.";
  try {
    JSON.parse(raw);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "JSON invalide.";
  }
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function JsonEditor({
  initialValue = "",
  rows = 18,
  submitLabel = "Appliquer",
  isPending = false,
  onSubmit,
  className,
  emptyMessage = "En attente de saisie…",
}: JsonEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    setValue(next);
    setError(next.trim().length > 0 ? validateJson(next) : null);
  }

  function handleSubmit() {
    const validationError = validateJson(value);
    if (validationError) {
      setError(validationError);
      return;
    }
    void onSubmit(value);
  }

  const isEmpty = value.trim().length === 0;
  const isValid = !isEmpty && error === null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Barre de statut */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          {isEmpty ? (
            <span className="text-muted-foreground">{emptyMessage}</span>
          ) : isValid ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              JSON valide
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden />
              JSON invalide
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {value.length.toLocaleString()} car.
        </span>
      </div>

      {/* Textarea */}
      <Textarea
        value={value}
        onChange={handleChange}
        rows={rows}
        spellCheck={false}
        className={cn(
          "font-mono text-xs leading-relaxed",
          error && "border-rose-500/50 focus-visible:ring-rose-500/50",
        )}
      />

      {/* Message d'erreur détaillé */}
      {error && (
        <p className="flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="break-all">{error}</span>
        </p>
      )}

      {/* Bouton submit */}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid || isPending}
        className="self-start gap-2"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {submitLabel}
      </Button>
    </div>
  );
}