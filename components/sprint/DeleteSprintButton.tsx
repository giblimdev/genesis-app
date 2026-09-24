/*
path :           components/sprint/DeleteSprintButton.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Bouton de suppression d'un sprint (soft delete), protégé par
                 ConfirmDialog. Désactivé si le sprint est verrouillé.

flow:            Client Component → ConfirmDialog(trigger) → softDeleteSprint
                 → toast + router.refresh(). Si locked, affiche un bouton
                 désactivé avec tooltip.

ecosystem:       Dev = ["@/components/sprint/DeleteSprintButton.tsx"]
imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/components/common/ConfirmDialog",
                  "@/components/ui/button",
                  "@/app/actions/sprint/softDeleteSprint"]
exports:         ["DeleteSprintButton", "DeleteSprintButtonProps"]

userStories:     ["*en tant que développeur je veux supprimer un sprint"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useRouter } from "next/navigation";
import { Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { softDeleteSprint } from "@/app/actions/sprint/softDeleteSprint";

export type DeleteSprintButtonProps = {
  readonly id: string;
  readonly name: string;
  readonly projectSlug: string;
  readonly locked?: boolean;
  readonly compact?: boolean;
};

export function DeleteSprintButton({
  id,
  name,
  projectSlug,
  locked = false,
  compact = false,
}: DeleteSprintButtonProps) {
  const router = useRouter();

  async function handleConfirm() {
    const result = await softDeleteSprint({ id });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`« ${name} » placé dans la corbeille.`);
    router.push(`/back-studio/scrum/${projectSlug}/sprints`);
    router.refresh();
  }

  if (locked) {
    return (
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon" : "sm"}
        disabled
        title="Sprint verrouillé — suppression impossible"
        className="text-muted-foreground"
      >
        <Lock className="h-4 w-4" aria-hidden />
        {!compact && "Verrouillé"}
      </Button>
    );
  }

  return (
    <ConfirmDialog
      trigger={
        <Button
          type="button"
          variant="ghost"
          size={compact ? "icon" : "sm"}
          aria-label={compact ? "Supprimer" : undefined}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {!compact && "Supprimer"}
        </Button>
      }
      title="Supprimer ce sprint ?"
      description={`« ${name} » sera placé dans la corbeille. Les user stories assignées seront détachées.`}
      confirmLabel="Supprimer"
      variant="destructive"
      onConfirm={handleConfirm}
    />
  );
}