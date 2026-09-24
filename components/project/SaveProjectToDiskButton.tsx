/*
path :           components/project/SaveProjectToDiskButton.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Bouton client qui déclenche la sauvegarde disque d'un
                 projet dans data/save-prog/ (dossier privé, non servi en
                 HTTP). Le fichier est un snapshot JSON ré-importable, il
                 sert de fallback si la base de données devient inaccessible.

flow:            Client Component → useState(busy) → onClick → fetch
                 POST /api/back-studio/save-prog → toast de résumé.
                 Aucun lien public : le dossier n'est pas exposé en HTTP.

ecosystem:       Dev = [
                   "@/components/project/SaveProjectToDiskButton.tsx",
                   "@/app/api/back-studio/save-prog/route.ts",
                 ]
relatedFiles:    ["@/app/api/back-studio/save-prog/route.ts",
                  "@/lib/project/disk-fallback.ts",
                  "@/app/back-studio/scrum/[slug]/page.tsx"]
imports:         ["react", "lucide-react", "sonner",
                  "@/components/ui/button"]
exports:         ["SaveProjectToDiskButton", "SaveProjectToDiskButtonProps"]

userStories:     ["*en tant que développeur je veux sauvegarder un projet sur disque"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useState } from "react";
import { HardDriveDownload, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SaveProjectToDiskButtonProps = {
  readonly projectId: string;
  readonly projectName: string;
  /** Inclure features, personas, user stories et sprints. Défaut : true. */
  readonly includeChildren?: boolean;
  /** Taille visuelle du bouton. Défaut : "sm". */
  readonly size?: "sm" | "default";
};

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function SaveProjectToDiskButton({
  projectId,
  projectName,
  includeChildren = true,
  size = "sm",
}: SaveProjectToDiskButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    try {
      const res = await fetch("/api/back-studio/save-prog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, includeChildren }),
      });

      const data = (await res.json()) as {
        saved?: boolean;
        filename?: string;
        size?: number;
        summary?: {
          features: number;
          personas: number;
          userStories: number;
          sprints: number;
        };
        error?: string;
      };

      if (!res.ok || !data.saved || !data.filename) {
        throw new Error(data.error ?? "Sauvegarde impossible.");
      }

      const s = data.summary;
      const detail = s
        ? ` (${s.features} feat. · ${s.personas} pers. · ${s.userStories} stories · ${s.sprints} sprints)`
        : "";

      toast.success(`« ${projectName} » sauvegardé${detail}`, {
        description: `${data.filename} écrit dans data/save-prog/`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={handleSave}
      disabled={busy}
      className="gap-2"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <HardDriveDownload className="h-4 w-4" aria-hidden />
      )}
      Sauvegarder sur disque
    </Button>
  );
}