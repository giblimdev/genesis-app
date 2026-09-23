/*
path :           app/back-studio/scrum/[slug]/features/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Liste des features d'un projet. Affiche toutes les features triées par
                 displayOrder. Point d'entrée du CRUD Feature.
flow:            Server Component async → params → prisma.project.findUnique({ slug })
                 → si absent/soft-deleted : notFound() → prisma.feature.findMany →
                 grille de <FeatureCard /> ou <EmptyState />.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/features/page.tsx",
                   "@/app/back-studio/scrum/[slug]/features/new/page.tsx",
                   "@/components/feature/FeatureCard.tsx",
                 ]
relatedFiles:    ["@/components/feature/FeatureCard.tsx",
                  "@/app/back-studio/scrum/[slug]/page.tsx"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/common/EmptyState",
                  "@/components/feature/FeatureCard"]
exports:         ["metadata", "default FeaturesListPage"]

userStories:     ["*en tant que développeur je veux lister les features d'un projet"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { FeatureCard } from "@/components/feature/FeatureCard";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { name: true },
  });
  return {
    title: project ? `Features — ${project.name}` : "Features",
  };
}

export default async function FeaturesListPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, deletedAt: true },
  });
  if (!project || project.deletedAt) notFound();

  const features = await prisma.feature.findMany({
    where: { projectId: project.id },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={`/back-studio/scrum/${project.slug}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour au projet
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm">
              <Layers className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {project.name} · Features
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Features
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {features.length} feature(s) rattachée(s) à ce projet.
          </p>
        </div>

        <Link
          href={`/back-studio/scrum/${project.slug}/features/new`}
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nouvelle feature
        </Link>
      </header>

      {features.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-6 w-6" />}
          title="Aucune feature pour l'instant"
          description="Ajoute une première feature pour décrire une capacité du projet."
          accent="violet"
          action={
            <Link
              href={`/back-studio/scrum/${project.slug}/features/new`}
              className={buttonVariants({ size: "sm" })}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Créer une feature
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <FeatureCard
              key={f.id}
              projectSlug={project.slug}
              feature={{
                id: f.id,
                name: f.name,
                slug: f.slug,
                description: f.description,
                module: f.module,
                icon: f.icon,
                accent: f.accent,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}