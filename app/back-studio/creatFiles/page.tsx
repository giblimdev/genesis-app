/*
path :           app/back-studio/creatFiles/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page Back-Studio « CreatFiles » : formulaire pour composer un tableau
                 d'objets { path, content } (fichiers à créer ou à assembler), éditable
                 ligne à ligne, avec copie du JSON et enregistrement sur disque
                 (protection anti-écrasement côté serveur).
                 Le path est optionnel : s'il est absent, il est déduit de l'en-tête
                 Helpdev du contenu.
flow:            Server Component → <CreatFilesView />. Toute l'interactivité est
                 déléguée au Client Component.
ecosystem:       Dev = [
                   "@/app/back-studio/creatFiles/page.tsx",
                   "@/app/back-studio/creatFiles/CreatFilesView.tsx",
                   "@/app/back-studio/creatFiles/ConflictDialog.tsx",
                 ]
relatedFiles:    ["@/app/back-studio/creatFiles/CreatFilesView.tsx",
                  "@/app/back-studio/creatFiles/ConflictDialog.tsx"]
imports:         ["next", "lucide-react",
                  "@/app/back-studio/creatFiles/CreatFilesView"]
exports:         ["metadata", "default CreatFilesPage"]
useBy:           []

userStories:     ["*en tant que développeur je veux composer et créer un tableau de fichiers"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import { FilePlus2 } from "lucide-react";

import { CreatFilesView } from "./CreatFilesView";

export const metadata: Metadata = {
  title: "CreatFiles — Composer un tableau de fichiers",
  description:
    "Compose un tableau d'objets { path?, content }, édite-le ligne à ligne, copie le JSON ou enregistre les fichiers sur disque. Le path est déduit du header Helpdev si absent.",
};

export default function CreatFilesPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm">
            <FilePlus2 className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Back-Studio · CreatFiles
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Composer un tableau de fichiers
        </h1>

        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Crée une liste d&apos;objets{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
            {"{ path, content }"}
          </code>
          , édite chaque entrée, réordonne, puis copie le JSON ou enregistre les
          fichiers sur disque (avec contrôle des conflits).
        </p>

        <p className="max-w-3xl rounded-lg border border-chart-1/30 bg-chart-1/5 px-3 py-2 text-xs leading-relaxed text-foreground/80">
          <strong className="text-chart-1">Astuce :</strong> le champ{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            path
          </code>{" "}
          est optionnel. Si tu colles un contenu contenant un en-tête Helpdev
          avec un champ{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            path :
          </code>{" "}
          (par exemple{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            {"/* path : components/project/ProjectForm.tsx */"}
          </code>
          ), il est déduit automatiquement — tu n&apos;as rien à saisir.
        </p>
      </header>

      <CreatFilesView />
    </main>
  );
}