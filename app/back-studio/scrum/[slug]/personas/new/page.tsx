/*
path :           app/back-studio/scrum/[slug]/personas/new/page.tsx
tag :            ["persona", "new", "import", "page"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de création d'un persona. Deux modes :
                 — Formulaire unitaire via <PersonaForm mode="create" />.
                 — Import en lot via <ImportJsonDialog /> : un tableau JSON
                   de personas est envoyé à bulkImportPersonas (projectId
                   passé via .bind()).

flow:            Server Component async → params → findFirst({ slug,
                 deletedAt: null }) → notFound si absent → rend le header
                 avec le bouton d'import + <PersonaForm mode="create" />.

ecosystem:       Persona = [
                   "@/app/actions/persona/bulkImportPersonas.ts",
                   "@/app/actions/persona/createPersona.ts",
                   "@/app/actions/persona/hardDeletePersona.ts",
                   "@/app/actions/persona/restorePersona.ts",
                   "@/app/actions/persona/softDeletePersona.ts",
                   "@/app/actions/persona/updatePersona.ts",
                   "@/app/back-studio/scrum/[slug]/personas/[personaSlug]/edit/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/[personaSlug]/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/trash/page.tsx",
                   "@/components/persona/DeletePersonaButton.tsx",
                   "@/components/persona/HardDeletePersonaButton.tsx",
                   "@/components/persona/PersonaCard.tsx",
                   "@/components/persona/PersonaForm.tsx",
                   "@/components/persona/RestorePersonaButton.tsx",
                   "@/lib/design/accents.ts",
                   "@/lib/json-templates/persona.ts",
                   "@/lib/validations/persona.ts",
                 ]
relatedFiles:    ["@/components/persona/PersonaForm.tsx",
                  "@/components/common/ImportJsonDialog.tsx",
                  "@/app/actions/persona/bulkImportPersonas.ts",
                  "@/lib/json-templates/persona.ts"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/ui/button",
                  "@/components/common/ImportJsonDialog",
                  "@/components/persona/PersonaForm",
                  "@/app/actions/persona/bulkImportPersonas",
                  "@/lib/json-templates/persona"]
exports:         ["metadata", "default NewPersonaPage"]
useBy:           []

userStories:     ["*en tant que développeur je veux créer un nouveau persona",
                  "*en tant que développeur je veux importer des personas en lot"]
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
import { PersonaForm } from "@/components/persona/PersonaForm";
import { bulkImportPersonas } from "@/app/actions/persona/bulkImportPersonas";
import { PERSONA_JSON_TEMPLATE } from "@/lib/json-templates/persona";

type Params = Promise<{ slug: string }>;

export const metadata: Metadata = {
  title: "Nouveau persona — Scrum",
  description: "Créer un nouveau persona pour ce projet.",
};

export default async function NewPersonaPage({
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
     ImportJsonDialog appellera importPersonas(rawJson). */
  const importPersonas = bulkImportPersonas.bind(null, project.id);

  const base = `/back-studio/scrum/${project.slug}`;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={`${base}/personas`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux personas
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-2 to-chart-1 text-white shadow-sm">
              <Plus className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {project.name} · Personas
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Nouveau persona
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
          title="Importer des personas"
          description="Colle un tableau JSON de personas. Le slug est auto-généré s'il est vide. Les mots-clés sont saisis en texte séparé par des virgules. Les slugs dupliqués (dans le JSON ou déjà présents dans le projet) sont refusés."
          template={PERSONA_JSON_TEMPLATE}
          submitLabel="Importer"
          onSubmit={importPersonas}
        />
      </header>

      <PersonaForm
        mode="create"
        projectId={project.id}
        projectSlug={project.slug}
      />
    </main>
  );
}