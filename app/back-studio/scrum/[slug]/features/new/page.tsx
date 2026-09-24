/*
path :           app/back-studio/scrum/[slug]/features/new/page.tsx
tag :            ["feature", "new", "import", "page"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de création d'une feature. Deux modes :
                 — Formulaire unitaire via <FeatureForm mode="create" />.
                 — Import en lot via <ImportJsonDialog /> : un tableau JSON
                   de features est envoyé à bulkImportFeatures (projectId
                   passé via .bind()).

flow:            Server Component async → params → findFirst({ slug,
                 deletedAt: null }) → notFound si absent → rend le header
                 avec le bouton d'import + <FeatureForm mode="create" />.

ecosystem:       Feature = [
                   "@/app/actions/feature/bulkImportFeatures.ts",
                   "@/app/back-studio/scrum/[slug]/features/new/page.tsx",
                   "@/lib/json-templates/feature.ts",
                   "@/lib/validations/feature.ts",
                 ]
relatedFiles:    ["@/components/feature/FeatureForm.tsx",
                  "@/components/common/ImportJsonDialog.tsx",
                  "@/app/actions/feature/bulkImportFeatures.ts",
                  "@/lib/json-templates/feature.ts"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/common/ImportJsonDialog",
                  "@/components/feature/FeatureForm",
                  "@/app/actions/feature/bulkImportFeatures",
                  "@/lib/json-templates/feature"]
exports:         ["metadata", "default NewFeaturePage"]
useBy:           []

userStories:     ["*en tant que développeur je veux créer une nouvelle feature",
                  "*en tant que développeur je veux importer des features en lot"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardPaste, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { ImportJsonDialog } from "@/components/common/ImportJsonDialog";
import { FeatureForm } from "@/components/feature/FeatureForm";
import { bulkImportFeatures } from "@/app/actions/feature/bulkImportFeatures";
import { FEATURE_JSON_TEMPLATE } from "@/lib/json-templates/feature";

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

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
  if (!project) notFound();

  /* Server Action pré-liée au projectId courant.
     ImportJsonDialog appellera importFeatures(rawJson). */
  const importFeatures = bulkImportFeatures.bind(null, project.id);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={`/back-studio/scrum/${project.slug}/features`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux features
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
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
        </div>

        <ImportJsonDialog
          trigger={
            <button
              type="button"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ClipboardPaste className="h-4 w-4" aria-hidden />
              Import JSON
            </button>
          }
          title="Importer des features"
          description="Colle un tableau JSON de features. Le slug est auto-généré s'il est vide. Les slugs dupliqués (dans le JSON ou déjà présents dans le projet) sont refusés."
          template={FEATURE_JSON_TEMPLATE}
          submitLabel="Importer"
          onSubmit={importFeatures}
        />
      </header>

      <FeatureForm
        mode="create"
        projectId={project.id}
        projectSlug={project.slug}
      />
    </main>
  );
}