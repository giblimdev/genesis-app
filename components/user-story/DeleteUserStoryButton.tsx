/*
path :           components/user-story/DeleteUserStoryButton.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Bouton de suppression d'une user story, protégé par ConfirmDialog.
                 Déclenche softDeleteUserStory puis toast + router.refresh().
flow:            Client Component → ConfirmDialog(trigger) → onConfirm →
                 softDeleteUserStory({ id }) → toast + router.refresh().
ecosystem:       Dev = [
                   "@/components/user-story/DeleteUserStoryButton.tsx",
                   "@/app/actions/user-story/softDeleteUserStory.ts",
                   "@/components/common/ConfirmDialog.tsx",
                 ]
relatedFiles:    ["@/app/actions/user-story/softDeleteUserStory.ts",
                  "@/components/common/ConfirmDialog.tsx"]
imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/components/common/ConfirmDialog",
                  "@/components/ui/button",
                  "@/app/actions/user-story/softDeleteUserStory"]
exports:         ["DeleteUserStoryButton", "DeleteUserStoryButtonProps"]

userStories:     ["*en tant que développeur je veux supprimer une user story en confirmant"]
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
import { softDeleteUserStory } from "@/app/actions/user-story/softDeleteUserStory";

export type DeleteUserStoryButtonProps = {
  readonly id: string;
  readonly title: string;
  readonly projectSlug: string;
  readonly redirectToList?: boolean;
  readonly compact?: boolean;
};

export function DeleteUserStoryButton({
  id,
  title,
  projectSlug,
  redirectToList = false,
  compact = false,
}: DeleteUserStoryButtonProps) {
  const router = useRouter();

  async function handleConfirm() {
    const result = await softDeleteUserStory({ id });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`« ${title} » placée dans la corbeille.`);
    if (redirectToList) {
      router.push(`/back-studio/scrum/${projectSlug}/backlog`);
    }
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
      title="Supprimer cette user story ?"
      description={`« ${title} » sera placée dans la corbeille. Ses stories enfants seront détachées. Tu pourras la restaurer plus tard.`}
      confirmLabel="Supprimer"
      variant="destructive"
      onConfirm={handleConfirm}
    />
  );
}