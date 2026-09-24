/*
path :           app/back-studio/scrum/[slug]/sprints/trash/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Corbeille des sprints d'un projet.

flow:            Server Component async → params → findFirst projet →
                 sprint.findMany({ projectId, deletedAt != null }) →
                 liste avec Restore + HardDelete.

ecosystem:       Dev = ["@/app/back-studio/scrum/[slug]/sprints/trash/page.tsx"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/common/EmptyState",
                  "@/components/sprint/RestoreSprintButton",
                  "@/components/sprint/HardDeleteSprintButton"]
exports:         ["metadata", "default SprintTrashPage"]

userStories:     ["*en tant que développeur je veux restaurer ou purger un sprint"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/common/EmptyState";
import { RestoreSprintButton } from "@/components/sprint/RestoreSprintButton";
import { HardDeleteSprintButton } from "@/components/sprint/HardDeleteSprintButton";

type Params = Promise<{ slug: string }>;

export const metadata: Metadata = {
  title: "Corbeille sprints — Scrum",
  description: "Sprints supprimés restaurables ou purgeables.",
};

export default async function SprintTrashPage({
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
    where: { projectId: project.id, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      deletedAt: true,
    },
  });

  const base = `/back-studio/scrum/${project.slug}/sprints`;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={base}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux sprints
      </Link>

      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Trash2 className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {project.name} · Sprints
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Corbeille
        </h1>

        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {sprints.length} sprint(s) supprimé(s). Tu peux les restaurer ou les
          supprimer définitivement.
        </p>
      </header>

      {sprints.length === 0 ? (
        <EmptyState
          icon={<Trash2 className="h-6 w-6" />}
          title="Corbeille vide"
          description="Aucun sprint supprimé pour l'instant."
          accent="amber"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {sprints.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-foreground">
                  {s.name}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  /{s.slug} · supprimé le{" "}
                  {s.deletedAt?.toLocaleDateString("fr-FR")}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <RestoreSprintButton id={s.id} name={s.name} />
                <HardDeleteSprintButton
                  id={s.id}
                  name={s.name}
                  slug={s.slug}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}