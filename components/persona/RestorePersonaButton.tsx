/*
path :           components/persona/RestorePersonaButton.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Bouton de restauration d'un persona soft-deleted. Appelle
                 restorePersona puis toast + router.refresh().
flow:            Client Component → onClick → restorePersona({ id }) → toast →
                 router.refresh().
ecosystem:       Dev = [
                   "@/components/persona/RestorePersonaButton.tsx",
                   "@/app/actions/persona/restorePersona.ts",
                 ]
relatedFiles:    ["@/app/actions/persona/restorePersona.ts",
                  "@/app/back-studio/scrum/[slug]/personas/trash/page.tsx"]
imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/components/ui/button",
                  "@/app/actions/persona/restorePersona"]
exports:         ["RestorePersonaButton", "RestorePersonaButtonProps"]

userStories:     ["*en tant que développeur je veux restaurer un persona"]
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
import { restorePersona } from "@/app/actions/persona/restorePersona";

export type RestorePersonaButtonProps = {
  readonly id: string;
  readonly name: string;
};

export function RestorePersonaButton({
  id,
  name,
}: RestorePersonaButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleRestore() {
    setBusy(true);
    try {
      const result = await restorePersona({ id });
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