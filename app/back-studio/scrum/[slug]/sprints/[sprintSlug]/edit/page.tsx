/*
path :           app/back-studio/scrum/[slug]/sprints/[sprintSlug]/edit/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page d'édition d'un sprint. Le verrouillage par statut est
                 désactivé : l'accès est toujours autorisé.

flow:            Server Component async → params → findFirst projet + sprint
                 → notFound si absent → <SprintForm mode="edit" />.

ecosystem:       Dev = ["@/app/back-studio/scrum/[slug]/sprints/[sprintSlug]/edit/page.tsx"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/sprint/SprintForm"]
exports:         ["metadata", "default EditSprintPage"]

userStories:     ["*en tant que développeur je veux éditer un sprint"]
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
import { SprintForm } from "@/components/sprint/SprintForm";

type Params = Promise<{ slug: string; sprintSlug: string }>;

export const metadata: Metadata = {
  title: "Éditer un sprint — Scrum",
  description: "Modifier les informations d'un sprint.",
};

export default async function EditSprintPage({ params }: { params: Params }) {
  const { slug, sprintSlug } = await params;

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
  if (!project) notFound();

  const sprint = await prisma.sprint.findFirst({
    where: { projectId: project.id, slug: sprintSlug, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      goal: true,
      startDate: true,
      endDate: true,
      durationWeeks: true,
      status: true,
      capacityPoints: true,
      velocity: true,
      notes: true,
      accent: true,
    },
  });
  if (!sprint) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={`/back-studio/scrum/${project.slug}/sprints/${sprint.slug}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour au sprint
      </Link>

      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-4 to-chart-2 text-white shadow-sm">
            <Pencil className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {project.name} · Sprints
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Éditer « {sprint.name} »
        </h1>
      </header>

      <SprintForm
        mode="edit"
        projectId={project.id}
        projectSlug={project.slug}
        initialData={{
          id: sprint.id,
          name: sprint.name,
          slug: sprint.slug,
          goal: sprint.goal,
          startDate: sprint.startDate.toISOString().slice(0, 10),
          endDate: sprint.endDate.toISOString().slice(0, 10),
          durationWeeks: sprint.durationWeeks,
          status: sprint.status,
          capacityPoints: sprint.capacityPoints,
          velocity: sprint.velocity,
          notes: sprint.notes,
          accent: sprint.accent,
        }}
      />
    </main>
  );
}