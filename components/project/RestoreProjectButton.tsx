/*
path :           components/project/RestoreProjectButton.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Bouton de restauration d'un projet soft-deleted. Appelle
                 restoreProject puis toast + router.refresh().
flow:            Client Component → onClick → restoreProject({ id }) → toast →
                 router.refresh().
ecosystem:       Dev = [
                   "@/components/project/RestoreProjectButton.tsx",
                   "@/app/actions/project/restoreProject.ts",
                 ]
relatedFiles:    ["@/app/actions/project/restoreProject.ts",
                  "@/app/back-studio/scrum/trash/page.tsx"]
imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/components/ui/button",
                  "@/app/actions/project/restoreProject"]
exports:         ["RestoreProjectButton", "RestoreProjectButtonProps"]

userStories:     ["*en tant que développeur je veux restaurer un projet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { restoreProject } from "@/app/actions/project/restoreProject";

export type RestoreProjectButtonProps = {
  readonly id: string;
  readonly name: string;
};

export function RestoreProjectButton({
  id,
  name,
}: RestoreProjectButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleRestore() {
    setBusy(true);
    try {
      const result = await restoreProject({ id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`« ${name} » restauré.`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleRestore}
      disabled={busy}
      className="gap-2"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <RotateCcw className="h-4 w-4" aria-hidden />
      )}
      Restaurer
    </Button>
  );
}