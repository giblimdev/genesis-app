/*
path :           app/back-studio/scrum/[slug]/backlog/new/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de création d'une user story (Epic ou Story). Charge le projet,
                 la liste des Epics disponibles (pour rattachement), les sprints et
                 les personas, puis rend <UserStoryForm mode="create" />. Le paramètre
                 `parent` (slug d'Epic) permet de pré-sélectionner un parent.
flow:            Server Component async → params + searchParams → findFirst projet →
                 findMany epics (parentId null) + sprints + personas →
                 <UserStoryForm mode="create" />.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/backlog/new/page.tsx",
                   "@/components/user-story/UserStoryForm.tsx",
                 ]
relatedFiles:    ["@/components/user-story/UserStoryForm.tsx",
                  "@/app/actions/user-story/createUserStory.ts"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/user-story/UserStoryForm"]
exports:         ["metadata", "default NewUserStoryPage"]

userStories:     ["*en tant que développeur je veux créer une nouvelle user story"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { UserStoryForm } from "@/components/user-story/UserStoryForm";

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

      <header className="flex flex-col gap-3">
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