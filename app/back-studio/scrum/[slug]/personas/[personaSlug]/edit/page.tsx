/*
path :           app/back-studio/scrum/[slug]/personas/[personaSlug]/edit/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page d'édition d'un persona. Charge le projet et le persona, puis
                 rend <PersonaForm mode="edit" />.
flow:            Server Component async → params → findFirst projet + persona →
                 notFound si absent → <PersonaForm mode="edit" />.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/personas/[personaSlug]/edit/page.tsx",
                   "@/components/persona/PersonaForm.tsx",
                 ]
relatedFiles:    ["@/components/persona/PersonaForm.tsx",
                  "@/app/actions/persona/updatePersona.ts"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/persona/PersonaForm"]
exports:         ["metadata", "default EditPersonaPage"]

userStories:     ["*en tant que développeur je veux éditer un persona existant"]
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
import { PersonaForm } from "@/components/persona/PersonaForm";

type Params = Promise<{ slug: string; personaSlug: string }>;

export const metadata: Metadata = {
  title: "Éditer un persona — Scrum",
  description: "Modifier les informations d'un persona.",
};

export default async function EditPersonaPage({
  params,
}: {
  params: Params;
}) {
  const { slug, personaSlug } = await params;

  const project = await prisma.project.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
  if (!project) notFound();

  const persona = await prisma.persona.findFirst({
    where: { projectId: project.id, slug: personaSlug, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      value: true,
      keywords: true,
      icon: true,
      accent: true,
    },
  });
  if (!persona) notFound();

  const base = `/back-studio/scrum/${project.slug}/personas`;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <Link
        href={`${base}/${persona.slug}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour au persona
      </Link>

      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-2 to-chart-1 text-white shadow-sm">
            <Pencil className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {project.name} · Personas
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Éditer « {persona.name} »
        </h1>
      </header>

      <PersonaForm
        mode="edit"
        projectId={project.id}
        projectSlug={project.slug}
        initialData={{
          id: persona.id,
          name: persona.name,
          slug: persona.slug,
          value: persona.value,
          keywords: persona.keywords,
          icon: persona.icon,
          accent: persona.accent,
        }}
      />
    </main>
  );
}