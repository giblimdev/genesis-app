/*
path :           app/back-studio/scrum/[slug]/features/[featureSlug]/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de détail d'une feature : infos complètes + actions Éditer et
                 Supprimer (avec redirection vers la liste après suppression).
flow:            Server Component async → params → findFirst projet + findFirst
                 feature (via projectId + slug) → notFound si absent.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/features/[featureSlug]/page.tsx",
                 ]
relatedFiles:    ["@/components/feature/DeleteFeatureButton.tsx",
                  "@/components/feature/FeatureModuleBadge.tsx"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/feature/FeatureModuleBadge",
                  "@/components/feature/DeleteFeatureButton"]
exports:         ["default FeatureDetailPage"]

userStories:     ["*en tant que développeur je veux consulter le détail d'une feature"]
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
import { FeatureModuleBadge } from "@/components/feature/FeatureModuleBadge";
import { DeleteFeatureButton } from "@/components/feature/DeleteFeatureButton";

type Params = Promise<{ slug: string; featureSlug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug, featureSlug } = await params;

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true },
  });
  if (!project) return { title: "Feature introuvable" };

  const feature = await prisma.feature.findFirst({
    where: { projectId: project.id, slug: featureSlug },
    select: { name: true },
  });

  return feature
    ? { title: `${feature.name} — Feature` }
    : { title: "Feature introuvable" };
}

export default async function FeatureDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug, featureSlug } = await params;

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
  if (!project) notFound();

  const feature = await prisma.feature.findFirst({
    where: { projectId: project.id, slug: featureSlug },
  });
  if (!feature) notFound();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={`/back-studio/scrum/${project.slug}/features`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux features
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {feature.name}
            </h1>
            <FeatureModuleBadge module={feature.module} />
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            /{feature.slug}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/back-studio/scrum/${project.slug}/features/${feature.slug}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Éditer
          </Link>
          <DeleteFeatureButton
            id={feature.id}
            name={feature.name}
            projectSlug={project.slug}
            redirectToList
          />
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Description
        </h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {feature.description}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meta label="Module" value={feature.module} />
        <Meta label="Icône" value={feature.icon ?? "—"} />
        <Meta label="Accent" value={feature.accent ?? "—"} />
        <Meta label="Ordre" value={String(feature.displayOrder)} />
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