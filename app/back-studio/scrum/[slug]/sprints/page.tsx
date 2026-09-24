/*
path :           app/back-studio/scrum/[slug]/sprints/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Liste des sprints d'un projet. Affiche une grille de
                 <SprintCard /> + actions Nouveau / Corbeille.

flow:            Server Component async → params → findFirst projet →
                 sprint.findMany({ projectId, deletedAt: null }) avec count US
                 → grille ou <EmptyState />.

ecosystem:       Dev = ["@/app/back-studio/scrum/[slug]/sprints/page.tsx"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/common/EmptyState",
                  "@/components/sprint/SprintCard"]
exports:         ["metadata", "default SprintsListPage"]

userStories:     ["*en tant que développeur je veux lister les sprints d'un projet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Timer, Trash2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { SprintCard } from "@/components/sprint/SprintCard";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { name: true },
  });
  return {
    title: project ? `Sprints — ${project.name}` : "Sprints",
  };
}

export default async function SprintsListPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
  if (!project) notFound();

  const sprints = await prisma.sprint.findMany({
    where: { projectId: project.id, deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { startDate: "asc" }],
    include: {
      _count: { select: { userstories: true } },
    },
  });

  const base = `/back-studio/scrum/${project.slug}`;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={base}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour au projet
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-4 to-chart-2 text-white shadow-sm">
              <Timer className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {project.name} · Sprints
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Sprints
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {sprints.length} sprint(s) — un sprint « en cours » ou « archivé »
            est verrouillé et ne peut plus être modifié.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`${base}/sprints/trash`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Corbeille
          </Link>
          <Link
            href={`${base}/sprints/new`}
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nouveau sprint
          </Link>
        </div>
      </header>

      {sprints.length === 0 ? (
        <EmptyState
          icon={<Timer className="h-6 w-6" />}
          title="Aucun sprint pour l'instant"
          description="Crée un premier sprint pour organiser ton backlog dans le temps."
          accent="emerald"
          action={
            <Link
              href={`${base}/sprints/new`}
              className={buttonVariants({ size: "sm" })}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Créer un sprint
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sprints.map((s) => (
            <SprintCard
              key={s.id}
              projectSlug={project.slug}
              sprint={{
                id: s.id,
                name: s.name,
                slug: s.slug,
                goal: s.goal,
                status: s.status,
                startDate: s.startDate.toISOString().slice(0, 10),
                endDate: s.endDate.toISOString().slice(0, 10),
                durationWeeks: s.durationWeeks,
                capacityPoints: s.capacityPoints,
                accent: s.accent,
                storyCount: s._count.userstories,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}