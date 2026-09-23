/*
path :           app/back-studio/scrum/[slug]/edit/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page d'édition d'un projet. Charge le projet par slug puis rend
                 <ProjectForm mode="edit" />.
flow:            Server Component async → params → findUnique({ slug }) →
                 si absent ou soft-deleted : notFound() → <ProjectForm mode="edit"
                 initialData={...} />.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/edit/page.tsx",
                   "@/components/project/ProjectForm.tsx",
                 ]
relatedFiles:    ["@/components/project/ProjectForm.tsx",
                  "@/app/actions/project/updateProject.ts"]
imports:         ["next", "next/link", "next/navigation", "lucide-react",
                  "@/lib/prisma",
                  "@/components/project/ProjectForm"]
exports:         ["metadata", "default EditProjectPage"]

userStories:     ["*en tant que développeur je veux éditer un projet existant"]
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
import { ProjectForm } from "@/components/project/ProjectForm";

type Params = Promise<{ slug: string }>;

export const metadata: Metadata = {
  title: "Éditer un projet — Scrum",
  description: "Modifier les informations d'un projet.",
};

export default async function EditProjectPage({ params }: { params: Params }) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      description: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!project || project.deletedAt) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <header className="flex flex-col gap-3">
        <Link
          href={`/back-studio/scrum/${project.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Retour au projet
        </Link>

        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm">
            <Pencil className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Back-Studio · Scrum
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Éditer « {project.name} »
        </h1>
      </header>

      <ProjectForm
        mode="edit"
        initialData={{
          id: project.id,
          name: project.name,
          slug: project.slug,
          tagline: project.tagline,
          description: project.description,
          status: project.status,
        }}
      />
    </main>
  );
}