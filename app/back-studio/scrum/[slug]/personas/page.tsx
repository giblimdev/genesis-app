/*
path :           app/back-studio/scrum/[slug]/personas/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Liste des personas d'un projet. Affiche tous les personas actifs triés
                 par displayOrder. Point d'entrée du CRUD Persona.
flow:            Server Component async → params → findFirst({ slug, deletedAt: null })
                 → notFound si absent → prisma.persona.findMany({ projectId,
                 deletedAt: null }) → grille de <PersonaCard /> ou <EmptyState />.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/personas/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/new/page.tsx",
                   "@/components/persona/PersonaCard.tsx",
                 ]
relatedFiles:    ["@/components/persona/PersonaCard.tsx",
                  "@/utils/keywords"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/common/EmptyState",
                  "@/components/persona/PersonaCard",
                  "@/utils/keywords"]
exports:         ["metadata", "default PersonasListPage"]

userStories:     ["*en tant que développeur je veux lister les personas d'un projet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Users2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { PersonaCard } from "@/components/persona/PersonaCard";
import { parseKeywordsJson } from "@/utils/keywords";

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
    title: project ? `Personas — ${project.name}` : "Personas",
  };
}

export default async function PersonasListPage({
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

  const personas = await prisma.persona.findMany({
    where: { projectId: project.id, deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
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
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-2 to-chart-1 text-white shadow-sm">
              <Users2 className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {project.name} · Personas
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Personas
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {personas.length} persona(s) rattaché(s) à ce projet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`${base}/personas/trash`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Corbeille
          </Link>
          <Link
            href={`${base}/personas/new`}
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nouveau persona
          </Link>
        </div>
      </header>

      {personas.length === 0 ? (
        <EmptyState
          icon={<Users2 className="h-6 w-6" />}
          title="Aucun persona pour l'instant"
          description="Décris un premier profil utilisateur pour guider la conception."
          accent="cyan"
          action={
            <Link
              href={`${base}/personas/new`}
              className={buttonVariants({ size: "sm" })}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Créer un persona
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((p) => (
            <PersonaCard
              key={p.id}
              projectSlug={project.slug}
              persona={{
                id: p.id,
                name: p.name,
                slug: p.slug,
                value: p.value,
                keywords: parseKeywordsJson(p.keywords),
                icon: p.icon,
                accent: p.accent,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}