/*
path :           app/back-studio/scrum/[slug]/backlog/[storySlug]/tasks/[taskId]/edit/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page d'édition d'une tâche. Charge la story + la tâche + les
                 membres du projet, puis rend <TaskForm mode="edit" />.

flow:            Server Component async → params → findFirst projet + story +
                 task → notFound si absent → <TaskForm mode="edit" />.

ecosystem:       Dev = ["@/app/back-studio/scrum/[slug]/backlog/[storySlug]/tasks/[taskId]/edit/page.tsx"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/task/TaskForm"]
exports:         ["metadata", "default EditTaskPage"]

userStories:     ["*en tant que développeur je veux modifier une tâche"]
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
import { TaskForm } from "@/components/task/TaskForm";

type Params = Promise<{ slug: string; storySlug: string; taskId: string }>;

export const metadata: Metadata = {
  title: "Éditer une tâche — Backlog",
  description: "Modifier une tâche rattachée à une user story.",
};

export default async function EditTaskPage({ params }: { params: Params }) {
  const { slug, storySlug, taskId } = await params;

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

  const task = await prisma.task.findFirst({
    where: { id: taskId, userStoryId: story.id },
    select: {
      id: true,
      title: true,
      description: true,
      assigneeId: true,
      estimateHours: true,
      status: true,
      blockedBy: true,
      notes: true,
    },
  });
  if (!task) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={`/back-studio/scrum/${project.slug}/backlog/${story.slug}`}
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
            {project.name} · {story.title}
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Éditer « {task.title} »
        </h1>
      </header>

      <TaskForm
        mode="edit"
        userStoryId={story.id}
        projectSlug={project.slug}
        storySlug={story.slug}
        assignees={project.users}
        initialData={{
          id: task.id,
          title: task.title,
          description: task.description,
          assigneeId: task.assigneeId,
          estimateHours: task.estimateHours,
          status: task.status,
          blockedBy: task.blockedBy,
          notes: task.notes,
        }}
      />
    </main>
  );
}