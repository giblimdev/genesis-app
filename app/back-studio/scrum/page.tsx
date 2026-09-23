/*
path :           app/back-studio/scrum/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page d'entrée du module Scrum / Back-Studio. Liste les projets actifs
                 (non soft-deleted) avec compteurs. Point d'accès au CRUD complet du
                 Project (création, édition, suppression, restauration).
flow:            Server Component async → prisma.project.findMany({ deletedAt: null })
                 avec _count → affiche soit <EmptyState>, soit une grille de
                 <ProjectCard />. Actions : « Nouveau projet », « Corbeille ».
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/page.tsx",
                   "@/app/back-studio/scrum/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/page.tsx",
                   "@/app/back-studio/scrum/[slug]/edit/page.tsx",
                   "@/app/back-studio/scrum/trash/page.tsx",
                   "@/components/project/ProjectCard.tsx",
                 ]
relatedFiles:    ["@/components/project/ProjectCard.tsx",
                  "@/app/actions/project/createProject.ts",
                  "@/lib/validations/project.ts"]
imports:         ["next", "next/link", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/common/EmptyState",
                  "@/components/project/ProjectCard"]
exports:         ["metadata", "default ScrumProjectsPage"]

userStories:     ["*en tant que développeur je veux lister et gérer les projets"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, Plus, Trash2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { ProjectCard } from "@/components/project/ProjectCard";

export const metadata: Metadata = {
  title: "Projets — Scrum",
  description:
    "Liste et gestion des projets : conception, personas, backlog, sprints.",
};

export default async function ScrumProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
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

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm">
              <FolderKanban className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Back-Studio · Scrum
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Projets
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {projects.length} projet(s) actif(s). Gère la conception, les personas,
            le backlog et les sprints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/back-studio/scrum/trash"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Corbeille
          </Link>
          <Link
            href="/back-studio/scrum/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nouveau projet
          </Link>
        </div>
      </header>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="Aucun projet pour l'instant"
          description="Crée ton premier projet pour commencer la conception."
          accent="violet"
          action={
            <Link
              href="/back-studio/scrum/new"
              className={buttonVariants({ size: "sm" })}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Créer un projet
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={{
                id: p.id,
                name: p.name,
                slug: p.slug,
                tagline: p.tagline,
                description: p.description,
                status: p.status,
                counts: {
                  features: p._count.features,
                  personas: p._count.personas,
                  userStories: p._count.userStories,
                  sprints: p._count.sprints,
                },
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}