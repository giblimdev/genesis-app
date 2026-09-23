/*
path :           app/back-studio/scrum/[slug]/backlog/[storySlug]/edit/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page d'édition d'une user story. Charge le projet, la story, les Epics
                 disponibles, les sprints et les personas, puis rend
                 <UserStoryForm mode="edit" />.
flow:            Server Component async → params → findFirst projet + story + listes
                 annexes → notFound si absent → <UserStoryForm mode="edit" />.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/backlog/[storySlug]/edit/page.tsx",
                   "@/components/user-story/UserStoryForm.tsx",
                 ]
relatedFiles:    ["@/components/user-story/UserStoryForm.tsx",
                  "@/app/actions/user-story/updateUserStory.ts"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/user-story/UserStoryForm"]
exports:         ["metadata", "default EditUserStoryPage"]

userStories:     ["*en tant que développeur je veux éditer une user story existante"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { UserStoryForm } from "@/components/user-story/UserStoryForm";

type Params = Promise<{ slug: string; storySlug: string }>;

export const metadata: Metadata = {
  title: "Éditer une user story — Scrum",
  description: "Modifier les informations d'une user story.",
};

export default async function EditUserStoryPage({
  params,
}: {
  params: Params;
}) {
  const { slug, storySlug } = await params;

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
  if (!project) notFound();

  const [story, epics, sprints, personas] = await Promise.all([
    prisma.userStory.findFirst({
      where: { projectId: project.id, slug: storySlug, deletedAt: null },
    }),
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

  if (!story) notFound();

  const base = `/back-studio/scrum/${project.slug}/backlog`;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={`${base}/${story.slug}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour à la story
      </Link>

      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-3 to-chart-2 text-white shadow-sm">
            <Pencil className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {project.name} · Backlog
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Éditer « {story.title} »
        </h1>
      </header>

      <UserStoryForm
        mode="edit"
        projectId={project.id}
        projectSlug={project.slug}
        epics={epics}
        sprints={sprints}
        personas={personas}
        initialData={{
          id: story.id,
          parentId: story.parentId,
          title: story.title,
          slug: story.slug,
          personaRef: story.personaRef,
          asA: story.asA,
          iWant: story.iWant,
          soThat: story.soThat,
          status: story.status,
          priority: story.priority,
          storyPoints: story.storyPoints,
          accent: story.accent,
          sprintId: story.sprintId,
          acceptanceCriteria: story.acceptanceCriteria,
          dodChecked: story.dodChecked,
          linkedFiles: story.linkedFiles,
        }}
      />
    </main>
  );
}