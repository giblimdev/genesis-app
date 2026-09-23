/*
path :           app/back-studio/scrum/[slug]/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de détail d'un projet. Affiche les informations complètes et les
                 compteurs ; prépare les liens vers les sous-routes (features, personas,
                 backlog, sprints).
flow:            Server Component async → params → prisma.project.findUnique({ slug })
                 → si absent ou soft-deleted : notFound() → affichage + actions
                 (Éditer, Supprimer).
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/page.tsx",
                   "@/app/back-studio/scrum/[slug]/edit/page.tsx",
                 ]
relatedFiles:    ["@/components/project/DeleteProjectButton.tsx",
                  "@/components/project/ProjectStatusBadge.tsx",
                  "@/app/back-studio/scrum/page.tsx"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/project/ProjectStatusBadge",
                  "@/components/project/DeleteProjectButton"]
exports:         ["default ProjectDetailPage"]

userStories:     ["*en tant que développeur je veux consulter le détail d'un projet"]
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
import { buttonVariants } from "@/components/ui/button";
import { ProjectStatusBadge } from "@/components/project/ProjectStatusBadge";
import { DeleteProjectButton } from "@/components/project/DeleteProjectButton";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { name: true, tagline: true, deletedAt: true },
  });
  if (!project || project.deletedAt) return { title: "Projet introuvable" };
  return {
    title: `${project.name} — Scrum`,
    description: project.tagline ?? undefined,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          features: true,
          personas: true,
          userStories: true,
          sprints: true,
        },
      },
    },
  });

  if (!project || project.deletedAt) notFound();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href="/back-studio/scrum"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux projets
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {project.name}
            </h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            /{project.slug}
          </p>
          {project.tagline && (
            <p className="max-w-2xl text-sm italic text-muted-foreground">
              {project.tagline}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/back-studio/scrum/${project.slug}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Éditer
          </Link>
          <DeleteProjectButton id={project.id} name={project.name} />
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Description
        </h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {project.description}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Features" value={project._count.features} />
        <Stat label="Personas" value={project._count.personas} />
        <Stat label="User Stories" value={project._count.userStories} />
        <Stat label="Sprints" value={project._count.sprints} />
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-2xl font-bold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}