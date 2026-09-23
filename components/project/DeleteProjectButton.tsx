/*
path :           components/project/DeleteProjectButton.tsx
projectId:       <à fournir>
type :           component
generic:         false

role:            Bouton de suppression d'un projet, protégé par ConfirmDialog.
                 Déclenche softDeleteProject puis toast + router.refresh().
flow:            Client Component → ConfirmDialog(trigger) → onConfirm →
                 softDeleteProject({ id }) → toast + router.refresh().
ecosystem:       Dev = [
                   "@/components/project/DeleteProjectButton.tsx",
                   "@/app/actions/project/softDeleteProject.ts",
                   "@/components/common/ConfirmDialog.tsx",
                 ]
relatedFiles:    ["@/app/actions/project/softDeleteProject.ts",
                  "@/components/common/ConfirmDialog.tsx",
                  "@/components/project/ProjectCard.tsx"]
imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/components/common/ConfirmDialog",
                  "@/components/ui/button",
                  "@/app/actions/project/softDeleteProject"]
exports:         ["DeleteProjectButton", "DeleteProjectButtonProps"]

userStories:     ["*en tant que développeur je veux supprimer un projet en confirmant"]
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
import { softDeleteProject } from "@/app/actions/project/softDeleteProject";

export type DeleteProjectButtonProps = {
  readonly id: string;
  readonly name: string;
  readonly compact?: boolean;
};

export function DeleteProjectButton({
  id,
  name,
  compact = false,
}: DeleteProjectButtonProps) {
  const router = useRouter();

  async function handleConfirm() {
    const result = await softDeleteProject({ id });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`« ${name} » placé dans la corbeille.`);
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
      title="Supprimer ce projet ?"
      description={`« ${name} » sera placé dans la corbeille. Tu pourras le restaurer plus tard.`}
      confirmLabel="Supprimer"
      variant="destructive"
      onConfirm={handleConfirm}
    />
  );
}