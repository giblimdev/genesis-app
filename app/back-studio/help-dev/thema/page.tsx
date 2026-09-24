/*
path :           app/back-studio/help-dev/thema/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de référence visuelle des design tokens de l'application
                 (surfaces, actions, états, bordures, accents, polices, radius,
                 sidebar) + liste des tokens sémantiques à ajouter. Délègue tout
                 le rendu interactif à ThemaView (copie, toggle thème, lecture
                 des valeurs calculées).

flow:            Server Component → <ThemaView />. Toute l'interactivité est
                 déléguée au Client Component.

ecosystem:       DevHelp = [
                   "@/app/back-studio/help-dev/thema/page.tsx",
                   "@/app/back-studio/help-dev/thema/ThemaView.tsx",
                 ]
relatedFiles:    ["@/app/globals.css",
                  "@/app/back-studio/help-dev/thema/ThemaView.tsx"]
imports:         ["next", "lucide-react",
                  "@/app/back-studio/help-dev/thema/ThemaView"]
exports:         ["metadata", "default ThemaPage"]
useBy:           []

userStories:     ["*en tant que développeur je veux une page de référence des tokens de thème"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import { Palette } from "lucide-react";

import { ThemaView } from "./ThemaView";

export const metadata: Metadata = {
  title: "Token Thema — Design system",
  description:
    "Référence visuelle des design tokens : couleurs, polices, radius, sidebar et tokens sémantiques.",
};

export default function ThemaPage() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 md:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-5 text-white shadow-sm">
              <Palette className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Back-Studio · Help Dev
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Token Thema
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Tous les design tokens du projet, lus en direct depuis{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              globals.css
            </code>
            . Clique sur une carte pour copier la déclaration CSS.
          </p>
        </div>
      </header>

      <ThemaView />
    </main>
  );
}