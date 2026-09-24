/*
path :           components/task/DeleteTaskButton.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Bouton de suppression d'une tâche, protégé par ConfirmDialog.

flow:            Client Component → ConfirmDialog(trigger) → deleteTask →
                 toast + router.refresh().

ecosystem:       Dev = ["@/components/task/DeleteTaskButton.tsx"]
imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/components/common/ConfirmDialog",
                  "@/components/ui/button",
                  "@/app/actions/task/deleteTask"]
exports:         ["DeleteTaskButton", "DeleteTaskButtonProps"]

userStories:     ["*en tant que développeur je veux supprimer une tâche"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { deleteTask } from "@/app/actions/task/deleteTask";

export type DeleteTaskButtonProps = {
  readonly id: string;
  readonly title: string;
  readonly compact?: boolean;
};

export function DeleteTaskButton({
  id,
  title,
  compact = false,
}: DeleteTaskButtonProps) {
  const router = useRouter();

  async function handleConfirm() {
    const result = await deleteTask({ id });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`« ${title} » supprimée.`);
    router.refresh();
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
      title="Supprimer cette tâche ?"
      description={`« ${title} » sera supprimée définitivement. Cette action est irréversible.`}
      confirmLabel="Supprimer"
      variant="destructive"
      onConfirm={handleConfirm}
    />
  );
}