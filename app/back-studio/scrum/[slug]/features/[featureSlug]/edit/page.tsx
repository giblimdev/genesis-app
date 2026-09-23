/*
path :           app/back-studio/scrum/[slug]/features/[featureSlug]/edit/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page d'édition d'une feature. Charge le projet et la feature, puis
                 rend <FeatureForm mode="edit" />.
flow:            Server Component async → params → findUnique projet + feature →
                 notFound si absent ou feature hors projet → <FeatureForm mode="edit" />.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/features/[featureSlug]/edit/page.tsx",
                   "@/components/feature/FeatureForm.tsx",
                 ]
relatedFiles:    ["@/components/feature/FeatureForm.tsx",
                  "@/app/actions/feature/updateFeature.ts"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/feature/FeatureForm"]
exports:         ["metadata", "default EditFeaturePage"]

userStories:     ["*en tant que développeur je veux éditer une feature existante"]
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
import { FeatureForm } from "@/components/feature/FeatureForm";

type Params = Promise<{ slug: string; featureSlug: string }>;

export const metadata: Metadata = {
  title: "Éditer une feature — Scrum",
  description: "Modifier les informations d'une feature.",
};

export default async function EditFeaturePage({
  params,
}: {
  params: Params;
}) {
  const { slug, featureSlug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, deletedAt: true },
  });
  if (!project || project.deletedAt) notFound();

  const feature = await prisma.feature.findUnique({
    where: { slug: featureSlug },
    select: {
      id: true,
      projectId: true,
      name: true,
      slug: true,
      description: true,
      module: true,
      icon: true,
      accent: true,
    },
  });
  if (!feature || feature.projectId !== project.id) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={`/back-studio/scrum/${project.slug}/features/${feature.slug}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour à la feature
      </Link>

      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm">
            <Pencil className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {project.name} · Features
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Éditer « {feature.name} »
        </h1>
      </header>

      <FeatureForm
        mode="edit"
        projectId={project.id}
        projectSlug={project.slug}
        initialData={{
          id: feature.id,
          name: feature.name,
          slug: feature.slug,
          description: feature.description,
          module: feature.module,
          icon: feature.icon,
          accent: feature.accent,
        }}
      />
    </main>
  );
}