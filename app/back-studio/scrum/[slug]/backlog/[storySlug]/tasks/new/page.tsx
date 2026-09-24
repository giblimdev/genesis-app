/*
path :           app/back-studio/scrum/[slug]/backlog/[storySlug]/tasks/new/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de création d'une tâche rattachée à une UserStory.
                 Charge le projet, la story et les membres du projet (pour
                 le select d'assignee), puis rend <TaskForm mode="create" />.

flow:            Server Component async → params → findFirst projet + story →
                 findMany users du projet → notFound si absent →
                 <TaskForm mode="create" />.

ecosystem:       Dev = ["@/app/back-studio/scrum/[slug]/backlog/[storySlug]/tasks/new/page.tsx"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/task/TaskForm"]
exports:         ["metadata", "default NewTaskPage"]

userStories:     ["*en tant que développeur je veux créer une tâche"]
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
import { TaskForm } from "@/components/task/TaskForm";

type Params = Promise<{ slug: string; storySlug: string }>;

export const metadata: Metadata = {
  title: "Nouvelle tâche — Backlog",
  description: "Créer une tâche rattachée à une user story.",
};

export default async function NewTaskPage({ params }: { params: Params }) {
  const { slug, storySlug } = await params;

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      users: {
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!project) notFound();

  const story = await prisma.userStory.findFirst({
    where: { projectId: project.id, slug: storySlug, deletedAt: null },
    select: { id: true, title: true, slug: true },
  });
  if (!story) notFound();

  const backHref = `/back-studio/scrum/${project.slug}/backlog/${story.slug}`;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour à la story
      </Link>

      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-3 to-chart-2 text-white shadow-sm">
            <Plus className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {project.name} · {story.title}
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Nouvelle tâche
        </h1>
      </header>

      <TaskForm
        mode="create"
        userStoryId={story.id}
        projectSlug={project.slug}
        storySlug={story.slug}
        assignees={project.users}
      />
    </main>
  );
}