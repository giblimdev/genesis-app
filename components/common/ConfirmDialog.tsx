/*
path :           components/common/ConfirmDialog.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Dialog de confirmation générique, réutilisable pour toute action
                 destructive ou importante. Wrappe AlertDialog de shadcn (Base UI)
                 avec un trigger en prop, un titre, une description et un callback
                 onConfirm.
flow:            Client Component → AlertDialogTrigger render={trigger} → Base UI
                 clone le trigger et merge ses props (onClick, aria-*, ref) → au
                 clic sur "Confirmer", appelle onConfirm() (sync ou async, retour
                 ignoré) et désactive le bouton pendant l'exécution.
ecosystem:       UI = [
                   "@/components/common/ConfirmDialog.tsx",
                   "@/components/ui/alert-dialog.tsx",
                   "@/components/ui/button.tsx",
                 ]
relatedFiles:    ["@/components/ui/alert-dialog.tsx",
                  "@/components/ui/button.tsx"]
imports:         ["react", "lucide-react",
                  "@/components/ui/alert-dialog"]
exports:         ["ConfirmDialog", "ConfirmDialogProps"]
useBy:           ["@/components/project/DeleteProjectButton.tsx"]

userStories:     ["*auto-common-confirm"]
status:          wip
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState + gestionnaires d'événements (onClick, onOpenChange).

import { useState, type ReactElement } from "react";
import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type ConfirmDialogProps = {
  /** Élément React qui devient le trigger (via Base UI render). */
  trigger: ReactElement;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  /**
   * Callback exécuté au clic sur "Confirmer".
   * La valeur de retour est IGNORÉE — accepte void, Promise<void>,
   * Promise<ActionResult>, etc.
   */
  onConfirm: () => unknown | Promise<unknown>;
};

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
            disabled={loading}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
