/*
path :           app/back-studio/scrum/[slug]/backlog/trash/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Corbeille des user stories d'un projet. Affiche les stories
                 soft-deleted et propose restauration + suppression définitive.
flow:            Server Component async → params → findFirst projet →
                 userStory.findMany({ projectId, deletedAt: { not: null } }) →
                 liste avec <RestoreUserStoryButton /> + <HardDeleteUserStoryButton />.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/backlog/trash/page.tsx",
                   "@/app/actions/user-story/restoreUserStory.ts",
                   "@/app/actions/user-story/hardDeleteUserStory.ts",
                 ]
relatedFiles:    ["@/components/user-story/RestoreUserStoryButton.tsx",
                  "@/components/user-story/HardDeleteUserStoryButton.tsx"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/common/EmptyState",
                  "@/components/user-story/RestoreUserStoryButton",
                  "@/components/user-story/HardDeleteUserStoryButton"]
exports:         ["metadata", "default UserStoryTrashPage"]

userStories:     ["*en tant que développeur je veux restaurer ou purger une user story"]
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
import { RestoreUserStoryButton } from "@/components/user-story/RestoreUserStoryButton";
import { HardDeleteUserStoryButton } from "@/components/user-story/HardDeleteUserStoryButton";

type Params = Promise<{ slug: string }>;

export const metadata: Metadata = {
  title: "Corbeille backlog — Scrum",
  description: "User stories supprimées restaurables ou purgeables.",
};

export default async function UserStoryTrashPage({
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

  const stories = await prisma.userStory.findMany({
    where: { projectId: project.id, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      deletedAt: true,
    },
  });

  const base = `/back-studio/scrum/${project.slug}/backlog`;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={base}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour au backlog
      </Link>

      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Trash2 className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {project.name} · Backlog
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Corbeille
        </h1>

        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {stories.length} user story(ies) supprimée(s). Tu peux les restaurer ou
          les supprimer définitivement.
        </p>
      </header>

      {stories.length === 0 ? (
        <EmptyState
          icon={<Trash2 className="h-6 w-6" />}
          title="Corbeille vide"
          description="Aucune user story supprimée pour l'instant."
          accent="amber"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {stories.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-foreground">
                  {s.title}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  /{s.slug} · supprimée le{" "}
                  {s.deletedAt?.toLocaleDateString("fr-FR")}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <RestoreUserStoryButton id={s.id} title={s.title} />
                <HardDeleteUserStoryButton
                  id={s.id}
                  title={s.title}
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