/*
path :           components/user-story/RestoreUserStoryButton.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Bouton de restauration d'une user story soft-deleted. Appelle
                 restoreUserStory puis toast + router.refresh().
flow:            Client Component → onClick → restoreUserStory({ id }) → toast →
                 router.refresh().
ecosystem:       Dev = [
                   "@/components/user-story/RestoreUserStoryButton.tsx",
                   "@/app/actions/user-story/restoreUserStory.ts",
                 ]
relatedFiles:    ["@/app/actions/user-story/restoreUserStory.ts",
                  "@/app/back-studio/scrum/[slug]/backlog/trash/page.tsx"]
imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/components/ui/button",
                  "@/app/actions/user-story/restoreUserStory"]
exports:         ["RestoreUserStoryButton", "RestoreUserStoryButtonProps"]

userStories:     ["*en tant que développeur je veux restaurer une user story"]
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
import { restoreUserStory } from "@/app/actions/user-story/restoreUserStory";

export type RestoreUserStoryButtonProps = {
  readonly id: string;
  readonly title: string;
};

export function RestoreUserStoryButton({
  id,
  title,
}: RestoreUserStoryButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleRestore() {
    setBusy(true);
    try {
      const result = await restoreUserStory({ id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`« ${title} » restaurée.`);
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