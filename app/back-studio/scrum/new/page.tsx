/*
path :           app/back-studio/scrum/new/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de création d'un projet. Rend <ProjectForm mode="create" />.
flow:            Server Component → <ProjectForm mode="create" />.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/new/page.tsx",
                   "@/components/project/ProjectForm.tsx",
                 ]
relatedFiles:    ["@/components/project/ProjectForm.tsx"]
imports:         ["next", "next/link", "lucide-react",
                  "@/components/project/ProjectForm"]
exports:         ["metadata", "default NewProjectPage"]

userStories:     ["*en tant que développeur je veux créer un nouveau projet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FolderPlus } from "lucide-react";

import { ProjectForm } from "@/components/project/ProjectForm";

export const metadata: Metadata = {
  title: "Nouveau projet — Scrum",
  description: "Créer un nouveau projet.",
};

export default function NewProjectPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <header className="flex flex-col gap-3">
        <Link
          href="/back-studio/scrum"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Retour aux projets
        </Link>

        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm">
            <FolderPlus className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Back-Studio · Scrum
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Nouveau projet
        </h1>

        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Renseigne les informations du projet. Tu pourras ajouter features,
          personas, user stories et sprints juste après.
        </p>
      </header>

      <ProjectForm mode="create" />
    </main>
  );
}