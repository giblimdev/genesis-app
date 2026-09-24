/*
path :           app/back-studio/help-dev/prompt/page.tsx
tag :            ["prompt", "help-dev"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Éditeur du fichier CONTRIBUTING.md. Charge le contenu
                 actuel côté serveur et le passe au Client Component
                 PromptView qui gère l'édition, l'ajout de thèmes, la
                 copie et la sauvegarde.

flow:            Server Component async → readContributing() → rend
                 <PromptView initialContent={content} />.

ecosystem:       Prompts = [
                   "@/app/back-studio/help-dev/prompt/page.tsx",
                   "@/app/back-studio/help-dev/prompt/PromptView.tsx",
                   "@/lib/prompts/read-contributing.ts",
                 ]
relatedFiles:    ["@/app/back-studio/help-dev/prompt/PromptView.tsx",
                  "@/lib/prompts/read-contributing.ts"]
imports:         ["next", "lucide-react",
                  "@/lib/prompts/read-contributing",
                  "@/app/back-studio/help-dev/prompt/PromptView"]
exports:         ["metadata", "default PromptPage"]
useBy:           []

userStories:     ["*en tant que développeur je veux éditer CONTRIBUTING.md"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { readContributing } from "@/lib/prompts/read-contributing";
import { PromptView } from "./PromptView";

export const metadata: Metadata = {
  title: "Prompt — Contributing",
  description:
    "Éditer les règles de génération de scripts et conventions du projet, sauvegardées dans CONTRIBUTING.md.",
};

export default async function PromptPage() {
  const initialContent = await readContributing();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm">
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Back-Studio · Help Dev
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Prompt — Contributing
        </h1>

        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Édite les règles de génération de scripts et les conventions du
          projet. Chaque thème est une section markdown. Le contenu est
          sauvegardé dans{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
            CONTRIBUTING.md
          </code>{" "}
          à la racine du projet.
        </p>
      </header>

      <PromptView initialContent={initialContent} />
    </main>
  );
}