/*
path :           components/feature/DeleteFeatureButton.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Bouton de suppression d'une feature, protégé par ConfirmDialog.
                 Appelle deleteFeature puis toast + router.refresh() (ou push vers la
                 liste si le composant est rendu sur la page détail).
flow:            Client Component → ConfirmDialog(trigger) → onConfirm →
                 deleteFeature({ id }) → toast + router.push/list refresh.
ecosystem:       Dev = [
                   "@/components/feature/DeleteFeatureButton.tsx",
                   "@/app/actions/feature/deleteFeature.ts",
                   "@/components/common/ConfirmDialog.tsx",
                 ]
relatedFiles:    ["@/app/actions/feature/deleteFeature.ts",
                  "@/components/common/ConfirmDialog.tsx",
                  "@/components/feature/FeatureCard.tsx"]
imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/components/common/ConfirmDialog",
                  "@/components/ui/button",
                  "@/app/actions/feature/deleteFeature"]
exports:         ["DeleteFeatureButton", "DeleteFeatureButtonProps"]

userStories:     ["*en tant que développeur je veux supprimer une feature en confirmant"]
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
import { deleteFeature } from "@/app/actions/feature/deleteFeature";

export type DeleteFeatureButtonProps = {
  readonly id: string;
  readonly name: string;
  readonly projectSlug: string;
  /** Si true, redirige vers la liste après suppression (utile sur page détail). */
  readonly redirectToList?: boolean;
  readonly compact?: boolean;
};

export function DeleteFeatureButton({
  id,
  name,
  projectSlug,
  redirectToList = false,
  compact = false,
}: DeleteFeatureButtonProps) {
  const router = useRouter();

  async function handleConfirm() {
    const result = await deleteFeature({ id });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`« ${name} » supprimée.`);
    if (redirectToList) {
      router.push(`/back-studio/scrum/${projectSlug}/features`);
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
      title="Supprimer cette feature ?"
      description={`« ${name} » sera supprimée définitivement. Cette action est irréversible.`}
      confirmLabel="Supprimer"
      variant="destructive"
      onConfirm={handleConfirm}
    />
  );
}