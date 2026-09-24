/*
path :           components/sprint/HardDeleteSprintButton.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Bouton de suppression DÉFINITIVE d'un sprint en corbeille.
                 Exige la saisie du slug exact dans un dialogue custom.

flow:            Client Component → dialogue custom → hardDeleteSprint({ id, slug })
                 → toast + refresh.

ecosystem:       Dev = ["@/components/sprint/HardDeleteSprintButton.tsx"]
imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/components/ui/button", "@/components/ui/input",
                  "@/app/actions/sprint/hardDeleteSprint"]
exports:         ["HardDeleteSprintButton", "HardDeleteSprintButtonProps"]

userStories:     ["*en tant que développeur je veux supprimer définitivement un sprint"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hardDeleteSprint } from "@/app/actions/sprint/hardDeleteSprint";

export type HardDeleteSprintButtonProps = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
};

export function HardDeleteSprintButton({
  id,
  name,
  slug,
}: HardDeleteSprintButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slugInput, setSlugInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) setSlugInput("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  const canConfirm = slugInput === slug && !busy;

  async function handleConfirm() {
    if (!canConfirm) return;
    setBusy(true);
    try {
      const result = await hardDeleteSprint({ id, slug });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`« ${name} » supprimé définitivement.`);
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        Supprimer définitivement
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="hard-delete-sprint-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div className="flex w-full max-w-lg flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-xl">
            <header className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/15 text-destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2
                  id="hard-delete-sprint-title"
                  className="text-lg font-bold text-foreground"
                >
                  Suppression définitive
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Action <strong>irréversible</strong>. Le sprint{" "}
                  <strong className="text-foreground">« {name} »</strong> sera
                  supprimé de la base.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                aria-label="Fermer"
                disabled={busy}
                className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Saisis le slug pour confirmer
              </span>
              <code className="font-mono text-xs text-foreground/80">
                {slug}
              </code>
              <Input
                type="text"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder={slug}
                spellCheck={false}
                autoComplete="off"
                disabled={busy}
                className="h-10 font-mono text-sm"
                aria-invalid={slugInput.length > 0 && slugInput !== slug}
              />
            </label>

            <footer className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="gap-2"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden />
                )}
                Supprimer définitivement
              </Button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}