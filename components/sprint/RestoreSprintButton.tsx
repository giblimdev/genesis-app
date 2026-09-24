/*
path :           components/sprint/RestoreSprintButton.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Bouton de restauration d'un sprint soft-deleted.

flow:            Client Component → onClick → restoreSprint → toast + refresh.

ecosystem:       Dev = ["@/components/sprint/RestoreSprintButton.tsx"]
imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/components/ui/button",
                  "@/app/actions/sprint/restoreSprint"]
exports:         ["RestoreSprintButton", "RestoreSprintButtonProps"]

userStories:     ["*en tant que développeur je veux restaurer un sprint"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { restoreSprint } from "@/app/actions/sprint/restoreSprint";

export type RestoreSprintButtonProps = {
  readonly id: string;
  readonly name: string;
};

export function RestoreSprintButton({ id, name }: RestoreSprintButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleRestore() {
    setBusy(true);
    try {
      const result = await restoreSprint({ id });
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