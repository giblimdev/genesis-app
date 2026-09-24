/*
path :           app/back-studio/scrum/[slug]/backlog/new/page.tsx
tag :            ["user-story", "new", "import", "page"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de création d'une user story (Epic ou Story). Deux modes :
                 — Formulaire unitaire via <UserStoryForm mode="create" />.
                 — Import en lot via <ImportJsonDialog /> : un tableau JSON de
                   stories (avec parentSlug et sprintSlug) est envoyé à
                   bulkImportUserStories (projectId passé via .bind()). Le
                   paramètre `parent` (slug d'Epic) permet de pré-sélectionner
                   un parent dans le formulaire.

flow:            Server Component async → params + searchParams → findFirst
                 projet → findMany epics (parentId null) + sprints + personas
                 → rend le header avec le bouton d'import + <UserStoryForm
                 mode="create" />.

ecosystem:       UserStory = [
                   "@/app/actions/user-story/bulkImportUserStories.ts",
                   "@/app/actions/user-story/createUserStory.ts",
                   "@/app/actions/user-story/hardDeleteUserStory.ts",
                   "@/app/actions/user-story/restoreUserStory.ts",
                   "@/app/actions/user-story/softDeleteUserStory.ts",
                   "@/app/actions/user-story/updateUserStory.ts",
                   "@/app/back-studio/scrum/[slug]/backlog/[storySlug]/edit/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/[storySlug]/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/trash/page.tsx",
                   "@/components/user-story/DeleteUserStoryButton.tsx",
                   "@/components/user-story/HardDeleteUserStoryButton.tsx",
                   "@/components/user-story/RestoreUserStoryButton.tsx",
                   "@/components/user-story/UserStoryCard.tsx",
                   "@/components/user-story/UserStoryForm.tsx",
                   "@/components/user-story/UserStoryMiniCard.tsx",
                   "@/components/user-story/UserStoryPriorityBadge.tsx",
                   "@/components/user-story/UserStoryStatusBadge.tsx",
                   "@/components/user-story/UserStoryTree.tsx",
                   "@/lib/design/accents.ts",
                   "@/lib/json-templates/user-story.ts",
                   "@/lib/user-story/json.ts",
                   "@/lib/validations/user-story.ts",
                 ]
relatedFiles:    ["@/components/user-story/UserStoryForm.tsx",
                  "@/components/common/ImportJsonDialog.tsx",
                  "@/app/actions/user-story/bulkImportUserStories.ts",
                  "@/app/actions/user-story/createUserStory.ts",
                  "@/lib/json-templates/user-story.ts"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/common/ImportJsonDialog",
                  "@/components/user-story/UserStoryForm",
                  "@/app/actions/user-story/bulkImportUserStories",
                  "@/lib/json-templates/user-story"]
exports:         ["metadata", "default NewUserStoryPage"]
useBy:           []

userStories:     ["*en tant que développeur je veux créer une nouvelle user story",
                  "*en tant que développeur je veux importer des user stories en lot"]
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
import { UserStoryForm } from "@/components/user-story/UserStoryForm";
import { bulkImportUserStories } from "@/app/actions/user-story/bulkImportUserStories";
import { USER_STORY_JSON_TEMPLATE } from "@/lib/json-templates/user-story";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ parent?: string }>;

export const metadata: Metadata = {
  title: "Nouvelle user story — Scrum",
  description: "Créer un nouvel Epic ou une nouvelle Story.",
};

export default async function NewUserStoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
  if (!project) notFound();

  const [epics, sprints, personas] = await Promise.all([
    prisma.userStory.findMany({
      where: { projectId: project.id, parentId: null, deletedAt: null },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, title: true, slug: true },
    }),
    prisma.sprint.findMany({
      where: { projectId: project.id, deletedAt: null },
      orderBy: [{ startDate: "asc" }],
      select: { id: true, name: true, slug: true },
    }),
    prisma.persona.findMany({
      where: { projectId: project.id, deletedAt: null },
      orderBy: [{ displayOrder: "asc" }],
      select: { slug: true, name: true },
    }),
  ]);

  /* Pré-sélection du parent si ?parent=<slug> */
  const initialParentId = sp.parent
    ? epics.find((e) => e.slug === sp.parent)?.id
    : undefined;

  /* Server Action pré-liée au projectId courant.
     ImportJsonDialog appellera importStories(rawJson). */
  const importStories = bulkImportUserStories.bind(null, project.id);

  const base = `/back-studio/scrum/${project.slug}`;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={`${base}/backlog`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour au backlog
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-3 to-chart-2 text-white shadow-sm">
              <Plus className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {project.name} · Backlog
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Nouvelle user story
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
          title="Importer des user stories"
          description="Colle un tableau JSON de stories. Un Epic racine a un parentSlug vide ; une Story référence son Epic parent via parentSlug. Les sprints sont référencés par sprintSlug. Tous les slugs doivent être uniques dans le projet."
          template={USER_STORY_JSON_TEMPLATE}
          submitLabel="Importer"
          onSubmit={importStories}
        />
      </header>

      <UserStoryForm
        mode="create"
        projectId={project.id}
        projectSlug={project.slug}
        epics={epics}
        sprints={sprints}
        personas={personas}
        {...(initialParentId ? { initialParentId } : {})}
      />
    </main>
  );
}