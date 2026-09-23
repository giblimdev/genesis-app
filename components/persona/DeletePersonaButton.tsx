/*
path :           components/persona/DeletePersonaButton.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Bouton de suppression d'un persona, protégé par ConfirmDialog.
                 Déclenche softDeletePersona puis toast + router.refresh().
flow:            Client Component → ConfirmDialog(trigger) → onConfirm →
                 softDeletePersona({ id }) → toast + router.refresh().
ecosystem:       Dev = [
                   "@/components/persona/DeletePersonaButton.tsx",
                   "@/app/actions/persona/softDeletePersona.ts",
                   "@/components/common/ConfirmDialog.tsx",
                 ]
relatedFiles:    ["@/app/actions/persona/softDeletePersona.ts",
                  "@/components/common/ConfirmDialog.tsx"]
imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/components/common/ConfirmDialog",
                  "@/components/ui/button",
                  "@/app/actions/persona/softDeletePersona"]
exports:         ["DeletePersonaButton", "DeletePersonaButtonProps"]

userStories:     ["*en tant que développeur je veux supprimer un persona en confirmant"]
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
import { softDeletePersona } from "@/app/actions/persona/softDeletePersona";

export type DeletePersonaButtonProps = {
  readonly id: string;
  readonly name: string;
  readonly projectSlug: string;
  readonly redirectToList?: boolean;
  readonly compact?: boolean;
};

export function DeletePersonaButton({
  id,
  name,
  projectSlug,
  redirectToList = false,
  compact = false,
}: DeletePersonaButtonProps) {
  const router = useRouter();

  async function handleConfirm() {
    const result = await softDeletePersona({ id });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`« ${name} » placé dans la corbeille.`);
    if (redirectToList) {
      router.push(`/back-studio/scrum/${projectSlug}/personas`);
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
      title="Supprimer ce persona ?"
      description={`« ${name} » sera placé dans la corbeille. Tu pourras le restaurer plus tard.`}
      confirmLabel="Supprimer"
      variant="destructive"
      onConfirm={handleConfirm}
    />
  );
}