/*
path :           app/back-studio/scrum/[slug]/personas/new/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de création d'un persona. Charge le projet (via slug) puis rend
                 <PersonaForm mode="create" projectId projectSlug />.
flow:            Server Component async → params → findFirst({ slug, deletedAt: null })
                 → notFound si absent → <PersonaForm mode="create" />.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/personas/new/page.tsx",
                   "@/components/persona/PersonaForm.tsx",
                 ]
relatedFiles:    ["@/components/persona/PersonaForm.tsx",
                  "@/app/actions/persona/createPersona.ts"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/persona/PersonaForm"]
exports:         ["metadata", "default NewPersonaPage"]

userStories:     ["*en tant que développeur je veux créer un nouveau persona"]
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
import { PersonaForm } from "@/components/persona/PersonaForm";

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

      <header className="flex flex-col gap-3">
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
      </header>

      <PersonaForm
        mode="create"
        projectId={project.id}
        projectSlug={project.slug}
      />
    </main>
  );
}