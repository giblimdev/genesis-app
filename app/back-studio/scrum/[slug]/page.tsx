/*
path :           app/back-studio/scrum/[slug]/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de détail d'un projet. Affiche les informations complètes,
                 la grille des 4 modules (via <ProjectModulesGrid />) et les actions
                 principales (Éditer, Supprimer).
flow:            Server Component async → params → findFirst({ slug, deletedAt: null })
                 avec include._count → si absent : notFound() → affichage.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/page.tsx",
                   "@/components/project/ProjectModulesGrid.tsx",
                 ]
relatedFiles:    ["@/components/project/ProjectModulesGrid.tsx",
                  "@/components/project/ProjectStatusBadge.tsx",
                  "@/components/project/DeleteProjectButton.tsx"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/project/ProjectStatusBadge",
                  "@/components/project/DeleteProjectButton",
                  "@/components/project/ProjectModulesGrid"]
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
import { ProjectModulesGrid } from "@/components/project/ProjectModulesGrid";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { name: true, tagline: true },
  });
  if (!project) return { title: "Projet introuvable" };
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

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
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

  if (!project) notFound();

  const base = `/back-studio/scrum/${project.slug}`;

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
            href={`${base}/edit`}
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

      <ProjectModulesGrid
        projectSlug={project.slug}
        counts={{
          features: project._count.features,
          personas: project._count.personas,
          userStories: project._count.userStories,
          sprints: project._count.sprints,
        }}
      />
    </main>
  );
}