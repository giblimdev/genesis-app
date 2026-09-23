/*
path :           app/back-studio/creatFiles/ConflictDialog.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Dialogue de résolution de conflit. Affiché quand la route /save renvoie
                 409 : une ou plusieurs destinations existent déjà. Propose 4 actions :
                 Annuler, Ignorer, Renommer (suffixe -2, -3), Écraser. Ne prend AUCUNE
                 décision par défaut — l'utilisateur doit choisir explicitement.

flow:            Reçoit conflicts (liste de chemins), busy, onCancel, onResolve(policy).
                 Modal centré, overlay noir translucide. Ne se ferme pas au clic
                 extérieur (action destructrice potentielle).
ecosystem:       Dev = [
                   "@/app/back-studio/CreatFiles/CreatFilesView.tsx",
                   "@/app/back-studio/CreatFiles/ConflictDialog.tsx",
                 ]
relatedFiles:    ["@/app/back-studio/CreatFiles/CreatFilesView.tsx"]
imports:         ["react", "lucide-react",
                  "props reçues : { conflicts: readonly string[]; busy?: boolean; onCancel: () => void; onResolve: (policy: \"skip\" | \"overwrite\" | \"rename\") => void; }"]
exports:         ["ConflictDialog", "ConflictDialogProps"]
useBy:           ["@/app/back-studio/CreatFiles/CreatFilesView.tsx"]

userStories:     ["*en tant que développeur je veux choisir quoi faire en cas de conflit"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : gestionnaires de clic + overlay.

import { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export type ConflictDialogProps = {
  readonly conflicts: readonly string[];
  readonly busy?: boolean;
  readonly onCancel: () => void;
  readonly onResolve: (policy: "skip" | "overwrite" | "rename") => void;
};

export function ConflictDialog({
  conflicts,
  busy = false,
  onCancel,
  onResolve,
}: ConflictDialogProps) {
  /* ESC → annule. Entrée → rien (action destructrice : jamais par défaut). */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-xl">
        <header className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h2
              id="conflict-title"
              className="text-lg font-bold text-foreground"
            >
              {conflicts.length} fichier(s) déjà existant(s)
            </h2>
            <p className="text-xs text-muted-foreground">
              Aucune action par défaut. Choisis explicitement ce qui doit se
              passer pour éviter tout écrasement accidentel.
            </p>
          </div>
        </header>

        <ul className="max-h-60 overflow-auto rounded-md border border-border/60 bg-muted/30 p-2 font-mono text-[11px] leading-relaxed text-foreground/90">
          {conflicts.map((p) => (
            <li key={p} className="truncate">
              {p}
            </li>
          ))}
        </ul>

        <footer className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={() => onResolve("skip")}
            disabled={busy}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            Ignorer les existants
          </button>

          <button
            type="button"
            onClick={() => onResolve("rename")}
            disabled={busy}
            className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
          >
            Renommer (-2, -3…)
          </button>

          <button
            type="button"
            onClick={() => onResolve("overwrite")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
            Écraser
          </button>
        </footer>
      </div>
    </div>
  );
}
