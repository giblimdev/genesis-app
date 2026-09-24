/*
path :           app/back-studio/help-dev/prompt/PromptView.tsx
tag :            ["prompt", "editor"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Éditeur de CONTRIBUTING.md. Textarea monospace pleine
                 largeur, compteur de caractères, bouton « Ajouter un
                 thème » (insère un squelette de section markdown à la
                 fin), bouton Copier, bouton Sauvegarder (POST vers
                 /api/back-studio/help-dev/prompt/save).

flow:            Client Component → useState(content) → onChange met à
                 jour le contenu → bouton "Ajouter un thème" concatène un
                 scaffold à la fin → "Copier" utilise CopyButton →
                 "Sauvegarder" fetch POST, toast succès/erreur.

ecosystem:       Prompts = [
                   "@/app/back-studio/help-dev/prompt/page.tsx",
                   "@/app/back-studio/help-dev/prompt/PromptView.tsx",
                 ]
relatedFiles:    ["@/app/back-studio/help-dev/prompt/page.tsx",
                  "@/app/api/back-studio/help-dev/prompt/save/route.ts",
                  "@/components/common/CopyButton.tsx"]
imports:         ["react", "lucide-react", "sonner",
                  "@/components/ui/button",
                  "@/components/common/CopyButton",
                  "props reçues : { initialContent: string }"]
exports:         ["PromptView", "PromptViewProps"]
useBy:           ["@/app/back-studio/help-dev/prompt/page.tsx"]

userStories:     ["*en tant que développeur je veux éditer CONTRIBUTING.md"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useState } from "react";
import { FilePlus2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/common/CopyButton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type PromptViewProps = {
  readonly initialContent: string;
};

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const NEW_THEME_TEMPLATE = `

---

## Nouveau thème

Décris ici les règles, conventions ou instructions liées à ce thème.
`;

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function PromptView({ initialContent }: PromptViewProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  /* ---------- Actions ---------- */

  function handleAddTheme() {
    setContent((prev) => prev + NEW_THEME_TEMPLATE);
    setIsDirty(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    setIsDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/back-studio/help-dev/prompt/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = (await res.json()) as {
        saved?: boolean;
        path?: string;
        size?: number;
        error?: string;
      };

      if (!res.ok || !data.saved) {
        throw new Error(data.error ?? "Sauvegarde impossible.");
      }

      toast.success("CONTRIBUTING.md sauvegardé", {
        description: `${data.size?.toLocaleString()} caractères`,
      });
      setIsDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Rendu ---------- */

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddTheme}
          className="gap-2"
        >
          <FilePlus2 className="h-3.5 w-3.5" aria-hidden />
          Ajouter un thème
        </Button>

        <span className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {isDirty && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
              Modifications non sauvegardées
            </span>
          )}
          <span className="font-mono">
            {content.length.toLocaleString()} caractères
          </span>

          <CopyButton
            value={content}
            label="Copier"
            toastLabel="Contenu copié dans le presse-papiers"
          />

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Save className="h-3.5 w-3.5" aria-hidden />
            )}
            Sauvegarder
          </Button>
        </span>
      </div>

      {/* Zone d'édition */}
      <textarea
        value={content}
        onChange={handleChange}
        spellCheck={false}
        rows={32}
        placeholder="# Contributing — Genesis

## Nouveau thème

Décris ici les règles, conventions ou instructions…"
        className="min-h-[60vh] w-full resize-y rounded-xl border border-border bg-card px-4 py-3 font-mono text-xs leading-relaxed text-foreground outline-none transition-colors focus:border-chart-1/50 focus:ring-2 focus:ring-chart-1/20"
      />

      {/* Pied informatif */}
      <p className="text-xs text-muted-foreground">
        Le contenu est sauvegardé dans{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
          CONTRIBUTING.md
        </code>{" "}
        à la racine du projet.
      </p>
    </div>
  );
}