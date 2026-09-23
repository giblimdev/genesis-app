/*
path :           app/back-studio/scrum/[slug]/backlog/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Liste des user stories d'un projet, affichée en arbre (Epics racines
                 avec leurs Stories enfants). Point d'entrée du CRUD UserStory.
flow:            Server Component async → params → findFirst projet →
                 userStory.findMany({ projectId, deletedAt: null }) triés par
                 displayOrder → séparation Epics / Stories → construction de l'arbre
                 → <UserStoryTree /> ou <EmptyState />.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/backlog/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/new/page.tsx",
                   "@/components/user-story/UserStoryTree.tsx",
                 ]
relatedFiles:    ["@/components/user-story/UserStoryTree.tsx",
                  "@/lib/user-story/json.ts"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/common/EmptyState",
                  "@/components/user-story/UserStoryTree",
                  "@/lib/user-story/json"]
exports:         ["metadata", "default BacklogPage"]

userStories:     ["*en tant que développeur je veux lister les user stories d'un projet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListChecks, Plus, Trash2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import {
  UserStoryTree,
  type UserStoryTreeEpic,
} from "@/components/user-story/UserStoryTree";
import { parseAcceptanceCriteria } from "@/lib/user-story/json";

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
    title: project ? `Backlog — ${project.name}` : "Backlog",
  };
}

export default async function BacklogPage({ params }: { params: Params }) {
  const { slug } = await params;

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
  if (!project) notFound();

  const allStories = await prisma.userStory.findMany({
    where: { projectId: project.id, deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  /* Séparation Epics / Stories */
  const epics = allStories.filter((s) => s.parentId === null);
  const stories = allStories.filter((s) => s.parentId !== null);

  /* Construction de l'arbre */
  const tree: UserStoryTreeEpic[] = epics.map((epic) => {
    const children = stories
      .filter((s) => s.parentId === epic.id)
      .map((child) => ({
        id: child.id,
        title: child.title,
        slug: child.slug,
        status: child.status,
        priority: child.priority,
        storyPoints: child.storyPoints,
      }));

    return {
      id: epic.id,
      title: epic.title,
      slug: epic.slug,
      asA: epic.asA,
      iWant: epic.iWant,
      soThat: epic.soThat,
      status: epic.status,
      priority: epic.priority,
      storyPoints: epic.storyPoints,
      acceptanceCount: parseAcceptanceCriteria(epic.acceptanceCriteria).length,
      children,
    };
  });

  /* Stories orphelines (leur parent a été supprimé) */
  const orphanStories = stories.filter(
    (s) => !epics.some((e) => e.id === s.parentId),
  );

  const base = `/back-studio/scrum/${project.slug}`;
  const total = epics.length + stories.length;

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
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-3 to-chart-2 text-white shadow-sm">
              <ListChecks className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {project.name} · Backlog
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            User Stories
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {epics.length} Epic(s) · {stories.length} Story(ies) rattachée(s) ·{" "}
            {total} au total.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`${base}/backlog/trash`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Corbeille
          </Link>
          <Link
            href={`${base}/backlog/new`}
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nouvelle story
          </Link>
        </div>
      </header>

      {tree.length === 0 && orphanStories.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-6 w-6" />}
          title="Aucune user story pour l'instant"
          description="Commence par un Epic pour structurer le backlog, puis ajoute des Stories."
          accent="amber"
          action={
            <Link
              href={`${base}/backlog/new`}
              className={buttonVariants({ size: "sm" })}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Créer un Epic
            </Link>
          }
        />
      ) : (
        <UserStoryTree epics={tree} projectSlug={project.slug} />
      )}
    </main>
  );
}