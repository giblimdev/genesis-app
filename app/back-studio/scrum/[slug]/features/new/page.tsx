/*
path :           app/back-studio/scrum/[slug]/features/new/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de création d'une feature. Charge le projet (via slug) puis rend
                 <FeatureForm mode="create" projectId projectSlug />.
flow:            Server Component async → params → findUnique({ slug }) → si absent
                 ou soft-deleted : notFound() → <FeatureForm mode="create" />.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/features/new/page.tsx",
                   "@/components/feature/FeatureForm.tsx",
                 ]
relatedFiles:    ["@/components/feature/FeatureForm.tsx",
                  "@/app/actions/feature/createFeature.ts"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/feature/FeatureForm"]
exports:         ["metadata", "default NewFeaturePage"]

userStories:     ["*en tant que développeur je veux créer une nouvelle feature"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { FeatureForm } from "@/components/feature/FeatureForm";

type Params = Promise<{ slug: string }>;

export const metadata: Metadata = {
  title: "Nouvelle feature — Scrum",
  description: "Créer une nouvelle feature pour ce projet.",
};

export default async function NewFeaturePage({
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

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={`/back-studio/scrum/${project.slug}/features`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux features
      </Link>

      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm">
            <Plus className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {project.name} · Features
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Nouvelle feature
        </h1>
      </header>

      <FeatureForm
        mode="create"
        projectId={project.id}
        projectSlug={project.slug}
      />
    </main>
  );
}