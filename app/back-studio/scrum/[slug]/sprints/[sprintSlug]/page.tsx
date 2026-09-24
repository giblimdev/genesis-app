/*
path :           app/back-studio/scrum/[slug]/sprints/[sprintSlug]/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de détail d'un sprint. Affiche les infos du sprint
                 + le plateau DnD (backlog ↔ sprint). Le statut est modifiable
                 en ligne via <SprintStatusSelect />. Le plateau DnD est
                 TOUJOURS actif — le verrouillage par statut est désactivé.

flow:            Server Component async → params → findFirst projet + sprint
                 + listes US (sprint courant + backlog projet non assigné)
                 → notFound si sprint absent → rend <SprintBoard /> et
                 <SprintStatusSelect />.

ecosystem:       Dev = ["@/app/back-studio/scrum/[slug]/sprints/[sprintSlug]/page.tsx"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/sprint/SprintStatusSelect",
                  "@/components/sprint/DeleteSprintButton",
                  "@/components/sprint/SprintBoard"]
exports:         ["default SprintDetailPage"]

userStories:     ["*en tant que développeur je veux voir le détail d'un sprint et composer son contenu",
                  "*en tant que développeur je veux changer le statut d'un sprint"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Pencil, Target } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { SprintStatusSelect } from "@/components/sprint/SprintStatusSelect";
import { DeleteSprintButton } from "@/components/sprint/DeleteSprintButton";
import { SprintBoard } from "@/components/sprint/SprintBoard";

type Params = Promise<{ slug: string; sprintSlug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug, sprintSlug } = await params;
  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true },
  });
  if (!project) return { title: "Sprint introuvable" };
  const sprint = await prisma.sprint.findFirst({
    where: { projectId: project.id, slug: sprintSlug, deletedAt: null },
    select: { name: true },
  });
  return sprint
    ? { title: `${sprint.name} — Sprint` }
    : { title: "Sprint introuvable" };
}

export default async function SprintDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug, sprintSlug } = await params;

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
  if (!project) notFound();

  const sprint = await prisma.sprint.findFirst({
    where: { projectId: project.id, slug: sprintSlug, deletedAt: null },
    include: {
      userstories: {
        where: { deletedAt: null },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          priority: true,
          storyPoints: true,
        },
      },
    },
  });
  if (!sprint) notFound();

  /* Backlog du projet = US non assignées (sprintId null), non supprimées. */
  const backlog = await prisma.userStory.findMany({
    where: {
      projectId: project.id,
      deletedAt: null,
      sprintId: null,
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      priority: true,
      storyPoints: true,
    },
  });

  /* Verrouillage désactivé : le sprint est toujours éditable. */
  const locked = false;
  const base = `/back-studio/scrum/${project.slug}`;

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={`${base}/sprints`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux sprints
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Statut interactif */}
            <SprintStatusSelect
              sprintId={sprint.id}
              currentStatus={sprint.status}
            />

            <span className="font-mono text-[10px] text-muted-foreground">
              {sprint.durationWeeks} sem.
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {sprint.name}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            /{sprint.slug}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`${base}/sprints/${sprint.slug}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Éditer
          </Link>
          <DeleteSprintButton
            id={sprint.id}
            name={sprint.name}
            projectSlug={project.slug}
          />
        </div>
      </header>

      {/* Bandeau infos */}
      <section className="grid gap-3 sm:grid-cols-3">
        <InfoBlock
          icon={<Target className="size-3.5" aria-hidden />}
          label="Objectif"
          value={sprint.goal}
          className="sm:col-span-2"
        />
        <InfoBlock
          icon={<CalendarDays className="size-3.5" aria-hidden />}
          label="Période"
          value={`${sprint.startDate.toISOString().slice(0, 10)} → ${sprint.endDate.toISOString().slice(0, 10)}`}
        />
        <InfoBlock
          label="Capacité"
          value={`${sprint.capacityPoints} pts`}
          mono
        />
        <InfoBlock
          label="Vélocité"
          value={sprint.velocity !== null ? `${sprint.velocity} pts` : "—"}
          mono
        />
        <InfoBlock
          label="Stories"
          value={String(sprint.userstories.length)}
          mono
        />
      </section>

      {sprint.notes && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Notes
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {sprint.notes}
          </p>
        </section>
      )}

      {/* Plateau DnD */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Composition du sprint
        </h2>
        <SprintBoard
          sprintId={sprint.id}
          projectSlug={project.slug}
          locked={locked}
          sprintStories={sprint.userstories}
          backlogStories={backlog}
        />
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  InfoBlock (interne)                                                */
/* ------------------------------------------------------------------ */

function InfoBlock({
  icon,
  label,
  value,
  mono = false,
  className,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border/60 bg-muted/30 px-4 py-3 ${className ?? ""}`}
    >
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}