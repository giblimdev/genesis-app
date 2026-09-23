/*
path :           app/back-studio/scrum/[slug]/backlog/[storySlug]/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de détail d'une user story : format standard, critères
                 d'acceptation, DoD, fichiers liés, métadonnées, et actions
                 (Éditer, Supprimer). Si c'est un Epic, affiche aussi ses enfants.
flow:            Server Component async → params → findFirst projet + story +
                 enfants (si Epic) → notFound si absent → affichage complet.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/backlog/[storySlug]/page.tsx",
                 ]
relatedFiles:    ["@/components/user-story/DeleteUserStoryButton.tsx",
                  "@/components/user-story/UserStoryStatusBadge.tsx",
                  "@/components/user-story/UserStoryPriorityBadge.tsx",
                  "@/lib/user-story/json.ts"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/user-story/DeleteUserStoryButton",
                  "@/components/user-story/UserStoryStatusBadge",
                  "@/components/user-story/UserStoryPriorityBadge",
                  "@/lib/user-story/json"]
exports:         ["default UserStoryDetailPage"]

userStories:     ["*en tant que développeur je veux consulter le détail d'une user story"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Pencil } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { DeleteUserStoryButton } from "@/components/user-story/DeleteUserStoryButton";
import { UserStoryStatusBadge } from "@/components/user-story/UserStoryStatusBadge";
import { UserStoryPriorityBadge } from "@/components/user-story/UserStoryPriorityBadge";
import {
  parseAcceptanceCriteria,
  parseStringList,
} from "@/lib/user-story/json";

type Params = Promise<{ slug: string; storySlug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug, storySlug } = await params;
  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true },
  });
  if (!project) return { title: "User story introuvable" };

  const story = await prisma.userStory.findFirst({
    where: { projectId: project.id, slug: storySlug, deletedAt: null },
    select: { title: true },
  });
  return story
    ? { title: `${story.title} — User Story` }
    : { title: "User story introuvable" };
}

export default async function UserStoryDetailPage({
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

  const story = await prisma.userStory.findFirst({
    where: { projectId: project.id, slug: storySlug, deletedAt: null },
  });
  if (!story) notFound();

  /* Enfants si c'est un Epic */
  const children =
    story.parentId === null
      ? await prisma.userStory.findMany({
          where: { parentId: story.id, deletedAt: null },
          orderBy: [{ displayOrder: "asc" }],
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            priority: true,
            storyPoints: true,
          },
        })
      : [];

  /* Parent si c'est une Story */
  const parent =
    story.parentId !== null
      ? await prisma.userStory.findFirst({
          where: { id: story.parentId },
          select: { id: true, title: true, slug: true },
        })
      : null;

  const acceptance = parseAcceptanceCriteria(story.acceptanceCriteria);
  const dod = parseStringList(story.dodChecked);
  const linkedFiles = parseStringList(story.linkedFiles);

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

      {parent && (
        <Link
          href={`${base}/${parent.slug}`}
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          ↑ Rattachée à « {parent.title} »
        </Link>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {story.parentId === null && (
              <span className="rounded-full border border-chart-1/30 bg-chart-1/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-chart-1">
                Epic
              </span>
            )}
            <UserStoryStatusBadge status={story.status} />
            <UserStoryPriorityBadge priority={story.priority} />
            {story.storyPoints !== null && (
              <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                {story.storyPoints} pt{story.storyPoints > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {story.title}
          </h1>

          <p className="font-mono text-xs text-muted-foreground">
            /{story.slug}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`${base}/${story.slug}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Éditer
          </Link>
          <DeleteUserStoryButton
            id={story.id}
            title={story.title}
            projectSlug={project.slug}
            redirectToList
          />
        </div>
      </header>

      {/* Format standard */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Format standard
        </h2>
        <div className="flex flex-col gap-2 text-sm leading-relaxed">
          <p>
            <span className="font-semibold text-chart-3">En tant que</span>{" "}
            <span className="text-foreground">{story.asA}</span>
          </p>
          <p>
            <span className="font-semibold text-chart-3">Je veux</span>{" "}
            <span className="text-foreground">{story.iWant}</span>
          </p>
          <p>
            <span className="font-semibold text-chart-3">Afin de</span>{" "}
            <span className="text-foreground">{story.soThat}</span>
          </p>
          {story.personaRef && (
            <p className="mt-2 text-xs text-muted-foreground">
              Persona de référence :{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                {story.personaRef}
              </code>
            </p>
          )}
        </div>
      </section>

      {/* Critères d'acceptation */}
      {acceptance.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Critères d&apos;acceptation
          </h2>
          <ul className="flex flex-col gap-2">
            {acceptance.map((ac) => (
              <li
                key={ac.id}
                className="flex items-start gap-2 text-sm leading-relaxed"
              >
                <span
                  className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border ${
                    ac.done
                      ? "border-chart-1 bg-chart-1 text-white"
                      : "border-border bg-background"
                  }`}
                  aria-hidden
                >
                  {ac.done && <Check className="h-3 w-3" />}
                </span>
                <span className="text-foreground/90">{ac.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Definition of Done */}
      {dod.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Definition of Done
          </h2>
          <ul className="flex flex-col gap-1.5">
            {dod.map((item, i) => (
              <li
                key={`${item}-${i}`}
                className="flex items-start gap-2 text-sm leading-relaxed"
              >
                <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
                <span className="text-foreground/90">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Fichiers liés */}
      {linkedFiles.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fichiers liés
          </h2>
          <ul className="flex flex-col gap-1.5">
            {linkedFiles.map((f) => (
              <li key={f}>
                <code className="block truncate rounded-md border border-border/60 bg-muted/30 px-2 py-1 font-mono text-xs text-foreground/90">
                  {f}
                </code>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Enfants (si Epic) */}
      {children.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Stories rattachées ({children.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`${base}/${child.slug}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <UserStoryPriorityBadge priority={child.priority} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {child.title}
                  </span>
                  <UserStoryStatusBadge status={child.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Métadonnées */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meta label="Créée le" value={story.createdAt.toLocaleDateString("fr-FR")} />
        <Meta
          label="Modifiée le"
          value={story.updatedAt.toLocaleDateString("fr-FR")}
        />
        <Meta label="Accent" value={story.accent ?? "—"} />
        <Meta label="Ordre" value={String(story.displayOrder)} />
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Meta (interne)                                                     */
/* ------------------------------------------------------------------ */

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate font-mono text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}