/*
path :           app/back-studio/scrum/[slug]/sprints/new/page.tsx
tag :            ["sprint", "new", "import", "page"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de création d'un sprint. Deux modes :
                 — Formulaire unitaire via <SprintForm mode="create" />.
                 — Import en lot via <ImportJsonDialog /> : un tableau JSON de
                   sprints est envoyé à bulkImportSprints (projectId passé
                   via .bind()).

flow:            Server Component async → params → findFirst({ slug,
                 deletedAt: null }) → notFound si absent → rend le header avec
                 le bouton d'import + <SprintForm mode="create" />.

ecosystem:       Sprint = [
                   "@/app/actions/sprint/assignStoryToSprint.ts",
                   "@/app/actions/sprint/bulkImportSprints.ts",
                   "@/app/actions/sprint/changeSprintStatus.ts",
                   "@/app/actions/sprint/createSprint.ts",
                   "@/app/actions/sprint/hardDeleteSprint.ts",
                   "@/app/actions/sprint/reorderSprintStories.ts",
                   "@/app/actions/sprint/restoreSprint.ts",
                   "@/app/actions/sprint/softDeleteSprint.ts",
                   "@/app/actions/sprint/unassignStoryFromSprint.ts",
                   "@/app/actions/sprint/updateSprint.ts",
                   "@/app/back-studio/scrum/[slug]/sprints/[sprintSlug]/edit/page.tsx",
                   "@/app/back-studio/scrum/[slug]/sprints/[sprintSlug]/page.tsx",
                   "@/app/back-studio/scrum/[slug]/sprints/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/sprints/page.tsx",
                   "@/app/back-studio/scrum/[slug]/sprints/trash/page.tsx",
                   "@/components/sprint/DeleteSprintButton.tsx",
                   "@/components/sprint/HardDeleteSprintButton.tsx",
                   "@/components/sprint/RestoreSprintButton.tsx",
                   "@/components/sprint/SprintBoard.tsx",
                   "@/components/sprint/SprintCard.tsx",
                   "@/components/sprint/SprintForm.tsx",
                   "@/components/sprint/SprintStatusBadge.tsx",
                   "@/components/sprint/SprintStatusSelect.tsx",
                   "@/lib/design/accents.ts",
                   "@/lib/json-templates/sprint.ts",
                   "@/lib/sprint/lock.ts",
                   "@/lib/sprint/transitions.ts",
                   "@/lib/validations/sprint.ts",
                 ]
relatedFiles:    ["@/components/sprint/SprintForm.tsx",
                  "@/components/common/ImportJsonDialog.tsx",
                  "@/app/actions/sprint/bulkImportSprints.ts",
                  "@/lib/json-templates/sprint.ts"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/common/ImportJsonDialog",
                  "@/components/sprint/SprintForm",
                  "@/app/actions/sprint/bulkImportSprints",
                  "@/lib/json-templates/sprint"]
exports:         ["metadata", "default NewSprintPage"]
useBy:           []

userStories:     ["*en tant que développeur je veux créer un sprint",
                  "*en tant que développeur je veux importer des sprints en lot"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardPaste, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { ImportJsonDialog } from "@/components/common/ImportJsonDialog";
import { SprintForm } from "@/components/sprint/SprintForm";
import { bulkImportSprints } from "@/app/actions/sprint/bulkImportSprints";
import { SPRINT_JSON_TEMPLATE } from "@/lib/json-templates/sprint";

type Params = Promise<{ slug: string }>;

export const metadata: Metadata = {
  title: "Nouveau sprint — Scrum",
  description: "Créer un nouveau sprint.",
};

export default async function NewSprintPage({ params }: { params: Params }) {
  const { slug } = await params;

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
  if (!project) notFound();

  /* Server Action pré-liée au projectId courant.
     ImportJsonDialog appellera importSprints(rawJson). */
  const importSprints = bulkImportSprints.bind(null, project.id);

  const base = `/back-studio/scrum/${project.slug}`;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={`${base}/sprints`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux sprints
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-4 to-chart-2 text-white shadow-sm">
              <Plus className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {project.name} · Sprints
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Nouveau sprint
          </h1>
        </div>

        <ImportJsonDialog
          trigger={
            <button
              type="button"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ClipboardPaste className="h-4 w-4" aria-hidden />
              Import JSON
            </button>
          }
          title="Importer des sprints"
          description="Colle un tableau JSON de sprints. Les dates sont au format YYYY-MM-DD (la fin doit être postérieure au début). Le slug est auto-généré s'il est vide. Les slugs dupliqués sont refusés."
          template={SPRINT_JSON_TEMPLATE}
          submitLabel="Importer"
          onSubmit={importSprints}
        />
      </header>

      <SprintForm
        mode="create"
        projectId={project.id}
        projectSlug={project.slug}
      />
    </main>
  );
}